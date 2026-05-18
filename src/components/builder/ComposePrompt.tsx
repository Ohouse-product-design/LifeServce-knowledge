"use client";

/**
 * ComposePrompt — SectionTree 하단의 "프롬프트로 페이지 구성" 입력 UI.
 *
 * 입력 가능한 두 가지:
 *   1) 자유 텍스트 — 그대로 prompt-compose 의 휴리스틱/LLM 매처로 전달
 *   2) Notion 페이지 URL — /api/notion-fetch 로 본문을 평문화한 뒤 매처로 전달
 *
 * 추가 후 사용자는 우측 인스펙터에서 카피·셀을 그대로 편집한다.
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { detectNotionUrl } from "@/lib/notion-url";
import { resolveNotionInput } from "@/lib/notion-fetch-client";
import { useBuilderStore } from "@/store/builder-store";

const PLACEHOLDER = `방법 1) 노션 페이지 URL 만 붙여넣기:
https://www.notion.so/workspace/기획-페이지-abcdef0123456789...

방법 2) 자유 텍스트:
USP — 강점 3가지: 빠른 매칭 / 합리적 가격 / 책임보장
프로세스: 견적 요청 → 업체 매칭 → 예약 확정 → 이사 완료
후기: 만족도 5점 평균...
FAQ:
- 견적은 어떻게 받나요?
- 추가 비용은?
신청 폼: 이름·전화번호·이사일 입력`;

export default function ComposePrompt() {
  const composeFromPrompt = useBuilderStore((s) => s.composeFromPrompt);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // 입력 첫 줄이 Notion URL 인지 라이브 감지 (UI 힌트용)
  const notionInfo = useMemo(() => detectNotionUrl(prompt), [prompt]);

  const submit = async () => {
    const text = prompt.trim();
    if (!text || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      // Notion URL 이면 평문화 → composeFromPrompt 입력
      const resolved = await resolveNotionInput(text);
      if (resolved.error) {
        setNotice(`Notion fetch 실패: ${resolved.error} — 원본 텍스트로 진행합니다.`);
      } else if (resolved.fromNotion) {
        setNotice(
          `Notion "${resolved.title ?? "페이지"}" 본문을 가져와 ${resolved.text.length}자 입력으로 구성합니다.`
        );
      }
      await composeFromPrompt(resolved.text);
      setPrompt("");
      // notice 는 자동으로 사라지지 않게 사용자가 expanded 닫을 때까지 표시
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-ods-8 border border-builder-accent/40 bg-builder-accent/10 py-2 text-[11px] text-builder-text hover:bg-builder-accent/20"
        >
          <span className="text-builder-accent">✨</span>
          <span>기획 문서로 페이지 구성</span>
        </button>
      ) : (
        <div className="space-y-2 rounded-ods-8 border border-builder-accent/40 bg-builder-panel-2 p-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-builder-text">
              ✨ 기획 문서로 페이지 구성
            </p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-[11px] text-builder-muted hover:text-builder-text"
            >
              ✕
            </button>
          </div>
          <p className="text-[10px] leading-snug text-builder-muted">
            노션 기획 초안을 그대로 붙여넣거나, <span className="font-semibold">노션 페이지 URL</span> 만
            붙여도 됩니다. 본문을 자동으로 가져와 키워드 분석 → 섹션 자동 구성 →
            카드 이미지 stock photo 채움까지 한 번에 처리합니다.
          </p>
          {notionInfo && (
            <div className="rounded-ods-4 border border-builder-accent/40 bg-builder-accent/10 px-2 py-1 text-[10px] text-builder-text">
              📄 Notion URL 감지됨 — 제출 시 페이지 본문을 자동으로 가져옵니다
            </div>
          )}
          {notice && (
            <div className="rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1 text-[10px] text-builder-muted">
              {notice}
            </div>
          )}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={8}
            disabled={busy}
            className="builder-scroll w-full resize-none rounded-ods-4 border border-builder-border bg-builder-bg p-2 text-[11px] leading-snug text-builder-text outline-none placeholder:text-builder-muted/60 focus:border-builder-accent disabled:opacity-60"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-builder-muted">
              {prompt.length > 0 ? `${prompt.length}자` : "비어 있음"}
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={!prompt.trim() || busy}
              className={cn(
                "rounded-ods-4 px-3 py-1.5 text-[11px] font-semibold transition-colors",
                !prompt.trim() || busy
                  ? "cursor-not-allowed bg-builder-border text-builder-muted/60"
                  : "bg-builder-accent text-white hover:bg-builder-accent/90"
              )}
            >
              {busy ? "구성 중…" : "페이지 구성하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
