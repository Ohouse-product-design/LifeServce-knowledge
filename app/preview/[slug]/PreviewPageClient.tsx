"use client";

import PreviewEmbed from "@/components/preview/PreviewEmbed";
import PreviewRenderer from "@/components/preview/PreviewRenderer";
import { seedDoc } from "@/lib/seed";
import type { Viewport } from "@/schema/doc";

/**
 * embed=1 → 빌더 iframe (postMessage 동기화)
 * 그 외 → 단독 프리뷰 탭 / Storybook 과 동일 렌더
 */
export default function PreviewPageClient({
  slug,
  viewport,
  embed,
  selected,
}: {
  slug: string;
  viewport: Viewport;
  embed: boolean;
  selected?: string;
}) {
  if (embed) {
    return <PreviewEmbed initialViewport={viewport} />;
  }

  const doc = slug === seedDoc.meta.slug ? seedDoc : seedDoc;

  return (
    <PreviewRenderer
      doc={doc}
      viewport={viewport}
      selectedSectionId={selected}
    />
  );
}
