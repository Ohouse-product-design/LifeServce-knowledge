/**
 * 시드 데이터 (v2 — Card 통합 후).
 *
 * 모든 카드형 콘텐츠는 단일 `card` 컴포넌트의 layout + cells 구조로 표현된다.
 * - USP        → Card { layout: grid    cols=4, usage=usp }
 * - Coverage   → Card { layout: grid    cols=2, usage=usp }
 * - Review     → Card { layout: carousel autoScroll=true, usage=review }
 * - Process    → Card { layout: grid    cols=4, usage=step }
 * - Cross-sell → Card { layout: row, usage=service } — 뷰포트별 1열 / 2×2 그리드
 */

import type {
  CardCell,
  CardLayoutSettings,
  CardProps,
  CardUsagePresetId,
} from "@/schema/card";
import type {
  ComponentInstance,
  LandingPageDoc,
  Section,
} from "@/schema/doc";

const now = "2026-05-14T00:00:00.000Z";
const uid = (prefix: string, n: number) => `${prefix}-${String(n).padStart(3, "0")}`;

// ---------------------------------------------------------------------------
// 헬퍼: Card ComponentInstance 만들기
// ---------------------------------------------------------------------------

function buildCard(args: {
  id: string;
  usage: CardUsagePresetId;
  layout: CardLayoutSettings;
  cells: CardCell[];
  cardType?: import("@/schema/card").ImgcardType;
}): ComponentInstance {
  const props: CardProps = {
    usage: args.usage,
    layout: args.layout,
    cells: args.cells,
    cardType: args.cardType,
  };
  return {
    id: args.id,
    preset: "card",
    // ComponentInstance.props 는 Record<string, unknown> — CardProps 의 필드들을 그대로 부어넣음
    props: props as unknown as Record<string, unknown>,
    assets: [],
  };
}

// ---------------------------------------------------------------------------
// USP — grid 4분할
// ---------------------------------------------------------------------------

const uspCells: CardCell[] = [
  {
    id: uid("usp-cell", 1),
    slots: {
      tag: { kind: "text", text: "FRAGILE" },
      title: { kind: "text", text: "파손 걱정" },
      body: { kind: "text", text: "비싼 가구가\n흠집 없이 도착할까?" },
      media: {
        kind: "asset",
        asset: { type: "image", alt: "파손된 가구", assetId: "AssetPackageSurpriseIconsStillImage" },
      },
    },
  },
  {
    id: uid("usp-cell", 2),
    slots: {
      tag: { kind: "text", text: "PRICE" },
      title: { kind: "text", text: "비교 견적" },
      body: { kind: "text", text: "어떤 업체가\n진짜 합리적일까?" },
      media: {
        kind: "asset",
        asset: { type: "image", alt: "견적서", assetId: "AssetPercentTicketLargeStillImage" },
      },
    },
  },
  {
    id: uid("usp-cell", 3),
    slots: {
      tag: { kind: "text", text: "TIME" },
      title: { kind: "text", text: "시간 부족" },
      body: { kind: "text", text: "이사 준비할\n시간이 부족하다" },
      media: {
        kind: "asset",
        asset: { type: "image", alt: "시계", assetId: "AssetClockLargeStillImage" },
      },
    },
  },
  {
    id: uid("usp-cell", 4),
    slots: {
      tag: { kind: "text", text: "TRUST" },
      title: { kind: "text", text: "업체 신뢰" },
      body: { kind: "text", text: "처음 보는 업체를\n믿을 수 있을까?" },
      media: {
        kind: "asset",
        asset: { type: "image", alt: "체크마크", assetId: "AssetLuckyCheckLargeStillImage" },
      },
    },
  },
];

const uspCard = buildCard({
  id: "card-usp",
  usage: "imgcard",
  layout: {
    type: "grid",
    settings: { columns: { mobile: 1, tablet: 2, desktop: 4 }, gap: 16 },
  },
  cells: uspCells,
});

// ---------------------------------------------------------------------------
// Coverage — grid 2분할
// ---------------------------------------------------------------------------

const coverageCells: CardCell[] = [
  {
    id: uid("cov-cell", 1),
    slots: {
      tag: { kind: "text", text: "INSURANCE" },
      title: { kind: "text", text: "파손 보장" },
      body: { kind: "text", text: "최대 1억원까지 보장" },
    },
  },
  {
    id: uid("cov-cell", 2),
    slots: {
      tag: { kind: "text", text: "SUPPORT" },
      title: { kind: "text", text: "24시간 상담" },
      body: { kind: "text", text: "이사 당일에도 즉시 대응" },
    },
  },
];

const coverageCard = buildCard({
  id: "card-coverage",
  usage: "imgcard",
  layout: {
    type: "grid",
    settings: { columns: { mobile: 1, tablet: 2, desktop: 2 }, gap: 16 },
  },
  cells: coverageCells,
});

// ---------------------------------------------------------------------------
// Review — carousel autoScroll on
// ---------------------------------------------------------------------------

const reviewCells: CardCell[] = [
  {
    id: uid("rev-cell", 1),
    slots: {
      rating: { kind: "rating", value: 5, max: 5 },
      title: { kind: "text", text: "10년 묵은 짐도\n깔끔하게 정리됐어요" },
      body: { kind: "text", text: "이사 전날까지도 짐 정리를 못해서 걱정했는데, 직원분들이 알아서 다 처리해 주셨어요. 추가 비용도 없었습니다." },
      meta: { kind: "meta", items: ["민지님", "30대 여성", "서울 강남"] },
    },
  },
  {
    id: uid("rev-cell", 2),
    slots: {
      rating: { kind: "rating", value: 5, max: 5 },
      title: { kind: "text", text: "비교 견적이\n진짜 편했어요" },
      body: { kind: "text", text: "여러 업체에 전화 돌리는 게 너무 귀찮았는데, 한 번에 비교가 되니까 진짜 편하더라고요." },
      meta: { kind: "meta", items: ["현우님", "40대 남성", "경기 성남"] },
    },
  },
  {
    id: uid("rev-cell", 3),
    slots: {
      rating: { kind: "rating", value: 5, max: 5 },
      title: { kind: "text", text: "책임보장이\n진심 안심이었어요" },
      body: { kind: "text", text: "혹시 모를 파손에도 보장이 된다고 하니까 마음 편하게 맡길 수 있었습니다." },
      meta: { kind: "meta", items: ["지영님", "30대 여성", "부산 해운대"] },
    },
  },
  {
    id: uid("rev-cell", 4),
    slots: {
      rating: { kind: "rating", value: 5, max: 5 },
      title: { kind: "text", text: "친절함이\n다른 업체와 달랐어요" },
      body: { kind: "text", text: "직원분들이 너무 친절하셔서 이사하는 내내 기분이 좋았습니다." },
      meta: { kind: "meta", items: ["성민님", "20대 남성", "서울 마포"] },
    },
  },
  {
    id: uid("rev-cell", 5),
    slots: {
      rating: { kind: "rating", value: 5, max: 5 },
      title: { kind: "text", text: "포장이사\n퀄리티 최고예요" },
      body: { kind: "text", text: "박스 하나하나 라벨링까지 해주셔서 정리할 때 너무 편했어요. 비용 대비 만족도 최고." },
      meta: { kind: "meta", items: ["수진님", "30대 여성", "인천 송도"] },
    },
  },
];

const reviewCard = buildCard({
  id: "card-review",
  usage: "reviewcard",
  layout: {
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
  },
  cells: reviewCells,
});

// ---------------------------------------------------------------------------
// Process — grid 4분할 (or row 변경 가능)
// ---------------------------------------------------------------------------

const stepCells: CardCell[] = [
  {
    id: uid("step-cell", 1),
    slots: {
      stepNumber: { kind: "text", text: "01" },
      title: { kind: "text", text: "견적 요청" },
      body: { kind: "text", text: "이사 정보 입력하고\n견적 받아보기" },
      media: { kind: "asset", asset: { type: "image", alt: "견적 요청", assetId: "AssetOpenGraphO2OMovingStillImage" } },
    },
  },
  {
    id: uid("step-cell", 2),
    slots: {
      stepNumber: { kind: "text", text: "02" },
      title: { kind: "text", text: "업체 매칭" },
      body: { kind: "text", text: "검증된 업체에서\n비교 견적 받기" },
      media: {
        kind: "asset",
        asset: { type: "lottie", alt: "진행 안내", assetId: "AssetMotionPlusCircleSweepLottie" },
      },
    },
  },
  {
    id: uid("step-cell", 3),
    slots: {
      stepNumber: { kind: "text", text: "03" },
      title: { kind: "text", text: "업체 선정" },
      body: { kind: "text", text: "원하는 조건에 맞는\n업체 직접 선택" },
      media: { kind: "asset", asset: { type: "image", alt: "업체 선정", assetId: "AssetOhouseHorizontalStillImage" } },
    },
  },
  {
    id: uid("step-cell", 4),
    slots: {
      stepNumber: { kind: "text", text: "04" },
      title: { kind: "text", text: "이사 진행" },
      body: { kind: "text", text: "당일 진행하고\n책임보장으로 안심" },
      media: { kind: "asset", asset: { type: "image", alt: "이사 진행", assetId: "AssetBoltTruckLargeView3StillImage" } },
    },
  },
];

const stepCard = buildCard({
  id: "card-process",
  usage: "imgcard",
  cardType: "leading-asset",
  layout: {
    type: "grid",
    settings: { columns: { mobile: 1, tablet: 2, desktop: 4 }, gap: 16 },
  },
  cells: stepCells,
});

// ---------------------------------------------------------------------------
// Cross-sell — row + wrap
// ---------------------------------------------------------------------------

const serviceCells: CardCell[] = [
  {
    id: uid("cs-cell", 1),
    slots: {
      icon: { kind: "asset", asset: { type: "image", alt: "인테리어", assetId: "AssetArtSettingDeliveryHorizontalStillImage" } },
      title: { kind: "text", text: "인테리어" },
      body: { kind: "text", text: "원스톱 시공" },
      cta: { kind: "cta", label: "보러가기", url: "/interior" },
    },
  },
  {
    id: uid("cs-cell", 2),
    slots: {
      icon: { kind: "asset", asset: { type: "image", alt: "청소", assetId: "AssetCameraLargeStillImage" } },
      title: { kind: "text", text: "청소" },
      body: { kind: "text", text: "입주청소 매칭" },
      cta: { kind: "cta", label: "보러가기", url: "/cleaning" },
    },
  },
  {
    id: uid("cs-cell", 3),
    slots: {
      icon: { kind: "asset", asset: { type: "image", alt: "렌탈", assetId: "AssetCartLargeStillImage" } },
      title: { kind: "text", text: "렌탈" },
      body: { kind: "text", text: "가전·생활 렌탈" },
      cta: { kind: "cta", label: "보러가기", url: "/rental/landing" },
    },
  },
];

const serviceCard = buildCard({
  id: "card-crosssell",
  usage: "listcard",
  layout: {
    type: "list",
    settings: { gap: 16, align: "start" },
  },
  cells: serviceCells,
});

// ---------------------------------------------------------------------------
// 섹션 조립
// ---------------------------------------------------------------------------

const allVisible = { mobile: true, tablet: true, desktop: true };

const sections: Section[] = [
  {
    id: "sec-hero",
    preset: "hero",
    name: "히어로",
    locked: true,
    props: {
      eyebrow: "오늘의집 이사",
      title: "집을 잘 아니까,\n이사도 오늘의집에서",
      subtitle: "",
      primaryCtaLabel: "무료 견적 신청하기",
      secondaryCtaLabel: "",
    },
    slots: {},
    assets: [
      {
        slotName: "background",
        asset: { type: "image", alt: "이사 트럭", assetId: "AssetBoltTruckLargeStillImage" },
      },
    ],
    tokens: [{ propPath: "title.color", tokenRef: "color.text.primary" }],
    visibility: allVisible,
  },
  {
    id: "sec-usp",
    preset: "usp",
    name: "USP — 이사 중 생기는 문제들",
    locked: false,
    props: { sectionSubtitle: "이사할 때 누구나 한 번쯤", sectionTitle: "고민하셨죠?" },
    slots: { content: [uspCard] },
    assets: [],
    visibility: allVisible,
  },
  {
    id: "sec-table",
    preset: "table",
    name: "비교 카드 — 타사 vs 오늘의집",
    locked: false,
    props: {
      sectionSubtitle: "꼼꼼히 비교해보세요",
      sectionTitle: "오늘의집 이사가\n다른 이유",
    },
    slots: {
      content: [
        buildCard({
          id: "card-table",
          usage: "tablecard",
          // 2row 변형: grey + blue 비교
          layout: { type: "grid", settings: { columns: { mobile: 1, tablet: 2, desktop: 2 }, gap: 2 } },
          cells: [
            {
              id: uid("tcrd", 1),
              theme: "grey",
              slots: {
                title: { kind: "text", text: "타사 서비스" },
                meta: {
                  kind: "meta",
                  items: [
                    "단순 업체 연결",
                    "업체마다 다른 견적",
                    "사고 발생 시\n직접 업체와 협의",
                    "현장 추가금\n발생 가능",
                    "업체별로\n다른 보상 범위",
                  ],
                },
              },
            },
            {
              id: uid("tcrd", 2),
              theme: "blue",
              slots: {
                title: { kind: "text", text: "오늘의집 이사" },
                meta: {
                  kind: "meta",
                  items: [
                    "파트너사 관리",
                    "평균 견적 정보 제공",
                    "오늘의집 중재",
                    "계약 외 청구 시\n최대 200% 보상",
                    "파손·분실 사고 시\n최대 200만원 보상",
                  ],
                },
              },
            },
          ],
        }),
      ],
    },
    assets: [],
    visibility: allVisible,
  },
  {
    id: "sec-coverage",
    preset: "usp",
    name: "책임보장 파트너",
    locked: false,
    props: {
      sectionSubtitle: "함께하는 파트너",
      sectionTitle: "신뢰할 수 있는 보장",
    },
    slots: { content: [coverageCard] },
    assets: [],
    visibility: allVisible,
  },
  {
    id: "sec-review",
    preset: "review",
    name: "고객 리뷰",
    locked: false,
    props: {
      sectionSubtitle: "고객님의 진짜 후기",
      sectionTitle: "이사하길 잘했어요",
    },
    slots: { content: [reviewCard], tabs: [] },
    assets: [],
    visibility: allVisible,
  },
  {
    id: "sec-process",
    preset: "process",
    name: "이용 프로세스",
    locked: false,
    props: {
      sectionSubtitle: "이사, 이렇게 진행됩니다",
      sectionTitle: "복잡할 것 없어요",
    },
    slots: { content: [stepCard] },
    assets: [],
    visibility: allVisible,
  },
  {
    id: "sec-crosssell",
    preset: "cross-sell",
    name: "크로스셀링 — 함께 보면 좋은 서비스",
    locked: false,
    props: {
      sectionSubtitle: "이사와 함께",
      sectionTitle: "이런 것도 준비하세요",
    },
    slots: { content: [serviceCard] },
    assets: [],
    visibility: allVisible,
  },
  {
    id: "sec-sticky-cta",
    preset: "sticky-cta",
    name: "하단 고정 CTA",
    locked: true,
    props: { label: "무료 견적 받기" },
    slots: {},
    assets: [],
    visibility: { mobile: true, tablet: true, desktop: false },
  },
  {
    id: "sec-footer",
    preset: "footer",
    name: "푸터",
    locked: true,
    props: { copyright: "© 2026 BUCKETPLACE Co., Ltd." },
    slots: {},
    assets: [],
    visibility: allVisible,
  },
];

export const seedDoc: LandingPageDoc = {
  id: "doc-moving-001",
  schemaVersion: "1.0.0",
  meta: {
    slug: "moving",
    title: "이사 — 오늘의집",
    description: "이사 비교 견적 · 책임보장 · 후기까지 한 번에",
    category: "moving",
    owners: {
      designer: { name: "Jisun Moon", email: "jisun.moon@bucketplace.net", slackId: "U0123" },
      developer: { name: "TBD", email: "tbd@bucketplace.net" },
      pm: { name: "TBD", email: "tbd@bucketplace.net" },
    },
  },
  sections,
  globalTokens: [
    { propPath: "page.background", tokenRef: "color.surface.gray" },
    { propPath: "page.fontFamily", tokenRef: "typography.body-md" },
  ],
  audit: {
    createdAt: now,
    updatedAt: now,
    createdBy: "jisun.moon@bucketplace.net",
    updatedBy: "jisun.moon@bucketplace.net",
  },
};
