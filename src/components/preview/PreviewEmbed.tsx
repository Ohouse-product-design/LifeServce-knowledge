"use client";

import { useEffect, useState } from "react";

import PreviewRenderer from "@/components/preview/PreviewRenderer";
import { seedDoc } from "@/lib/seed";
import {
  isLpbPreviewMessage,
  LPB_PREVIEW_CHANNEL,
  type LpbPreviewSyncMessage,
} from "@/lib/preview-bridge";
import type { LandingPageDoc, Viewport } from "@/schema/doc";

/**
 * `/preview/[slug]?embed=1` — 빌더 iframe 안에서 동작.
 * 부모(PreviewStage)가 postMessage 로 doc·viewport·selection 을 동기화한다.
 * Storybook 과 동일한 PreviewRenderer / Section / Card 스펙을 그대로 쓴다.
 */
export default function PreviewEmbed({
  initialViewport,
}: {
  initialViewport: Viewport;
}) {
  const [doc, setDoc] = useState<LandingPageDoc>(seedDoc);
  const [viewport, setViewport] = useState<Viewport>(initialViewport);
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isLpbPreviewMessage(event.data)) return;

      if (event.data.type === "LPB_PREVIEW_SYNC") {
        const msg = event.data as LpbPreviewSyncMessage;
        setDoc(msg.doc);
        setViewport(msg.viewport);
        setSelectedSectionId(msg.selectedSectionId ?? undefined);
      }
    };

    window.addEventListener("message", onMessage);
    window.parent.postMessage(
      { channel: LPB_PREVIEW_CHANNEL, type: "LPB_PREVIEW_READY" },
      window.location.origin
    );
    setReady(true);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="min-h-screen bg-white font-pretendard text-ods-text-primary">
      {!ready ? (
        <p className="p-4 text-ods-body-sm text-ods-text-tertiary">프리뷰 연결 중…</p>
      ) : null}
      <PreviewRenderer
        doc={doc}
        viewport={viewport}
        selectedSectionId={selectedSectionId}
        onSelectSection={(id) => {
          setSelectedSectionId(id);
          window.parent.postMessage(
            { channel: LPB_PREVIEW_CHANNEL, type: "LPB_PREVIEW_SELECT", sectionId: id },
            window.location.origin
          );
        }}
      />
    </div>
  );
}
