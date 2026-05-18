import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { CardLayout, CardProps, CardUsagePresetId } from "@/schema/card";
import { defaultLayoutSettings } from "@/schema/card";
import type { Section as SectionData } from "@/schema/doc";
import type { SectionPresetId } from "@/schema/section-presets";
import Section from "./Section";
import { fixtureByPreset } from "./sections/__fixtures__/sectionFixtures";

/**
 * 통합 Section 스토리 — preset 을 토글하면 같은 컨테이너 안에서
 * Header / Hero / 카드 그리드 / Table / Review / Process / Cross-sell /
 * CTA-Form / Sticky-CTA / Footer 가 자유롭게 갈아끼워진다.
 *
 * 카드형 섹션(usp/review/process/cross-sell)은 추가로
 * cardLayout 과 cardUsage 컨트롤로 layout/cell 모양 스왑을 시연한다.
 */

type StoryArgs = {
  preset: SectionPresetId;
  viewport: "mobile" | "tablet" | "desktop";
  cardLayout: CardLayout;
  cardUsage: CardUsagePresetId;
};

const cardPresets: SectionPresetId[] = [
  "usp",
  "review",
  "process",
  "cross-sell",
];

function isCardPreset(preset: SectionPresetId) {
  return cardPresets.includes(preset);
}

function override(args: StoryArgs): SectionData {
  const base = fixtureByPreset[args.preset];
  if (!isCardPreset(args.preset)) return base;

  const card = base.slots["content"]?.[0];
  if (!card || card.preset !== "card") return base;

  const cardProps = card.props as unknown as CardProps;
  const newProps: CardProps = {
    ...cardProps,
    usage: args.cardUsage,
    layout:
      cardProps.layout.type === args.cardLayout
        ? cardProps.layout
        : defaultLayoutSettings(args.cardLayout),
  };
  return {
    ...base,
    slots: {
      ...base.slots,
      content: [{ ...card, props: newProps as unknown as Record<string, unknown> }],
    },
  };
}

const meta: Meta<StoryArgs> = {
  title: "Preview/Section",
  // 섹션은 페이지 폭 100% 단위 — preview centered 디폴트를 fullscreen 으로 override
  parameters: { layout: "fullscreen" },
  args: {
    preset: "usp",
    viewport: "desktop",
    cardLayout: "grid",
    cardUsage: "imgcard",
  },
  argTypes: {
    preset: {
      control: "select",
      options: [
        "header",
        "hero",
        "usp",
        "table",
        "review",
        "process",
        "cross-sell",
        "faq",
        "cta-form",
        "sticky-cta",
        "footer",
      ] as SectionPresetId[],
      description:
        "어떤 섹션 preset 을 렌더할지. 빌더 `SectionTree` 기본 추가 메뉴의 7 프리셋과 같은 id 집합(고정 header/hero/sticky/footer 는 메뉴에 없고 스토리에서만 선택 가능).",
    },
    viewport: {
      control: "inline-radio",
      options: ["mobile", "tablet", "desktop"],
    },
    cardLayout: {
      control: "inline-radio",
      options: ["grid", "carousel", "list"] as CardLayout[],
      description: "카드형 섹션에서만 적용 — grid/carousel/list 토글",
      if: { arg: "preset", neq: "header" },
    },
    cardUsage: {
      control: "select",
      options: [
        "imgcard",
        "reviewcard",
        "listcard",
        "tablecard",
        "faqcard",
      ] satisfies CardUsagePresetId[],
      description:
        "카드형 섹션의 카드 변형 — imgcard/reviewcard/listcard/tablecard. imgcard 내부 변형(bgfullimg/leading-asset)은 cardType prop 으로 별도 분기.",
      if: { arg: "preset", neq: "header" },
    },
  },
  render: (args: StoryArgs) => (
    <Section section={override(args)} viewport={args.viewport} />
  ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

// ───── 기본 — 빌더에서 처음 USP 섹션 추가했을 때 모습 ─────
export const Playground: Story = {};

// ───── preset 매트릭스 (한 화면에 한 섹션씩) ─────
export const Header: Story = { args: { preset: "header" } };
export const Hero: Story = { args: { preset: "hero" } };
export const Usp: Story = { args: { preset: "usp" } };
export const Table: Story = { args: { preset: "table" } };
export const Review: Story = {
  args: { preset: "review", cardLayout: "carousel", cardUsage: "reviewcard" },
};
export const Process: Story = {
  args: { preset: "process", cardLayout: "grid", cardUsage: "imgcard" },
};
export const CrossSell: Story = {
  args: { preset: "cross-sell", cardLayout: "list", cardUsage: "listcard" },
};
export const Faq: Story = {
  args: { preset: "faq", cardLayout: "list", cardUsage: "faqcard" },
};
export const CtaForm: Story = { args: { preset: "cta-form" } };
export const StickyCta: Story = { args: { preset: "sticky-cta" } };
export const Footer: Story = { args: { preset: "footer" } };

// ───── 레이아웃 스왑 시연 — 같은 카드 그리드가 grid/carousel/list 로 ─────
export const CardGridAsGrid: Story = {
  name: "카드 그리드 · Layout: Grid",
  args: { preset: "usp", cardLayout: "grid" },
};
export const CardGridAsCarousel: Story = {
  name: "카드 그리드 · Layout: Carousel",
  args: { preset: "usp", cardLayout: "carousel" },
};
export const CardGridAsList: Story = {
  name: "카드 그리드 · Layout: List",
  args: { preset: "usp", cardLayout: "list" },
};

// ───── usage 스왑 시연 — 같은 process 섹션이 imgcard(leading-asset) / listcard 로 ─────
export const ProcessAsListcard: Story = {
  name: "Process · Cell Usage: listcard",
  args: { preset: "process", cardLayout: "list", cardUsage: "listcard" },
};
