/**
 * Stock photo 검색 — 무료 실사 이미지 카탈로그.
 *
 * 우선순위:
 *   1. NEXT_PUBLIC_PEXELS_API_KEY 가 설정되어 있으면 Pexels API 사용 (실 검색)
 *   2. 미설정 시 Picsum (Lorem Picsum) 로 폴백 — 검색어를 무시한 랜덤 풀
 *
 * 응답은 단일 표준 형태(StockPhoto[]) 로 정규화한다.
 * 빌더가 사용할 때는 `AssetRef.url` 에 photo.urls.large 를 그대로 저장.
 */

export interface StockPhoto {
  id: string;
  /** 갤러리 썸네일 (200~400px) */
  thumbUrl: string;
  /** 페이지 임베드용 풀 사이즈 (~1600px) */
  largeUrl: string;
  /** 원본 (다운로드/raw) — Pexels src.original / Picsum 1200x800 */
  rawUrl: string;
  /** alt 텍스트 */
  alt: string;
  /** 작가/저작자 표기 (필요 시) */
  credit?: string;
  /** 출처 페이지 URL */
  sourceUrl?: string;
  /** 출처 라벨 ("Pexels" / "Picsum") */
  provider: "pexels" | "picsum";
}

const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";
const PICSUM_LIST_ENDPOINT = "https://picsum.photos/v2/list";

export async function searchStockPhotos(
  query: string,
  options?: { perPage?: number }
): Promise<StockPhoto[]> {
  const perPage = options?.perPage ?? 30;
  const key = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
  if (key && query.trim()) {
    try {
      return await searchPexels(query.trim(), perPage, key);
    } catch {
      // fall through to picsum
    }
  }
  return await listPicsum(perPage);
}

async function searchPexels(
  query: string,
  perPage: number,
  apiKey: string
): Promise<StockPhoto[]> {
  const url = new URL(PEXELS_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "landscape");
  const res = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
  });
  if (!res.ok) throw new Error(`pexels ${res.status}`);
  const json: PexelsResponse = await res.json();
  return json.photos.map((p) => ({
    id: `pexels-${p.id}`,
    thumbUrl: p.src.medium,
    largeUrl: p.src.large2x,
    rawUrl: p.src.original,
    alt: p.alt || "Pexels stock photo",
    credit: p.photographer,
    sourceUrl: p.url,
    provider: "pexels",
  }));
}

async function listPicsum(perPage: number): Promise<StockPhoto[]> {
  const page = 1 + Math.floor(Math.random() * 10); // 풀에서 임의 페이지
  const url = `${PICSUM_LIST_ENDPOINT}?page=${page}&limit=${perPage}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`picsum ${res.status}`);
  const json: PicsumItem[] = await res.json();
  return json.map((it) => ({
    id: `picsum-${it.id}`,
    thumbUrl: `https://picsum.photos/id/${it.id}/300/200`,
    largeUrl: `https://picsum.photos/id/${it.id}/1600/900`,
    rawUrl: it.download_url,
    alt: `Photo by ${it.author}`,
    credit: it.author,
    sourceUrl: it.url,
    provider: "picsum",
  }));
}

// ----- Pexels API 타입 (필요 필드만) -----
interface PexelsResponse {
  photos: Array<{
    id: number;
    photographer: string;
    url: string;
    alt: string;
    src: {
      original: string;
      large2x: string;
      large: string;
      medium: string;
    };
  }>;
}

interface PicsumItem {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}
