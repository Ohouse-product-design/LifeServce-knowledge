"use client";

/**
 * `@bucketplace/assets/image` 대체 구현.
 * 사내 패키지가 설치되면 tsconfig paths 에서 이 파일 대신 패키지를 가리키면 된다.
 *
 * StillImage 프리뷰: design-assets CDN(`…/static/AssetBellLarge/image_480.webp` 등) 우선,
 * webp 실패 시 `image_480.png`, 그다음 picsum (`preview-asset-url`).
 */

import type { SyntheticEvent } from "react";

import type { AssetRef } from "@/schema/doc";
import {
  resolveOdsCatalogStillImagePreviewFallbackPng,
  resolvePreviewPlaceholderRasterSrc,
  resolvePreviewRasterImageSrc,
} from "@/lib/preview-asset-url";

function rasterSrcForComponentName(name: string): string {
  const asset: AssetRef = {
    type: "image",
    alt: name,
    assetId: name,
  };
  return resolvePreviewRasterImageSrc(asset);
}

function handleCatalogStillImageError(
  e: SyntheticEvent<HTMLImageElement>,
  assetId: string
): void {
  const el = e.currentTarget;
  if (el.dataset.odsFallback === "png") {
    el.onerror = null;
    el.src = resolvePreviewPlaceholderRasterSrc(assetId, 960, 540);
    return;
  }
  const png = resolveOdsCatalogStillImagePreviewFallbackPng(assetId);
  if (png) {
    el.dataset.odsFallback = "png";
    el.src = png;
    return;
  }
  el.onerror = null;
  el.src = resolvePreviewPlaceholderRasterSrc(assetId, 960, 540);
}

export function AssetGiftLargeStillImage({ className }: { className?: string }) {
  const id = "AssetGiftLargeStillImage";
  return (
    <img
      src={rasterSrcForComponentName(id)}
      alt=""
      className={className}
      draggable={false}
      onError={(e) => handleCatalogStillImageError(e, id)}
    />
  );
}

/** 카탈로그에 등록된 임의 StillImage 이름 — OdsAssetRenderer 가 image 슬롯에 사용 */
export function BucketplaceCatalogStillImage({
  assetId,
  className,
}: {
  assetId: string;
  className?: string;
}) {
  const id = assetId.trim();
  return (
    <img
      src={rasterSrcForComponentName(id)}
      alt=""
      className={className}
      draggable={false}
      onError={(e) => handleCatalogStillImageError(e, id)}
    />
  );
}
