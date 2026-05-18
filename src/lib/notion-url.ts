/**
 * Notion URL ↔ page id 변환 헬퍼.
 *
 * 지원 URL 형태:
 *   - https://www.notion.so/<workspace>/<title>-<32hex>
 *   - https://www.notion.so/<32hex>?...
 *   - https://<workspace>.notion.site/<title>-<32hex>
 *
 * 페이지 id 는 마지막 32자리 hex. dashed UUID 형태로 정규화한다.
 */

const NOTION_HOST_RE = /(?:^|\.)notion\.so$|(?:^|\.)notion\.site$/;
/** 마지막 32 hex (대시 없이) — slug 다음에 위치 */
const PAGE_ID_RE = /([0-9a-f]{32})(?:[/?#]|$)/i;

export interface NotionUrlInfo {
  pageId: string;
  /** 원본 URL */
  url: string;
}

/**
 * 입력 텍스트의 첫 줄(또는 trim 후 전체)이 Notion URL 이면 page id 를 반환.
 * 일반 텍스트면 null.
 */
export function detectNotionUrl(input: string): NotionUrlInfo | null {
  const trimmed = input.trim();
  // 첫 줄만 URL 후보로 검사 (사용자가 URL + 추가 메모를 함께 붙일 수 있음)
  const firstLine = trimmed.split(/\s|\n/)[0];
  if (!/^https?:\/\//.test(firstLine)) return null;
  try {
    const u = new URL(firstLine);
    if (!NOTION_HOST_RE.test(u.host)) return null;
    const match = (u.pathname + u.search).match(PAGE_ID_RE);
    if (!match) return null;
    return { pageId: normalizePageId(match[1]), url: firstLine };
  } catch {
    return null;
  }
}

/** "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" → "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" */
export function normalizePageId(id: string): string {
  const clean = id.replace(/-/g, "");
  if (clean.length !== 32) return id;
  return [
    clean.slice(0, 8),
    clean.slice(8, 12),
    clean.slice(12, 16),
    clean.slice(16, 20),
    clean.slice(20, 32),
  ].join("-");
}
