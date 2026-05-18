#!/usr/bin/env node
/**
 * design-assets 클론 manifest(prod) 기준으로 정적 파일을
 * `public/ods-static/` 에 CDN 과 동일한 상대 경로로 복사.
 *
 * 예: AssetBellLarge/image_480.webp, AssetMotionChevronDown/motion-chevron-down.json
 *
 * 사전: npm run clone:ods && npm run generate:ods-paths
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveDesignAssetsRoot } from "./lib/design-assets-root.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outRoot = path.join(root, "public", "ods-static");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

/** manifest CI 절대 경로 → 로컬 design-assets 경로 */
function resolveLocalSource(designRoot, manifestFile) {
  const marker = "/design-assets/";
  const idx = manifestFile.lastIndexOf(marker);
  if (idx >= 0) {
    return path.join(designRoot, manifestFile.slice(idx + marker.length));
  }
  return null;
}

function cdnRelativeFromUrl(url) {
  try {
    const u = new URL(url);
    const prefix = "/static/";
    const i = u.pathname.indexOf(prefix);
    if (i < 0) return null;
    return u.pathname.slice(i + prefix.length);
  } catch {
    return null;
  }
}

function collectUploads(entry) {
  const items = [];
  for (const upload of entry.uploaded ?? []) {
    if (upload.scales?.length) {
      for (const scale of upload.scales) {
        if (scale.url && scale.file) items.push({ url: scale.url, file: scale.file });
      }
    } else if (upload.url && upload.file) {
      items.push({ url: upload.url, file: upload.file });
    }
  }
  return items;
}

function main() {
  const designRoot = resolveDesignAssetsRoot(root);
  const manifestPath = path.join(designRoot, "manifest", "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.error(`[sync:ods] manifest 없음: ${manifestPath}`);
    console.error("  npm run clone:ods 또는 DESIGN_ASSETS_ROOT 설정");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const prod = manifest.entries?.prod ?? [];

  if (fs.existsSync(outRoot)) {
    fs.rmSync(outRoot, { recursive: true, force: true });
  }
  ensureDir(outRoot);

  let copied = 0;
  let skipped = 0;

  for (const entry of prod) {
    for (const { url, file: manifestFile } of collectUploads(entry)) {
      const rel = cdnRelativeFromUrl(url);
      if (!rel) continue;

      const src = resolveLocalSource(designRoot, manifestFile);
      if (!src || !fs.existsSync(src)) {
        skipped += 1;
        continue;
      }

      const destFile = path.join(outRoot, ...rel.split("/"));
      ensureDir(path.dirname(destFile));
      if (!fs.existsSync(destFile)) {
        fs.copyFileSync(src, destFile);
        copied += 1;
      }
    }
  }

  console.log(`[sync:ods] ${copied} files → public/ods-static/ (skipped ${skipped} missing sources)`);
  if (copied === 0) {
    console.warn(
      "[sync:ods] 복사된 파일 없음. DESIGN_ASSETS_ROOT 가 올바른지, manifest 의 로컬 소스 경로를 확인하세요."
    );
  }
}

main();
