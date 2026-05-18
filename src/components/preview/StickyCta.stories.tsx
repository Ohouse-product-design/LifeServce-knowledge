import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StickyCta } from "./StickyCta";

/**
 * StickyCta — 히어로 CTA 가 화면에서 사라지면 하단에 슬라이드 인,
 * 페이지 하단의 두 번째 인라인 CTA 가 보이면 비활성.
 *
 * **Props**
 *
 * | Prop | Type | Default | 설명 |
 * |---|---|---|---|
 * | `direction` | `"bottom"` | `"bottom"` | sticky 가 붙는 방향 (v1: bottom 만) |
 * | `offset` | `number` | `0` | 붙는 위치의 오프셋 (px) |
 * | `transition` | `number` | `0.1` | 슬라이드 인/아웃 transition 시간 (초) |
 * | `triggerOutRef` | `RefObject<HTMLElement>` | — | 뷰포트 밖으로 사라지면 sticky 등장 |
 * | `triggerHideRef` | `RefObject<HTMLElement>` | — | 뷰포트에 진입하면 sticky 비활성 |
 *
 * **상태 매트릭스**
 *
 * | 시나리오 | `isNativeSticky` | `emulatedDisabled` | 표시 |
 * |---|---|---|---|
 * | 1. 초기 (히어로 CTA 보임) | false | false | ✗ |
 * | 2. 히어로 CTA 사라짐 | **true** | false | ✓ (슬라이드 인) |
 * | 3. 스크롤 중 (둘 다 안 보임) | true | false | ✓ |
 * | 4. 하단 CTA 진입 | true | **true** | ✗ (슬라이드 아웃) |
 *
 * 활성 시 컨테이너 스타일:
 * ```
 * position: fixed
 * bottom: {offset}px
 * transform: translateY(0)       // 비활성 시 translateY(100%)
 * transition: transform {transition}s cubic-bezier(0.2, 0, 0.2, 1.05)
 * ```
 *
 * 버튼 press 피드백: `active:scale-[0.98]` + `transition transform 111ms cubic-bezier(0.2, 0, 0.2, 1.05)`.
 *
 * IntersectionObserver root 가 viewport (디폴트) 또는 `scrollRootRef` 로 지정 가능.
 * Storybook 데모는 페이지 내부 스크롤 컨테이너를 쓰므로 `scrollRootRef` 필요.
 */
function StickyCtaDemo({
  offset = 0,
  transition = 0.1,
}: {
  offset?: number;
  transition?: number;
}) {
  const heroCtaRef = useRef<HTMLButtonElement>(null);
  const bottomCtaRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="relative mx-auto h-[600px] w-[400px] overflow-y-auto rounded-ods-12 border border-ods-border bg-white"
      style={{ scrollSnapType: "y proximity" }}
    >
      {/* 1. Hero 섹션 — 위로 스크롤하면 사라짐 */}
      <section className="flex h-[500px] flex-col items-center justify-center gap-4 bg-ods-surface-light p-6 text-center">
        <h1 className="font-pretendard text-[24px] font-semibold leading-8 text-ods-text-primary">
          이사, 오늘의집과 함께
        </h1>
        <p className="font-pretendard text-[14px] text-ods-text-tertiary">
          ↓ 스크롤하면 sticky CTA 가 등장합니다
        </p>
        <button
          ref={heroCtaRef}
          type="button"
          className="rounded-ods-8 bg-ods-primary px-6 py-3 font-pretendard text-[14px] font-semibold text-white"
        >
          무료 견적 신청하기 (히어로)
        </button>
      </section>

      {/* 2. 중간 콘텐츠 — sticky 활성 구간 */}
      <section className="space-y-4 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-ods-8 bg-ods-surface-gray p-4 font-pretendard text-[14px] text-ods-text-secondary"
          >
            본문 콘텐츠 블록 #{i + 1} — 이 구간을 스크롤 중에는 sticky CTA 가 하단에 떠 있습니다.
          </div>
        ))}
      </section>

      {/* 3. 하단 inline CTA — 진입 시 sticky 비활성 */}
      <section className="flex flex-col items-center gap-4 p-6">
        <p className="font-pretendard text-[14px] text-ods-text-tertiary">
          ↓ 이 버튼이 보이면 sticky CTA 가 사라집니다
        </p>
        <button
          ref={bottomCtaRef}
          type="button"
          className="rounded-ods-8 bg-ods-primary px-6 py-3 font-pretendard text-[14px] font-semibold text-white"
        >
          무료 견적 신청하기 (하단)
        </button>
      </section>

      <div className="h-[200px]" />

      {/* StickyCta — scrollRef 컨테이너 기준 */}
      <StickyCta
        offset={offset}
        transition={transition}
        triggerOutRef={heroCtaRef}
        triggerHideRef={bottomCtaRef}
        scrollRootRef={scrollRef}
        className="!absolute"
      >
        <div className="border-t border-ods-border bg-white p-3">
          <button
            type="button"
            className="w-full rounded-ods-8 bg-ods-primary py-3 font-pretendard text-[14px] font-semibold text-white"
          >
            무료 견적 신청하기 (Sticky)
          </button>
        </div>
      </StickyCta>
    </div>
  );
}

const meta = {
  title: "Preview/StickyCta Behavior",
  component: StickyCtaDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "히어로 인라인 CTA 가 뷰포트 밖으로 사라지면 하단에 슬라이드 인, " +
          "페이지 하단의 두 번째 인라인 CTA 가 뷰포트에 진입하면 비활성. " +
          "IntersectionObserver 기반.",
      },
    },
  },
  argTypes: {
    offset: {
      control: { type: "number", min: 0, max: 64, step: 1 },
      description: "붙는 위치의 오프셋 (px)",
    },
    transition: {
      control: { type: "number", min: 0, max: 1, step: 0.05 },
      description: "슬라이드 인/아웃 transition 시간 (초)",
    },
  },
  args: { offset: 0, transition: 0.1 },
} satisfies Meta<typeof StickyCtaDemo>;

export default meta;

type Story = StoryObj<typeof StickyCtaDemo>;

/** 디폴트 — offset 0, transition 0.1s */
export const Default: Story = {};

/** offset 16px — 화면 하단에서 16px 띄움 */
export const WithOffset: Story = {
  args: { offset: 16 },
};

/** transition 0.3s — 슬라이드가 더 느리게 (모션 감수성 확인) */
export const SlowTransition: Story = {
  args: { transition: 0.3 },
};
