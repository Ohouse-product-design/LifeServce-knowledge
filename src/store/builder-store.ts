"use client";

/**
 * 빌더 전역 상태 (v2 — Card 통합 후).
 *
 * 추가/변경:
 * - selection.cellId 추가 (Card 인스턴스 내 선택된 cell)
 * - updateCardLayout / updateCardLayoutSettings — layout 토글 + 세부 옵션
 * - addCardCell / removeCardCell — Card 의 cells 배열 조작
 * - updateCardCellSlot — cell 의 slot 내용 변경
 */

import { create } from "zustand";

import { seedDoc } from "@/lib/seed";
import {
  CARD_USAGE_PRESETS,
  FAQCARD_CELL_LIMITS,
  buildAutoCellsForSection,
  defaultLayoutSettings,
  type CardCell,
  type CardLayout,
  type CardLayoutSettings,
  type CardProps,
  type CardSlotContent,
  type CardSlotName,
  type CardUsagePresetId,
} from "@/schema/card";
import type {
  AssetRef,
  ComponentInstance,
  LandingPageDoc,
  Section,
  TokenBinding,
  Viewport,
} from "@/schema/doc";
import type { AssetSlotModalOpenContext } from "@/schema/asset-modal-context";
import {
  SECTION_PRESETS,
  type SectionPresetId,
} from "@/schema/section-presets";

export type { AssetSlotModalOpenContext } from "@/schema/asset-modal-context";

export type InspectorTab = "props" | "slots" | "assets";

export interface Selection {
  sectionId: string | null;
  /** 컴포넌트 인스턴스 ID */
  componentId: string | null;
  /** Card 인스턴스 안의 선택된 cell ID (Card 가 선택된 경우에만) */
  cellId: string | null;
}

export interface BuilderState {
  doc: LandingPageDoc;
  selection: Selection;
  viewport: Viewport;
  inspectorTab: InspectorTab;
  reviewModalOpen: boolean;
  assetModal: AssetSlotModalOpenContext | null;

  // -------- Selection --------
  selectSection: (sectionId: string | null) => void;
  selectComponent: (sectionId: string, componentId: string) => void;
  /** Card 셀 선택 — Slots 탭 유지, cellId 보존 */
  selectCardCell: (sectionId: string, componentId: string, cellId: string) => void;
  setSelectedCell: (cellId: string | null) => void;
  setInspectorTab: (tab: InspectorTab) => void;

  // -------- Viewport --------
  setViewport: (v: Viewport) => void;

  // -------- Section ops --------
  reorderSections: (fromId: string, toId: string) => void;
  addSection: (preset: SectionPresetId, variant?: string) => void;
  composeFromPrompt: (prompt: string) => Promise<void>;
  removeSection: (sectionId: string) => void;
  updateSectionProp: (sectionId: string, key: string, value: unknown) => void;
  bindSectionToken: (sectionId: string, binding: TokenBinding) => void;
  unbindSectionToken: (sectionId: string, propPath: string) => void;
  toggleSectionVisibility: (sectionId: string, viewport: Viewport) => void;

  // -------- Component ops (generic) --------
  updateComponentProp: (
    sectionId: string,
    componentId: string,
    key: string,
    value: unknown
  ) => void;
  reorderComponents: (
    sectionId: string,
    slotName: string,
    fromId: string,
    toId: string
  ) => void;
  removeComponent: (sectionId: string, componentId: string) => void;

  // -------- Card ops --------
  updateCardLayout: (
    sectionId: string,
    componentId: string,
    layout: CardLayout
  ) => void;
  updateCardLayoutSettings: (
    sectionId: string,
    componentId: string,
    layoutSettings: CardLayoutSettings
  ) => void;
  updateCardUsage: (
    sectionId: string,
    componentId: string,
    usage: CardUsagePresetId
  ) => void;
  addCardCell: (sectionId: string, componentId: string) => void;
  removeCardCell: (
    sectionId: string,
    componentId: string,
    cellId: string
  ) => void;
  updateCardCellSlot: (
    sectionId: string,
    componentId: string,
    cellId: string,
    slotName: CardSlotName,
    content: CardSlotContent
  ) => void;

  // -------- Asset ops --------
  openAssetModal: (ctx: AssetSlotModalOpenContext) => void;
  closeAssetModal: () => void;
  embedAsset: (
    sectionId: string,
    componentId: string | null,
    slotName: string,
    asset: AssetRef
  ) => void;

  // -------- Review --------
  openReviewModal: () => void;
  closeReviewModal: () => void;
}

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------

function isMovableIndex(sections: Section[], index: number): boolean {
  return index >= 0 && index < sections.length && !sections[index]!.locked;
}

function findSectionIndex(doc: LandingPageDoc, id: string): number {
  return doc.sections.findIndex((s) => s.id === id);
}

function nowIso() {
  return new Date().toISOString();
}

function bumpAudit(doc: LandingPageDoc): LandingPageDoc {
  return { ...doc, audit: { ...doc.audit, updatedAt: nowIso() } };
}

function asCardProps(instance: ComponentInstance | undefined): CardProps | null {
  if (!instance || instance.preset !== "card") return null;
  return instance.props as unknown as CardProps;
}

function setCardProps(
  instance: ComponentInstance,
  props: CardProps
): ComponentInstance {
  return { ...instance, props: props as unknown as Record<string, unknown> };
}

/** 모든 슬롯에서 Card 인스턴스를 찾아 매핑 함수로 교체 */
function mapCardInstance(
  section: Section,
  componentId: string,
  fn: (c: ComponentInstance, p: CardProps) => ComponentInstance
): Section {
  const slots: Record<string, ComponentInstance[]> = {};
  for (const [k, list] of Object.entries(section.slots)) {
    slots[k] = list.map((c) => {
      if (c.id !== componentId) return c;
      const p = asCardProps(c);
      if (!p) return c;
      return fn(c, p);
    });
  }
  return { ...section, slots };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBuilderStore = create<BuilderState>((set, get) => ({
  doc: seedDoc,
  selection: {
    sectionId: seedDoc.sections.find((s) => !s.locked)?.id ?? null,
    componentId: null,
    cellId: null,
  },
  viewport: "desktop",
  inspectorTab: "props",
  reviewModalOpen: false,
  assetModal: null,

  selectSection: (sectionId) =>
    set({
      selection: { sectionId, componentId: null, cellId: null },
      inspectorTab: "props",
    }),

  selectComponent: (sectionId, componentId) =>
    set({
      selection: { sectionId, componentId, cellId: null },
      inspectorTab: "props",
    }),

  selectCardCell: (sectionId, componentId, cellId) =>
    set({
      selection: { sectionId, componentId, cellId },
      inspectorTab: "slots",
    }),

  setSelectedCell: (cellId) =>
    set((s) => ({ selection: { ...s.selection, cellId } })),

  setInspectorTab: (tab) => set({ inspectorTab: tab }),

  setViewport: (v) => set({ viewport: v }),

  // ----- Section -----
  reorderSections: (fromId, toId) =>
    set((state) => {
      const fromIdx = findSectionIndex(state.doc, fromId);
      const toIdx = findSectionIndex(state.doc, toId);
      if (fromIdx < 0 || toIdx < 0) return state;
      if (!isMovableIndex(state.doc.sections, fromIdx)) return state;
      if (!isMovableIndex(state.doc.sections, toIdx)) return state;
      const next = state.doc.sections.slice();
      const [moved] = next.splice(fromIdx, 1);
      if (!moved) return state;
      next.splice(toIdx, 0, moved);
      return { doc: bumpAudit({ ...state.doc, sections: next }) };
    }),

  addSection: (preset, variant) =>
    set((state) => {
      const def = SECTION_PRESETS[preset];
      const variantNameSuffix =
        variant === "marketing-form"
          ? " · 상담 필드"
          : variant === "marketing-contact"
            ? " · 문의 박스"
            : "";
      const sectionId = `sec-${preset}-${Math.random().toString(36).slice(2, 8)}`;

      // 카드 슬롯이 있으면 자동으로 card instance + 디폴트 cells 생성
      const cardComponentId = `${sectionId}-card`;
      const auto = buildAutoCellsForSection(preset, cardComponentId);
      const initialSlots: Section["slots"] = auto
        ? {
            content: [
              {
                id: cardComponentId,
                preset: "card",
                props: ({
                  usage: auto.usage,
                  cardType: auto.cardType,
                  layout: defaultLayoutSettings(
                    CARD_USAGE_PRESETS[auto.usage].defaultLayout
                  ),
                  cells: auto.cells,
                } as unknown) as Record<string, unknown>,
                assets: [],
              },
            ],
          }
        : {};

      const newSection: Section = {
        id: sectionId,
        preset,
        name: `${def.label}${variantNameSuffix}`,
        locked: def.defaultLocked,
        props: variant ? { variant } : {},
        slots: initialSlots,
        assets: [],
        visibility: { mobile: true, tablet: true, desktop: true },
      };
      const stickyIdx = state.doc.sections.findIndex(
        (s) => s.preset === "sticky-cta"
      );
      const next = state.doc.sections.slice();
      if (def.defaultLocked) next.push(newSection);
      else if (stickyIdx >= 0) next.splice(stickyIdx, 0, newSection);
      else next.push(newSection);
      return {
        doc: bumpAudit({ ...state.doc, sections: next }),
        // 새 섹션을 자동 선택 → PreviewRenderer 가 해당 위치로 scroll
        selection: { sectionId: newSection.id, componentId: null, cellId: null },
      };
    }),

  /**
   * 프롬프트 → 섹션 자동 구성 (SPEC §4 v1).
   * 1) lib/prompt-compose.ts 의 매처 결과대로 addSection + props/cells override
   * 2) imgcard/listcard 의 media/icon 슬롯에 stock photo 비동기 자동 임베드 (Phase 37)
   */
  composeFromPrompt: async (prompt) => {
    const { composeFromPrompt, seedCellsToCardCells, pickImageQueryForCell } =
      await import("@/lib/prompt-compose");
    const plan = await composeFromPrompt(prompt);

    // 추가된 section + 매칭 entry 를 매핑 (Phase 2 이미지 fill 에서 사용)
    const addedSections: Array<{ entry: typeof plan.sections[number]; sectionId: string }> = [];

    // 순차 실행 — addSection 자체가 selection 갱신 + scroll 트리거
    for (const entry of plan.sections) {
      get().addSection(entry.preset, entry.variant);
      const sectionId = get().selection.sectionId;
      if (!sectionId) continue;
      addedSections.push({ entry, sectionId });

      // props 오버라이드 (sectionTitle 등)
      if (entry.props) {
        for (const [k, v] of Object.entries(entry.props)) {
          get().updateSectionProp(sectionId, k, v);
        }
      }
      // seedCells 가 있으면 자동 생성된 card 의 cells 를 교체
      if (entry.seedCells && entry.seedCells.length > 0) {
        set((state) => ({
          doc: bumpAudit({
            ...state.doc,
            sections: state.doc.sections.map((s) => {
              if (s.id !== sectionId) return s;
              const contentSlot = s.slots["content"];
              if (!contentSlot || contentSlot.length === 0) return s;
              const card = contentSlot[0];
              if (card.preset !== "card") return s;
              const cells = seedCellsToCardCells(entry.seedCells!, card.id);
              return mapCardInstance(s, card.id, (inst, p) =>
                setCardProps(inst, { ...p, cells })
              );
            }),
          }),
        }));
      }
    }
    set((state) => ({ doc: bumpAudit(state.doc) }));

    // ── Phase 2: 비동기 이미지 fill ─────────────────────────────
    // 사용자는 페이지 구조를 즉시 보고, 이미지는 백그라운드에서 채워짐.
    // 호출 throttle: 동시 4개, 페이지당 최대 12장 (rate limit 대응).
    void (async () => {
      const { searchStockPhotos } = await import("@/lib/stock-photos");
      const MAX_PER_COMPOSE = 12;
      let fetched = 0;

      type FillTask = {
        sectionId: string;
        cardId: string;
        cellId: string;
        slotName: "media" | "icon";
        query: string;
      };
      const tasks: FillTask[] = [];

      for (const { entry, sectionId } of addedSections) {
        const section = get().doc.sections.find((s) => s.id === sectionId);
        if (!section) continue;
        const card = section.slots["content"]?.[0];
        if (!card || card.preset !== "card") continue;
        const props = card.props as unknown as CardProps;
        // 이미지 슬롯이 있는 변형만
        const slotName: "media" | "icon" | null =
          props.usage === "imgcard"
            ? "media"
            : props.usage === "listcard"
              ? "icon"
              : null;
        if (!slotName) continue;
        const sectionTitle = (entry.props?.sectionTitle as string | undefined) ?? section.props.sectionTitle as string | undefined;
        for (const cell of props.cells) {
          tasks.push({
            sectionId,
            cardId: card.id,
            cellId: cell.id,
            slotName,
            query: pickImageQueryForCell(cell.slots, sectionTitle),
          });
          if (tasks.length >= MAX_PER_COMPOSE) break;
        }
        if (tasks.length >= MAX_PER_COMPOSE) break;
      }

      // throttle: 동시 4개씩
      const CONCURRENCY = 4;
      const runOne = async (task: FillTask) => {
        if (fetched >= MAX_PER_COMPOSE) return;
        const photos = await searchStockPhotos(task.query, { perPage: 5 }).catch(() => []);
        const photo = photos[0];
        if (!photo) return;
        fetched += 1;
        get().updateCardCellSlot(task.sectionId, task.cardId, task.cellId, task.slotName, {
          kind: "asset",
          asset: { type: "image", url: photo.largeUrl, alt: photo.alt },
        });
      };
      for (let i = 0; i < tasks.length; i += CONCURRENCY) {
        await Promise.all(tasks.slice(i, i + CONCURRENCY).map(runOne));
      }
    })();
  },

  removeSection: (sectionId) =>
    set((state) => {
      const sec = state.doc.sections.find((s) => s.id === sectionId);
      if (!sec || sec.locked) return state;
      const next = state.doc.sections.filter((s) => s.id !== sectionId);
      return {
        doc: bumpAudit({ ...state.doc, sections: next }),
        selection:
          state.selection.sectionId === sectionId
            ? { sectionId: null, componentId: null, cellId: null }
            : state.selection,
      };
    }),

  updateSectionProp: (sectionId, key, value) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) =>
          s.id === sectionId ? { ...s, props: { ...s.props, [key]: value } } : s
        ),
      }),
    })),

  bindSectionToken: (sectionId, binding) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) => {
          if (s.id !== sectionId) return s;
          const existing = s.tokens ?? [];
          const replaced = [
            ...existing.filter((t) => t.propPath !== binding.propPath),
            binding,
          ];
          return { ...s, tokens: replaced };
        }),
      }),
    })),

  unbindSectionToken: (sectionId, propPath) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            tokens: (s.tokens ?? []).filter((t) => t.propPath !== propPath),
          };
        }),
      }),
    })),

  toggleSectionVisibility: (sectionId, viewport) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                visibility: {
                  ...s.visibility,
                  [viewport]: !s.visibility[viewport],
                },
              }
            : s
        ),
      }),
    })),

  // ----- Component (generic) -----
  updateComponentProp: (sectionId, componentId, key, value) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) => {
          if (s.id !== sectionId) return s;
          const slots = { ...s.slots };
          for (const slotName of Object.keys(slots)) {
            slots[slotName] = (slots[slotName] ?? []).map((c) =>
              c.id === componentId
                ? { ...c, props: { ...c.props, [key]: value } }
                : c
            );
          }
          return { ...s, slots };
        }),
      }),
    })),

  reorderComponents: (sectionId, slotName, fromId, toId) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) => {
          if (s.id !== sectionId) return s;
          const list = (s.slots[slotName] ?? []).slice();
          const fromIdx = list.findIndex((c) => c.id === fromId);
          const toIdx = list.findIndex((c) => c.id === toId);
          if (fromIdx < 0 || toIdx < 0) return s;
          const [moved] = list.splice(fromIdx, 1);
          if (!moved) return s;
          list.splice(toIdx, 0, moved);
          return { ...s, slots: { ...s.slots, [slotName]: list } };
        }),
      }),
    })),

  removeComponent: (sectionId, componentId) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) => {
          if (s.id !== sectionId) return s;
          const slots: Record<string, ComponentInstance[]> = {};
          for (const [k, v] of Object.entries(s.slots)) {
            slots[k] = v.filter((c) => c.id !== componentId);
          }
          return { ...s, slots };
        }),
      }),
    })),

  // ----- Card -----
  updateCardLayout: (sectionId, componentId, layout) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) => {
          if (s.id !== sectionId) return s;
          return mapCardInstance(s, componentId, (inst, props) => {
            const next: CardProps = {
              ...props,
              layout: defaultLayoutSettings(layout),
            };
            return setCardProps(inst, next);
          });
        }),
      }),
    })),

  updateCardLayoutSettings: (sectionId, componentId, layoutSettings) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) => {
          if (s.id !== sectionId) return s;
          return mapCardInstance(s, componentId, (inst, props) => {
            // 같은 타입일 때만 교체 — 타입이 다르면 updateCardLayout 으로 가야 함
            if (layoutSettings.type !== props.layout.type) return inst;
            return setCardProps(inst, { ...props, layout: layoutSettings });
          });
        }),
      }),
    })),

  updateCardUsage: (sectionId, componentId, usage) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) => {
          if (s.id !== sectionId) return s;
          return mapCardInstance(s, componentId, (inst, props) => {
            if (props.usage === usage) return inst;
            // 변형 전환 시 cells 를 새 usage 의 defaultCell 로 재생성.
            // 사용자가 reviewcard → tablecard 같은 큰 변경 시 즉시 의미 있는 자리표시자 카드를 보도록.
            // (cell 개수는 유지: 데이터 손실 우려 vs 새 자리표시자 확보 사이의 균형)
            const newPreset = CARD_USAGE_PRESETS[usage];
            const count = Math.max(1, props.cells.length);
            const newCells: CardCell[] = Array.from({ length: count }).map((_, i) => ({
              id: `${componentId}-cell-${Date.now()}-${i}`,
              slots: newPreset.defaultCell(),
            }));
            return setCardProps(inst, { ...props, usage, cells: newCells });
          });
        }),
      }),
    })),

  addCardCell: (sectionId, componentId) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) => {
          if (s.id !== sectionId) return s;
          return mapCardInstance(s, componentId, (inst, props) => {
            const usagePreset = CARD_USAGE_PRESETS[props.usage];
            // faqcard 는 4–10 사이로 cell 수 제한
            if (props.usage === "faqcard" && props.cells.length >= FAQCARD_CELL_LIMITS.max) {
              return inst;
            }
            const newCell: CardCell = {
              id: `cell-${Math.random().toString(36).slice(2, 8)}`,
              slots: usagePreset.defaultCell(),
            };
            return setCardProps(inst, {
              ...props,
              cells: [...props.cells, newCell],
            });
          });
        }),
      }),
    })),

  removeCardCell: (sectionId, componentId, cellId) =>
    set((state) => {
      const sel = state.selection;
      const clearCell =
        sel.sectionId === sectionId &&
        sel.componentId === componentId &&
        sel.cellId === cellId;
      return {
        ...(clearCell ? { selection: { ...sel, cellId: null } } : {}),
        doc: bumpAudit({
          ...state.doc,
          sections: state.doc.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return mapCardInstance(s, componentId, (inst, props) => {
              // faqcard 는 최소 4개 유지
              if (props.usage === "faqcard" && props.cells.length <= FAQCARD_CELL_LIMITS.min) {
                return inst;
              }
              return setCardProps(inst, {
                ...props,
                cells: props.cells.filter((c) => c.id !== cellId),
              });
            });
          }),
        }),
      };
    }),

  updateCardCellSlot: (sectionId, componentId, cellId, slotName, content) =>
    set((state) => ({
      doc: bumpAudit({
        ...state.doc,
        sections: state.doc.sections.map((s) => {
          if (s.id !== sectionId) return s;
          return mapCardInstance(s, componentId, (inst, props) => {
            return setCardProps(inst, {
              ...props,
              cells: props.cells.map((c) =>
                c.id === cellId
                  ? { ...c, slots: { ...c.slots, [slotName]: content } }
                  : c
              ),
            });
          });
        }),
      }),
    })),

  // ----- Asset -----
  openAssetModal: (ctx) => set({ assetModal: ctx }),
  closeAssetModal: () => set({ assetModal: null }),

  embedAsset: (sectionId, componentId, slotName, asset) =>
    set((state) => {
      const ctx = state.assetModal;
      if (
        ctx?.cellId &&
        ctx.cardSlotName &&
        ctx.sectionId === sectionId &&
        ctx.componentId === componentId &&
        componentId
      ) {
        const cellId = ctx.cellId;
        const slotKey = ctx.cardSlotName;
        return {
          assetModal: null,
          doc: bumpAudit({
            ...state.doc,
            sections: state.doc.sections.map((s) => {
              if (s.id !== sectionId) return s;
              return mapCardInstance(s, componentId, (inst, props) =>
                setCardProps(inst, {
                  ...props,
                  cells: props.cells.map((c) =>
                    c.id === cellId
                      ? {
                          ...c,
                          slots: {
                            ...c.slots,
                            [slotKey]: { kind: "asset", asset },
                          },
                        }
                      : c
                  ),
                })
              );
            }),
          }),
        };
      }

      return {
        assetModal: null,
        doc: bumpAudit({
          ...state.doc,
          sections: state.doc.sections.map((s) => {
            if (s.id !== sectionId) return s;
            if (componentId === null) {
              const existing = s.assets.filter((a) => a.slotName !== slotName);
              return { ...s, assets: [...existing, { slotName, asset }] };
            }
            const slots: Record<string, ComponentInstance[]> = {};
            for (const [k, list] of Object.entries(s.slots)) {
              slots[k] = list.map((c) => {
                if (c.id !== componentId) return c;
                const existing = c.assets.filter((a) => a.slotName !== slotName);
                return { ...c, assets: [...existing, { slotName, asset }] };
              });
            }
            return { ...s, slots };
          }),
        }),
      };
    }),

  // ----- Review -----
  openReviewModal: () => set({ reviewModalOpen: true }),
  closeReviewModal: () => set({ reviewModalOpen: false }),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function selectSelectedSection(state: BuilderState): Section | null {
  if (!state.selection.sectionId) return null;
  return (
    state.doc.sections.find((s) => s.id === state.selection.sectionId) ?? null
  );
}

export function selectSelectedComponent(
  state: BuilderState
): ComponentInstance | null {
  const sec = selectSelectedSection(state);
  if (!sec || !state.selection.componentId) return null;
  for (const list of Object.values(sec.slots)) {
    const hit = list.find((c) => c.id === state.selection.componentId);
    if (hit) return hit;
  }
  return null;
}
