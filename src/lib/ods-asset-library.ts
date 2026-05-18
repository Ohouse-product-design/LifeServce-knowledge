/**
 * ODS Asset/Icon 라이브러리 — `@bucketplace/assets/image`, `@bucketplace/icons` 패키지의
 * 컴포넌트 이름을 카탈로그 형태로 노출.
 *
 * 사내 소스 정렬(읽기 전용 체크리스트 — 레포는 비공개이므로 클론 후 수동 동기화):
 * - 아이콘·래스터·Lottie 메타: https://github.com/bucketplace/design-assets
 * - 웹 앱 실사용 컴포넌트: https://github.com/bucketplace/apps-web
 * - Android / iOS 는 네이티브 — 이 웹 빌더 프리뷰와 직접 매핑하지 않음
 *   https://github.com/bucketplace/ohs-android · https://github.com/bucketplace/ohs-iOS
 *
 * 카탈로그 미러(로컬):
 *   - assets: `src/catalog/ods-assets.json` — product-design `catalog/assets.json` 과 동일 규칙
 *   - icons : `src/catalog/ods-icons.json` — product-design `catalog/icons.json` 과 동일 규칙
 *
 * 로컬 미러: `src/catalog/ods-assets.json`, `src/catalog/ods-icons.json`.
 * AssetEmbedModal 에서 이 라이브러리를 검색·선택하면 AssetRef 의 `assetId` 에
 * ODS 컴포넌트 이름(e.g. "AssetBellLargeStillImage") 이 저장되고,
 * 프리뷰는 `OdsAssetRenderer` + `preview-asset-url` + `ods-asset-paths.json`(clone 생성)이
 * design-assets manifest(prod) CDN 경로로 렌더한다.
 */

import assetsCatalog from "@/catalog/ods-assets.json";
import iconsCatalog from "@/catalog/ods-icons.json";
import type { AssetType } from "@/schema/doc";

export interface OdsLibraryEntry {
  /** ODS 컴포넌트 이름 (e.g. "AssetBellLargeStillImage", "IconChevronRight") */
  name: string;
  /** 실제 사용 시 사용되는 import 문 */
  importStatement: string;
  /** 빌더의 AssetType 으로 매핑 */
  type: AssetType;
  /** 검색용 태그 (icons 에만 있음) */
  tags?: string[];
  /** 카테고리 — UI 그룹핑용 */
  category: "asset" | "icon";
}

interface RawAssetEntry {
  name: string;
  import: string;
  type: "image" | "lottie";
}

interface RawIconEntry {
  name: string;
  import: string;
  size: string;
  tags: string[];
}

function odsTypeToAssetType(odsType: "image" | "lottie" | "svg"): AssetType {
  if (odsType === "image") return "image";
  if (odsType === "lottie") return "lottie";
  return "svg";
}

const assetEntries: OdsLibraryEntry[] = (assetsCatalog as RawAssetEntry[]).map((a) => ({
  name: a.name,
  importStatement: a.import,
  type: odsTypeToAssetType(a.type),
  category: "asset" as const,
}));

const iconEntries: OdsLibraryEntry[] = (iconsCatalog as RawIconEntry[]).map((i) => ({
  name: i.name,
  importStatement: i.import,
  type: "svg" as const,
  tags: i.tags,
  category: "icon" as const,
}));

export const ODS_ASSET_LIBRARY: OdsLibraryEntry[] = [...assetEntries, ...iconEntries];

/** ODS 이미지/Lottie 컴포넌트명과 `AssetRef.assetId` 가 정확히 일치하는 항목 (프리뷰·임베드용) */
export function getOdsLibraryAssetByAssetId(
  assetId: string | undefined
): OdsLibraryEntry | null {
  if (!assetId?.trim()) return null;
  const id = assetId.trim();
  const hit = ODS_ASSET_LIBRARY.find(
    (e) => e.category === "asset" && e.name === id
  );
  return hit ?? null;
}

/** ODS 아이콘 컴포넌트명(`IconCheck` 등)과 일치하는 항목 */
export function getOdsLibraryIconByAssetId(
  assetId: string | undefined
): OdsLibraryEntry | null {
  if (!assetId?.trim()) return null;
  const id = assetId.trim();
  const hit = ODS_ASSET_LIBRARY.find(
    (e) => e.category === "icon" && e.name === id
  );
  return hit ?? null;
}

/** 라이브러리에서 검색 — name + tags 매칭. q 비어있으면 전체. */
export function searchOdsLibrary(
  q: string,
  filter?: { category?: OdsLibraryEntry["category"]; type?: AssetType }
): OdsLibraryEntry[] {
  const needle = q.trim().toLowerCase();
  return ODS_ASSET_LIBRARY.filter((e) => {
    if (filter?.category && e.category !== filter.category) return false;
    if (filter?.type && e.type !== filter.type) return false;
    if (!needle) return true;
    return (
      e.name.toLowerCase().includes(needle) ||
      e.tags?.some((t) => t.toLowerCase().includes(needle))
    );
  });
}
