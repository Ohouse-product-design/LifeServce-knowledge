import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import Card from "./Card";
import {
  carouselLayout,
  fixtureByPreset,
  gridLayout,
  rowLayout as listLayout,
} from "./sections/__fixtures__/sectionFixtures";
import {
  CARD_USAGE_PRESETS,
  type CardCell,
  type CardLayout,
  type CardLayoutSettings,
  type CardProps,
  type CardUsagePresetId,
  type ImgcardType,
  defaultLayoutSettings,
} from "@/schema/card";
import type { Section } from "@/schema/doc";
import type { Viewport } from "@/schema/doc";

/**
 * Card 스토리.
 *
 * 어드민(Inspector → 콘텐츠 슬롯) 의 [Cell Usage → Layout → Cells] 흐름과
 * 동일한 구조로 노출한다.
 *
 *  · usage    : imgcard | reviewcard | listcard | tablecard
 *  · cardType : (imgcard 전용) bgfullimg | leading-asset
 *  · layout   : 각 usage 의 `allowedLayouts` 안에서 선택 (grid | carousel | list)
 */

function cardPropsFromSection(section: Section): CardProps | null {
  const inst = section.slots.content?.[0];
  if (!inst || inst.preset !== "card") return null;
  return inst.props as unknown as CardProps;
}

/**
 * tablecard 데모 데이터 (Figma 2:166).
 *
 *   2row 변형 = 2 cells (grey + blue) 나란히 비교
 *   1row 변형 = 1 cell (green) 단독 강조
 *
 * 색상 테마는 cell.theme 으로 설정. 그 외 구조는 동일 (title + meta items as rows).
 */
const tablecardCellsGrey: CardCell = {
  id: "tc-grey",
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
};

const tablecardCellsBlue: CardCell = {
  id: "tc-blue",
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
};

const tablecardCellsGreen: CardCell = {
  id: "tc-green",
  theme: "green",
  slots: {
    title: { kind: "text", text: "오늘의집 이사 + 책임보장" },
    meta: {
      kind: "meta",
      items: [
        "10% 파트너사만 자격 부여",
        "투명한 가격 정찰제",
        "사고 발생 시 오늘의집 전담팀이 해결",
        "파손 분실 시 최대 1천만 원 보상",
      ],
    },
  },
};

// 디폴트 Playground 는 2row (grey + blue)
const tablecardCells: CardCell[] = [tablecardCellsGrey, tablecardCellsBlue];

/**
 * imgcard / listcard 스토리에서 미디어 슬롯의 assetId 를 비우는 헬퍼.
 * OdsAssetRenderer 가 assetId 가 없으면 AssetGiftLargeStillImage(범용 placeholder)를
 * 렌더한다 — 즉 디자인 시안의 "이미지 슬롯이 비어 있을 때" UI 와 동일.
 */
function stripAssetIds(cells: CardCell[], slotName: "media" | "icon"): CardCell[] {
  return cells.map((cell) => {
    const slot = cell.slots[slotName];
    if (!slot || slot.kind !== "asset") return cell;
    return {
      ...cell,
      slots: {
        ...cell.slots,
        [slotName]: {
          ...slot,
          asset: { ...slot.asset, assetId: undefined, url: undefined },
        },
      },
    };
  });
}

// imgcard 의 두 가지 데이터: bgfullimg (uspFixture 의 카드), leading-asset (processFixture 의 step 데이터)
const usageFixture: Record<CardUsagePresetId, Section> = {
  imgcard: fixtureByPreset.usp, // bgfullimg 디폴트
  reviewcard: fixtureByPreset.review,
  listcard: fixtureByPreset["cross-sell"],
  // tablecard: 동일 base 를 쓰되 cells 만 tablecardCells 로 교체
  tablecard: fixtureByPreset.usp,
  faqcard: fixtureByPreset.faq,
};
// imgcard cardType="leading-asset" 일 때 사용할 step 형식 데이터
const imgcardLeadingAssetFixture = fixtureByPreset.process;

type CardStoryArgs = {
  usage: CardUsagePresetId;
  layoutType: CardLayout;
  viewport: Viewport;
  /** usage === "imgcard" 일 때만 적용 */
  cardType?: ImgcardType;
};

function toCardProps(args: CardStoryArgs): ComponentProps<typeof Card> {
  // imgcard + leading-asset 면 step 형식 데이터로 스왑
  const sourceSection =
    args.usage === "imgcard" && args.cardType === "leading-asset"
      ? imgcardLeadingAssetFixture
      : usageFixture[args.usage];
  const base = cardPropsFromSection(sourceSection);
  if (!base) {
    throw new Error("Card fixture missing for usage");
  }
  const usagePreset = CARD_USAGE_PRESETS[args.usage];
  // 선택한 layoutType 이 이 usage 에서 허용되지 않으면 defaultLayout 으로 강등
  const safeLayoutType = usagePreset.allowedLayouts.includes(args.layoutType)
    ? args.layoutType
    : usagePreset.defaultLayout;
  const layout: CardLayoutSettings =
    safeLayoutType === "grid"
      ? gridLayout
      : safeLayoutType === "carousel"
        ? carouselLayout
        : safeLayoutType === "list"
          ? listLayout
          : defaultLayoutSettings(safeLayoutType);
  // 변형별 cells 선택 + placeholder 처리
  let cells = base.cells;
  if (args.usage === "tablecard") {
    cells = tablecardCells;
  } else if (args.usage === "imgcard") {
    // 디자인 시안 검증 목적상 실제 에셋 대신 범용 placeholder 사용
    // bgfullimg 은 media 슬롯 placeholder, leading-asset 은 media 슬롯이 자체 default 에셋
    if (args.cardType !== "leading-asset") {
      cells = stripAssetIds(base.cells, "media");
    }
  } else if (args.usage === "listcard") {
    cells = stripAssetIds(base.cells, "icon");
  }
  return {
    ...base,
    usage: args.usage,
    layout,
    cells,
    viewport: args.viewport,
    cardType: args.cardType,
  };
}

const meta = {
  title: "Preview/Card",
  tags: ["autodocs"],
  args: {
    usage: "imgcard",
    layoutType: "grid",
    viewport: "desktop",
  } satisfies CardStoryArgs,
  argTypes: {
    usage: {
      control: "select",
      options: [
        "imgcard",
        "reviewcard",
        "listcard",
        "tablecard",
        "faqcard",
      ] satisfies CardUsagePresetId[],
      description: "CARD_USAGE_PRESETS 기준 카드 변형 (cell usage)",
    },
    layoutType: {
      control: "inline-radio",
      options: ["grid", "carousel", "list"] satisfies CardLayout[],
      description:
        "레이아웃 — 각 usage 의 allowedLayouts 안에서만 적용되며, 허용 외 값은 defaultLayout 으로 강등",
    },
    cardType: {
      control: "inline-radio",
      options: ["bgfullimg", "leading-asset"] satisfies ImgcardType[],
      description: "imgcard 서브 변형 (다른 usage 에서는 무시)",
      if: { arg: "usage", eq: "imgcard" },
    },
    viewport: {
      control: "inline-radio",
      options: ["mobile", "tablet", "desktop"] satisfies Viewport[],
    },
  },
  render: (args: CardStoryArgs) => {
    const props = toCardProps(args);
    return <Card {...props} />;
  },
} satisfies Meta<CardStoryArgs>;

export default meta;

type Story = StoryObj<CardStoryArgs>;

/** Controls 로 usage / layout / viewport 를 바꿔가며 확인 */
export const Playground: Story = {};

// ───── usage 별 대표 ─────

/**
 * 디자인 시안 링크.
 * `@storybook/addon-designs` 를 설치하면 Storybook 패널에 Figma 가 임베드된다.
 * 미설치 상태에서도 `parameters.design` 은 그대로 메타데이터로 보존된다.
 */
const FIGMA_BASE = "https://www.figma.com/design/kffOnFVN7j3nAdHugX9rHa/Components";
const FIGMA_NODES = {
  imgcardBgFull: `${FIGMA_BASE}?node-id=1-132`,        // imgcard bgfullimg (dim overlay 단독)
  imgcardLeadingAsset: `${FIGMA_BASE}?node-id=1-49`,   // imgcard leading-asset (구 stepcard)
  reviewcard: `${FIGMA_BASE}?node-id=1-82`,            // reviewcard
  tablecard: `${FIGMA_BASE}?node-id=1-1694`,           // tablecard
  listcard: null,                                       // 디자인 시안 미제공
} as const;

/**
 * imgcard · bgfullimg — 풀-블리드 배경 이미지 + dim 오버레이.
 */
export const ImgcardBgFullImg: Story = {
  name: "imgcard · bgfullimg",
  args: { usage: "imgcard", layoutType: "grid", viewport: "desktop", cardType: "bgfullimg" },
  parameters: {
    design: { type: "figma", url: FIGMA_NODES.imgcardBgFull },
  },
};

/**
 * imgcard · leading-asset — 상단 아이콘/일러스트 + 좌측 정렬 텍스트 (구 stepcard).
 */
export const ImgcardLeadingAsset: Story = {
  name: "imgcard · leading-asset",
  args: { usage: "imgcard", layoutType: "grid", viewport: "desktop", cardType: "leading-asset" },
  parameters: {
    design: { type: "figma", url: FIGMA_NODES.imgcardLeadingAsset },
  },
};

export const ReviewcardCarousel: Story = {
  name: "reviewcard · carousel",
  args: { usage: "reviewcard", layoutType: "carousel", viewport: "desktop" },
  parameters: {
    design: { type: "figma", url: FIGMA_NODES.reviewcard },
  },
};

export const ListcardList: Story = {
  name: "listcard · list",
  args: { usage: "listcard", layoutType: "list", viewport: "desktop" },
  // 디자인 시안 미제공 — 디자인 PR 완료 시 design.url 추가
};

/**
 * faqcard · list — accordion Q&A. ODS 토큰 기반.
 */
export const FaqcardList: Story = {
  name: "faqcard · list",
  args: { usage: "faqcard", layoutType: "list", viewport: "desktop" },
};

/**
 * tablecard · 2row — grey vs blue 비교 (Figma 2:166 Property 1=2row)
 */
export const TablecardTwoRow: Story = {
  name: "tablecard · 2row (grey + blue)",
  args: { usage: "tablecard", layoutType: "grid", viewport: "desktop" },
  parameters: {
    design: { type: "figma", url: `${FIGMA_BASE}?node-id=2-164` },
  },
};

/**
 * tablecard · 1row — green 단독 강조 (Figma 2:166 Property 1=1row)
 */
export const TablecardOneRow: Story = {
  name: "tablecard · 1row (green)",
  args: { usage: "tablecard", layoutType: "list", viewport: "desktop" },
  parameters: {
    design: { type: "figma", url: `${FIGMA_BASE}?node-id=2-165` },
  },
  render: (args) => {
    const props = toCardProps(args);
    // 1row 변형: green 한 장만
    return <Card {...props} cells={[tablecardCellsGreen]} />;
  },
};

