"use client";

import { cn } from "@/lib/cn";
import { useBuilderStore, selectSelectedSection } from "@/store/builder-store";
import type { InspectorTab } from "@/store/builder-store";
import PropsTab from "./tabs/PropsTab";
import AssetsTab from "./tabs/AssetsTab";

const TABS: { id: InspectorTab; label: string }[] = [
  { id: "props", label: "타이틀" },
  { id: "assets", label: "이미지" },
];

export default function Inspector() {
  const rawTab = useBuilderStore((s) => s.inspectorTab);
  const setTab = useBuilderStore((s) => s.setInspectorTab);
  const section = useBuilderStore(selectSelectedSection);
  // "slots" 탭은 v3에서 "타이틀"로 통합되어 제거됨. 잔존 상태가 들어오면 props로 폴백.
  const tab: InspectorTab =
    TABS.some((t) => t.id === rawTab) ? rawTab : "props";

  if (!section) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-12 items-center border-b border-builder-border px-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-builder-muted">
            Inspector
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center text-[12px] text-builder-muted">
          좌측 트리 또는 프리뷰에서 섹션을 선택하세요
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-builder-border bg-builder-panel">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 px-2 py-2 text-[12px] transition",
              tab === t.id
                ? "border-b-2 border-builder-accent text-builder-text"
                : "border-b-2 border-transparent text-builder-muted hover:text-builder-text"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="builder-scroll flex-1 overflow-y-auto p-4" key={section.id}>
        {tab === "props" && <PropsTab />}
        {tab === "assets" && <AssetsTab />}
      </div>
    </div>
  );
}
