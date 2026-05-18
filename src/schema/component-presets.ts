/**
 * 컴포넌트 프리셋 카탈로그 (v3 — Section 구성 원칙 적용).
 *
 * 섹션 구성 원칙 (CONVENTIONS §12):
 *   - hero / cta / footer 를 제외한 모든 섹션은 **타이틀(uiSpec) + 카드(slot)** 의
 *     조합으로만 구성되어야 한다.
 *   - 따라서 body 섹션의 slot 은 항상 `["card"]` 만 허용.
 *   - `form-field` 는 cta-form 섹션 전용 (cta 카테고리, 예외).
 *
 * 변경:
 *   - `table-row`, `tab`, `badge` 는 v2 잔재로, 어떤 섹션에서도 더 이상 사용되지 않음.
 *   - 향후 한 릴리스 사이클 후 완전 제거 예정. 현재는 union 유지 + DEPRECATED 표시.
 */

import type { UISpec } from "./ui-spec";

export type ComponentPresetId =
  | "card"        // ★ 통합 카드 — layout + cells
  | "form-field"  // cta-form 섹션 전용
  // DEPRECATED — 어떤 섹션도 더 이상 참조하지 않음. 제거 대기.
  | "table-row"
  | "tab"
  | "badge";

export interface ComponentPreset {
  id: ComponentPresetId;
  label: string;
  description: string;
  icon: string;
  /** 컴포넌트 인스턴스의 컨테이너 단 props 에 대한 UI Spec */
  uiSpec: UISpec;
  /** 컴포넌트 인스턴스 단 에셋 슬롯 — card 의 경우 cell 단에서 별도 처리하므로 비어있음 */
  assetSlots: { name: string; label: string; required: boolean }[];
}

export const COMPONENT_PRESETS: Record<ComponentPresetId, ComponentPreset> = {
  card: {
    id: "card",
    label: "Card",
    description:
      "단일 상위 컴포넌트. layout(grid/carousel/row) 으로 배치를 결정하고, 각 cell 은 slot 시스템으로 콘텐츠를 갖는다.",
    icon: "LayoutGrid",
    uiSpec: {
      // 컨테이너 단 옵션 — 자세한 layout 세부 옵션은 CardLayoutSettings 로 별도 관리
      usage: {
        inputType: "enum",
        enumOptions: [
          { value: "imgcard", label: "Image Card" },
          { value: "reviewcard", label: "Review Card" },
          { value: "listcard", label: "List Card" },
          { value: "tablecard", label: "Table Card" },
        ],
        required: true,
        help: "셀의 슬롯 활성화 + 제약을 결정합니다. imgcard 는 cardType(bgfullimg/leading-asset) 으로 추가 분기.",
      },
    },
    assetSlots: [],
  },

  "table-row": {
    id: "table-row",
    label: "테이블 행",
    description: "비교 테이블의 한 행 — 좌/중/우 셀",
    icon: "Rows",
    uiSpec: {
      label: { maxChar: 20, maxLine: 2, required: true },
      colA: { maxChar: 30, maxLine: 2 },
      colB: { maxChar: 30, maxLine: 2 },
      colC: { maxChar: 30, maxLine: 2 },
    },
    assetSlots: [],
  },

  "form-field": {
    id: "form-field",
    label: "폼 필드",
    description: "라벨/placeholder/유효성을 갖는 입력 필드",
    icon: "FormInput",
    uiSpec: {
      label: { maxChar: 20, maxLine: 1, required: true },
      placeholder: { maxChar: 30, maxLine: 1 },
      fieldType: {
        inputType: "enum",
        enumOptions: [
          { value: "text", label: "텍스트" },
          { value: "tel", label: "전화" },
          { value: "email", label: "이메일" },
          { value: "select", label: "선택" },
          { value: "checkbox", label: "체크박스" },
        ],
      },
    },
    assetSlots: [],
  },

  tab: {
    id: "tab",
    label: "탭",
    description: "탭바의 한 항목 — 라벨 + 콘텐츠 키",
    icon: "PanelTopOpen",
    uiSpec: {
      label: { maxChar: 10, maxLine: 1, required: true },
      contentKey: { maxChar: 30, maxLine: 1, required: true },
    },
    assetSlots: [],
  },

  badge: {
    id: "badge",
    label: "배지",
    description: "아이콘 + 라벨, 그라디언트 배경",
    icon: "BadgeCheck",
    uiSpec: {
      label: { maxChar: 12, maxLine: 1, required: true },
    },
    assetSlots: [{ name: "icon", label: "배지 아이콘", required: false }],
  },
};

export const COMPONENT_PRESET_LIST: ComponentPreset[] =
  Object.values(COMPONENT_PRESETS);
