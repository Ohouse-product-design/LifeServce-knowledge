/**
 * 프롬프트 → 섹션 구성 매처 (v1).
 *
 * 비디자이너·BD 가 노션 기획 문서를 붙여넣으면 LLM 이 의도를 추출해 섹션 프리셋을
 * 순서대로 제안한다. v1 은 키워드 휴리스틱 + 옵션 LLM API 의 두 단계 폴백 구조.
 *
 *   prompt
 *     ├─ (1) LLM call    — NEXT_PUBLIC_PROMPT_COMPOSE_LLM=on 일 때 /api/compose 호출
 *     └─ (2) heuristic   — fallback. 키워드 스캔 → 섹션 순서 + 셀 시드 추출
 *
 * 반환: ComposePlan { sections: ComposeSection[] } — 각 entry 가
 *   addSection(preset, variant?) + optional seedCells (셀 override) 로 분기됨.
 *
 * SPEC §4 (프롬프트 → 프리셋 매처) 의 v1 구현체.
 */

import type { SectionPresetId } from "@/schema/section-presets";
import type { CardCell, CardSlotContent, CardSlotName } from "@/schema/card";

export interface ComposeSection {
  /** 매칭된 섹션 preset id */
  preset: SectionPresetId;
  /** SectionTree 의 variant 라벨 (선택) */
  variant?: string;
  /** 섹션 props 오버라이드 (sectionTitle/sectionSubtitle 등) */
  props?: Record<string, unknown>;
  /** 프롬프트에서 추출된 cell 시드 — 비어 있으면 SECTION_AUTO_CONTENT 의 디폴트 사용 */
  seedCells?: Array<Partial<Record<CardSlotName, CardSlotContent>>>;
  /** 매칭 근거 (디버깅/감사용) */
  rationale?: string;
}

export interface ComposePlan {
  sections: ComposeSection[];
  /** "heuristic" | "llm" — 어떤 경로로 매칭됐는지 */
  source: "heuristic" | "llm";
  /** 원본 프롬프트 (감사 로그용) */
  rawPrompt: string;
}

// ───────────────────────────────────────────────────────────
// 키워드 → 프리셋 매핑
// ───────────────────────────────────────────────────────────

type Matcher = {
  preset: SectionPresetId;
  variant?: string;
  /** 이 키워드가 등장하면 후보로 추가 */
  keywords: RegExp;
  /** 정렬 우선순위 — 작을수록 페이지 상단에 배치 */
  order: number;
};

const MATCHERS: Matcher[] = [
  // 강점/특징 → usp
  { preset: "usp",        keywords: /(강점|장점|특징|why|왜|핵심|차별|usp|usp:)/i, order: 20 },
  // 단계/절차 → process
  { preset: "process",    keywords: /(단계|절차|프로세스|이용 ?방법|how|step|진행)/i, order: 30 },
  // 비교/타사 → table (비교 카드)
  { preset: "table",      keywords: /(비교|타사|차이|vs|대비|경쟁)/i, order: 40 },
  // 후기/리뷰 → review
  { preset: "review",     keywords: /(후기|리뷰|고객 ?만족|customer ?(review|story)|성공 ?사례)/i, order: 50 },
  // 크로스셀링/관련 서비스 → cross-sell
  { preset: "cross-sell", keywords: /(관련 ?서비스|크로스 ?셀|cross.?sell|다른 ?상품|추천 ?상품)/i, order: 60 },
  // FAQ
  { preset: "faq",        keywords: /(faq|자주 ?묻는|자주 ?하는|q.?&.?a|질문)/i, order: 70 },
  // 신청 폼
  { preset: "cta-form",   variant: "marketing-form",
    keywords: /(신청|문의|상담 ?신청|cta|폼|form|연락 ?받기|회신)/i, order: 80 },
];

/**
 * 휴리스틱 매처 — 프롬프트의 각 단락/섹션 헤더를 스캔해서
 * 매칭되는 섹션을 순서대로 반환.
 */
export function composeFromPromptHeuristic(prompt: string): ComposePlan {
  const matched = new Map<string, ComposeSection>(); // key = preset[+variant]

  // 1. 단락 분리 — 빈 줄 또는 헤더 마커(#, ##, ★, [...]) 단위
  const blocks = prompt
    .split(/\n{2,}|(?=^\s*(?:#|##|###|\*|\-|\d+\.|\[))/gm)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const block of blocks) {
    for (const m of MATCHERS) {
      if (!m.keywords.test(block)) continue;
      const key = `${m.preset}-${m.variant ?? "default"}`;
      if (matched.has(key)) continue; // 같은 섹션 중복 방지

      // 단락 첫 줄 또는 첫 30자 를 sectionTitle 후보로 추출
      const firstLine = block.split("\n")[0].replace(/^(#+|\*|\-|\d+\.|\[|\])\s*/, "").trim();
      const sectionTitle = firstLine.slice(0, 30) || undefined;

      // body / list 항목 추출 — bullet 또는 줄단위
      const bodyLines = block
        .split("\n")
        .slice(1)
        .map((l) => l.replace(/^[\-\*\+••]\s*/, "").trim())
        .filter(Boolean);

      const seedCells = extractSeedCells(m.preset, bodyLines);

      matched.set(key, {
        preset: m.preset,
        variant: m.variant,
        props: sectionTitle ? { sectionTitle } : undefined,
        seedCells: seedCells.length > 0 ? seedCells : undefined,
        rationale: `keyword match: ${block.match(m.keywords)?.[0] ?? ""}`,
      });
    }
  }

  // 2. 매칭 0건이면 디폴트 4종 (usp / review / cta-form / faq)
  if (matched.size === 0) {
    return {
      sections: [
        { preset: "usp",     rationale: "fallback default" },
        { preset: "review",  rationale: "fallback default" },
        { preset: "faq",     rationale: "fallback default" },
        { preset: "cta-form", variant: "marketing-form", rationale: "fallback default" },
      ],
      source: "heuristic",
      rawPrompt: prompt,
    };
  }

  // 3. order 로 정렬
  const sections = Array.from(matched.values()).sort((a, b) => {
    const oa = MATCHERS.find((m) => m.preset === a.preset)?.order ?? 99;
    const ob = MATCHERS.find((m) => m.preset === b.preset)?.order ?? 99;
    return oa - ob;
  });

  return { sections, source: "heuristic", rawPrompt: prompt };
}

/**
 * preset 에 맞게 body 라인을 셀로 변환.
 * - usp: 각 라인 = card 1장 (title)
 * - review: 각 라인 = review card 1장 (body)
 * - faq: 각 라인 = Q (body 는 짧은 placeholder)
 * - 그 외: 첫 4개만 title 로 사용
 */
function extractSeedCells(
  preset: SectionPresetId,
  lines: string[]
): Array<Partial<Record<CardSlotName, CardSlotContent>>> {
  const cleaned = lines.slice(0, 10);
  if (preset === "review") {
    return cleaned.map((line) => ({
      rating: { kind: "rating", value: 5, max: 5 },
      title: { kind: "text", text: line.slice(0, 40) },
      meta: { kind: "meta", items: ["작성자", "메타1", "메타2"] },
      body: { kind: "text", text: line },
    }));
  }
  if (preset === "faq") {
    return cleaned.map((line) => ({
      title: { kind: "text", text: line.slice(0, 80) },
      body: { kind: "text", text: "답변을 입력하세요." },
    }));
  }
  if (preset === "process") {
    return cleaned.slice(0, 4).map((line, i) => ({
      stepNumber: { kind: "text", text: String(i + 1).padStart(2, "0") },
      title: { kind: "text", text: line.slice(0, 12) },
      body: { kind: "text", text: line.slice(12, 40) || "" },
    }));
  }
  // usp / cross-sell / etc.
  return cleaned.slice(0, 4).map((line) => ({
    title: { kind: "text", text: line.slice(0, 20) },
    body: { kind: "text", text: line.slice(20, 60) || "" },
  }));
}

// ───────────────────────────────────────────────────────────
// LLM 경로 (옵션) — /api/compose 호출
// ───────────────────────────────────────────────────────────

/**
 * `NEXT_PUBLIC_PROMPT_COMPOSE_LLM=on` 이고 서버에 API 키가 설정된 경우
 * 실제 LLM 으로 분기. 응답 형태는 ComposePlan 과 동일.
 *
 * 실패 시 heuristic 으로 폴백.
 */
export async function composeFromPrompt(prompt: string): Promise<ComposePlan> {
  const useLlm = process.env.NEXT_PUBLIC_PROMPT_COMPOSE_LLM === "on";
  if (!useLlm) return composeFromPromptHeuristic(prompt);

  try {
    const res = await fetch("/api/compose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as ComposePlan;
    return { ...json, source: "llm", rawPrompt: prompt };
  } catch {
    // LLM 실패 → heuristic 폴백
    return composeFromPromptHeuristic(prompt);
  }
}

// 셀 변환 헬퍼 export — store 액션이 seedCells → CardCell 로 변환할 때 사용
export function seedCellsToCardCells(
  seedCells: Array<Partial<Record<CardSlotName, CardSlotContent>>>,
  prefix: string
): CardCell[] {
  return seedCells.map((slots, i) => ({
    id: `${prefix}-cell-${i}`,
    slots,
  }));
}

// ───────────────────────────────────────────────────────────
// 이미지 키워드 추출 — cell text → stock photo 검색어
// ───────────────────────────────────────────────────────────

/** 한글 조사·불용어 — 검색어에서 제거 */
const STOP_WORDS = new Set([
  "은", "는", "이", "가", "을", "를", "의", "에", "와", "과", "도",
  "그", "이런", "저런", "어떤", "왜", "어떻게", "하는", "되는",
  "있어요", "있습니다", "해드립니다", "드립니다",
  "the", "a", "an", "and", "or", "of", "to", "for", "with",
]);

/**
 * 텍스트에서 stock photo 검색에 쓸 키워드(앞 2개 토큰)를 뽑아냄.
 * 한글: 조사/공백 분리 → 첫 2개 의미어 join
 * 영문: 공백 분리 → 첫 2개 단어 join
 */
export function extractImageKeyword(text: string, fallback = "lifestyle"): string {
  if (!text) return fallback;
  const tokens = text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t.toLowerCase()));
  if (tokens.length === 0) return fallback;
  return tokens.slice(0, 2).join(" ");
}

/**
 * imgcard 의 media / listcard 의 icon 슬롯에 자동 임베드할
 * stock photo 검색어 후보를 cell 단위로 결정.
 *   1순위: cell.title 텍스트
 *   2순위: cell.body 텍스트
 *   3순위: sectionTitle (외부에서 전달)
 *   4순위: fallback "lifestyle"
 */
export function pickImageQueryForCell(
  cellSlots: Partial<Record<CardSlotName, CardSlotContent>>,
  sectionTitle?: string
): string {
  const title = cellSlots.title?.kind === "text" ? cellSlots.title.text : "";
  const body = cellSlots.body?.kind === "text" ? cellSlots.body.text : "";
  return (
    extractImageKeyword(title, "") ||
    extractImageKeyword(body, "") ||
    (sectionTitle ? extractImageKeyword(sectionTitle, "") : "") ||
    "lifestyle"
  );
}
