#!/usr/bin/env node
/**
 * design-assets 클론(manifest + packages/assets/src) 기준으로
 * `src/catalog/ods-asset-paths.json` 생성.
 *
 * 카탈로그 컴포넌트명(AssetBellLargeStillImage) → CDN 상대 경로(AssetBellLarge/image_480.webp)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveDesignAssetsRoot } from "./lib/design-assets-root.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outFile = path.join(root, "src", "catalog", "ods-asset-paths.json");

const EXPORT_RE = /export\s*\{\s*(\w+)\s*\}/;

function readExportName(indexPath) {
  if (!fs.existsSync(indexPath)) return null;
  const src = fs.readFileSync(indexPath, "utf8");
  const m = src.match(EXPORT_RE);
  return m?.[1] ?? null;
}

function pickPreviewFile(entry) {
  for (const upload of entry.uploaded ?? []) {
    if (upload.type === "lottie" && upload.url) {
      const file = path.basename(new URL(upload.url).pathname);
      return file;
    }
    if (upload.scales?.length) {
      const preferred =
        upload.scales.find((s) => s.scale === "480" && s.url) ??
        upload.scales.find((s) => s.url);
      if (preferred?.url) {
        return path.basename(new URL(preferred.url).pathname);
      }
    }
    if (upload.url) {
      return path.basename(new URL(upload.url).pathname);
    }
  }
  return null;
}

function main() {
  const designRoot = resolveDesignAssetsRoot(root);
  if (!fs.existsSync(designRoot)) {
    console.error(`[generate:ods-paths] design-assets 없음: ${designRoot}`);
    console.error("  npm run clone:ods 또는 DESIGN_ASSETS_ROOT 설정");
    process.exit(1);
  }

  const manifestPath = path.join(designRoot, "manifest", "manifest.json");
  const imageRoot = path.join(designRoot, "packages", "assets", "src", "image");
  const lottieRoot = path.join(designRoot, "packages", "assets", "src", "lottie");

  if (!fs.existsSync(manifestPath)) {
    console.error(`[generate:ods-paths] manifest 없음: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const prodByName = new Map((manifest.entries?.prod ?? []).map((e) => [e.name, e]));

  /** @type {Record<string, { kind: 'img'|'lottie', folder: string, file: string }>} */
  const paths = {};

  if (fs.existsSync(imageRoot)) {
    for (const folder of fs.readdirSync(imageRoot, { withFileTypes: true })) {
      if (!folder.isDirectory()) continue;
      const catalogName = readExportName(path.join(imageRoot, folder.name, "index.ts"));
      if (!catalogName) continue;
      const entry = prodByName.get(folder.name);
      const file = entry ? pickPreviewFile(entry) : "image_480.webp";
      if (!file) continue;
      paths[catalogName] = { kind: "img", folder: folder.name, file };
    }
  }

  if (fs.existsSync(lottieRoot)) {
    for (const folder of fs.readdirSync(lottieRoot, { withFileTypes: true })) {
      if (!folder.isDirectory()) continue;
      if (folder.name === "dynamic") continue;
      const catalogName = readExportName(path.join(lottieRoot, folder.name, "index.ts"));
      if (!catalogName) continue;
      const entry = prodByName.get(folder.name);
      const file = entry ? pickPreviewFile(entry) : null;
      if (!file) continue;
      paths[catalogName] = { kind: "lottie", folder: folder.name, file };
    }
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(paths, null, 2)}\n`);
  console.log(
    `[generate:ods-paths] ${Object.keys(paths).length} entries → ${path.relative(root, outFile)} (from ${designRoot})`
  );
}

main();
