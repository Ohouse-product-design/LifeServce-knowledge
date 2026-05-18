"use client";

import { useMemo } from "react";

import { cn } from "@/lib/cn";
import { VIEWPORT_WIDTH, type Viewport } from "@/schema/doc";
import { useBuilderStore } from "@/store/builder-store";
import PreviewIframe from "./PreviewIframe";
import PreviewRenderer from "../preview/PreviewRenderer";

const usePreviewIframe =
  process.env.NEXT_PUBLIC_PREVIEW_IFRAME !== "false";

/**
 * 가운데 프리뷰 패널.
 * - 기본: `/preview/[slug]?embed=1` iframe + postMessage (Storybook 과 동일 PreviewRenderer)
 * - `NEXT_PUBLIC_PREVIEW_IFRAME=false` 이면 인라인 PreviewRenderer
 */
export default function PreviewStage() {
  const viewport = useBuilderStore((s) => s.viewport);
  const setViewport = useBuilderStore((s) => s.setViewport);
  const doc = useBuilderStore((s) => s.doc);
  const selection = useBuilderStore((s) => s.selection);
  const selectSection = useBuilderStore((s) => s.selectSection);
  const openReviewModal = useBuilderStore((s) => s.openReviewModal);
  const openAssetModal = useBuilderStore((s) => s.openAssetModal);

  const width = useMemo(() => VIEWPORT_WIDTH[viewport], [viewport]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="builder-scroll flex-1 overflow-y-auto bg-[#0a0c12] p-6">
        <div className="mb-3 flex flex-col items-center gap-3 text-[11px] text-builder-muted sm:flex-row sm:justify-center sm:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {(["mobile", "tablet", "desktop"] as Viewport[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setViewport(v)}
                className={cn(
                  "rounded-ods-4 px-2.5 py-1 text-[11px]",
                  viewport === v
                    ? "bg-builder-accent text-white"
                    : "text-builder-muted hover:bg-builder-panel-2 hover:text-builder-text"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span>
              {viewport === "mobile" && "iPhone 13 기준 · 375 × 812"}
              {viewport === "tablet" && "iPad Mini 기준 · 768 × 1024"}
              {viewport === "desktop" && "Desktop · 1280 × auto"}
            </span>
            {usePreviewIframe ? (
              <a
                href={`/preview/${doc.meta.slug}?embed=1&viewport=${viewport}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-builder-accent hover:underline"
              >
                프리뷰 탭
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => openReviewModal()}
              className="rounded-ods-8 bg-builder-success px-2.5 py-1 text-[11px] font-medium text-black hover:bg-builder-success/90"
            >
              검수 요청
            </button>
          </div>
        </div>
        <div
          className="mx-auto rounded-ods-12 border border-builder-border bg-white text-black shadow-2xl transition-all"
          style={{ width: `${width}px`, maxWidth: "100%" }}
        >
          {usePreviewIframe ? (
            <PreviewIframe
              doc={doc}
              viewport={viewport}
              selectedSectionId={selection.sectionId ?? undefined}
              onSelectSection={selectSection}
              width={width}
            />
          ) : (
            <PreviewRenderer
              doc={doc}
              viewport={viewport}
              selectedSectionId={selection.sectionId ?? undefined}
              onSelectSection={selectSection}
              onRequestAssetSlot={openAssetModal}
            />
          )}
        </div>
      </div>
    </div>
  );
}
