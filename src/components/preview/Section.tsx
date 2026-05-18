"use client";

/**
 * 통합 Section 컴포넌트.
 *
 * preset 별로 분리된 Template 들을 단일 진입점으로 dispatch.
 * - 빌더의 PreviewRenderer 가 섹션마다 이걸 호출
 * - Storybook 의 Section.stories 가 preset prop 으로 모든 변형을 한 자리에서 컨트롤
 *
 *   <Section section={section} viewport={viewport} onRequestAssetSlot={...} />
 *
 * variant: "marketing" / "marketing-form" / "marketing-contact" (구버전 lead* 는 아래에서 정규화)
 * 마케팅 풀페이지 UI(`app/lead` 계열 컴포넌트)로 렌더링.
 */

import type { AssetSlotModalOpenContext } from "@/schema/asset-modal-context";
import type { Section as SectionData, Viewport } from "@/schema/doc";
import type { SectionPresetId } from "@/schema/section-presets";
import CardSectionTemplate from "./sections/CardSectionTemplate";
import CtaFormTemplate from "./sections/CtaFormTemplate";
import FooterTemplate from "./sections/FooterTemplate";
import HeaderTemplate from "./sections/HeaderTemplate";
import HeroTemplate from "./sections/HeroTemplate";
import StickyCtaTemplate from "./sections/StickyCtaTemplate";
import {
  LeadContactVariant,
  LeadFormVariant,
  LeadHeroVariant,
  LeadProcessVariant,
  LeadReviewVariant,
  LeadStickyCtaVariant,
  LeadUSPVariant,
} from "./sections/lead/LeadVariants";

interface Props {
  section: SectionData;
  viewport: Viewport;
  /** 빌더 프리뷰: 에셋 영역 클릭 시 `openAssetModal` 과 동일 컨텍스트로 호출 */
  onRequestAssetSlot?: (ctx: AssetSlotModalOpenContext) => void;
}

function normalizeMarketingVariant(raw: string | undefined): string | undefined {
  if (raw === "lead") return "marketing";
  if (raw === "lead-form") return "marketing-form";
  if (raw === "lead-contact") return "marketing-contact";
  return raw;
}

export default function Section({ section, viewport, onRequestAssetSlot }: Props) {
  const variant = normalizeMarketingVariant(
    (section.props as { variant?: string } | undefined)?.variant
  );

  if (variant === "marketing") {
    const leadByPreset: Partial<Record<SectionPresetId, () => JSX.Element>> = {
      hero: () => <LeadHeroVariant />,
      usp: () => <LeadUSPVariant />,
      process: () => <LeadProcessVariant />,
      review: () => <LeadReviewVariant />,
      "sticky-cta": () => <LeadStickyCtaVariant />,
    };
    const render = leadByPreset[section.preset];
    if (render) return render();
  }

  if (section.preset === "cta-form") {
    if (variant === "marketing-form") return <LeadFormVariant />;
    if (variant === "marketing-contact") return <LeadContactVariant />;
  }

  const renderers: Record<SectionPresetId, () => JSX.Element> = {
    header: () => <HeaderTemplate section={section} />,
    hero: () => (
      <HeroTemplate
        section={section}
        viewport={viewport}
        onRequestAssetSlot={onRequestAssetSlot}
      />
    ),
    usp: () => (
      <CardSectionTemplate
        section={section}
        viewport={viewport}
        bg="white"
        onRequestAssetSlot={onRequestAssetSlot}
      />
    ),
    table: () => (
      <CardSectionTemplate
        section={section}
        viewport={viewport}
        bg="white"
        onRequestAssetSlot={onRequestAssetSlot}
      />
    ),
    review: () => (
      <CardSectionTemplate
        section={section}
        viewport={viewport}
        bg="gray"
        onRequestAssetSlot={onRequestAssetSlot}
      />
    ),
    process: () => (
      <CardSectionTemplate
        section={section}
        viewport={viewport}
        bg="white"
        onRequestAssetSlot={onRequestAssetSlot}
      />
    ),
    "cross-sell": () => (
      <CardSectionTemplate
        section={section}
        viewport={viewport}
        bg="gray"
        onRequestAssetSlot={onRequestAssetSlot}
      />
    ),
    faq: () => (
      <CardSectionTemplate
        section={section}
        viewport={viewport}
        bg="white"
        onRequestAssetSlot={onRequestAssetSlot}
      />
    ),
    "cta-form": () => <CtaFormTemplate section={section} />,
    "sticky-cta": () => <StickyCtaTemplate section={section} />,
    footer: () => <FooterTemplate section={section} />,
  };
  return renderers[section.preset]();
}
