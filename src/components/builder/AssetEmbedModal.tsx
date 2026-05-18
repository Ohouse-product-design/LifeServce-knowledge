"use client";

/**
 * 에셋 임베드 모달.
 *
 * 두 가지 소스 (탭 전환):
 *   1. ODS Catalog — `src/catalog/ods-assets.json` 기반 (assetId 저장)
 *   2. Stock Photos — Pexels API (NEXT_PUBLIC_PEXELS_API_KEY 설정 시) 또는 Picsum 폴백 (url 저장)
 *
 * imgcard 의 cardType="bgfullimg" 처럼 실사 배경 이미지가 필요할 때 Stock Photos 탭을 사용.
 * leading-asset (구 stepcard) 처럼 디자인 시스템 일러스트가 필요할 때 ODS Catalog 사용.
 */

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import OdsAssetRenderer from "@/components/preview/OdsAssetRenderer";
import { cn } from "@/lib/cn";
import { searchOdsLibrary } from "@/lib/ods-asset-library";
import { searchStockPhotos, type StockPhoto } from "@/lib/stock-photos";
import type { AssetRef } from "@/schema/doc";
import { useBuilderStore } from "@/store/builder-store";

function entryToAssetRef(entry: {
  name: string;
  type: AssetRef["type"];
}): AssetRef {
  return {
    assetId: entry.name,
    type: entry.type,
    alt: entry.name,
  };
}

function LazyEmbedAssetThumbnail({
  asset,
  scrollRootRef,
}: {
  asset: AssetRef;
  scrollRootRef: RefObject<HTMLDivElement | null>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const root = scrollRootRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          setShow(true);
          io.disconnect();
        }
      },
      { root: root ?? undefined, rootMargin: "120px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scrollRootRef]);

  return (
    <div
      ref={wrapRef}
      className="mb-2 flex h-24 w-full items-center justify-center overflow-hidden rounded-ods-4 bg-builder-panel-2"
    >
      {show ? (
        <div className="pointer-events-none flex size-full min-h-0 min-w-0 items-center justify-center p-1">
          <OdsAssetRenderer
            asset={asset}
            className={
              asset.type === "lottie"
                ? "flex h-full w-full max-h-full max-w-full items-center justify-center [&_.lottie-react]:max-h-full [&_.lottie-react]:max-w-full"
                : "h-auto w-auto max-h-full max-w-full object-contain"
            }
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0.5 text-[9px] text-builder-muted">
          <span className="rounded px-1 py-px uppercase tracking-wide opacity-80">
            {asset.type}
          </span>
        </div>
      )}
    </div>
  );
}

type AssetTab = "ods" | "stock";

export default function AssetEmbedModal() {
  const modal = useBuilderStore((s) => s.assetModal);
  const close = useBuilderStore((s) => s.closeAssetModal);
  const embed = useBuilderStore((s) => s.embedAsset);
  const [tab, setTab] = useState<AssetTab>("ods");
  const [query, setQuery] = useState("");
  const [stockPhotos, setStockPhotos] = useState<StockPhoto[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const scrollRootRef = useRef<HTMLDivElement>(null);

  const odsFiltered = useMemo(() => {
    const list = searchOdsLibrary(query, { category: "asset" }).filter(
      (e) => e.type === "image" || e.type === "lottie"
    );
    return list.slice(0, 90).map(entryToAssetRef);
  }, [query]);

  // Stock photos: 쿼리 변경 시 fetch (탭이 stock 일 때만)
  useEffect(() => {
    if (tab !== "stock") return;
    let cancelled = false;
    setStockLoading(true);
    searchStockPhotos(query)
      .then((photos) => {
        if (!cancelled) setStockPhotos(photos);
      })
      .catch(() => {
        if (!cancelled) setStockPhotos([]);
      })
      .finally(() => {
        if (!cancelled) setStockLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, query]);

  if (!modal) return null;

  const hasPexelsKey = !!process.env.NEXT_PUBLIC_PEXELS_API_KEY;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[680px] max-w-full rounded-ods-12 border border-builder-border bg-builder-panel"
      >
        <div className="flex items-center justify-between border-b border-builder-border px-5 py-3">
          <div>
            <div className="text-sm font-semibold">에셋 임베드</div>
            <div className="text-[11px] text-builder-muted">
              {modal.cellId && modal.cardSlotName ? (
                <>카드 셀 슬롯: <span className="text-builder-text">{modal.cardSlotName}</span></>
              ) : (
                <>슬롯: {modal.slotName}</>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-builder-muted hover:text-builder-text"
          >
            ✕
          </button>
        </div>

        {/* 탭: ODS / Stock */}
        <div className="flex border-b border-builder-border bg-builder-panel">
          {(["ods", "stock"] as AssetTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setQuery("");
              }}
              className={cn(
                "flex-1 px-2 py-2 text-[12px] transition",
                tab === t
                  ? "border-b-2 border-builder-accent text-builder-text"
                  : "border-b-2 border-transparent text-builder-muted hover:text-builder-text"
              )}
            >
              {t === "ods" ? "ODS Catalog" : "Stock Photos"}
              {t === "stock" && !hasPexelsKey && (
                <span className="ml-1 text-[10px] text-builder-muted">· Picsum 폴백</span>
              )}
            </button>
          ))}
        </div>

        <div className="border-b border-builder-border p-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === "ods"
                ? "컴포넌트명 검색 (예: BoltTruck, Motion…)"
                : "이미지 검색 (예: 이사, 인테리어, 가구…)"
            }
            className="w-full rounded-ods-8 border border-builder-border bg-builder-bg px-3 py-2 text-[12px] outline-none focus:border-builder-accent"
          />
        </div>

        <div
          ref={scrollRootRef}
          className="builder-scroll max-h-[420px] overflow-y-auto p-3"
        >
          {tab === "ods" ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                {odsFiltered.map((asset) => (
                  <button
                    key={asset.assetId}
                    type="button"
                    onClick={() =>
                      embed(modal.sectionId, modal.componentId, modal.slotName, asset)
                    }
                    className={cn(
                      "rounded-ods-8 border border-builder-border bg-builder-bg p-2 text-left hover:border-builder-accent"
                    )}
                  >
                    <LazyEmbedAssetThumbnail asset={asset} scrollRootRef={scrollRootRef} />
                    <div className="truncate text-[11px] text-builder-text">{asset.alt}</div>
                    <div className="truncate text-[10px] text-builder-muted">{asset.assetId}</div>
                  </button>
                ))}
              </div>
              {odsFiltered.length === 0 && (
                <div className="py-12 text-center text-[12px] text-builder-muted">
                  일치하는 에셋이 없습니다
                </div>
              )}
            </>
          ) : (
            <>
              {stockLoading && (
                <div className="py-6 text-center text-[12px] text-builder-muted">불러오는 중…</div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {stockPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() =>
                      embed(modal.sectionId, modal.componentId, modal.slotName, {
                        type: "image",
                        url: photo.largeUrl,
                        alt: photo.alt,
                      })
                    }
                    className="rounded-ods-8 border border-builder-border bg-builder-bg p-2 text-left hover:border-builder-accent"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumbUrl}
                      alt={photo.alt}
                      className="aspect-[3/2] w-full rounded-ods-4 object-cover"
                      loading="lazy"
                    />
                    <div className="mt-1 truncate text-[10px] text-builder-muted">
                      {photo.provider === "pexels" ? "Pexels" : "Picsum"} · {photo.credit}
                    </div>
                  </button>
                ))}
              </div>
              {!stockLoading && stockPhotos.length === 0 && (
                <div className="py-12 text-center text-[12px] text-builder-muted">
                  결과가 없습니다
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
