/**
 * Notion 페이지 fetch API.
 *
 *   POST /api/notion-fetch
 *   body: { url: string }
 *   response: { ok: true, text: string, title?: string } | { ok: false, error: string }
 *
 * v1 구현: Notion REST API (`NOTION_TOKEN` 환경변수 필요).
 *
 * ── 향후 MCP swap ─────────────────────────────────────────
 * 사내 Notion 통합을 MCP 서버로 운영 중이면 `fetchPageBlocks` 와 `fetchPageMeta`
 * 함수만 MCP 클라이언트 호출로 교체하면 됨. 인터페이스 (page id → blocks/text) 가
 * 동일하므로 다운스트림 (ComposePrompt → composeFromPrompt) 변경 불필요.
 *
 *   import { McpClient } from "your-mcp-sdk";
 *   const mcp = new McpClient({ server: "notion" });
 *   async function fetchPageBlocks(pageId) {
 *     return mcp.call("notion-fetch", { id: pageId });   // ← MCP 도구명에 맞춰 변경
 *   }
 * ──────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server";
import { detectNotionUrl } from "@/lib/notion-url";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export async function POST(req: Request) {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "NOTION_TOKEN 이 설정되지 않았습니다. .env 에 노션 internal integration token 을 추가하거나 MCP swap 을 진행하세요.",
      },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => null)) as { url?: string } | null;
  const url = body?.url?.trim();
  if (!url) {
    return NextResponse.json({ ok: false, error: "url 이 비어 있습니다." }, { status: 400 });
  }
  const info = detectNotionUrl(url);
  if (!info) {
    return NextResponse.json(
      { ok: false, error: "Notion URL 이 아닙니다." },
      { status: 400 }
    );
  }

  try {
    const meta = await fetchPageMeta(info.pageId, token);
    const blocks = await fetchPageBlocks(info.pageId, token);
    const text = blocksToText(blocks);
    return NextResponse.json({
      ok: true,
      title: meta?.title ?? null,
      text: meta?.title ? `# ${meta.title}\n\n${text}` : text,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "fetch 실패" },
      { status: 502 }
    );
  }
}

// ───────────────────────────────────────────────────────────
// Notion API 호출 (MCP swap 시 이 두 함수만 교체)
// ───────────────────────────────────────────────────────────

async function fetchPageMeta(
  pageId: string,
  token: string
): Promise<{ title: string | null } | null> {
  const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as NotionPage;
  const titleProp = Object.values(json.properties ?? {}).find(
    (p): p is NotionTitleProperty => p.type === "title"
  );
  const title = titleProp?.title?.map((t) => t.plain_text).join("") ?? null;
  return { title };
}

async function fetchPageBlocks(
  pageId: string,
  token: string,
  startCursor?: string
): Promise<NotionBlock[]> {
  const params = new URLSearchParams({ page_size: "100" });
  if (startCursor) params.set("start_cursor", startCursor);
  const res = await fetch(
    `${NOTION_API}/blocks/${pageId}/children?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`Notion API ${res.status}`);
  const json = (await res.json()) as NotionBlocksResponse;
  let blocks = json.results;
  if (json.has_more && json.next_cursor) {
    const more = await fetchPageBlocks(pageId, token, json.next_cursor);
    blocks = [...blocks, ...more];
  }
  return blocks;
}

// ───────────────────────────────────────────────────────────
// 블록 트리 → 평문 변환
// ───────────────────────────────────────────────────────────

function blocksToText(blocks: NotionBlock[]): string {
  const lines: string[] = [];
  for (const b of blocks) {
    const line = blockToLine(b);
    if (line !== null) lines.push(line);
  }
  return lines.join("\n");
}

function blockToLine(block: NotionBlock): string | null {
  switch (block.type) {
    case "heading_1":
      return `# ${richTextToString(block.heading_1?.rich_text)}`;
    case "heading_2":
      return `## ${richTextToString(block.heading_2?.rich_text)}`;
    case "heading_3":
      return `### ${richTextToString(block.heading_3?.rich_text)}`;
    case "paragraph":
      return richTextToString(block.paragraph?.rich_text);
    case "bulleted_list_item":
      return `- ${richTextToString(block.bulleted_list_item?.rich_text)}`;
    case "numbered_list_item":
      return `1. ${richTextToString(block.numbered_list_item?.rich_text)}`;
    case "quote":
      return `> ${richTextToString(block.quote?.rich_text)}`;
    case "callout":
      return richTextToString(block.callout?.rich_text);
    case "to_do":
      return `- [ ] ${richTextToString(block.to_do?.rich_text)}`;
    case "toggle":
      return richTextToString(block.toggle?.rich_text);
    case "divider":
      return "---";
    default:
      return null;
  }
}

function richTextToString(rt?: NotionRichText[]): string {
  if (!rt || rt.length === 0) return "";
  return rt.map((t) => t.plain_text ?? "").join("");
}

// ───────────────────────────────────────────────────────────
// Notion API 타입 (사용 필드만)
// ───────────────────────────────────────────────────────────

interface NotionRichText {
  plain_text?: string;
}
interface NotionTitleProperty {
  type: "title";
  title?: NotionRichText[];
}
interface NotionPage {
  properties?: Record<string, NotionTitleProperty | { type: string }>;
}
interface NotionBlocksResponse {
  results: NotionBlock[];
  has_more: boolean;
  next_cursor: string | null;
}
interface NotionBlock {
  id: string;
  type: string;
  paragraph?: { rich_text?: NotionRichText[] };
  heading_1?: { rich_text?: NotionRichText[] };
  heading_2?: { rich_text?: NotionRichText[] };
  heading_3?: { rich_text?: NotionRichText[] };
  bulleted_list_item?: { rich_text?: NotionRichText[] };
  numbered_list_item?: { rich_text?: NotionRichText[] };
  quote?: { rich_text?: NotionRichText[] };
  callout?: { rich_text?: NotionRichText[] };
  to_do?: { rich_text?: NotionRichText[] };
  toggle?: { rich_text?: NotionRichText[] };
}
