/**
 * 사내 design-assets 로컬 미러 설정.
 *
 * `npm run setup:local-ods` 후:
 * - `public/ods-static/{AssetName}/…` 에 design-assets manifest(prod) 와 동일 경로로 복사
 * - `NEXT_PUBLIC_USE_LOCAL_ODS=true` 이면 프리뷰가 `/ods-static/...` 를 우선 사용
 */

export const LOCAL_ODS_STATIC_PREFIX = "/ods-static";

/** 프로덕션 CDN 과 동일한 베이스 (preview-asset-url 과 정합) */
export const ODS_REMOTE_STATIC_CDN = "https://asset.ohousecdn.com/static";

export function isLocalOdsStaticEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_LOCAL_ODS === "true";
}

/** StillImage / Lottie JSON 등 정적 에셋 베이스 URL */
export function odsStaticAssetBase(): string {
  return isLocalOdsStaticEnabled() ? LOCAL_ODS_STATIC_PREFIX : ODS_REMOTE_STATIC_CDN;
}
