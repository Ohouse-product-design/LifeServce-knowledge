import type { SectionPresetId } from "@/schema/section-presets";

/**
 * SectionTree 「+ 섹션 추가」드롭다운의 2-그룹 구조.
 *
 *   1. 서비스 소개 페이지 (Service intro)
 *      - 서비스 안내       (usp)
 *      - 고객 만족 리뷰    (review)
 *      - 신청 단계 안내    (process)
 *      - 크로스셀링        (cross-sell)
 *
 *   2. 마케팅 페이지 (Marketing)
 *      - 서비스 안내       (usp, marketing variant)
 *      - 신청폼            (cta-form, marketing-form variant)
 *      - 신청 단계 안내    (process, marketing variant)
 *      - FAQ               (faq)
 *
 * 각 entry 의 라벨은 비즈니스 친화적 카피이며, 내부적으로는 preset id (+ optional variant) 로 매핑됨.
 * Storybook `SectionPresetMenu` 스토리도 이 데이터를 그대로 import 한다.
 */

export type SectionAddEntry = {
  preset: SectionPresetId;
  variant?: string;
  label: string;
  /** 비디자이너·개발자 대상 1문장 설명 (SectionPresetMenu 카드에 노출) */
  description: string;
};

export type SectionAddGroup = {
  id: string;
  label: string;
  entries: SectionAddEntry[];
};

export const SECTION_ADD_GROUPS: SectionAddGroup[] = [
  {
    id: "service-intro",
    label: "서비스 소개 페이지",
    entries: [
      {
        preset: "usp",
        label: "서비스 안내",
        description: "강점·핵심 정보를 카드 그리드로 한눈에 보여줍니다.",
      },
      {
        preset: "review",
        label: "고객 만족 리뷰",
        description: "별점과 후기 카드로 실제 고객의 만족도를 보여줍니다.",
      },
      {
        preset: "process",
        label: "신청 단계 안내",
        description: "번호 순서대로 이용 절차를 시각화합니다.",
      },
      {
        preset: "cross-sell",
        label: "크로스셀링",
        description: "관련 서비스를 카드 리스트로 추천합니다.",
      },
    ],
  },
  {
    id: "marketing",
    label: "마케팅 페이지",
    entries: [
      {
        preset: "usp",
        variant: "marketing",
        label: "서비스 안내",
        description: "마케팅 톤으로 강조된 카드 그리드.",
      },
      {
        preset: "cta-form",
        variant: "marketing-form",
        label: "신청폼",
        description: "이름·연락처 입력과 제출 버튼으로 신청을 받습니다.",
      },
      {
        preset: "process",
        variant: "marketing",
        label: "신청 단계 안내",
        description: "신청부터 완료까지 단계를 시각적으로 안내합니다.",
      },
      {
        preset: "faq",
        label: "FAQ",
        description: "자주 묻는 질문을 펼침·접힘 카드로 정리합니다.",
      },
    ],
  },
];

/**
 * 호환을 위한 평탄화 export — 기존 import 사이트가 있을 경우.
 * 새 코드는 SECTION_ADD_GROUPS 사용 권장.
 */
export const SECTION_ADD_BASIC_PRESET_IDS = SECTION_ADD_GROUPS[0].entries.map(
  (e) => e.preset
);

/** 드롭다운/트리 라벨 — entry 의 label 을 우선 사용 */
export function sectionAddMenuLabel(entry: SectionAddEntry): string {
  return entry.label;
}
