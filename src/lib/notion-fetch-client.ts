/**
 * 클라이언트에서 Notion URL → 평문 text 를 가져오는 헬퍼.
 *
 * 사용 예:
 *   const resolved = await resolveNotionInput(rawText);
 *   // resolved.text 가 composeFromPrompt 에 들어갈 최종 프롬프트
 */

import { detectNotionUrl } from "./notion-url";

export interface ResolvedPromptInput {
  /** 최종 프롬프트 텍스트 (Notion URL 이면 fetch 결과, 아니면 원본) */
  text: string;
  /** Notion 으로부터 가져온 경우 true */
  fromNotion: boolean;
  /** 노션 페이지 제목 (있을 때) */
  title?: string;
  /** Notion 처리 중 에러 — 비어 있으면 정상 */
  error?: string;
}

export async function resolveNotionInput(raw: string): Promise<ResolvedPromptInput> {
  const info = detectNotionUrl(raw);
  if (!info) return { text: raw, fromNotion: false };

  try {
    const res = await fetch("/api/notion-fetch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: info.url }),
    });
    const json = (await res.json()) as
      | { ok: true; text: string; title?: string }
      | { ok: false; error: string };

    if (!json.ok) {
      return { text: raw, fromNotion: true, error: json.error };
    }
    // 사용자가 URL + 추가 메모를 함께 붙인 경우, fetch 결과 뒤에 추가 메모를 이어붙임
    const extraNote = raw.trim().slice(info.url.length).trim();
    const merged = extraNote
      ? `${json.text}\n\n--- 추가 메모 ---\n${extraNote}`
      : json.text;
    return { text: merged, fromNotion: true, title: json.title };
  } catch (e) {
    return {
      text: raw,
      fromNotion: true,
      error: e instanceof Error ? e.message : "Notion fetch 실패",
    };
  }
}
