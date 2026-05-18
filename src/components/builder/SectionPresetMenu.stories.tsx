import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import SectionPresetMenu from "./SectionPresetMenu";
import { SECTION_PRESETS } from "@/schema/section-presets";
import { SECTION_ADD_GROUPS } from "./section-add-menu";

/**
 * SectionTree 「+ 섹션 추가」 메뉴 — 2 그룹 구조.
 *
 *   1. 서비스 소개 페이지   — 서비스 안내 · 고객 만족 리뷰 · 신청 단계 안내 · 크로스셀링
 *   2. 마케팅 페이지        — 서비스 안내 · 신청폼 · 신청 단계 안내 · FAQ
 *
 * 그룹/엔트리 데이터 단일 소스: `src/components/builder/section-add-menu.ts`.
 * SectionTree 의 add 메뉴 UI 와 이 스토리는 같은 데이터를 import.
 */

const groupedEntries = SECTION_ADD_GROUPS.flatMap((group) =>
  group.entries.map((e, i) => ({
    id: `${group.id}-${e.preset}-${e.variant ?? "default"}-${i}`,
    label: e.label,
    description: e.description,
    group: group.label,
    preset: e.preset,
  }))
);

// 전체 스키마 카탈로그 (문서/스펙 참고용)
const fullCatalogEntries = Object.values(SECTION_PRESETS).map((p) => ({
  id: p.id,
  label: p.label,
  description: p.description,
  group: "전체 카탈로그",
  preset: p.id,
}));

const meta: Meta<typeof SectionPresetMenu> = {
  title: "Builder/Editor/SectionPresetMenu",
  component: SectionPresetMenu,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'SectionTree 의 "+ 섹션 추가" 메뉴를 2 그룹(서비스 소개 페이지 / 마케팅 페이지) 구조로 노출. ' +
          "데이터 단일 소스는 section-add-menu.ts 의 SECTION_ADD_GROUPS.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SectionPresetMenu>;

/** SectionTree 의 add 메뉴와 동일 — 2 그룹 × 4 entries = 8개 */
export const AsInSectionTree: Story = {
  args: { entries: groupedEntries },
};

/** SECTION_PRESETS 전체 (고정 영역 + faq 포함) — 스키마 검토용 */
export const FullCatalog: Story = {
  args: { entries: fullCatalogEntries },
};

/** 그룹 1 만: 서비스 소개 페이지 */
export const ServiceIntroOnly: Story = {
  args: {
    entries: groupedEntries.filter((e) => e.group === "서비스 소개 페이지"),
  },
};

/** 그룹 2 만: 마케팅 페이지 */
export const MarketingOnly: Story = {
  args: {
    entries: groupedEntries.filter((e) => e.group === "마케팅 페이지"),
  },
};
