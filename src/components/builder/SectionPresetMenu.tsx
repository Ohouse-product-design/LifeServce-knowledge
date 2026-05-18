"use client";

/**
 * SectionPresetMenu — SectionTree "+ 섹션 추가" 메뉴의 presentational 컴포넌트.
 *
 * v3 UI: 2-col card grid + 섹션별 SVG 썸네일 + 1문장 설명.
 * 비디자이너·개발자가 카드 미리보기와 친근한 설명으로 직관적으로 섹션을 고를 수 있게 함.
 */

import { cn } from "@/lib/cn";
import type { SectionPresetId } from "@/schema/section-presets";
import { SECTION_THUMBNAILS } from "./SectionThumbnails";

export interface SectionPresetMenuEntry {
  /** 고유 식별자 (preset[+variant] 조합) */
  id: string;
  /** 사용자 노출 라벨 (예: "서비스 안내") */
  label: string;
  /** 1문장 설명 (비디자이너·개발자 대상) */
  description: string;
  /** 그룹 라벨 (예: "서비스 소개 페이지") */
  group?: string;
  /** 썸네일 매핑용 preset id */
  preset: SectionPresetId;
}

export interface SectionPresetMenuProps {
  entries: SectionPresetMenuEntry[];
  onPick?: (id: string) => void;
}

export default function SectionPresetMenu({
  entries,
  onPick,
}: SectionPresetMenuProps) {
  // 그룹별 묶기 (group 이 없으면 "기본")
  const groups = entries.reduce<Record<string, SectionPresetMenuEntry[]>>(
    (acc, e) => {
      const key = e.group ?? "기본";
      (acc[key] = acc[key] ?? []).push(e);
      return acc;
    },
    {}
  );

  return (
    <div className="max-h-[70vh] w-[480px] overflow-y-auto rounded-ods-8 border border-builder-border bg-builder-panel-2 p-3 shadow-xl">
      {Object.entries(groups).map(([group, list], gi) => (
        <div key={group} className={gi > 0 ? "mt-4" : ""}>
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-builder-muted">
            {group}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {list.map((entry) => {
              const Thumb = SECTION_THUMBNAILS[entry.preset];
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onPick?.(entry.id)}
                  className={cn(
                    "group flex flex-col gap-2 overflow-hidden rounded-ods-8 border border-builder-border bg-builder-panel p-2 text-left transition-colors",
                    "hover:border-builder-accent/60 hover:bg-builder-panel-2"
                  )}
                >
                  <div className="overflow-hidden rounded-ods-4 border border-builder-border/50 bg-white">
                    {Thumb ? (
                      <Thumb className="aspect-[5/3] w-full" />
                    ) : (
                      <div className="aspect-[5/3] w-full bg-builder-panel-2" />
                    )}
                  </div>
                  <div className="space-y-0.5 px-0.5">
                    <p className="text-[12px] font-semibold text-builder-text">
                      {entry.label}
                    </p>
                    <p className="text-[11px] leading-snug text-builder-muted">
                      {entry.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
