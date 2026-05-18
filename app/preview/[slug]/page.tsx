import PreviewPageClient from "./PreviewPageClient";

/**
 * 프리뷰 페이지.
 * - `?embed=1` — 빌더 PreviewStage iframe (doc 는 postMessage 로 수신)
 * - 그 외 — `/preview/moving` 단독 열람
 */
export default function PreviewPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { viewport?: ViewportParam; selected?: string; embed?: string };
}) {
  const viewport = searchParams.viewport ?? "desktop";
  const embed = searchParams.embed === "1" || searchParams.embed === "true";

  return (
    <PreviewPageClient
      slug={params.slug}
      viewport={viewport}
      embed={embed}
      selected={searchParams.selected}
    />
  );
}

type ViewportParam = "mobile" | "tablet" | "desktop";
