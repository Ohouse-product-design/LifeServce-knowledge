/**
 * 섹션 프리셋 카탈로그 (v2 — Card 통합 후).
 *
 * 변경: 모든 카드형 슬롯의 allows 가 단일 "card" 로 통일.
 * Card 인스턴스가 layout(grid/carousel/row) 을 가지므로
 * 섹션 단에서는 "어떤 컨테이너든 들어갈 수 있다" 로 단순화된다.
 */

import type { UISpec } from "./ui-spec";
import type { ComponentPresetId } from "./component-presets";

export type SectionPresetId =
  // 고정 영역 (locked)
  | "header"
  | "hero"
  | "sticky-cta"
  | "footer"
  // 가변 영역
  | "usp"
  | "table"
  | "review"
  | "process"
  | "cross-sell"
  | "faq"
  | "cta-form";

export interface SectionSlotSpec {
  name: string;
  allows: ComponentPresetId[];
  min: number;
  max: number;
  label: string;
}

export interface SectionAssetSpec {
  slotName: string;
  label: string;
  recommended?: { width: number; height: number };
  required: boolean;
}

export interface SectionPreset {
  id: SectionPresetId;
  label: string;
  description: string;
  category: "fixed" | "hero" | "content" | "cta";
  defaultLocked: boolean;
  icon: string;
  uiSpec: UISpec;
  slots: SectionSlotSpec[];
  assets: SectionAssetSpec[];
  maxPerPage: number;
}

// ---------------------------------------------------------------------------
// 카탈로그
// ---------------------------------------------------------------------------

export const SECTION_PRESETS: Record<SectionPresetId, SectionPreset> = {
  header: {
    id: "header",
    label: "헤더",
    description: "로고/네비게이션. 모든 페이지 공통, 순서 변경 불가",
    category: "fixed",
    defaultLocked: true,
    icon: "PanelTop",
    uiSpec: { logoText: { maxChar: 10, maxLine: 1 } },
    slots: [],
    assets: [
      { slotName: "logo", label: "로고", required: false, recommended: { width: 120, height: 32 } },
    ],
    maxPerPage: 1,
  },

  hero: {
    id: "hero",
    label: "히어로",
    description: "메인 카피·서브 카피·CTA·메인 이미지",
    category: "hero",
    defaultLocked: true,
    icon: "Sparkles",
    uiSpec: {
      eyebrow: { maxChar: 20, maxLine: 1 },
      title: { maxChar: 48, maxLine: 3, required: true },
      subtitle: { maxChar: 48, maxLine: 2 },
      primaryCtaLabel: { maxChar: 20, maxLine: 1, required: true },
      secondaryCtaLabel: { maxChar: 20, maxLine: 1 },
    },
    slots: [],
    assets: [
      {
        slotName: "background",
        label: "히어로 이미지",
        required: true,
        recommended: { width: 600, height: 400 },
      },
    ],
    maxPerPage: 1,
  },

  usp: {
    id: "usp",
    label: "카드 그리드",
    description: "균일한 카드를 그리드/리스트/캐러셀로 배치. 카드 변형(usage)으로 USP·신뢰·서비스 등 다양한 용도 커버 (CONVENTIONS: section.card-grid)",
    category: "content",
    defaultLocked: false,
    icon: "LayoutGrid",
    uiSpec: {
      sectionTitle: { maxChar: 22, maxLine: 2, required: true },
      sectionSubtitle: { maxChar: 18, maxLine: 1 },
    },
    slots: [
      {
        name: "content",
        label: "card slot",
        allows: ["card"], // ★ 단일 card
        min: 1,
        max: 1,
      },
    ],
    assets: [],
    maxPerPage: 5,
  },

  table: {
    id: "table",
    label: "비교 카드",
    description: "여러 옵션을 카드 단위로 비교 (CONVENTIONS: section.card-grid, 기본 아이템 slot-item.table-card)",
    category: "content",
    defaultLocked: false,
    icon: "Table",
    uiSpec: {
      sectionTitle: { maxChar: 22, maxLine: 2, required: true },
      sectionSubtitle: { maxChar: 18, maxLine: 1 },
    },
    slots: [
      {
        name: "content",
        label: "card slot",
        allows: ["card"], // tablecard variant 사용
        min: 1,
        max: 1,
      },
    ],
    assets: [],
    maxPerPage: 2,
  },

  review: {
    id: "review",
    label: "후기 리스트",
    description: "인용형 카드 리스트 (CONVENTIONS: section.quote-list, 기본 아이템 slot-item.review-card)",
    category: "content",
    defaultLocked: false,
    icon: "MessagesSquare",
    uiSpec: {
      sectionTitle: { maxChar: 22, maxLine: 2, required: true },
      sectionSubtitle: { maxChar: 18, maxLine: 1 },
    },
    slots: [
      {
        name: "content",
        label: "card slot",
        allows: ["card"],
        min: 1,
        max: 1,
      },
    ],
    assets: [],
    maxPerPage: 2,
  },

  process: {
    id: "process",
    label: "프로세스 단계",
    description: "순서 있는 단계 카드 (CONVENTIONS: section.steps, 기본 아이템 slot-item.progress-card)",
    category: "content",
    defaultLocked: false,
    icon: "ListOrdered",
    uiSpec: {
      sectionTitle: { maxChar: 22, maxLine: 2, required: true },
      sectionSubtitle: { maxChar: 18, maxLine: 1 },
    },
    slots: [
      {
        name: "content",
        label: "card slot",
        allows: ["card"],
        min: 1,
        max: 1,
      },
    ],
    assets: [],
    maxPerPage: 2,
  },

  "cross-sell": {
    id: "cross-sell",
    label: "카드 캐러셀",
    description: "가로 스크롤형 카드 (CONVENTIONS: section.card-carousel)",
    category: "content",
    defaultLocked: false,
    icon: "Boxes",
    uiSpec: {
      sectionTitle: { maxChar: 22, maxLine: 2, required: true },
      sectionSubtitle: { maxChar: 18, maxLine: 1 },
    },
    slots: [
      {
        name: "content",
        label: "card slot",
        allows: ["card"],
        min: 1,
        max: 1,
      },
    ],
    assets: [],
    maxPerPage: 1,
  },

  faq: {
    id: "faq",
    label: "FAQ",
    description: "질문/답변 accordion 리스트 (CONVENTIONS: section.accordion, 카드 변형 faqcard)",
    category: "content",
    defaultLocked: false,
    icon: "HelpCircle",
    uiSpec: {
      sectionTitle: { maxChar: 22, maxLine: 2, required: true },
      sectionSubtitle: { maxChar: 18, maxLine: 1 },
    },
    slots: [
      {
        name: "content",
        label: "card slot",
        allows: ["card"], // faqcard variant 사용
        min: 1,
        max: 1,
      },
    ],
    assets: [],
    maxPerPage: 1,
  },

  "cta-form": {
    id: "cta-form",
    label: "폼",
    description: "입력 필드 슬롯 (CONVENTIONS: section.form, slot-item.input)",
    category: "cta",
    defaultLocked: false,
    icon: "PhoneCall",
    uiSpec: {
      sectionTitle: { maxChar: 22, maxLine: 2, required: true },
      sectionSubtitle: { maxChar: 24, maxLine: 1 },
      submitLabel: { maxChar: 12, maxLine: 1, required: true },
      consentText: { maxChar: 100, maxLine: 3 },
    },
    slots: [
      { name: "fields", label: "폼 필드", allows: ["form-field"], min: 1, max: 8 },
    ],
    assets: [],
    maxPerPage: 2,
  },

  "sticky-cta": {
    id: "sticky-cta",
    label: "CTA",
    description: "화면에 고정되는 액션 바 (CONVENTIONS: section.sticky-bar)",
    category: "fixed",
    defaultLocked: true,
    icon: "ArrowDownToLine",
    uiSpec: { label: { maxChar: 16, maxLine: 1, required: true } },
    slots: [],
    assets: [],
    maxPerPage: 1,
  },

  footer: {
    id: "footer",
    label: "푸터",
    description: "회사 정보·약관 링크. 공통 영역, 순서 변경 불가",
    category: "fixed",
    defaultLocked: true,
    icon: "PanelBottom",
    uiSpec: { copyright: { maxChar: 60, maxLine: 1 } },
    slots: [],
    assets: [],
    maxPerPage: 1,
  },
};

export const SECTION_PRESET_LIST: SectionPreset[] = Object.values(SECTION_PRESETS);

export function isLockedByDefault(preset: SectionPresetId): boolean {
  return SECTION_PRESETS[preset].defaultLocked;
}
