"use client";

/**
 * Card 런타임 컴포넌트.
 *
 * 단일 상위 컴포넌트로서 layout 에 따라 grid / carousel / row 를 렌더한다.
 * 각 cell 은 slot 시스템(media/tag/title/body/meta/rating/cta/icon/stepNumber)
 * 으로 콘텐츠를 그린다.
 *
 * 주의:
 * - carousel 의 autoScroll 은 무한 marquee 스타일 (CSS animation 으로 처리)
 * - autoScroll=false 면 사용자가 좌우 드래그/스크롤로만 이동
 * - viewport 별 컬럼 수 / 카드 폭은 부모(PreviewRenderer) 가 viewport prop 으로 결정해서 전달
 */

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { IconChevronDown, IconPhoto, IconStar, IconStarFilled } from "@bucketplace/icons";
import type { AssetSlotModalOpenContext } from "@/schema/asset-modal-context";
import {
  CARD_USAGE_PRESETS,
  type CardCell,
  type CardCellTheme,
  type CardLayoutSettings,
  type CardSlotContent,
  type CardSlotName,
  type CardUsagePresetId,
  type ImgcardType,
} from "@/schema/card";
import type { Viewport } from "@/schema/doc";
import OdsAssetRenderer from "./OdsAssetRenderer";

// ---------------------------------------------------------------------------
// 공용 헬퍼
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Card 컴포넌트 (메인)
// ---------------------------------------------------------------------------

export interface CardPreviewAssetBinding {
  sectionId: string;
  componentId: string;
  onRequestSlot: (ctx: AssetSlotModalOpenContext) => void;
}

interface CardProps {
  usage: CardUsagePresetId;
  layout: CardLayoutSettings;
  cells: CardCell[];
  viewport: Viewport;
  /** imgcard 서브 변형 — bgfullimg(디폴트) | leading-asset */
  cardType?: ImgcardType;
  /** 빌더 프리뷰: 에셋 클릭 시 슬롯 교체 모달 */
  previewAsset?: CardPreviewAssetBinding;
}

/**
 * CONVENTIONS §11 — minWidth 폴백.
 *
 * grid 가 선택된 상태에서 viewport 기준 per-card 폭이 변형의 minWidth 미만이면
 * `allowedLayouts` 순서로 carousel → list 로 자동 강등한다.
 *
 * 폭 계산은 viewport 기반 휴리스틱 (375/768/1280 에서 페이지 거터를 뺀 사용 폭).
 * 정확한 컨테이너 폭은 ResizeObserver 가 필요하지만 v1 은 단순화.
 */
const APPROX_USABLE_WIDTH_PX: Record<Viewport, number> = {
  mobile: 360,
  tablet: 750,
  desktop: 1200,
};

function resolveLayoutWithFallback(
  usage: CardUsagePresetId,
  layout: CardLayoutSettings,
  viewport: Viewport
): CardLayoutSettings {
  if (layout.type !== "grid") return layout;

  const preset = CARD_USAGE_PRESETS[usage];
  const cols = usage === "listcard" ? (viewport === "mobile" ? 1 : 2) : 2;
  const usable = APPROX_USABLE_WIDTH_PX[viewport];
  const perCardWidth = (usable - GRID_FIXED_GAP_PX * (cols - 1)) / cols;

  if (perCardWidth >= preset.minWidth) return layout;

  // 폴백 순서: carousel → list (CONVENTIONS §11.1)
  if (preset.allowedLayouts.includes("carousel")) {
    return {
      type: "carousel",
      settings: {
        cardWidth: {
          mobile: preset.minWidth,
          tablet: preset.minWidth,
          desktop: preset.minWidth,
        },
        gap: 8,
        autoScroll: false,
      },
    };
  }
  if (preset.allowedLayouts.includes("list")) {
    return { type: "list", settings: { gap: 8, align: "start" } };
  }
  // 둘 다 안 되면 원본 grid 유지 (시각적 손상 허용)
  return layout;
}

export default function Card({ usage, layout, cells, viewport, cardType, previewAsset }: CardProps) {
  const effective = resolveLayoutWithFallback(usage, layout, viewport);
  switch (effective.type) {
    case "grid":
      return (
        <GridLayout
          usage={usage}
          cells={cells}
          viewport={viewport}
          settings={effective.settings}
          cardType={cardType}
          previewAsset={previewAsset}
        />
      );
    case "carousel":
      return (
        <CarouselLayout
          usage={usage}
          cells={cells}
          viewport={viewport}
          settings={effective.settings}
          cardType={cardType}
          previewAsset={previewAsset}
        />
      );
    case "list":
      return (
        <ListLayout
          usage={usage}
          cells={cells}
          viewport={viewport}
          settings={effective.settings}
          cardType={cardType}
          previewAsset={previewAsset}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// Grid layout — Figma 31:777 (Lead 태블릿) 스펙
//
// 규칙: 카드 사이 간격 8px 고정.
// - `usage === "service"`: 모바일 뷰포트 `grid-cols-1`, 태블릿·데스크톱 `grid-cols-2`.
// - 그 외: 항상 `grid-cols-2` (Lead UI spec).
// - settings.columns / settings.gap 은 schema 호환을 위해 유지되나 service 가 아니면 2 col 고정.
// ---------------------------------------------------------------------------

const GRID_FIXED_GAP_PX = 8;

function GridLayout({
  usage,
  cells,
  viewport,
  settings: _settings,
  cardType,
  previewAsset,
}: {
  usage: CardUsagePresetId;
  cells: CardCell[];
  viewport: Viewport;
  settings: Extract<CardLayoutSettings, { type: "grid" }>["settings"];
  cardType?: ImgcardType;
  previewAsset?: CardPreviewAssetBinding;
}) {
  const gridCols =
    usage === "listcard"
      ? viewport === "mobile"
        ? "grid-cols-1"
        : "grid-cols-2"
      : "grid-cols-2";

  return (
    <div
      className={cn("grid w-full", gridCols)}
      style={{ gap: `${GRID_FIXED_GAP_PX}px` }}
    >
      {cells.map((cell) => (
        <div key={cell.id} className="min-w-0 w-full">
          <CellRenderer
            cell={cell}
            usage={usage}
            viewport={viewport}
            cardType={cardType}
            previewAsset={previewAsset}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carousel layout — Figma 31:777 (Lead 태블릿) 스펙
//
// 규칙: 카드 고정 너비, 카드 좌우 패딩 제거(= 컨테이너에 horizontal padding 없음,
// 셀 wrapper 도 padding 없이 cardWidth 그대로).
// - settings.cardWidth[viewport] 는 그대로 사용
// - settings.gap 은 schema 호환을 위해 유지되나 카드 사이 간격은 8로 고정
// - autoScroll on/off 동작은 동일하게 유지.
// ---------------------------------------------------------------------------

const CAROUSEL_FIXED_GAP_PX = 8;

function CarouselLayout({
  usage,
  cells,
  viewport,
  settings,
  cardType,
  previewAsset,
}: {
  usage: CardUsagePresetId;
  cells: CardCell[];
  viewport: Viewport;
  settings: Extract<CardLayoutSettings, { type: "carousel" }>["settings"];
  cardType?: ImgcardType;
  previewAsset?: CardPreviewAssetBinding;
}) {
  const cardWidth = settings.cardWidth[viewport] ?? 320;

  const renderedCells = settings.autoScroll ? [...cells, ...cells] : cells;
  const durationSec = (settings.autoScrollDurationMs ?? 30000) / 1000;

  const animKey = useMemo(
    () => `card-marquee-${cells.length}-${durationSec}`,
    [cells.length, durationSec]
  );

  return (
    <div className="relative overflow-hidden px-0">
      <div
        className={cn(
          "flex w-max px-0",
          settings.autoScroll ? "" : "overflow-x-auto"
        )}
        style={{
          gap: `${CAROUSEL_FIXED_GAP_PX}px`,
          animation: settings.autoScroll
            ? `${animKey} ${durationSec}s linear infinite`
            : undefined,
        }}
      >
        {renderedCells.map((cell, i) => (
          <div
            key={`${cell.id}-${i}`}
            className="p-0"
            style={{ width: `${cardWidth}px`, flexShrink: 0 }}
          >
            <CellRenderer
              cell={cell}
              usage={usage}
              viewport={viewport}
              cardType={cardType}
              previewAsset={previewAsset}
            />
          </div>
        ))}
      </div>

      {settings.showArrows && !settings.autoScroll && (
        <>
          <button
            type="button"
            aria-label="이전"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm shadow"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="다음"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm shadow"
          >
            ›
          </button>
        </>
      )}

      {settings.autoScroll && (
        <style>{`@keyframes ${animKey} { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row layout — Figma 31:777 (Lead 태블릿) 스펙
//
// 규칙: 카드 full width(100%) + 위→아래 세로 스택 + 간격 8px 고정.
// - `usage === "service"` (크로스셀): 모바일 뷰포트는 1열 flex, 태블릿·데스크톱은 2×2 grid.
// - 그 외: 기존과 동일하게 세로 스택만 사용.
// ---------------------------------------------------------------------------

const ROW_FIXED_GAP_PX = 8;

function ListLayout({
  usage,
  cells,
  viewport,
  settings: _settings,
  cardType,
  previewAsset,
}: {
  usage: CardUsagePresetId;
  cells: CardCell[];
  viewport: Viewport;
  settings: Extract<CardLayoutSettings, { type: "list" }>["settings"];
  cardType?: ImgcardType;
  previewAsset?: CardPreviewAssetBinding;
}) {
  if (usage === "listcard") {
    const isMobile = viewport === "mobile";
    return (
      <div
        className={cn(
          "w-full",
          isMobile ? "flex flex-col" : "grid grid-cols-2"
        )}
        style={{ gap: `${ROW_FIXED_GAP_PX}px` }}
      >
        {cells.map((cell) => (
          <div key={cell.id} className="min-w-0 w-full">
            <CellRenderer
              cell={cell}
              usage={usage}
              viewport={viewport}
              cardType={cardType}
              previewAsset={previewAsset}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex w-full flex-col"
      style={{ gap: `${ROW_FIXED_GAP_PX}px` }}
    >
      {cells.map((cell) => (
        <div key={cell.id} className="w-full">
          <CellRenderer
            cell={cell}
            usage={usage}
            viewport={viewport}
            cardType={cardType}
            previewAsset={previewAsset}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cell 렌더러 — usage 별 슬롯 조합 + 스타일
// ---------------------------------------------------------------------------

function CellRenderer({
  cell,
  usage,
  viewport: _viewport,
  cardType,
  previewAsset,
}: {
  cell: CardCell;
  usage: CardUsagePresetId;
  viewport: Viewport;
  cardType?: ImgcardType;
  previewAsset?: CardPreviewAssetBinding;
}) {
  const openSlot = (slot: CardSlotName) => {
    if (!previewAsset) return;
    previewAsset.onRequestSlot({
      sectionId: previewAsset.sectionId,
      componentId: previewAsset.componentId,
      slotName: slot,
      cellId: cell.id,
      cardSlotName: slot,
    });
  };
  const slotEdit = (slot: CardSlotName) =>
    previewAsset ? () => openSlot(slot) : undefined;

  switch (usage) {
    case "imgcard":
      // cardType 으로 분기: bgfullimg(디폴트, 풀배경) / leading-asset(상단 에셋)
      return cardType === "leading-asset"
        ? <CardLeadingAssetCell cell={cell} onRequestSlotEdit={slotEdit("media")} />
        : <CardBgFullImgCell cell={cell} onRequestSlotEdit={slotEdit("media")} />;
    case "reviewcard":
      return <CardReviewCell cell={cell} onRequestSlotEdit={slotEdit("media")} />;
    case "listcard":
      return <ListCell cell={cell} onRequestSlotEdit={slotEdit("icon")} />;
    case "tablecard":
      return <CardTableCell cell={cell} />;
    case "faqcard":
      return <CardFaqCell cell={cell} />;
  }
}

// ---------------------------------------------------------------------------
// 슬롯 접근 헬퍼
// ---------------------------------------------------------------------------

function slot<K extends CardSlotName>(
  cell: CardCell,
  name: K
): CardSlotContent | undefined {
  return cell.slots[name];
}

function asText(c?: CardSlotContent): string | null {
  if (!c || c.kind !== "text") return null;
  return c.text;
}

function asMeta(c?: CardSlotContent): string[] | null {
  if (!c || c.kind !== "meta") return null;
  return c.items;
}

function asRating(c?: CardSlotContent): { value: number; max: number } | null {
  if (!c || c.kind !== "rating") return null;
  return { value: c.value, max: c.max ?? 5 };
}

function asAssetAlt(c?: CardSlotContent): string | null {
  if (!c || c.kind !== "asset") return null;
  return c.asset.alt;
}

function asAssetUrl(c?: CardSlotContent): { url: string; alt: string } | null {
  if (!c || c.kind !== "asset") return null;
  const url = c.asset.url ?? "";
  if (!url) return null;
  return { url, alt: c.asset.alt };
}

function asAsset(c?: CardSlotContent): import("@/schema/doc").AssetRef | null {
  if (!c || c.kind !== "asset") return null;
  return c.asset;
}

/**
 * 본문에 인라인 **bold** 마커가 들어있으면 SemiBold span 으로 변환.
 * 빌더 입력자는 강조 구간을 `**...**` 로 감싸서 작성한다.
 */
function renderRichText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} className="font-semibold">
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function asCta(c?: CardSlotContent): { label: string; url: string } | null {
  if (!c || c.kind !== "cta") return null;
  return { label: c.label, url: c.url };
}

// ---------------------------------------------------------------------------
// Usage 별 cell 스타일
// ---------------------------------------------------------------------------

/**
 * USP 카드 — Figma `card_usp` 스펙.
 * - 카드 셸: `border-radius: 12px`, 배경 그라데이션 + `#F5F5F5` 베이스
 * - 풀-블리드 배경 사진 + 어두운 dim gradient + 흰 텍스트 오버레이
 * - 미디어 영역 비율: **3:4** (가로:세로, 세로형 카드) — 그리드 열 너비에 맞춤
 * - title / body / tag 레이아웃 동일
 */
function CardBgFullImgCell({
  cell,
  onRequestSlotEdit,
}: {
  cell: CardCell;
  onRequestSlotEdit?: () => void;
}) {
  const tag = asText(slot(cell, "tag"));
  const title = asText(slot(cell, "title"));
  const body = asText(slot(cell, "body"));
  const media = asAsset(slot(cell, "media"));
  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden"
      style={{
        borderRadius: "12px",
        background:
          "linear-gradient(160deg, rgba(239, 239, 239, 0.20) -1.05%, rgba(147, 184, 210, 0.20) 99.18%), #F5F5F5",
      }}
    >
      {media ? (
        <OdsAssetRenderer
          asset={media}
          className="absolute inset-0 flex h-full w-full items-center justify-center object-cover"
          onRequestSlotEdit={onRequestSlotEdit}
        />
      ) : onRequestSlotEdit ? (
        <OdsAssetRenderer
          asset={{ type: "image", alt: "미디어 슬롯" }}
          className="absolute inset-0 flex h-full w-full items-center justify-center object-cover"
          onRequestSlotEdit={onRequestSlotEdit}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />
      {tag && (
        <p className="absolute bottom-[60px] left-0 w-full px-5 text-left font-pretendard text-[10px] leading-[14px] tracking-[-0.3px] text-white/70">
          {tag}
        </p>
      )}
      <p className="absolute bottom-3 right-5 font-pretendard text-[10px] font-medium leading-[14px] tracking-[-0.3px] text-white/40">
        AI Generated
      </p>
      <div className="absolute bottom-0 left-0 w-full px-5 pb-[24px] pt-[40px] text-white">
        {title && (
          <h3 className="overflow-hidden text-ellipsis whitespace-nowrap font-pretendard text-[20px] font-semibold leading-7 tracking-[-0.3px]">
            {title}
          </h3>
        )}
        {body && (
          <p className="mt-1.5 max-w-[200px] whitespace-pre-line font-pretendard text-[15px] leading-6 tracking-[-0.3px] line-clamp-2">
            {body}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 리뷰 카드 — 후기 리스트 섹션(seed.ts `sec-review` / section.quote-list) 캐노니컬 스펙.
 *
 * 구조 (위→아래):
 *   1. ★★★★★  별점 (Yellow, 18px)
 *   2. 헤드라인 (Body16 SemiBold 16/20, `\n` 다중줄, line-clamp 없음)
 *   3. 메타 (Detail12 Medium 12/16, 마지막 항목 앞에 `|`, 나머지는 `·` join)
 *   4. 본문 (Body14 Regular 14/20, line-clamp-3, `**...**` SemiBold 변환)
 *
 * - 컨테이너: 흰 배경, p-4, rounded-ods-12, 높이 가변(콘텐츠 기반).
 * - 작성자 사진(media) 슬롯은 사용하지 않음 — 후기 리스트 섹션에 없음.
 * - 폭은 부모 layout 이 결정 (CONVENTIONS §11 minWidth=254).
 */
function CardReviewCell({ cell }: { cell: CardCell; onRequestSlotEdit?: () => void }) {
  const rating = asRating(slot(cell, "rating"));
  const title = asText(slot(cell, "title"));
  const body = asText(slot(cell, "body"));
  const meta = asMeta(slot(cell, "meta"));
  const metaHead = meta && meta.length > 1 ? meta.slice(0, -1) : meta ?? [];
  const metaTail = meta && meta.length > 1 ? meta[meta.length - 1] : null;
  return (
    <div className="flex w-full flex-col gap-3 rounded-ods-12 bg-white p-4">
      {rating && (
        <div
          className="flex gap-0.5"
          role="img"
          aria-label={`별점 ${rating.value}점 만점 ${rating.max}점`}
        >
          {Array.from({ length: rating.max }).map((_, i) => (
            <span key={i} className="inline-flex shrink-0" aria-hidden>
              {i < rating.value ? (
                <IconStarFilled size={18} className="text-ods-star-yellow" />
              ) : (
                <IconStar size={18} className="text-ods-star-yellow opacity-45" />
              )}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1.5 tracking-[-0.3px]">
        {title && (
          <h3 className="whitespace-pre-line font-pretendard text-[16px] font-semibold leading-5 text-ods-text-primary">
            {title}
          </h3>
        )}
        {meta && meta.length > 0 && (
          <div className="flex items-center gap-1 whitespace-nowrap font-pretendard text-[12px] font-medium leading-4">
            {metaHead.length > 0 && (
              <span className="overflow-hidden text-ellipsis text-ods-text-tertiary">
                {metaHead.join(" · ")}
              </span>
            )}
            {metaTail && (
              <>
                <span className="text-[#c1c1c1]">|</span>
                <span className="text-ods-text-tertiary">{metaTail}</span>
              </>
            )}
          </div>
        )}
      </div>
      {body && (
        <p className="mt-1 font-pretendard text-[14px] leading-5 tracking-[-0.3px] text-ods-text-primary line-clamp-3">
          {renderRichText(body)}
        </p>
      )}
    </div>
  );
}

/**
 * 프로세스 스텝 — Figma `card_process/md` (node 34:2983) 스펙 적용.
 * - 컨테이너 260px 높이 그라데이션 배경, `px-5 pb-5` rounded-12. `justify-between` 으로 그래픽·텍스트를 카드 안에서 위·아래 배치.
 * - imgGraphic 영역 : `max-w-[240px]` 래퍼에 `pt-2`(8px), 내부 `240×160` 박스. media 가 있으면 이미지, 없으면 placeholder chip 표시.
 * - title  : Heading20 SemiBold 20/28 -0.3 #141414 opacity-80, 1줄 ellipsis.
 *            stepNumber 가 별도로 있으면 "{n}. {title}" 으로 prefix.
 * - body   : Body15 Regular 15/24 -0.3 #141414 opacity-80, 2줄 ellipsis (whitespace-pre-line).
 */
function CardLeadingAssetCell({
  cell,
  onRequestSlotEdit,
}: {
  cell: CardCell;
  onRequestSlotEdit?: () => void;
}) {
  const stepNumber = asText(slot(cell, "stepNumber"));
  const title = asText(slot(cell, "title"));
  const body = asText(slot(cell, "body"));
  const media = asAsset(slot(cell, "media"));
  const displayTitle = stepNumber && title ? `${stepNumber}. ${title}` : title;
  // 디자인 시안 (Figma 1:49) 의 기본 그래픽 에셋 — 이미지 슬롯이 비어 있을 때도 항상 에셋 렌더
  const fallbackAsset: import("@/schema/doc").AssetRef = {
    type: "image",
    alt: "그래픽",
    assetId: "AssetMotionFaceSmilingCapHeadsetLargeAnimatedImage",
  };
  return (
    <div
      // 디자인 시안: 좌측 정렬(items-start), 하단 패딩 20px(pb-5)
      className="flex h-[260px] w-full flex-col items-start justify-between gap-4 rounded-ods-12 px-5 pb-5"
      style={{
        backgroundImage:
          "linear-gradient(173.759deg, rgba(239,239,239,0.2) 1.5877%, rgba(139,195,235,0.2) 92.346%), linear-gradient(90deg, rgb(245,245,245) 0%, rgb(245,245,245) 100%)",
      }}
    >
      <div className="flex w-full max-w-[240px] shrink-0 flex-col items-start pt-2">
        <div className="relative h-[160px] w-full overflow-hidden">
          <OdsAssetRenderer
            asset={media ?? fallbackAsset}
            className="absolute inset-0 flex h-full w-full items-center justify-center object-contain"
            onRequestSlotEdit={onRequestSlotEdit}
          />
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-1 text-left tracking-[-0.3px] text-ods-text-primary">
        {displayTitle && (
          <h3 className="overflow-hidden text-ellipsis whitespace-nowrap font-pretendard text-[20px] font-semibold leading-7 opacity-80">
            {displayTitle}
          </h3>
        )}
        {body && (
          <p className="whitespace-pre-line font-pretendard text-[15px] leading-6 opacity-80 line-clamp-2">
            {body}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 서비스 리스트 셀 — Figma `이사-프로덕트` CrossSelling `CardService` (node 640:9365 근방).
 * - 96px 높이 가로 카드, `rounded-ods-8`, 좌 96×96 이미지 + 우측 타이틀/설명
 * - 타이틀 18px Semibold / 본문 15px Regular 70% opacity (피그마 Body15)
 * - 카드 전체 링크; 별도 "보러가기" 텍스트는 시안에 없음 (`aria-label`에 CTA 반영)
 * - 모바일 뷰포트: `RowLayout` 1열 + 카드 `w-full` (360px 캡 없음)
 * - 태블릿·데스크톱: `RowLayout` 2×2 `grid`, 셀 너비에 맞춤
 */
function ListCell({
  cell,
  onRequestSlotEdit,
}: {
  cell: CardCell;
  onRequestSlotEdit?: () => void;
}) {
  const iconAsset = asAsset(slot(cell, "icon"));
  const title = asText(slot(cell, "title"));
  const body = asText(slot(cell, "body"));
  const cta = asCta(slot(cell, "cta"));
  const label =
    [title, cta?.label].filter(Boolean).join(" — ") || "서비스 카드";

  return (
    <div className="flex h-[96px] w-full min-w-0 flex-row items-stretch overflow-hidden rounded-ods-8 bg-white text-left shadow-none transition-shadow hover:shadow-sm">
      <div className="relative h-full w-24 shrink-0 bg-ods-surface-light">
        {iconAsset || onRequestSlotEdit ? (
          <OdsAssetRenderer
            asset={iconAsset ?? { type: "image", alt: "아이콘 슬롯" }}
            className="absolute inset-0 size-full object-cover"
            onRequestSlotEdit={onRequestSlotEdit}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ods-text-tertiary">
            <IconPhoto size={28} />
          </div>
        )}
      </div>
      <a
        href={cta?.url ?? "#"}
        aria-label={label}
        className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-1 bg-white px-4 py-5 no-underline"
      >
        {title ? (
          <p className="truncate font-pretendard text-[18px] font-semibold leading-6 tracking-[-0.3px] text-ods-text-primary">
            {title}
          </p>
        ) : null}
        {body ? (
          <p className="line-clamp-2 font-pretendard text-[15px] font-normal leading-6 tracking-[-0.3px] text-ods-text-primary opacity-70">
            {body}
          </p>
        ) : null}
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table 카드 — Figma 2:166 (table) 스펙
//
// 구조:
//   ┌────────────────────────┐  ← 타이틀 바 (Heading17 SemiBold, h-40)
//   │       타이틀           │
//   ├────────────────────────┤
//   │     row 텍스트 1       │  ← row (Body16 Medium 또는 Semibold, h-64)
//   │  ─── divider 1px ───   │
//   │     row 텍스트 2       │
//   │       ...              │
//   └────────────────────────┘
//
// cell.slots.title         → 타이틀 바 텍스트
// cell.slots.meta.items    → 각 row 텍스트
// cell.theme               → grey / blue / green (색상 + 보더 + 섀도우)
// ---------------------------------------------------------------------------

const TABLE_THEMES: Record<CardCellTheme, {
  titleBar: string;
  titleColor: string;
  rowBg: string;
  rowColor: string;
  rowFont: "medium" | "semibold";
  divider: string;
  border: string;
  shadow: string;
  rowPaddingX: number;
}> = {
  grey: {
    titleBar: "#E0E0E0",
    titleColor: "#141414",
    rowBg: "#F5F5F5",
    rowColor: "#141414",
    rowFont: "medium",
    divider: "#E0E0E0",
    border: "none",
    shadow: "none",
    rowPaddingX: 12,
  },
  blue: {
    titleBar: "#00A1FF",
    titleColor: "#FFFFFF",
    rowBg: "#F0F8FC",
    rowColor: "#141414",
    rowFont: "medium",
    divider: "#EDEDED",
    border: "1px solid #00A1FF",
    shadow: "none",
    rowPaddingX: 16,
  },
  green: {
    titleBar: "#0AB261",
    titleColor: "#FFFFFF",
    rowBg: "#F2FFF8",
    rowColor: "#05924E",
    rowFont: "semibold",
    divider: "#EDEDED",
    border: "2px solid #0AB261",
    shadow: "0 0 30px 0 rgba(10, 178, 97, 0.3)",
    rowPaddingX: 20,
  },
};

function CardTableCell({ cell }: { cell: CardCell }) {
  const theme = TABLE_THEMES[cell.theme ?? "grey"];
  const title = asText(slot(cell, "title")) ?? "";
  const meta = asMeta(slot(cell, "meta")) ?? [];

  return (
    <div
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-ods-8"
      style={{
        border: theme.border,
        boxShadow: theme.shadow,
      }}
    >
      {/* 타이틀 바 */}
      <div
        className="flex h-10 w-full flex-col items-center justify-center"
        style={{ background: theme.titleBar }}
      >
        <p
          className="w-full text-center font-pretendard text-[17px] font-semibold leading-[22px] tracking-[-0.3px]"
          style={{ color: theme.titleColor }}
        >
          {title}
        </p>
      </div>

      {/* row 컨테이너 */}
      <div
        className="flex w-full flex-col items-stretch"
        style={{
          background: theme.rowBg,
          padding: `0 ${theme.rowPaddingX}px 8px`,
        }}
      >
        {meta.map((rowText, i) => (
          <div key={i}>
            <div className="flex h-16 w-full flex-col items-center justify-center">
              <p
                className={cn(
                  "w-full whitespace-pre-line text-center font-pretendard text-[16px] leading-5 tracking-[-0.3px]",
                  theme.rowFont === "semibold" ? "font-semibold" : "font-medium"
                )}
                style={{ color: theme.rowColor }}
              >
                {rowText}
              </p>
            </div>
            {i < meta.length - 1 && (
              <div
                aria-hidden
                className="h-px w-full"
                style={{ background: theme.divider }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ 카드 — accordion (collapsible Q&A)
//
// cell.slots.title → 질문 (Body16 SemiBold)
// cell.slots.body  → 답변 (Body14 Regular, 펼쳤을 때만)
// ODS 토큰: bg-white, border-ods-border-light, text-ods-text-primary / -secondary, rounded-ods-8.
// ---------------------------------------------------------------------------

function CardFaqCell({ cell }: { cell: CardCell }) {
  const [open, setOpen] = useState(false);
  const question = asText(slot(cell, "title")) ?? "";
  const answer = asText(slot(cell, "body")) ?? "";

  return (
    <div className="w-full overflow-hidden rounded-ods-8 border border-ods-border-light bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-ods-surface-gray"
      >
        <span className="font-pretendard text-[16px] font-semibold leading-5 tracking-[-0.3px] text-ods-text-primary">
          {question}
        </span>
        <IconChevronDown
          size={18}
          className={cn(
            "shrink-0 text-ods-text-tertiary transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t border-ods-border-light px-5 py-4">
          <p className="whitespace-pre-line font-pretendard text-[14px] leading-5 tracking-[-0.3px] text-ods-text-secondary">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

