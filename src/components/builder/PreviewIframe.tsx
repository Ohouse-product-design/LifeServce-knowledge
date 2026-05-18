"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { isLocalOdsStaticEnabled } from "@/lib/local-ods-config";
import {
  isLpbPreviewMessage,
  postPreviewSync,
  type LpbPreviewSelectMessage,
} from "@/lib/preview-bridge";
import type { LandingPageDoc, Viewport } from "@/schema/doc";

interface Props {
  doc: LandingPageDoc;
  viewport: Viewport;
  selectedSectionId?: string;
  onSelectSection: (sectionId: string) => void;
  width: number;
}

/**
 * 빌더 가운데 패널 — `/preview/[slug]?embed=1` iframe.
 * Storybook(Preview/*) 과 동일한 렌더 트리를 격리된 문서에서 띄운다.
 */
export default function PreviewIframe({
  doc,
  viewport,
  selectedSectionId,
  onSelectSection,
  width,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);

  const src = useMemo(() => {
    const slug = encodeURIComponent(doc.meta.slug || "moving");
    const params = new URLSearchParams({ embed: "1", viewport });
    return `/preview/${slug}?${params.toString()}`;
  }, [doc.meta.slug, viewport]);

  const syncToIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !iframeReady) return;
    postPreviewSync(win, {
      doc,
      viewport,
      selectedSectionId: selectedSectionId ?? null,
    });
  }, [doc, viewport, selectedSectionId, iframeReady]);

  useEffect(() => {
    syncToIframe();
  }, [syncToIframe]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isLpbPreviewMessage(event.data)) return;
      if (event.data.type === "LPB_PREVIEW_READY") {
        setIframeReady(true);
        return;
      }
      if (event.data.type === "LPB_PREVIEW_SELECT") {
        onSelectSection((event.data as LpbPreviewSelectMessage).sectionId);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onSelectSection]);

  return (
    <div className="relative">
      <iframe
        ref={iframeRef}
        title="랜딩 페이지 프리뷰"
        src={src}
        className="block w-full rounded-ods-8 border-0 bg-white"
        style={{ width: `${width}px`, maxWidth: "100%", minHeight: 720 }}
        onLoad={() => {
          setIframeReady(true);
          syncToIframe();
        }}
      />
      <div
        className={cn(
          "pointer-events-none absolute bottom-2 right-2 rounded-ods-4 px-2 py-0.5 text-[10px]",
          isLocalOdsStaticEnabled()
            ? "bg-emerald-600/90 text-white"
            : "bg-builder-panel-2/90 text-builder-muted"
        )}
      >
        {isLocalOdsStaticEnabled() ? "ODS 로컬" : "ODS CDN"}
      </div>
    </div>
  );
}
