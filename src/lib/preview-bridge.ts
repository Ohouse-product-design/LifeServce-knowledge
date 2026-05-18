import type { LandingPageDoc, Viewport } from "@/schema/doc";

/** 빌더 ↔ `/preview/[slug]` iframe postMessage 프로토콜 */
export const LPB_PREVIEW_CHANNEL = "lpb-preview-v1" as const;

export type LpbPreviewSyncMessage = {
  channel: typeof LPB_PREVIEW_CHANNEL;
  type: "LPB_PREVIEW_SYNC";
  doc: LandingPageDoc;
  viewport: Viewport;
  selectedSectionId: string | null;
};

export type LpbPreviewSelectMessage = {
  channel: typeof LPB_PREVIEW_CHANNEL;
  type: "LPB_PREVIEW_SELECT";
  sectionId: string;
};

export type LpbPreviewReadyMessage = {
  channel: typeof LPB_PREVIEW_CHANNEL;
  type: "LPB_PREVIEW_READY";
};

export type LpbPreviewOutboundMessage = LpbPreviewSyncMessage;
export type LpbPreviewInboundMessage = LpbPreviewSelectMessage | LpbPreviewReadyMessage;

export function isLpbPreviewMessage(data: unknown): data is { channel: string; type: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "channel" in data &&
    (data as { channel: string }).channel === LPB_PREVIEW_CHANNEL &&
    "type" in data &&
    typeof (data as { type: string }).type === "string"
  );
}

export function postPreviewSync(
  target: Window,
  payload: Omit<LpbPreviewSyncMessage, "channel" | "type">
) {
  const message: LpbPreviewSyncMessage = {
    channel: LPB_PREVIEW_CHANNEL,
    type: "LPB_PREVIEW_SYNC",
    ...payload,
  };
  target.postMessage(message, window.location.origin);
}
