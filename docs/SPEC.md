# SPEC — Landing Page Builder

> Status: Draft v1 · [PRD.md](./PRD.md)의 컴패니언 문서 · Last updated: 2026-05-17
> 모든 프리셋·슬롯·카테고리 명명은 [CONVENTIONS.md](./CONVENTIONS.md)를 따른다.

이 문서는 PRD 뒷단의 기술 컨트랙트를 정의한다. 데이터 모델, Storybook 기반 레지스트리, 프롬프트 → 프리셋 파이프라인, 빌더 이벤트, 에러/관측 동작을 다룬다. `src/` 의 구현이 런타임 타입의 최종 진실이며, 본 문서는 서브시스템 간 **컨트랙트**를 정리한 것이다.

---

## 1. 시스템 개요

```
                ┌────────────────────────────────────────────────────┐
                │              Storybook (디자이너)                  │
                │  *.stories.tsx 가 프리셋 + 컴포넌트 선언           │
                │  preset.intents  →  의도 라벨                      │
                └──────────────────────┬─────────────────────────────┘
                                       │  빌드 타임 제너레이터
                                       ▼
                ┌────────────────────────────────────────────────────┐
                │            Preset Registry (JSON 아티팩트)         │
                │   sectionPresets[] · componentPresets[] · tags     │
                └─────────────┬─────────────────────┬────────────────┘
                              │                     │
              consumed by     │                     │   consumed by
                              ▼                     ▼
              ┌──────────────────────┐   ┌──────────────────────────┐
              │   Builder UI         │   │   Preset Matcher         │
              │   (Next.js admin)    │   │   (LLM intent + scoring) │
              └──────────┬───────────┘   └──────────────┬───────────┘
                         │                              │
                         │  유저 프롬프트 + 페이지 상태  │
                         └──────────────►───────────────┘
                                       │
                                       ▼
                ┌────────────────────────────────────────────────────┐
                │           LandingPageDoc (zustand store)           │
                │   sections[] · slots · tokens · audit · prompts    │
                └──────────────────────┬─────────────────────────────┘
                                       │  publish
                                       ▼
                ┌────────────────────────────────────────────────────┐
                │   Publisher (Apps Script → M5에서 CDN/CMS)         │
                └────────────────────────────────────────────────────┘
```

세 가지 컨트랙트가 시스템을 묶는다.

1. **프리셋 컨트랙트** — Storybook 스토리가 프리셋이 되기 위해 선언해야 할 것.
2. **레지스트리 컨트랙트** — 빌더가 소비하는 형태.
3. **도큐먼트 컨트랙트** — 영속 저장되는 `LandingPageDoc` 모델 (이미 `src/schema/doc.ts` 에 구현됨).

## 2. 데이터 모델

빌더에는 `src/schema/` 에 모델이 이미 존재한다. 본 절은 v1 프롬프트 → 프리셋 기능을 위한 **추가/변경** 사항을 명시한다. 기존 필드는 요약만 다룬다.

### 2.1 LandingPageDoc (기존 + 확장)

```ts
type LandingPageDoc = {
  meta: { slug: string; title: string; category: string; owners: string[] };
  sections: Section[];
  globalTokens: TokenBinding[];
  audit: AuditEntry[];
  promptHistory?: PromptEvent[];     // §5.4
};

type Section = {
  id: string;
  preset: SectionPresetId;            // 예: "section.card-grid"
  pinned: boolean;                    // 기존 locked 대체
  unique?: boolean;                   // 페이지당 1회만 허용 (header 등)

  // 모든 섹션의 공통 헤더 (CONVENTIONS §4)
  title: string;                      // 필수, 프리셋 default 로 채워짐
  subtitle?: string;                  // 선택

  // 슬롯 (chrome 섹션은 비어 있을 수 있음)
  slots: Record<string, SlotInstance>;

  // 기타
  assets: AssetSlot[];
  tokens: TokenBinding[];
  visibility: { mobile: boolean; tablet: boolean; desktop: boolean };
  origin?: SectionOrigin;             // §5.4
};

type SectionOrigin =
  | { kind: "manual"; pickerLabel: string }
  | { kind: "prompt"; promptId: string; confidence: number; matchedIntent: string };
```

기존의 `locked: boolean` 은 `pinned: boolean` 으로 이름 변경. `unique: boolean` 추가. `props.sectionTitle` 같은 자유 형식 키 대신, `title` 과 `subtitle?` 을 섹션 모델의 1급 필드로 승격 (CONVENTIONS §4).

### 2.2 SlotInstance (개정)

기존 `Record<string, ComponentInstance[]>` 가 `Record<string, SlotInstance>` 로 변경된다. 슬롯이 단순 배열이 아니라 layout/dataSource/items 의 3축을 가진 객체가 된다.

```ts
type SlotInstance = {
  variant: SlotItemVariant;           // 슬롯이 담는 아이템 변형 (CONVENTIONS §7)
  layout: SlotLayout;                  // grid | carousel | list (CONVENTIONS §8)
  dataSource: DataSourceSpec;          // CONVENTIONS §9
  items: SlotItem[];                   // dataSource=static 일 때만 권위 있는 소스
                                       // google-sheet 일 때는 빌드/퍼블리시 시점에 hydrate
};

type SlotItem = {
  id: string;
  cells: Cell;                         // 변형마다 cell schema 가 다름 (CONVENTIONS §7)
  href?: string;
  onClick?: ItemAction;                // CONVENTIONS §10
};

type Cell = Record<string, CellValue>;
type CellValue = string | number | AssetRef | undefined;

type SlotItemVariant =
  | "slot-item.card"
  | "slot-item.review-card"
  | "slot-item.list-card"
  | "slot-item.progress-card"
  | "slot-item.input";

type SlotLayout = "grid" | "carousel" | "list";

type ItemAction =
  | { type: "navigate"; href: string; target?: "_self" | "_blank" }
  | { type: "anchor";   sectionId: string }
  | { type: "modal";    modalId: string }
  | { type: "submit"; }
  | { type: "none"; };
```

### 2.3 DataSourceSpec (신규)

```ts
type DataSourceSpec =
  | { type: "static"; }
  | {
      type: "google-sheet";
      sheetId: string;
      range: string;                   // 예: "Sheet1!A2:E"
      columnMap: Record<string, string>; // cell key → 열 라벨 ("A", "B", ...)
      refresh: "manual" | "on-publish";
      lastSyncedAt?: string;
    };
```

`google-sheet` 의 페치/캐싱/오류 처리는 §6 의 데이터 소스 컨트랙트에서 다룬다.

### 2.4 SectionPreset (레지스트리 형태)

```ts
type SectionPreset = {
  id: SectionPresetId;                // 예: "section.card-grid"
  label: string;                      // 빌더 "+ 섹션" 메뉴 표기
  pinned: boolean;                    // 재정렬/삭제 불가 (디폴트)
  unique: boolean;                    // 페이지당 1회만 허용

  defaults: {
    title: string;                    // 기본 섹션 타이틀 (CONVENTIONS §4)
    subtitle?: string;                // 기본 서브타이틀
    slots: Record<string, SlotDefault>;
  };

  slots: SlotSpec[];                  // §2.5
  uiSpec: UISpec;                     // title/subtitle/cell 의 글자수·줄수 제약

  // 프롬프트 라우팅용
  intents: IntentTag[];               // 자동 생성 (§3.3), 디자이너 오버라이드 가능
  cardinality: "single" | "multi";
  tone?: "informational" | "social_proof" | "transactional";

  storyId: string;                    // 출처 Storybook 스토리
};

type SlotDefault = {
  variant: SlotItemVariant;
  layout: SlotLayout;
  dataSource: DataSourceSpec;
  items: SlotItem[];                  // 빈 배열로 시작하는 게 일반적
};
```

### 2.5 SlotSpec (재정의)

```ts
type SlotSpec = {
  name: SlotName;                     // CONVENTIONS §6.1: "items" | "media" | "actions" | "fields" | "columns" | "rows" | "tabs"
  accepts: SlotItemVariant[];         // 슬롯이 허용하는 아이템 변형들
  layouts: SlotLayout[];              // 허용되는 레이아웃 (CONVENTIONS §8.1)
  defaultLayout: SlotLayout;
  allowDataSource: DataSourceType[];  // ["static"] | ["static", "google-sheet"]
  min?: number;
  max?: number;
};

type SlotName = "items" | "media" | "actions" | "fields" | "columns" | "rows" | "tabs";
type DataSourceType = "static" | "google-sheet";
```

### 2.6 IntentTag

```ts
type IntentTag =
  | "introduce_features"
  | "compare_plans"
  | "show_coverage"
  | "social_proof"
  | "explain_process"
  | "cross_sell"
  | "collect_lead"
  | "promote_hero"
  | string; // 오픈 보캐뷸러리 — §5.2 참고
```

### 2.7 왜 이 형태인가

- **공통 헤더 (title / subtitle?) 가 1급 필드.** 자유 형식 `props.sectionTitle` 대신 모델 레벨에 둠으로써, 모든 섹션이 동일한 편집 UX 와 검증 규칙을 공유한다. 비디자이너가 한 번 학습한 편집 패턴이 모든 프리셋에 일관 적용된다.
- **슬롯이 3축 객체.** 단순 아이템 배열이 아닌 `(variant, layout, dataSource)` 의 3축으로 슬롯을 모델링함으로써, "같은 카드 데이터를 grid → carousel 로 전환" 같은 작업이 데이터 손실 없이 가능하다.
- **변형/레이아웃 분리.** 카드 종류(`slot-item.review-card`)와 배치(`carousel`) 가 독립적인 축이므로, 5 종 × 3 종 = 15 가지 조합을 1 종의 슬롯 정의로 커버.
- **Storybook 단일 소스.** 각 `slot-item.*` 변형의 cell schema 는 Storybook 스토리에서 선언된 것을 권위 있는 소스로 본다. 빌더는 레지스트리에서 cell schema 를 읽어 인스펙터를 자동 생성.
- `intents`, `cardinality`, `tone` 만이 매처의 런타임 입력이다.
- `storyId` 는 인스펙터에서 정식 Storybook 예시로 딥링크하는 백포인터.

## 3. Storybook → 레지스트리 파이프라인

### 3.1 스토리 작성 컨트랙트

섹션 프리셋은 Storybook 스토리의 default export 가 `parameters.preset` 블록을 포함함으로써 선언된다.

```tsx
// src/stories/sections/CardGrid.stories.tsx
export default {
  title: "Sections/CardGrid",
  component: CardGridSection,
  parameters: {
    preset: {
      kind: "section",
      id: "section.card-grid",
      label: "카드 그리드",
      pinned: false,
      unique: false,
      defaults: {
        title: "이런 점이 다릅니다",
        subtitle: "",
        slots: {
          items: {
            variant: "slot-item.card",
            layout: "grid",
            dataSource: { type: "static" },
            items: [],
          },
        },
      },
      slots: [
        {
          name: "items",
          accepts: ["slot-item.card", "slot-item.list-card"],
          layouts: ["grid", "list"],
          defaultLayout: "grid",
          allowDataSource: ["static", "google-sheet"],
          min: 1,
          max: 12,
        },
      ],
      uiSpec: cardGridUISpec,
      // intents 는 빌드 타임에 자동 생성됨 (§3.3).
      cardinality: "multi",
      tone: "informational",
    },
  },
};
```

슬롯 아이템 변형(`slot-item.*`)도 동일한 형태에 `kind: "slot-item"` 으로 선언한다. 각 변형은 자신의 `cells` 스키마 — 어떤 셀이 필수/선택인지, 타입은 무엇인지 — 를 stories `parameters.preset.cells` 에 선언한다. 빌더는 이 스키마를 읽어 인스펙터를 자동 생성한다.

```tsx
// src/stories/slot-items/ReviewCard.stories.tsx
export default {
  title: "SlotItems/ReviewCard",
  component: ReviewCard,
  parameters: {
    preset: {
      kind: "slot-item",
      id: "slot-item.review-card",
      label: "후기 카드",
      cells: {
        rating: { type: "number", min: 0, max: 5, required: false },
        title:  { type: "string", maxChar: 40, required: false },
        body:   { type: "string", maxChar: 200, maxLine: 5, required: true },
        meta:   { type: "string", maxChar: 30, required: false },
        media:  { type: "asset", kind: "image", required: false },
      },
      acceptsAction: ["navigate", "modal", "none"],
    },
  },
};
```

### 3.2 제너레이터

빌드 타임 스크립트가 `src/stories/**/*.stories.{ts,tsx}` 를 순회하며 모든 `parameters.preset` 블록을 수집하고, `SectionPreset` / `ComponentPreset` 스키마(Zod)로 검증한 뒤 다음을 출력한다.

```
src/catalog/preset-registry.json   // 체크인된 빌드 아티팩트
```

빌더는 이 JSON 을 직접 임포트한다. 런타임에 Storybook 에 의존하지 않는다.

CI 게이트: 스토리가 `preset` 을 선언했지만 스키마 검증에 실패하면 빌드 실패.

### 3.3 Intent 태그 자동 생성

`intents` 는 빌드 타임에 다음 입력으로부터 자동 생성된다.

```
[입력]
  · 스토리 타이틀 (예: "Sections/CardGrid")
  · 프리셋 id, label, cardinality, tone
  · 슬롯 구성 (이름, accepts 컴포넌트 종류·라벨)
  · uiSpec 의 필드 라벨/설명
        │
        ▼
[자동 태깅 LLM 호출]
  시스템 프롬프트: 큐레이션된 IntentTag 보캐뷸러리(§2.2) + "기타" 이스케이프
  출력: { intents: IntentTag[], confidence: number, rationale: string }
        │
        ▼
[병합]
  · 자동 생성 intents
  · 스토리의 명시적 `intents` 가 있으면 그것이 우선 (오버라이드)
        │
        ▼
preset-registry.json 에 기록 (각 intent 에 대해 source: "auto" | "manual" 표시)
```

규칙:

- 자동 생성된 intents 의 confidence < 0.6 이면 빌드 경고 + 디자이너에게 명시적 태깅 요청.
- 자동 태깅 결과는 PR 단계에서 검증할 수 있도록 `preset-registry.diff.md` 산출물로 함께 출력한다 (PR 리뷰어가 "이 프리셋이 이 intent에 매칭되는 게 맞나" 확인 가능).
- 자동 태깅 LLM 호출은 결정적으로 캐싱(스토리 메타데이터 해시 키)되어 동일 입력은 동일 결과를 낸다.

### 3.4 오늘 코드로부터의 마이그레이션

현재 `src/schema/section-presets.ts` 와 `src/schema/component-presets.ts` 가 카탈로그를 하드코딩하고 있다. v1 은 한 릴리스 사이클 동안 이 파일들을 폴백으로 유지한다. 그 이후 생성된 `preset-registry.json` 이 권위 있는 소스가 되고, 수기 프리셋 파일은 M3 이후 제거된다.

기존 시멘틱 ID(`usp`, `review`, `coverage`, `process`, `cross-sell`, `cta-form`, `hero`, `sticky-cta`) 는 CONVENTIONS §7 의 마이그레이션 테이블에 따라 구조적 ID(`section.card-grid`, `section.quote-list`, `section.tag-list`, `section.steps`, `section.card-carousel`, `section.form`, `section.banner`, `section.sticky-bar`)로 일괄 변경한다.

## 4. 프롬프트 → 프리셋 매처

### 4.1 파이프라인

```
prompt (string)
   │
   ▼
[1] normalize        (trim, 언어 감지)
   │
   ▼
[2] segment          (LLM 호출 → IntentSignal[])
                     (단일 의도면 길이 1, 다중 의도면 N. §4.6 참고)
   │
   ▼ (each signal)
[3] candidate fetch  (intent 태그로 레지스트리 필터)
   │
   ▼
[4] score            (intent 매치 + cardinality + 페이지 컨텍스트)
   │
   ▼
[5] decide           (신뢰도에 따라 자동 삽입 vs 선택 UI)
   │
   ▼
PresetPlacement[]    (의도 순서를 보존)
```

### 4.2 IntentSignal (LLM 출력 컨트랙트)

LLM 은 시스템 프롬프트에서 레지스트리의 intent 보캐뷸러리 + "기타" 이스케이프로 고정된다. 출력 스키마(structured output 강제):

```ts
type IntentSignal = {
  intent: IntentTag;                  // 주 의도
  cardinality: "single" | "multi";
  tone?: "informational" | "social_proof" | "transactional";
  entities?: string[];                // 선택: 추출된 토픽 단어
  confidence: number;                 // 0..1
  rationale?: string;                 // 1줄, 감사/디버그용
};
```

### 4.3 스코어링

후보 프리셋 `p` 와 시그널 `s` 에 대해:

```
score(p, s) =
    1.0  if p.intents 가 s.intent 포함
  + 0.3  if p.cardinality == s.cardinality
  + 0.2  if p.tone == s.tone
  - 0.5  if 페이지의 최근 2 섹션 내에 p.id 가 이미 존재 (반복 페널티)
  + 0.1  if 동일 구조 프리셋이 페이지에 아예 없음
```

결정 규칙:

```
top = argmax(score)
if top.score - second.score >= 0.4 AND top.score >= 0.9:
    자동 삽입
else:
    상위 3개를 선택 UI로 노출
```

(상수는 튜닝 가능. 매처는 `MATCHER_CONFIG` 로 노출하며, 호출별 스코어 분해를 로깅한다.)

### 4.4 삽입 시맨틱

- 기본 삽입 위치는 **현재 선택된 섹션 다음**. 선택이 없으면 페이지 끝.
- 삽입된 섹션은 프리셋의 `defaults` (타이틀 + 빈 슬롯) 를 사용.
- 삽입된 섹션의 `origin` 은 `{ kind: "prompt", promptId, confidence, matchedIntent }`.
- 대응되는 `PromptEvent` 가 `doc.promptHistory` 에 append.

### 4.5 다중 의도 분절

`[2] segment` 단계는 모든 프롬프트에 대해 호출되며, 다음 컨트랙트로 동작한다.

```ts
type SegmentResult = {
  signals: IntentSignal[];            // 1..N
  ordering: "sequential" | "free";    // "위·아래", "이어서" 등의 표현이 있으면 sequential
};
```

LLM 시스템 프롬프트는 "사용자가 한 문장에 여러 섹션을 요청했을 수 있다. 의도가 명확히 분리되면 별도 시그널로 쪼개라" 라고 지시한다. 예시:

| 입력 | 분절 결과 |
|---|---|
| "서비스 주요 항목 안내 섹션 추가" | `[{ intent: introduce_features }]` |
| "배너 추가하고 그 아래에 서비스 항목 안내" | `[{ promote_hero }, { introduce_features }]` (sequential) |
| "후기랑 자주 묻는 질문도 같이" | `[{ social_proof }, { faq }]` (free) |

배치 규칙:

- `sequential` 인 경우 시그널 순서대로 연속 삽입. 첫 시그널은 현재 선택 위치 다음, 두 번째 시그널은 그 다음.
- `free` 인 경우에도 순서는 시그널 배열 순서를 따른다 (분리만 됐을 뿐, 사용자가 적은 순서를 존중).
- 각 시그널의 confidence 와 매칭 score 는 개별 평가. 한 시그널이 폴백(선택 UI)으로 떨어져도 나머지는 자동 삽입 가능.
- 다중 시그널이 모두 처리되면 단일 `PromptEvent` 에 N 개의 placement 를 묶어 기록한다 (§5.2 의 `placement` 가 배열화됨).

### 4.6 폴백 동작

| 조건 | 동작 |
|---|---|
| LLM 호출 실패 또는 타임아웃 (>3s). | 인라인 에러 + 매뉴얼 "+ 섹션" 피커를 프롬프트 키워드 매치 위치로 스크롤. (AI 없는 degraded 모드) |
| LLM 응답 confidence < 0.5. | 자동 삽입 대신 상위 3 후보 선택 UI 노출. |
| 모든 후보 score < 0.4. | "어떤 섹션이 맞을지 잘 모르겠어요. 골라주세요" 안내 + 전체 피커 오픈. |
| 레지스트리 비어 있음 (빌드 문제). | 빌드 로그 링크와 함께 배너 오류. |

## 5. 빌더 이벤트 & 저장

### 5.1 섹션 단위 이벤트 (zustand 액션)

| 액션 | 인자 | Origin 전파 |
|---|---|---|
| `addSectionFromPicker` | `presetId`, `insertAfter?` | `origin = { kind: "manual", pickerLabel }` |
| `addSectionFromPrompt` | `presetId`, `promptId`, `confidence`, `matchedIntent`, `insertAfter?` | `origin = { kind: "prompt", ... }` |
| `reorderSections` | `fromIndex`, `toIndex` | `pinned` 존중 |
| `removeSection` | `sectionId` | `pinned` 존중 |
| `editSectionProps` | `sectionId`, `propPath`, `value` | `validateField` 실행 |
| `editSectionSlot` | `sectionId`, `slotName`, mutation | 슬롯 `min/max` 체크 |

### 5.2 프롬프트 이벤트

```ts
type PromptEvent = {
  id: string;                         // uuid
  ts: string;                         // ISO timestamp
  userId: string;
  rawText: string;
  signal: IntentSignal;
  segment: SegmentResult;             // §4.5
  placements: Array<{
    signalIndex: number;               // segment.signals 의 인덱스
    chosen: { presetId: string; auto: boolean };
    alternates: Array<{ presetId: string; score: number }>;
  }>;
  outcome: "kept" | "partial" | "undone" | "replaced";
};
```

`outcome` 은 동일 세션 내에서 사용자가 undo 하거나 섹션을 교체할 때 업데이트(베스트 에포트). 매처의 오프라인 튜닝에 사용.

### 5.3 영속화

- `LandingPageDoc` 은 기존 퍼블리셔 타깃(M1: Apps Script, M5: CDN/CMS)에 저장.
- `promptHistory` 와 `audit` 은 doc 과 함께 저장.
- v1 은 옵티미스틱 로컬 상태(zustand) + 디바운스 세이브(2s). 서버사이드 컨플릭트 해결 없음. 세션 단위 last-writer-wins.

### 5.4 검수 핸드오프 페이로드

P1 이 "검수 요청" 클릭 시 빌더가 Jira/Slack 에 전송:

```json
{
  "slug": "moving",
  "previewUrl": "...",
  "sections": [
    { "id": "...", "preset": "section.card-grid", "origin": "prompt:서비스 주요 항목..." }
  ],
  "promptHistory": [ /* PromptEvent[] */ ],
  "reviewer": "@designer",
  "note": "...",
  "catalogExtension": {
    "requested": true,
    "description": "통계 strip 과 결합된 banner 가 필요한데 현재 카탈로그에 없음",
    "references": ["sectionId:abc", "사례 URL"]
  }
}
```

Jira 티켓은 빌더의 해당 doc 리비전으로 백링크된다. `catalogExtension.requested === true` 이면 티켓에 `catalog-extension` 라벨이 부여되고 디자인 플랫폼 팀 큐로 라우팅된다. 후속 PR(디자이너의 Storybook 스토리 + 필요 시 개발자의 컴포넌트)이 머지되면 §3 의 레지스트리 빌드 경로로 자동 반영된다.

## 6. 데이터 소스 (Google Sheet)

슬롯의 `dataSource.type === "google-sheet"` 일 때, 슬롯의 `items` 는 Google Sheet 의 행에서 hydrate 된다. 빌더는 Sheet 자격증명을 직접 보유하지 않고, 기존 `apps-script/` GAS Web App 을 읽기 브리지로 사용한다.

### 6.1 컨트랙트

```
[빌더가 슬롯의 dataSource 요청]
   POST {appsScriptUrl}/sheet-read
   { sheetId, range, columnMap }
        │
        ▼
[Apps Script]
   · 사용자의 OAuth 토큰으로 Sheets API 호출
   · 행 단위로 columnMap 에 따라 cell 매핑
   · 결과를 SlotItem[] 형태로 반환
        │
        ▼
[빌더가 hydrate 결과를 인스펙터/프리뷰에 표시]
   · "Google Sheet 에서 N행 로드됨" 배지 표시
   · 각 아이템에 origin: "sheet:{rowIndex}" 부착
```

### 6.2 응답 형태

```ts
type SheetReadResponse = {
  ok: true;
  rows: number;                       // 반환된 행 수
  items: SlotItem[];                  // columnMap 으로 변환된 결과
  syncedAt: string;                   // ISO timestamp
} | {
  ok: false;
  error:
    | "auth_required"
    | "sheet_not_found"
    | "range_invalid"
    | "column_missing"                // columnMap 에 명시된 열이 없음
    | "rate_limited";
  message: string;
};
```

### 6.3 컬럼 매핑

각 슬롯 아이템 변형의 cell 키가 Sheet 열 라벨에 매핑된다. 예: `slot-item.review-card`:

| Sheet 열 | columnMap key | Cell |
|---|---|---|
| A | `rating` | `rating: number` |
| B | `title` | `title: string` |
| C | `body` | `body: string` |
| D | `meta` | `meta: string` |
| E | `href` | `href: string` (아이템 레벨) |
| F | `onClickType` | `onClick.type` (`navigate` 등) |

`href` 와 `onClickType` 은 cell 이 아니라 `SlotItem` 레벨이지만 동일한 columnMap 으로 처리한다.

### 6.4 새로고침 정책

| `refresh` | 동작 |
|---|---|
| `manual` | 인스펙터의 "Sheet 새로 고침" 버튼을 누를 때만 페치. `lastSyncedAt` 표시. |
| `on-publish` | 빌더 퍼블리시(또는 export) 직전에 자동 페치. doc 에는 페치 결과 스냅샷이 저장됨. |

런타임에 실시간으로 Sheet 를 다시 읽는 모드는 v1 에서 지원하지 않는다 (퍼블리시된 페이지는 정적이다).

### 6.5 빌더 동작

- `dataSource.type === "google-sheet"` 인 슬롯은 인스펙터에서 개별 아이템 편집이 잠긴다. 편집 대상은 `sheetId`, `range`, `columnMap`, `refresh` 뿐.
- 한 아이템만 오버라이드하고 싶다면 슬롯을 `static` 으로 전환해야 한다 (한 번의 클릭으로 hydrate 결과를 정적 items 로 dump 하는 액션 제공).
- 페치 결과가 슬롯의 `min`/`max` 를 위반하면 인스펙터에 경고 표시 + 퍼블리시 차단.

### 6.6 에러 처리

| 상황 | UX |
|---|---|
| `auth_required` | "Apps Script 권한이 만료되었습니다" 토스트 + 권한 갱신 링크 |
| `sheet_not_found` / `range_invalid` | 인스펙터 인라인 에러, items 비움 |
| `column_missing` | 누락된 열을 빨강으로 표시. 아이템은 부분 채움 + 경고 |
| `rate_limited` | 백오프 후 1회 자동 재시도. 실패 시 토스트 |

## 7. 코드 Export

조립된 `LandingPageDoc` 을 개발자가 자신의 코드베이스에 1차 초안으로 가져갈 수 있는 정적 번들로 변환한다. PRD §6.5 의 기술 구현 디테일.

### 7.1 트리거

- 빌더 상단 보조 줄의 "Export" 액션 (검수와 별도)
- API 엔드포인트: `POST /api/export?slug={slug}&format={html|jsx}&assets={url|zip}`

### 7.2 출력 번들 구조

```
landing-{slug}-{revision}.zip
├─ index.html
├─ styles.css
├─ assets.json
├─ links.json
├─ components/                       # format=jsx 일 때만
│  ├─ Section-header.jsx
│  ├─ Section-banner.jsx
│  └─ ...
└─ README.md
```

### 7.3 index.html (정적 HTML 포맷)

요구사항:

- **DOCTYPE + meta viewport** 포함. 모바일 first 가정.
- **시맨틱 마크업**: `pinned: true && unique: true` 인 프리셋은 `<header>` / `<footer>`. `section.banner` 는 `<section role="banner">`. 그 외 본문 섹션은 `<section>`.
- **ARIA**: 모든 `<section>` 에 `aria-labelledby` 가 그 섹션의 타이틀 엘리먼트(`<h2 id="...">`) 를 참조.
- **데이터 어트리뷰트**: 각 섹션 루트에 `data-preset="section.card-grid"`, `data-section-id="..."` 부착. 개발자가 빌더와 매핑할 때 사용.
- **에셋 src**: `assets.json` 에 등록된 절대 URL 그대로. `format=zip` 옵션이면 상대 경로(`./assets/...`)로 치환.
- **링크 href**: `links.json` 에 등록. placeholder(`#TODO-cta`)는 명시적으로 부착해 grep 가능하게.

예시:

```html
<section
  data-preset="section.card-grid"
  data-section-id="sec_abc123"
  aria-labelledby="title_sec_abc123"
>
  <h2 id="title_sec_abc123">이런 점이 다릅니다</h2>
  <div class="lp-card-grid">
    <article class="lp-card">
      <img src="https://cdn.ohou.se/..." alt="..." />
      <h3>...</h3>
      <p>...</p>
    </article>
    <!-- ... -->
  </div>
</section>
```

### 7.4 styles.css (반응형 스펙 포함)

요구사항:

- **mobile-first**. 기본 규칙은 375px 기준, `@media (min-width: 768px)` / `@media (min-width: 1280px)` 두 브레이크포인트로 데스크탑 확장.
- **`:root` 토큰 인라인**: ODS 토큰 전체(또는 사용된 서브셋)을 CSS 변수로 export.
- **클래스 네이밍**: `lp-{preset-tail}` 패턴 (`lp-card-grid`, `lp-banner`, `lp-quote-list`). 빌더 내부 클래스명과 동일.
- **Tailwind 의존성 제거**: Tailwind 클래스가 적용된 결과를 평문 CSS 로 인라인.
- **반응형 가시성**: `Section.visibility` 가 false 인 뷰포트에서는 `display: none` 으로 처리.

예시:

```css
:root {
  --ods-color-bg: #fff;
  --ods-color-fg: #1a1a1a;
  --ods-color-accent: #35c5f0;
  --ods-radius-md: 12px;
  --ods-space-section: 80px;
  --ods-type-h2-size: 24px;
  --ods-type-h2-line: 32px;
  /* ... */
}

.lp-card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: var(--ods-space-section) 16px;
}

@media (min-width: 768px) {
  .lp-card-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1280px) {
  .lp-card-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
}

[data-section-id="sec_xyz"][data-visible-mobile="false"] {
  display: none;
}
@media (min-width: 768px) {
  [data-section-id="sec_xyz"][data-visible-tablet="false"] { display: none; }
}
@media (min-width: 1280px) {
  [data-section-id="sec_xyz"][data-visible-desktop="false"] { display: none; }
}
```

### 7.5 assets.json

```ts
type AssetsManifest = {
  version: 1;
  items: Array<{
    refId: string;                    // HTML 의 data-asset-id 와 매칭
    sectionId: string;
    slotName: string;
    type: "image" | "lottie" | "icon";
    url: string;                      // 절대 URL (zip 옵션이면 상대 경로)
    alt?: string;
    sourceTokenRef?: string;          // ODS 에셋 ID, 있는 경우
  }>;
};
```

개발자는 이 파일만으로 모든 외부 에셋 의존성을 audit 할 수 있다.

### 7.6 links.json

```ts
type LinksManifest = {
  version: 1;
  items: Array<{
    refId: string;
    sectionId: string;
    label: string;                    // 버튼/링크 텍스트
    href: string;                     // 실제 URL or "#TODO-{label}"
    placeholder: boolean;             // true 면 개발자가 채워야 함
    target?: "_blank" | "_self";
  }>;
};
```

placeholder 링크는 HTML 에 `href="#TODO-..."` 로 부착되어 grep 으로 한 번에 찾아낼 수 있다.

### 7.7 components/ (JSX 포맷)

`format=jsx` 옵션이 켜진 경우, 섹션별로 함수형 React 컴포넌트가 생성된다.

- 파일명: `Section-{preset-tail}.jsx` (예: `Section-card-grid.jsx`).
- 슬롯은 props 로 노출 (`items: Array<{...}>` 등).
- 토큰은 className 또는 inline `style` 로 매핑 (Tailwind 사용 환경이면 옵션으로 Tailwind 클래스 보존).
- `index.jsx` 가 섹션들을 순서대로 import + 렌더하는 entry 를 제공.

### 7.8 README.md

자동 생성되는 README 에 포함:

- 페이지 메타 (slug, title, revision, exported_at)
- 사용된 프리셋 목록과 그 origin (`manual` / `prompt:{rawText}`)
- 반응형 스펙: 브레이크포인트 정의, 각 뷰포트에서의 가시성 규칙
- 바인딩된 ODS 토큰 목록 (사용된 것만)
- 교체 포인트 체크리스트: placeholder 링크, TODO 카피, alt 텍스트 누락 에셋
- 빌더 doc 리비전으로의 백링크

### 7.9 변환 컨트랙트 (doc → bundle)

```
LandingPageDoc
   │
   ▼
[1] resolve tokens     모든 TokenBinding 을 실제 값으로 해석
   │
   ▼
[2] render preview     기존 PreviewRenderer 와 동일한 트리 생성 (DOM 표현)
   │
   ▼
[3] serialize HTML     시맨틱 태그 + ARIA + data-* 부여
   │
   ▼
[4] extract CSS        사용된 클래스만 추출 + 반응형 규칙 병합
   │
   ▼
[5] collect manifests  assets.json + links.json 생성 (visit AssetSlot, prop 이 'href' 인 필드)
   │
   ▼
[6] (optional) split   format=jsx 면 섹션별 컴포넌트 파일로 분할
   │
   ▼
[7] zip + sign         bundle 메타에 doc revision + builder version 기록
```

빌더의 프리뷰 렌더러와 export 렌더러는 **동일한 노드 트리**를 입력으로 받는다(=시각적 정합 보장). export 는 그 트리를 React 가 아닌 정적 HTML 문자열로 직렬화하는 추가 단계만 가진다.

### 7.10 보장 vs 비보장

| 항목 | 보장 |
|---|---|
| 빌더 프리뷰와 시각적 동일성 (375/768/1280) | ✓ |
| 시맨틱 마크업 + ARIA 라벨 | ✓ |
| 반응형 미디어 쿼리 명시 | ✓ |
| 토큰 인라인 (`:root` CSS 변수) | ✓ |
| 에셋·링크 매니페스트 | ✓ |
| 모든 브라우저에서 픽셀 퍼펙트 | ✗ (개발자 검증 필요) |
| 운영 코드베이스 컨벤션 일치 | ✗ (개발자 어댑테이션 단계) |
| 빌더에서의 후속 변경이 export 번들에 자동 반영 | ✗ (다시 export 필요) |
| SEO 메타 (OG, JSON-LD 등) | ✗ (v1 범위 밖) |
| 모션·인터랙션 디테일 | 부분 (CSS 트랜지션만; JS 인터랙션은 컴포넌트 prop 으로 명시) |

## 8. UI Spec 강제

`uiSpec` 은 `src/schema/ui-spec.ts` 에 이미 구현되어 있고 `PropsTab` 이 소비한다. v1 은 이를 엄격화한다.

- 검증은 **편집 중**(라이브 카운터) 과 **퍼블리시 시**(실패 시 퍼블리시 차단, Review 모달 에러 상태로 오픈) 양쪽에서 수행.
- 슬롯 `min/max` 는 추가/삭제 시점에 강제. "+" 어포던스는 `max` 도달 시 비활성화. `min` 미달 섹션은 인라인 경고 + 퍼블리시 차단.
- 에셋 슬롯은 `assetSlots[i].required === true` 일 때만 필수.

## 9. 권한 (v1 스케치)

| 역할 | 조립 | 카탈로그 추가 | 퍼블리시 |
|---|---|---|---|
| 비디자이너 (P1) | ✓ | ✗ (검수로 요청) | ✓ (검수 동반) |
| 디자이너 (P2) | ✓ | ✓ (Storybook PR) | ✓ |
| 리뷰어 (P3) | 보기 + 코멘트 | ✓ (Storybook PR) | ✗ |

**`pinned` 프리셋 편집 규칙:**

| 작업 | 비디자이너 | 디자이너 |
|---|---|---|
| 재정렬 | ✗ | ✓ |
| 삭제 | ✗ | ✓ |
| 슬롯 컴포넌트 변경 | ✗ | ✓ |
| 카피 편집 (타이틀, 서브타이틀, CTA 라벨) | ✓ | ✓ |
| 이미지/Lottie 에셋 교체 | ✓ | ✓ |

구현: 오늘의집 디자인 플랫폼 도구의 동일 SSO 그룹으로 게이팅. 상세는 M4 에서 플랫폼 팀과 협의.

## 10. 관측성

- **매처 로그** (서버 사이드): 호출별 → 프롬프트, IntentSignal, 후보 + 스코어, 결정(자동/선택), 레이턴시, LLM 토큰 사용량.
- **결과 로그** (클라이언트 → 서버): 사용자가 프롬프트 추가 섹션을 undo/replace 할 때 PromptEvent 업데이트.
- **빌드 로그**: 레지스트리 생성, 스키마 검증 실패와 해당 스토리 경로.
- **대시보드**: 프롬프트 수락률(유지 vs undo), 프리셋별 배치 카운트, 매처 p50/p95 레이턴시.

## 11. 에러 처리 요약

| 영역 | 에러 | UX |
|---|---|---|
| 레지스트리 빌드 | 스토리의 프리셋 블록 invalid | CI 실패 + 스토리 경로 + Zod 에러 |
| 매처 | LLM 타임아웃/네트워크 | 인라인 토스트, 피커 폴백 |
| 매처 | 낮은 confidence | 자동 삽입 대신 선택 UI |
| 에디터 | 필드가 글자/줄수 한도 초과 | 라이브 카운터 빨강, 퍼블리시 차단 |
| 에디터 | 슬롯이 `min` 미달 | 인라인 경고, 퍼블리시 차단 |
| 퍼블리시 | Apps Script 쓰기 실패 | 1회 재시도 후 페이로드 복사 가능한 토스트 |

## 12. 오픈 기술 질문

- **Intent 보캐뷸러리 거버넌스.** 자동 태깅 + 수동 오버라이드가 디폴트 (§3.3). 코어 보캐뷸러리의 변경 주기/책임자는 미정.
- **프리셋 임베딩.** 매처가 intent 태그 외에 임베딩(스토리 타이틀 + 라벨 + uiSpec 텍스트)을 타이브레이커로 사용해야 하는가? M2 이후 결과 데이터가 쌓이면 결정.
- **프리셋 버저닝.** 디자이너가 프리셋의 `slots[].accepts` 를 편집하면 기존 doc 이 이제 invalid 한 컴포넌트를 참조할 수 있다. 마이그레이션 정책 필요(자동 코어스 vs 플래그).
- **오프라인 모드.** LLM 없이 조립이 동작해야 하는가 (피커 전용)? v1 답: 예. 매처는 향상이지 의존성이 아니다.

## 13. 참고

- 기존 데이터 모델: `src/schema/doc.ts`, `src/schema/section-presets.ts`, `src/schema/component-presets.ts`, `src/schema/ui-spec.ts`, `src/schema/ods-tokens.ts`.
- 빌더 셸: `src/components/builder/BuilderShell.tsx`.
- 퍼블리셔 타깃(현재): `apps-script/`.
- 본 문서의 PRD 카운터파트: [PRD.md](./PRD.md).
- 네이밍 규칙: [CONVENTIONS.md](./CONVENTIONS.md).
