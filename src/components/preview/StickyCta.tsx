"use client";

/**
 * StickyCta — 히어로 CTA 가 뷰포트 밖으로 사라지면 하단에 슬라이드 인,
 * 페이지 하단의 두 번째 인라인 CTA 가 뷰포트에 진입하면 비활성.
 *
 * 동작 스펙은 docs/STICKY-CTA-BEHAVIOR.md 또는 Storybook
 * `Preview/StickyCta Behavior` 스토리의 docs 패널 참고.
 *
 * 사용 예:
 *   const heroCtaRef = useRef<HTMLButtonElement>(null);
 *   const bottomCtaRef = useRef<HTMLButtonElement>(null);
 *   <button ref={heroCtaRef}>무료 견적 신청하기</button>
 *   ... 긴 콘텐츠 ...
 *   <button ref={bottomCtaRef}>무료 견적 신청하기</button>
 *   <StickyCta triggerOutRef={heroCtaRef} triggerHideRef={bottomCtaRef}>
 *     <button>무료 견적 신청하기</button>
 *   </StickyCta>
 */

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";

export interface StickyCtaProps {
  /** sticky 가 붙는 방향. v1 은 bottom 만 지원. */
  direction?: "bottom";
  /** 붙는 위치의 오프셋 (px). 디폴트 0. */
  offset?: number;
  /** 슬라이드 인/아웃 transition 시간 (초). 디폴트 0.1. */
  transition?: number;
  /**
   * 이 요소가 뷰포트 밖으로(위쪽으로) 사라지면 sticky 등장.
   * 일반적으로 히어로 섹션의 인라인 CTA 버튼 ref.
   */
  triggerOutRef?: RefObject<HTMLElement>;
  /**
   * 이 요소가 뷰포트에 진입하면 sticky 비활성 (emulatedDisabled).
   * 일반적으로 페이지 하단의 두 번째 인라인 CTA 버튼 ref.
   */
  triggerHideRef?: RefObject<HTMLElement>;
  /**
   * Scroll 컨테이너 (IntersectionObserver root).
   * Storybook 데모처럼 페이지 내부 스크롤 컨테이너를 쓰는 경우 지정.
   * 미지정 시 viewport (document) 사용.
   */
  scrollRootRef?: RefObject<HTMLElement>;
  /** sticky 내부 콘텐츠 (보통 버튼) */
  children: ReactNode;
  /** 컨테이너 className 추가 */
  className?: string;
}

/**
 * 컴포넌트 상태:
 *   disabled         : 외부에서 강제 비활성 (현재 미사용 prop)
 *   emulatedDisabled : triggerHideRef 가 뷰포트에 들어와서 자동 비활성
 *   isNativeSticky   : 사용자가 트리거를 지나 sticky 가 활성된 상태
 *
 * 표시 조건:  isNativeSticky && !emulatedDisabled
 */
export function StickyCta({
  direction = "bottom",
  offset = 0,
  transition = 0.1,
  triggerOutRef,
  triggerHideRef,
  scrollRootRef,
  children,
  className,
}: StickyCtaProps) {
  const [isNativeSticky, setIsNativeSticky] = useState(false);
  const [emulatedDisabled, setEmulatedDisabled] = useState(false);

  useEffect(() => {
    const root = scrollRootRef?.current ?? null;
    const observers: IntersectionObserver[] = [];

    // 1. triggerOutRef — 뷰포트 위로 사라지면 sticky ON
    const triggerOut = triggerOutRef?.current;
    if (triggerOut) {
      const obs = new IntersectionObserver(
        ([entry]) => {
          // 위쪽(상단 밖)으로 사라진 경우만 활성. 아래쪽으로 사라진 건 페이지 시작 시점이라 제외.
          const goneAbove = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          setIsNativeSticky(goneAbove);
        },
        { root, threshold: 0 }
      );
      obs.observe(triggerOut);
      observers.push(obs);
    }

    // 2. triggerHideRef — 뷰포트에 들어오면 emulatedDisabled ON
    const triggerHide = triggerHideRef?.current;
    if (triggerHide) {
      const obs = new IntersectionObserver(
        ([entry]) => {
          setEmulatedDisabled(entry.isIntersecting);
        },
        { root, threshold: 0.1 }
      );
      obs.observe(triggerHide);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [triggerOutRef, triggerHideRef, scrollRootRef]);

  const visible = isNativeSticky && !emulatedDisabled;

  return (
    <div
      // sticky 컨테이너 — 위치 계산용. 항상 DOM 에 존재하되 transform 으로 슬라이드.
      // (높이 플레이스홀더가 필요 없는 fixed 포지셔닝 사용.)
      data-sticky-cta=""
      data-active={visible}
      data-native-sticky={isNativeSticky}
      data-emulated-disabled={emulatedDisabled}
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 will-change-transform",
        className
      )}
      style={{
        [direction]: `${offset}px`,
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: `transform ${transition}s cubic-bezier(0.2, 0, 0.2, 1.05)`,
      }}
    >
      <div className="pointer-events-auto">
        {/*
          Press 애니메이션: 내부 버튼 클래스에 .press-feedback 을 두면
          tap 시 scale 축소 → 즉시 복원. 사용자 정의 children 에도 적용되도록
          글로벌 셀렉터 대신 wrapper 에 active:scale 적용.
        */}
        <div className="press-feedback transition-transform duration-[111ms] [transition-timing-function:cubic-bezier(0.2,0,0.2,1.05)] active:scale-[0.98]">
          {children}
        </div>
      </div>
    </div>
  );
}
