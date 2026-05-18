/**
 * Card — 단일 상위 컴포넌트.
 *
 * 기존의 UspCard / ReviewCard / StepCard / ServiceCard 를 통합한 단일 컴포넌트.
 * Card 는 "레이아웃 컨테이너 + N개의 cell" 구조로 표현되며,
 * 각 cell 은 slot 시스템(media/tag/title/body/meta/rating/cta/icon/stepNumber)
 * 으로 콘텐츠를 갖는다.
 *
 *   Section
 *    └─ Card  (preset="card")
 *        ├─ layout      : "grid" | "carousel" | "list"
 *        ├─ layoutSettings  (레이아웃별 세부 옵션)
 *        └─ cells[]     : CardCell[]
 *             └─ slots  : { media?, tag?, title?, body?, meta?, rating?, ... }
 *
 * 어드민에서 Card 를 선택하면 Inspector 우측에서 layout 토글 + cells 트리를 편집한다.
 */

import type { AssetRef } from "./doc";

// ---------------------------------------------------------------------------
// Layout 타입
// ---------------------------------------------------------------------------

export type CardLayout = "grid" | "carousel" | "list";

/** grid — 화면을 n:n 분할 */
export interface GridLayoutSettings {
  /** 디바이스별 컬럼 수. mobile/tablet/desktop */
  columns: { mobile: number; tablet: number; desktop: number };
  /** 셀 간 간격 (ods spacing 토큰 단위로 매핑되는 px) */
  gap: number;
  /** 카드 자체의 최소 높이 (px). 비어두면 콘텐츠에 맞춤 */
  minCellHeight?: number;
}

/** carousel — 고정 너비 카드 + 좌우 스크롤 (fixed-width) */
export interface CarouselLayoutSettings {
  /** 카드 한 장의 너비 (디바이스별, 고정값) */
  cardWidth: { mobile: number; tablet: number; desktop: number };
  /** 카드 간 간격 (px) */
  gap: number;
  /**
   * x scroll 애니메이션 on/off 토글.
   * - true  : 자동으로 좌→우 흐르는 marquee (무한 루프)
   * - false : 사용자 드래그/스크롤 only
   */
  autoScroll: boolean;
  /** 자동 스크롤 한 사이클 시간 (ms). autoScroll=true 일 때만 사용 */
  autoScrollDurationMs?: number;
  /** loop 여부 (autoScroll=false 일 때 도달 후 처음으로 점프) */
  loop?: boolean;
  /** 좌우 화살표 노출 */
  showArrows?: boolean;
  /** 페이지 인디케이터(dots) 노출 */
  showDots?: boolean;
}

/** list — 수직 스택 (한 줄에 카드 1개, 위→아래 읽기 순) */
export interface ListLayoutSettings {
  /** 셀 간 수직 간격 (px) */
  gap: number;
  /** 행 정렬 (좌/중앙/우) */
  align: "start" | "center" | "end";
  /** 카드 좌우 패딩 (px) */
  inset?: number;
}

export type CardLayoutSettings =
  | { type: "grid"; settings: GridLayoutSettings }
  | { type: "carousel"; settings: CarouselLayoutSettings }
  | { type: "list"; settings: ListLayoutSettings };

// ---------------------------------------------------------------------------
// Cell / Slot
// ---------------------------------------------------------------------------

/**
 * Card 의 한 셀이 가질 수 있는 슬롯 이름.
 * - 슬롯은 모두 optional. 채운 슬롯만 렌더된다.
 * - 슬롯 이름은 ODS 디자인 토큰 / 스타일 규칙의 anchor 가 된다.
 */
export type CardSlotName =
  | "media"      // 카드의 메인 이미지/일러스트
  | "icon"       // 작은 아이콘 (서비스/배지 등)
  | "tag"        // 상단 작은 라벨
  | "stepNumber" // 프로세스 스텝 번호
  | "title"      // 카드 제목
  | "body"       // 카드 본문/설명
  | "meta"       // 부가 정보 (작성자/날짜/위치 등)
  | "rating"     // 별점
  | "cta";       // 카드 클릭 시 이동 액션

/** 슬롯의 콘텐츠. union 으로 슬롯별 데이터 형태가 결정됨. */
export type CardSlotContent =
  | { kind: "asset"; asset: AssetRef }
  | { kind: "text"; text: string; maxLines?: number }
  | { kind: "rating"; value: number; max?: number }
  | { kind: "meta"; items: string[] }
  | { kind: "cta"; label: string; url: string };

export type CardCellTheme = "grey" | "blue" | "green";

export interface CardCell {
  id: string;
  /** 슬롯별 콘텐츠. 키는 CardSlotName. 비어있는 슬롯은 키 자체가 없거나 undefined. */
  slots: Partial<Record<CardSlotName, CardSlotContent>>;
  /** 셀 단의 토큰 바인딩 (배경/보더 등) */
  tokens?: { propPath: string; tokenRef: string }[];
  /**
   * 변형별 추가 속성 — 현재는 tablecard 의 color theme 만 사용.
   *   grey  : 비교 대상 (default 평범한 회색 카드)
   *   blue  : 강조 카드 (1px 블루 보더, 흰 타이틀)
   *   green : 최강조 카드 (2px 그린 보더 + 그린 글로우 섀도우)
   */
  theme?: CardCellTheme;
}

// ---------------------------------------------------------------------------
// Card UI Spec (per-slot 글자수/줄수 제약)
// ---------------------------------------------------------------------------

/**
 * 슬롯별 UI Spec.
 * - 어드민 입력 단계에서 실시간 글자수 카운터 + 줄수 제약을 적용한다.
 * - 텍스트 슬롯에만 maxChar/maxLine 이 의미가 있다.
 */
export interface CardSlotSpec {
  /** 텍스트 슬롯 — 최대 글자수 */
  maxChar?: number;
  /** 텍스트 슬롯 — 최대 줄수 */
  maxLine?: number;
  /** 필수 슬롯 여부 */
  required?: boolean;
  /** 슬롯에 허용되는 콘텐츠 kind */
  allowedKinds: CardSlotContent["kind"][];
  /** 어드민 UI 라벨 */
  label: string;
  /** 도움말 */
  help?: string;
}

/** 어떤 슬롯들이 활성화될지 + 각 슬롯의 스펙 — Card 자체는 변형이 없고, "사용 패턴" 만 다름 */
export type CardSlotSpecMap = Partial<Record<CardSlotName, CardSlotSpec>>;

// ---------------------------------------------------------------------------
// 사용 패턴 (USP/Review/Step/Service 등) — 슬롯 활성화 프리셋
// ---------------------------------------------------------------------------

/**
 * 어드민/Storybook 의 카드 변형 (cell usage).
 * CONVENTIONS §7 의 slot-item.* 와 1:1 매핑:
 *   imgcard   → slot-item.card           (이미지+텍스트 기본)
 *   reviewcard→ slot-item.review-card    (인용·후기)
 *   listcard  → slot-item.list-card      (아이콘·텍스트·링크 리스트)
 *   stepcard  → slot-item.progress-card  (번호·타이틀·설명)
 *   tablecard → slot-item.table-card     (테이블·요약·CTA)
 *
 * 각 변형은 자신이 허용하는 layout 과 default layout 을 선언한다 (§7 + §8).
 */
export type CardUsagePresetId =
  | "imgcard"
  | "reviewcard"
  | "listcard"
  | "tablecard"
  | "faqcard";

/**
 * imgcard 의 서브 변형. usage === "imgcard" 일 때만 의미 있음.
 *   bgfullimg     : 풀-블리드 배경 이미지 + dim + 오버레이 텍스트 (구 imgcard)
 *   leading-asset : 상단 아이콘/일러스트 + 좌측 정렬 텍스트 (구 stepcard)
 */
export type ImgcardType = "bgfullimg" | "leading-asset";

export interface CardUsagePreset {
  id: CardUsagePresetId;
  label: string;
  description: string;
  /** 활성화될 슬롯 + 슬롯별 제약 */
  slotSpec: CardSlotSpecMap;
  /** 셀을 새로 만들 때 사용할 기본 콘텐츠 (placeholder) */
  defaultCell: () => Partial<Record<CardSlotName, CardSlotContent>>;
  /** 이 변형이 허용하는 layout 들 (인스펙터 토글에 노출되는 항목) */
  allowedLayouts: CardLayout[];
  /** 새로 추가될 때의 default layout */
  defaultLayout: CardLayout;
  /**
   * 카드가 시각적으로 깨지지 않는 최소 너비 (px).
   * CONVENTIONS §11: 슬롯 컨테이너의 per-card 폭이 이 값 미만이 되면
   * grid → carousel → list 순으로 자동 폴백.
   */
  minWidth: number;
}

export const CARD_USAGE_PRESETS: Record<CardUsagePresetId, CardUsagePreset> = {
  imgcard: {
    id: "imgcard",
    label: "Image Card",
    description: "이미지 + 텍스트 카드. cardType=bgfullimg(풀 배경) / leading-asset(상단 에셋) 토글로 두 레이아웃 지원",
    slotSpec: {
      tag: { maxChar: 12, maxLine: 1, allowedKinds: ["text"], label: "태그" },
      stepNumber: { maxChar: 4, maxLine: 1, allowedKinds: ["text"], label: "스텝 번호 (leading-asset 전용)" },
      title: { maxChar: 20, maxLine: 2, required: true, allowedKinds: ["text"], label: "헤드라인" },
      body: { maxChar: 40, maxLine: 2, allowedKinds: ["text"], label: "설명" },
      media: { allowedKinds: ["asset"], label: "이미지" },
    },
    defaultCell: () => ({
      tag: { kind: "text", text: "" },
      title: { kind: "text", text: "" },
      body: { kind: "text", text: "" },
    }),
    allowedLayouts: ["grid", "carousel", "list"],
    defaultLayout: "grid",
    minWidth: 240,
  },

  reviewcard: {
    id: "reviewcard",
    label: "Review Card",
    description: "별점·헤드라인·메타·본문으로 구성된 후기 카드 (후기 리스트 섹션 / seed.ts sec-review 캐노니컬)",
    slotSpec: {
      rating: { required: true, allowedKinds: ["rating"], label: "별점 (0–5)" },
      title: { maxChar: 40, maxLine: 2, required: true, allowedKinds: ["text"], label: "헤드라인 (\\n 으로 줄바꿈)" },
      meta: { required: true, allowedKinds: ["meta"], label: "메타 + 작성자 (마지막 항목 = 작성자, '|' 로 구분)" },
      body: { maxChar: 180, maxLine: 3, required: true, allowedKinds: ["text"], label: "본문 (3줄 ellipsis)" },
    },
    // 후기 리스트 섹션 디폴트 셀: rate / title / userid / meta1 / meta2 / reviewtext
    defaultCell: () => ({
      rating: { kind: "rating", value: 5, max: 5 },
      title: { kind: "text", text: "후기 헤드라인" },
      // meta.items = [userid, meta1, meta2]
      meta: { kind: "meta", items: ["작성자", "메타1", "메타2"] },
      body: { kind: "text", text: "후기 본문 내용을 입력하세요." },
    }),
    allowedLayouts: ["grid", "list", "carousel"],
    defaultLayout: "grid",
    minWidth: 254,
  },

  listcard: {
    id: "listcard",
    label: "List Card",
    description: "아이콘·타이틀·설명·링크로 구성된 리스트형 카드 (slot-item.list-card)",
    slotSpec: {
      icon: { required: true, allowedKinds: ["asset"], label: "아이콘" },
      title: { maxChar: 20, maxLine: 1, required: true, allowedKinds: ["text"], label: "타이틀" },
      body: { maxChar: 40, maxLine: 2, allowedKinds: ["text"], label: "설명" },
      cta: { allowedKinds: ["cta"], label: "링크" },
    },
    defaultCell: () => ({
      title: { kind: "text", text: "" },
      body: { kind: "text", text: "" },
    }),
    allowedLayouts: ["list", "grid"],
    defaultLayout: "list",
    minWidth: 320,
  },

  tablecard: {
    id: "tablecard",
    label: "Table Card",
    description: "rowtitle + N개의 row (4~6) 로 구성된 비교/요약 테이블 카드 (Figma 2:166)",
    slotSpec: {
      title: { maxChar: 24, maxLine: 1, required: true, allowedKinds: ["text"], label: "Row Title" },
      meta: { required: true, allowedKinds: ["meta"], label: "Rows (한 행 = meta items 한 개)" },
    },
    // 디폴트: rowtitle + 4개 row (min)
    defaultCell: () => ({
      title: { kind: "text", text: "카드 제목" },
      meta: { kind: "meta", items: ["Row 1", "Row 2", "Row 3", "Row 4"] },
    }),
    allowedLayouts: ["grid", "list"],
    defaultLayout: "grid",
    minWidth: 199,
  },

  faqcard: {
    id: "faqcard",
    label: "FAQ Card",
    description: "질문(title) + 답변(body)의 accordion 카드 (slot-item.faq-card)",
    slotSpec: {
      title: { maxChar: 80, maxLine: 2, required: true, allowedKinds: ["text"], label: "질문" },
      body: { maxChar: 400, maxLine: 10, required: true, allowedKinds: ["text"], label: "답변" },
    },
    defaultCell: () => ({
      title: { kind: "text", text: "자주 묻는 질문" },
      body: { kind: "text", text: "답변을 입력하세요. 여러 줄도 가능합니다." },
    }),
    allowedLayouts: ["list"],
    defaultLayout: "list",
    minWidth: 320,
  },
};

/** tablecard 의 row 개수 제한 (CellSlotEditor 에서 강제) */
export const TABLECARD_ROW_LIMITS = { min: 4, max: 6 } as const;

/** faqcard 의 cell 개수 제한 (Cells 리스트 add/remove 버튼에서 강제) */
export const FAQCARD_CELL_LIMITS = { min: 4, max: 10 } as const;

/**
 * 섹션 prest 가 처음 추가될 때 카드 슬롯에 자동 주입할 콘텐츠.
 * `addSection` 이 빈 슬롯 대신 의미 있는 자리표시자 카드를 생성하도록 한다.
 *
 *   { usage, cardType?, cells } — cells 는 buildDefaultCells 로 생성된 placeholder
 */
export type SectionAutoContent = {
  usage: CardUsagePresetId;
  cardType?: ImgcardType;
  /** 디폴트 cell 개수 */
  cellCount: number;
  /** 첫 cell 들에 들어갈 placeholder 콘텐츠 — 미지정 시 defaultCell 만 반복 */
  seedCells?: Array<Partial<Record<CardSlotName, CardSlotContent>>>;
};

export const SECTION_AUTO_CONTENT: Record<string, SectionAutoContent> = {
  usp: { usage: "imgcard", cardType: "bgfullimg", cellCount: 4 },
  review: { usage: "reviewcard", cellCount: 4 },
  process: { usage: "imgcard", cardType: "leading-asset", cellCount: 4 },
  "cross-sell": { usage: "listcard", cellCount: 3 },
  table: { usage: "tablecard", cellCount: 2 },
  faq: {
    usage: "faqcard",
    cellCount: 4,
    seedCells: [
      {
        title: { kind: "text", text: "이사 견적은 어떻게 받나요?" },
        body: { kind: "text", text: "이사 일정과 물량을 입력하시면 검증된 업체의 견적을 한 번에 비교해서 받아보실 수 있어요. 카카오톡 또는 전화로 추가 상담도 가능합니다." },
      },
      {
        title: { kind: "text", text: "파손 보상 범위는 어떻게 되나요?" },
        body: { kind: "text", text: "오늘의집 책임보장 적용 시 파손·분실에 대해 최대 1천만원까지 보상해 드립니다." },
      },
      {
        title: { kind: "text", text: "예약 후 일정 변경이 가능한가요?" },
        body: { kind: "text", text: "이사 예정일 3일 전까지는 무료로 일정 변경이 가능합니다. 그 이후에는 업체 정책에 따라 변경 가능 여부가 달라집니다." },
      },
      {
        title: { kind: "text", text: "추가 비용이 발생할 수 있나요?" },
        body: { kind: "text", text: "현장에서 예상치 못한 추가 작업(엘리베이터 미사용, 가구 분해/조립 등)이 필요한 경우 별도 비용이 발생할 수 있어요. 견적 단계에서 미리 확인하세요." },
      },
    ],
  },
};

/**
 * 섹션 추가 시 카드 슬롯의 cells 를 생성. SectionAutoContent.seedCells 가 있으면 그것을, 없으면 defaultCell() 을 반복.
 */
export function buildAutoCellsForSection(
  presetId: string,
  cardComponentId: string
): { usage: CardUsagePresetId; cardType?: ImgcardType; cells: CardCell[] } | null {
  const auto = SECTION_AUTO_CONTENT[presetId];
  if (!auto) return null;
  const preset = CARD_USAGE_PRESETS[auto.usage];
  const cells: CardCell[] = Array.from({ length: auto.cellCount }).map((_, i) => ({
    id: `${cardComponentId}-cell-${i}`,
    slots: auto.seedCells?.[i] ?? preset.defaultCell(),
  }));
  return { usage: auto.usage, cardType: auto.cardType, cells };
}

// ---------------------------------------------------------------------------
// Card 인스턴스 형태 (ComponentInstance.props 의 shape)
// ---------------------------------------------------------------------------

/**
 * Card 컴포넌트는 ComponentInstance.preset === "card" 일 때
 * ComponentInstance.props 가 아래 형태를 갖는다 (CardProps 로 캐스팅).
 */
export interface CardProps {
  /** 어떤 사용 패턴인지 (imgcard/reviewcard/listcard/tablecard) */
  usage: CardUsagePresetId;
  /** 레이아웃 */
  layout: CardLayoutSettings;
  /** 셀 목록 */
  cells: CardCell[];
  /**
   * imgcard 의 서브 변형 (bgfullimg | leading-asset). 다른 usage 에서는 무시됨.
   * 디폴트는 "bgfullimg".
   */
  cardType?: ImgcardType;
}

// ---------------------------------------------------------------------------
// 기본값 헬퍼
// ---------------------------------------------------------------------------

export function defaultLayoutSettings(layout: CardLayout): CardLayoutSettings {
  switch (layout) {
    case "grid":
      return {
        type: "grid",
        settings: {
          columns: { mobile: 1, tablet: 2, desktop: 4 },
          gap: 16,
        },
      };
    case "carousel":
      return {
        type: "carousel",
        settings: {
          cardWidth: { mobile: 280, tablet: 320, desktop: 360 },
          gap: 16,
          autoScroll: true,
          autoScrollDurationMs: 30000,
          loop: true,
          showArrows: false,
          showDots: false,
        },
      };
    case "list":
      return {
        type: "list",
        settings: { gap: 16, align: "start" },
      };
  }
}
