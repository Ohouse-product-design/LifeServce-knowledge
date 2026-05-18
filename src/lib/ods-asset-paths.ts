/**
 * design-assets 클론에서 생성한 정적 경로 맵 (`npm run generate:ods-paths`).
 * 카탈로그 컴포넌트명 → CDN 상대 경로 `{folder}/{file}`.
 */

import pathsCatalog from "@/catalog/ods-asset-paths.json";

export type OdsAssetPathKind = "img" | "lottie";

export interface OdsAssetPathEntry {
  kind: OdsAssetPathKind;
  folder: string;
  file: string;
}

const PATHS = pathsCatalog as Record<string, OdsAssetPathEntry>;

export function getOdsAssetPathEntry(assetId: string | undefined): OdsAssetPathEntry | null {
  if (!assetId?.trim()) return null;
  return PATHS[assetId.trim()] ?? null;
}

/** CDN / 로컬 미러 공통 상대 경로 (`AssetBellLarge/image_480.webp`) */
export function odsAssetStaticRelativePath(entry: OdsAssetPathEntry): string {
  return `${entry.folder}/${entry.file}`;
}
