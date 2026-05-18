"use client";

/**
 * Slots 탭 (v2 — Card 통합 후).
 *
 * 변경:
 * - 선택된 섹션이 Card 컨테이너를 갖는 경우(usp/review/process/cross-sell),
 *   Card 의 layout 토글 + cells 트리 + 각 cell 의 slot 편집 진입을 통합 노출한다.
 * - 그 외 섹션(table/cta-form/review.tabs)은 기존처럼 컴포넌트 인스턴스 목록을 보여준다.
 */

import { cn } from "@/lib/cn";
import { IconChevronDown } from "@/lib/ods-icons";
import { COMPONENT_PRESETS } from "@/schema/component-presets";
import { SECTION_PRESETS } from "@/schema/section-presets";
import {
  CARD_USAGE_PRESETS,
  FAQCARD_CELL_LIMITS,
  TABLECARD_ROW_LIMITS,
  type CardCell,
  type CardLayout,
  type CardProps,
  type CardSlotName,
  type CardUsagePresetId,
} from "@/schema/card";
import type { AssetRef, AssetType } from "@/schema/doc";
import {
  selectSelectedSection,
  useBuilderStore,
} from "@/store/builder-store";

/**
 * `SectionSlotsPanel` — 슬롯 편집 UI 본체.
 * Inspector 에서 단독 탭으로 쓰던 것을 PropsTab 내부로 통합하기 위해 named export.
 * (기존 default export 도 호환을 위해 동일 함수를 가리킨다.)
 */
export function SectionSlotsPanel() {
  const section = useBuilderStore(selectSelectedSection);
  const selectComponent = useBuilderStore((s) => s.selectComponent);
  const removeComponent = useBuilderStore((s) => s.removeComponent);
  const updateCardLayout = useBuilderStore((s) => s.updateCardLayout);
  const updateCardUsage = useBuilderStore((s) => s.updateCardUsage);
  const updateComponentProp = useBuilderStore((s) => s.updateComponentProp);
  const addCardCell = useBuilderStore((s) => s.addCardCell);
  const removeCardCell = useBuilderStore((s) => s.removeCardCell);
  const setSelectedCell = useBuilderStore((s) => s.setSelectedCell);
  const selectCardCell = useBuilderStore((s) => s.selectCardCell);
  const selectedCellId = useBuilderStore((s) => s.selection.cellId);

  if (!section) return null;

  const preset = SECTION_PRESETS[section.preset];

  // -------- Card 사용 섹션 --------
  const contentSlot = preset.slots.find(
    (sl) => sl.name === "content" && sl.allows.includes("card")
  );
  if (contentSlot) {
    const cardInstance = (section.slots["content"] ?? [])[0];
    const cardProps = cardInstance && cardInstance.preset === "card"
      ? (cardInstance.props as unknown as CardProps)
      : null;
    if (!cardInstance || !cardProps) {
      return (
        <div className="rounded-ods-8 border border-dashed border-builder-border p-3 text-center text-[11px] text-builder-muted">
          아이템 슬롯이 비어 있습니다
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wider text-builder-muted">
            Cell Usage
          </div>
          <select
            value={cardProps.usage}
            onChange={(e) =>
              updateCardUsage(
                section.id,
                cardInstance.id,
                e.target.value as CardUsagePresetId
              )
            }
            className="w-full rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1.5 text-[11px] text-builder-text outline-none focus:border-builder-accent"
          >
            {Object.values(CARD_USAGE_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.description}
              </option>
            ))}
          </select>
        </div>

        {/* imgcard 전용 서브 변형 토글 */}
        {cardProps.usage === "imgcard" && (
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-builder-muted">
              Card Type
            </div>
            <div className="flex gap-1">
              {(["bgfullimg", "leading-asset"] as const).map((t) => {
                const active = (cardProps.cardType ?? "bgfullimg") === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      updateComponentProp(section.id, cardInstance.id, "cardType", t)
                    }
                    className={cn(
                      "flex-1 rounded-ods-4 border px-2 py-1.5 text-[11px]",
                      active
                        ? "border-builder-accent bg-builder-accent/10 text-builder-text"
                        : "border-builder-border text-builder-muted hover:text-builder-text"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-builder-muted">
              {(cardProps.cardType ?? "bgfullimg") === "bgfullimg"
                ? "풀-블리드 배경 이미지 + dim 오버레이 텍스트"
                : "상단 아이콘/일러스트 + 좌측 정렬 텍스트 (구 stepcard)"}
            </p>
          </div>
        )}

        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wider text-builder-muted">
            Layout
          </div>
          <div className="flex gap-1">
            {(CARD_USAGE_PRESETS[cardProps.usage].allowedLayouts).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => updateCardLayout(section.id, cardInstance.id, l)}
                className={cn(
                  "flex-1 rounded-ods-4 border px-2 py-1.5 text-[11px]",
                  cardProps.layout.type === l
                    ? "border-builder-accent bg-builder-accent/10 text-builder-text"
                    : "border-builder-border text-builder-muted hover:text-builder-text"
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-builder-muted">
            {cardProps.layout.type === "grid" && "n:n 분할 — Props 탭에서 컬럼 수 조정"}
            {cardProps.layout.type === "carousel" && "고정 너비 + 좌우 스크롤 (autoScroll 토글)"}
            {cardProps.layout.type === "list" && "수직 스택 — 한 행에 카드 1개"}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-builder-muted">
              Cells ({cardProps.cells.length}
              {cardProps.usage === "faqcard"
                ? ` / ${FAQCARD_CELL_LIMITS.min}–${FAQCARD_CELL_LIMITS.max}`
                : ""}
              )
            </span>
          </div>
          <div className="space-y-1.5">
            {cardProps.cells.map((cell, idx) => {
              const isSelected = selectedCellId === cell.id;
              const titleSlot = cell.slots.title;
              const previewLabel =
                titleSlot?.kind === "text" && titleSlot.text
                  ? titleSlot.text.split("\n")[0]
                  : `Cell #${idx + 1}`;
              const filledCount = Object.values(cell.slots).filter(Boolean).length;
              return (
                <div
                  key={cell.id}
                  className={cn(
                    "overflow-hidden rounded-ods-8 border transition-colors",
                    isSelected
                      ? "border-builder-accent bg-builder-accent/5"
                      : "border-builder-border bg-builder-bg"
                  )}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (selectedCellId === cell.id) {
                        setSelectedCell(null);
                      } else {
                        selectCardCell(section.id, cardInstance.id, cell.id);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (selectedCellId === cell.id) setSelectedCell(null);
                        else selectCardCell(section.id, cardInstance.id, cell.id);
                      }
                    }}
                    className={cn(
                      "group flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-builder-panel-2/80",
                      isSelected && "bg-builder-accent/10"
                    )}
                  >
                    <IconChevronDown
                      size={14}
                      className={cn(
                        "shrink-0 text-builder-muted transition-transform",
                        isSelected && "rotate-180"
                      )}
                    />
                    <span className="text-[10px] text-builder-muted">#{idx + 1}</span>
                    <span className="flex-1 truncate text-[12px] text-builder-text">
                      {previewLabel}
                    </span>
                    <span className="text-[10px] text-builder-muted">
                      {filledCount} slots
                    </span>
                    {/* faqcard 는 min 4 미만으로 내려가지 않게 */}
                    {(cardProps.usage !== "faqcard" ||
                      cardProps.cells.length > FAQCARD_CELL_LIMITS.min) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCardCell(section.id, cardInstance.id, cell.id);
                        }}
                        className="hidden text-[10px] text-builder-muted hover:text-builder-danger group-hover:inline"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {isSelected && (
                    <div className="border-t border-builder-border bg-builder-panel-2 px-2 py-3">
                      <CellSlotEditor
                        cellId={cell.id}
                        cells={cardProps.cells}
                        sectionId={section.id}
                        componentId={cardInstance.id}
                        usage={cardProps.usage}
                        cellIndex={idx}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {(() => {
              const isFaq = cardProps.usage === "faqcard";
              const canAdd = !isFaq || cardProps.cells.length < FAQCARD_CELL_LIMITS.max;
              return (
                <button
                  type="button"
                  disabled={!canAdd}
                  onClick={() => addCardCell(section.id, cardInstance.id)}
                  className={cn(
                    "w-full rounded-ods-8 border border-dashed py-1.5 text-[11px]",
                    canAdd
                      ? "border-builder-border text-builder-muted hover:border-builder-accent hover:text-builder-text"
                      : "cursor-not-allowed border-builder-border/40 text-builder-muted/40"
                  )}
                >
                  + Cell 추가 ({cardProps.usage}
                  {isFaq ? ` · ${cardProps.cells.length}/${FAQCARD_CELL_LIMITS.max}` : ""})
                </button>
              );
            })()}
          </div>
        </div>

      </div>
    );
  }

  // -------- 그 외 (table/form/tab) --------
  if (preset.slots.length === 0) {
    return (
      <p className="text-[12px] text-builder-muted">
        이 섹션은 슬롯이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {preset.slots.map((slotSpec) => {
        const list = section.slots[slotSpec.name] ?? [];
        return (
          <div key={slotSpec.name}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-medium text-builder-text">
                {slotSpec.label}
              </span>
              <span
                className={cn(
                  "text-[11px]",
                  list.length < slotSpec.min || list.length > slotSpec.max
                    ? "text-builder-danger"
                    : "text-builder-muted"
                )}
              >
                {list.length}/{slotSpec.min}–{slotSpec.max}
              </span>
            </div>
            <div className="space-y-1.5">
              {list.map((c, idx) => {
                const cPreset = COMPONENT_PRESETS[c.preset];
                return (
                  <div
                    key={c.id}
                    onClick={() => selectComponent(section.id, c.id)}
                    className="group flex cursor-pointer items-center gap-2 rounded-ods-8 border border-builder-border bg-builder-bg px-2 py-1.5 hover:border-builder-accent/60"
                  >
                    <span className="text-[10px] text-builder-muted">
                      #{idx + 1}
                    </span>
                    <span className="flex-1 truncate text-[12px] text-builder-text">
                      {String(
                        c.props["label"] ??
                          c.props["title"] ??
                          cPreset.label
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeComponent(section.id, c.id);
                      }}
                      className="hidden text-[10px] text-builder-muted hover:text-builder-danger group-hover:inline"
                    >
                      삭제
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 선택된 cell 의 slot 편집기
// ---------------------------------------------------------------------------

const ASSET_TYPES: AssetType[] = ["image", "svg", "video", "lottie"];

function CellSlotEditor({
  cellId,
  cells,
  sectionId,
  componentId,
  usage,
  cellIndex,
}: {
  cellId: string;
  cells: CardCell[];
  sectionId: string;
  componentId: string;
  usage: CardProps["usage"];
  cellIndex: number;
}) {
  const cell = cells.find((c) => c.id === cellId);
  const updateCellSlot = useBuilderStore((s) => s.updateCardCellSlot);
  const openAssetModal = useBuilderStore((s) => s.openAssetModal);
  if (!cell) return null;

  const slotSpec = CARD_USAGE_PRESETS[usage].slotSpec;
  const activeKeys = Object.keys(cell.slots);

  // 변형별 특화 에디터 분기
  if (usage === "reviewcard") {
    return (
      <ReviewCellFields
        cell={cell}
        sectionId={sectionId}
        componentId={componentId}
        cellIndex={cellIndex}
        updateCellSlot={updateCellSlot}
      />
    );
  }
  if (usage === "tablecard") {
    return (
      <TableCellFields
        cell={cell}
        sectionId={sectionId}
        componentId={componentId}
        cellIndex={cellIndex}
        updateCellSlot={updateCellSlot}
      />
    );
  }

  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-wider text-builder-muted">
        Cell #{cellIndex + 1} · 슬롯 편집
      </div>
      <div className="space-y-2">
        {activeKeys.map((k) => {
          const content = cell.slots[k as keyof typeof cell.slots];
          if (!content) return null;
          const slotLabel =
            slotSpec[k as CardSlotName]?.label ?? k;
          return (
            <div key={k} className="rounded-ods-8 border border-builder-border bg-builder-bg p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-builder-text">{slotLabel}</span>
                <span className="text-[10px] text-builder-muted">{content.kind}</span>
              </div>
              {content.kind === "text" && (
                <textarea
                  rows={2}
                  value={content.text}
                  onChange={(e) =>
                    updateCellSlot(sectionId, componentId, cellId, k as keyof typeof cell.slots, {
                      kind: "text",
                      text: e.target.value,
                    })
                  }
                  className="w-full resize-none rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1 text-[11px] text-builder-text outline-none focus:border-builder-accent"
                />
              )}
              {content.kind === "meta" && (
                <input
                  type="text"
                  value={content.items.join(" / ")}
                  onChange={(e) =>
                    updateCellSlot(sectionId, componentId, cellId, k as keyof typeof cell.slots, {
                      kind: "meta",
                      items: e.target.value.split("/").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="/ 로 구분"
                  className="w-full rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1 text-[11px] outline-none focus:border-builder-accent"
                />
              )}
              {content.kind === "rating" && (
                <input
                  type="number"
                  min={0}
                  max={content.max ?? 5}
                  value={content.value}
                  onChange={(e) =>
                    updateCellSlot(sectionId, componentId, cellId, k as keyof typeof cell.slots, {
                      kind: "rating",
                      value: Number(e.target.value),
                      max: content.max,
                    })
                  }
                  className="w-20 rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1 text-[11px] outline-none focus:border-builder-accent"
                />
              )}
              {content.kind === "asset" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={content.asset.alt}
                    onChange={(e) =>
                      updateCellSlot(sectionId, componentId, cellId, k as CardSlotName, {
                        kind: "asset",
                        asset: { ...content.asset, alt: e.target.value },
                      })
                    }
                    placeholder="alt (접근성)"
                    className="w-full rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1 text-[11px] outline-none focus:border-builder-accent"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={content.asset.assetId ?? ""}
                      onChange={(e) =>
                        updateCellSlot(sectionId, componentId, cellId, k as CardSlotName, {
                          kind: "asset",
                          asset: { ...content.asset, assetId: e.target.value || undefined },
                        })
                      }
                      placeholder="assetId"
                      className="min-w-0 flex-1 rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1 text-[11px] outline-none focus:border-builder-accent"
                    />
                    <select
                      value={content.asset.type}
                      onChange={(e) =>
                        updateCellSlot(sectionId, componentId, cellId, k as CardSlotName, {
                          kind: "asset",
                          asset: {
                            ...content.asset,
                            type: e.target.value as AssetType,
                          },
                        })
                      }
                      className="w-[100px] shrink-0 rounded-ods-4 border border-builder-border bg-builder-bg px-1 py-1 text-[11px] outline-none focus:border-builder-accent"
                    >
                      {ASSET_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={content.asset.url ?? ""}
                    onChange={(e) =>
                      updateCellSlot(sectionId, componentId, cellId, k as CardSlotName, {
                        kind: "asset",
                        asset: {
                          ...content.asset,
                          url: e.target.value || undefined,
                        },
                      })
                    }
                    placeholder="직접 URL (선택)"
                    className="w-full rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1 text-[11px] outline-none focus:border-builder-accent"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      openAssetModal({
                        sectionId,
                        componentId,
                        slotName: k,
                        cellId,
                        cardSlotName: k as CardSlotName,
                      })
                    }
                    className="w-full rounded-ods-4 border border-builder-border bg-builder-panel-2 px-2 py-1.5 text-[11px] text-builder-text hover:border-builder-accent"
                  >
                    카탈로그에서 선택…
                  </button>
                </div>
              )}
              {content.kind === "cta" && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={content.label}
                    onChange={(e) =>
                      updateCellSlot(sectionId, componentId, cellId, k as keyof typeof cell.slots, {
                        kind: "cta",
                        label: e.target.value,
                        url: content.url,
                      })
                    }
                    placeholder="라벨"
                    className="w-full rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1 text-[11px] outline-none focus:border-builder-accent"
                  />
                  <input
                    type="text"
                    value={content.url}
                    onChange={(e) =>
                      updateCellSlot(sectionId, componentId, cellId, k as keyof typeof cell.slots, {
                        kind: "cta",
                        label: content.label,
                        url: e.target.value,
                      })
                    }
                    placeholder="URL"
                    className="w-full rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1 text-[11px] outline-none focus:border-builder-accent"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 변형별 전용 cell 에디터
// ---------------------------------------------------------------------------

type CellSlotUpdater = (
  sectionId: string,
  componentId: string,
  cellId: string,
  slotName: CardSlotName,
  content: import("@/schema/card").CardSlotContent
) => void;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-0.5 text-[10px] uppercase tracking-wider text-builder-muted">
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls =
    "w-full rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1 text-[11px] text-builder-text outline-none focus:border-builder-accent";
  if (multiline) {
    return (
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(cls, "resize-none")}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
    />
  );
}

/**
 * reviewcard 전용 셀 에디터.
 *
 * 6개 명시적 필드 — 사용자 멘탈 모델:
 *   rate (별점 0–5) · title · userid · meta1 · meta2 · reviewtext
 *
 * 내부 매핑:
 *   rate       → cell.slots.rating.value
 *   title      → cell.slots.title.text
 *   userid     → cell.slots.meta.items[0]
 *   meta1      → cell.slots.meta.items[1]
 *   meta2      → cell.slots.meta.items[2]
 *   reviewtext → cell.slots.body.text
 *
 * 렌더 시 meta 는 ([userid] + [meta1]) · join "·" | join "|" [meta2] 순서로 표시됨.
 */
function ReviewCellFields({
  cell,
  sectionId,
  componentId,
  cellIndex,
  updateCellSlot,
}: {
  cell: CardCell;
  sectionId: string;
  componentId: string;
  cellIndex: number;
  updateCellSlot: CellSlotUpdater;
}) {
  const rating = cell.slots.rating?.kind === "rating" ? cell.slots.rating.value : 5;
  const title = cell.slots.title?.kind === "text" ? cell.slots.title.text : "";
  const body = cell.slots.body?.kind === "text" ? cell.slots.body.text : "";
  const metaItems = cell.slots.meta?.kind === "meta" ? cell.slots.meta.items : [];
  const userid = metaItems[0] ?? "";
  const meta1 = metaItems[1] ?? "";
  const meta2 = metaItems[2] ?? "";

  const updateMeta = (next: { userid?: string; meta1?: string; meta2?: string }) => {
    const items = [next.userid ?? userid, next.meta1 ?? meta1, next.meta2 ?? meta2];
    updateCellSlot(sectionId, componentId, cell.id, "meta", {
      kind: "meta",
      items,
    });
  };

  return (
    <div className="space-y-3">
      <div className="text-[11px] uppercase tracking-wider text-builder-muted">
        Cell #{cellIndex + 1} · Review Card 필드
      </div>

      <div>
        <FieldLabel>Rate (0–5)</FieldLabel>
        <input
          type="number"
          min={0}
          max={5}
          value={rating}
          onChange={(e) =>
            updateCellSlot(sectionId, componentId, cell.id, "rating", {
              kind: "rating",
              value: Math.max(0, Math.min(5, Number(e.target.value))),
              max: 5,
            })
          }
          className="w-20 rounded-ods-4 border border-builder-border bg-builder-bg px-2 py-1 text-[11px] text-builder-text outline-none focus:border-builder-accent"
        />
      </div>

      <div>
        <FieldLabel>Title (헤드라인)</FieldLabel>
        <TextInput
          multiline
          value={title}
          placeholder="후기 헤드라인 (\\n 으로 줄바꿈)"
          onChange={(v) =>
            updateCellSlot(sectionId, componentId, cell.id, "title", {
              kind: "text",
              text: v,
            })
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <FieldLabel>User ID</FieldLabel>
          <TextInput value={userid} placeholder="민지님" onChange={(v) => updateMeta({ userid: v })} />
        </div>
        <div>
          <FieldLabel>Meta 1</FieldLabel>
          <TextInput value={meta1} placeholder="30대 여성" onChange={(v) => updateMeta({ meta1: v })} />
        </div>
        <div>
          <FieldLabel>Meta 2</FieldLabel>
          <TextInput value={meta2} placeholder="서울 강남" onChange={(v) => updateMeta({ meta2: v })} />
        </div>
      </div>

      <div>
        <FieldLabel>Review Text</FieldLabel>
        <TextInput
          multiline
          value={body}
          placeholder="후기 본문 (3줄까지 노출, **강조** 마커 지원)"
          onChange={(v) =>
            updateCellSlot(sectionId, componentId, cell.id, "body", {
              kind: "text",
              text: v,
            })
          }
        />
      </div>
    </div>
  );
}

/**
 * tablecard 전용 셀 에디터.
 *
 * rowtitle (= cell.slots.title) + N개의 row (= cell.slots.meta.items[0..N]).
 * Row 갯수는 4~6 사이 (TABLECARD_ROW_LIMITS) 에서 +/- 버튼으로 조정.
 */
function TableCellFields({
  cell,
  sectionId,
  componentId,
  cellIndex,
  updateCellSlot,
}: {
  cell: CardCell;
  sectionId: string;
  componentId: string;
  cellIndex: number;
  updateCellSlot: CellSlotUpdater;
}) {
  const rowtitle = cell.slots.title?.kind === "text" ? cell.slots.title.text : "";
  const rows = cell.slots.meta?.kind === "meta" ? cell.slots.meta.items : [];
  const { min, max } = TABLECARD_ROW_LIMITS;

  const setRows = (next: string[]) => {
    updateCellSlot(sectionId, componentId, cell.id, "meta", {
      kind: "meta",
      items: next,
    });
  };

  const updateRow = (i: number, v: string) => {
    const next = [...rows];
    next[i] = v;
    setRows(next);
  };

  const addRow = () => {
    if (rows.length >= max) return;
    setRows([...rows, `Row ${rows.length + 1}`]);
  };

  const removeRow = () => {
    if (rows.length <= min) return;
    setRows(rows.slice(0, -1));
  };

  return (
    <div className="space-y-3">
      <div className="text-[11px] uppercase tracking-wider text-builder-muted">
        Cell #{cellIndex + 1} · Table Card 필드
      </div>

      <div>
        <FieldLabel>Row Title</FieldLabel>
        <TextInput
          value={rowtitle}
          placeholder="카드 제목"
          onChange={(v) =>
            updateCellSlot(sectionId, componentId, cell.id, "title", {
              kind: "text",
              text: v,
            })
          }
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <FieldLabel>Rows ({rows.length} / {min}–{max})</FieldLabel>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={removeRow}
              disabled={rows.length <= min}
              className={cn(
                "rounded-ods-4 border border-builder-border px-2 py-0.5 text-[11px]",
                rows.length <= min
                  ? "cursor-not-allowed text-builder-muted/40"
                  : "text-builder-text hover:border-builder-accent"
              )}
            >
              −
            </button>
            <button
              type="button"
              onClick={addRow}
              disabled={rows.length >= max}
              className={cn(
                "rounded-ods-4 border border-builder-border px-2 py-0.5 text-[11px]",
                rows.length >= max
                  ? "cursor-not-allowed text-builder-muted/40"
                  : "text-builder-text hover:border-builder-accent"
              )}
            >
              +
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          {rows.map((rowText, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-[10px] text-builder-muted">Row {i + 1}</span>
              <TextInput
                value={rowText}
                placeholder={`Row ${i + 1} 텍스트`}
                onChange={(v) => updateRow(i, v)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
