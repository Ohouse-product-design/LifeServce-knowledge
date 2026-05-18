import type { AssetRef } from "@/schema/doc";
import { odsStaticAssetBase } from "@/lib/local-ods-config";
import pathsCatalog from "@/catalog/ods-asset-paths.json";
import {
  getOdsAssetPathEntry,
  odsAssetStaticRelativePath,
  type OdsAssetPathEntry,
} from "@/lib/ods-asset-paths";

const LOTTIE_FALLBACK_POOL: OdsAssetPathEntry[] = Object.values(
  pathsCatalog as Record<string, OdsAssetPathEntry>
).filter((e) => e.kind === "lottie");

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

/** URL 이 Lottie JSON / dotlottie 로 보이면 true (이미지 src 로 쓰지 않음) */
export function isLikelyLottieUrl(url: string): boolean {
  return /\.(json|lottie)(\?|#|$)/i.test(url) || /lottie\.host\//i.test(url);
}

function odsStaticPath(folder: string, file: string): string {
  return `${odsStaticAssetBase()}/${folder}/${file}`;
}

function odsStaticPathFromEntry(entry: OdsAssetPathEntry): string {
  return `${odsStaticAssetBase()}/${odsAssetStaticRelativePath(entry)}`;
}

/** 클론 manifest 에 없을 때 StillImage 접미사 제거 폴백 */
function stillImageFolderFallback(assetId: string): string | null {
  if (!assetId.endsWith("StillImage")) return null;
  return assetId.slice(0, -"StillImage".length);
}

/** 카탈로그에 등록된 Lottie 컴포넌트명 → 프리뷰용 fetch 가능한 .json URL */
export function resolveOdsCatalogLottiePreviewSrc(componentName: string): string {
  const id = componentName.trim();
  const mapped = getOdsAssetPathEntry(id);
  if (mapped?.kind === "lottie") return odsStaticPathFromEntry(mapped);

  if (LOTTIE_FALLBACK_POOL.length > 0) {
    const pick = LOTTIE_FALLBACK_POOL[hashString(id) % LOTTIE_FALLBACK_POOL.length]!;
    return odsStaticPathFromEntry(pick);
  }

  return odsStaticPath("AssetMotionPlusCircleSweep", "motion-plus-circle-sweep.json");
}

/**
 * ODS StillImage 컴포넌트명 → CDN 첫 후보(`image_480.webp` 등, design-assets manifest 기준).
 * design-assets 에 없는 이름이면 null (picsum 등으로 폴백).
 */
export function resolveOdsCatalogStillImagePreviewPrimary(assetId: string): string | null {
  const id = assetId.trim();
  const mapped = getOdsAssetPathEntry(id);
  if (mapped?.kind === "img") return odsStaticPathFromEntry(mapped);

  const folder = stillImageFolderFallback(id);
  if (folder) return odsStaticPath(folder, "image_480.webp");
  return null;
}

/** webp 실패 시 시도할 `image_480.png` */
export function resolveOdsCatalogStillImagePreviewFallbackPng(assetId: string): string | null {
  const id = assetId.trim();
  const mapped = getOdsAssetPathEntry(id);
  if (mapped?.kind === "img" && mapped.file.endsWith(".webp")) {
    return odsStaticPath(mapped.folder, mapped.file.replace(/\.webp$/i, ".png"));
  }
  const folder = stillImageFolderFallback(id);
  if (!folder) return null;
  return odsStaticPath(folder, "image_480.png");
}

/** `assetId` / alt 시드 기반 picsum (ODS CDN 실패 시) */
export function resolvePreviewPlaceholderRasterSrc(
  seedSource: string,
  width = 960,
  height = 540
): string {
  const seed = encodeURIComponent(seedSource.replace(/[/\\]+/g, "-").slice(0, 80));
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * 프리뷰용 래스터 이미지 src.
 * - `asset.url` 이 있고 Lottie 가 아니면 그대로 사용
 * - `*StillImage` 이면 design-assets CDN (`image_480.webp` 우선, onError 에서 png·picsum 은 shim 에서 처리)
 * - 그 외 `assetId`(또는 alt) 기반 picsum
 */
export function resolvePreviewRasterImageSrc(
  asset: AssetRef,
  width = 960,
  height = 540
): string {
  if (asset.url && !isLikelyLottieUrl(asset.url)) {
    return asset.url;
  }
  const id = asset.assetId?.trim();
  if (id) {
    const cdn = resolveOdsCatalogStillImagePreviewPrimary(id);
    if (cdn) return cdn;
  }
  const seedSource = id || asset.alt?.trim() || "landing-preview";
  return resolvePreviewPlaceholderRasterSrc(seedSource, width, height);
}

/** `asset.type === "lottie"` 인데 URL 이 없을 때 사용하는 Lottie JSON (design-assets CDN) */
export const PREVIEW_FALLBACK_LOTTIE_JSON_URL = (() => {
  const mapped = getOdsAssetPathEntry("AssetMotionPlusCircleSweepLottie");
  if (mapped?.kind === "lottie") return odsStaticPathFromEntry(mapped);
  return odsStaticPath("AssetMotionPlusCircleSweep", "motion-plus-circle-sweep.json");
})();
