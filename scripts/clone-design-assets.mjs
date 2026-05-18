#!/usr/bin/env node
/**
 * bucketplace/design-assets 를 vendor/design-assets 에 연결합니다.
 *
 *   DESIGN_ASSETS_REPO=git@github.com:bucketplace/design-assets.git npm run clone:ods
 *   DESIGN_ASSETS_ROOT=/path/to/design-assets npm run clone:ods  # 기존 클론 symlink
 *
 * 이미 vendor 에 클론되어 있으면 pull 만 시도합니다.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveDesignAssetsRoot } from "./lib/design-assets-root.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const vendorDir = path.join(root, "vendor", "design-assets");
const repo =
  process.env.DESIGN_ASSETS_REPO?.trim() ||
  "git@github.com:bucketplace/design-assets.git";

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: root, ...opts });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

const fromEnv = process.env.DESIGN_ASSETS_ROOT?.trim();
if (fromEnv) {
  const resolved = path.resolve(fromEnv);
  if (!fs.existsSync(resolved)) {
    console.error(`[clone:ods] DESIGN_ASSETS_ROOT 없음: ${resolved}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(vendorDir), { recursive: true });
  if (fs.existsSync(vendorDir)) {
    const stat = fs.lstatSync(vendorDir);
    if (stat.isSymbolicLink()) fs.unlinkSync(vendorDir);
    else {
      console.error(`[clone:ods] vendor/design-assets 가 이미 존재합니다 (symlink 아님).`);
      process.exit(1);
    }
  }
  fs.symlinkSync(resolved, vendorDir, "dir");
  console.log(`[clone:ods] symlink: ${vendorDir} → ${resolved}`);
  console.log("[clone:ods] 완료. 다음: npm run generate:ods-paths && npm run sync:ods");
  process.exit(0);
}

if (fs.existsSync(path.join(vendorDir, ".git"))) {
  console.log(`[clone:ods] 기존 클론 업데이트: ${vendorDir}`);
  run("git", ["-C", vendorDir, "pull", "--ff-only"]);
} else if (fs.existsSync(vendorDir)) {
  try {
    const resolved = resolveDesignAssetsRoot(root);
    console.log(`[clone:ods] 기존 design-assets 사용: ${resolved}`);
  } catch {
    console.error(`[clone:ods] vendor/design-assets 가 git 클론이 아닙니다.`);
    process.exit(1);
  }
} else {
  fs.mkdirSync(path.join(root, "vendor"), { recursive: true });
  console.log(`[clone:ods] 클론: ${repo} → ${vendorDir}`);
  run("git", ["clone", "--depth", "1", repo, vendorDir]);
}

console.log("[clone:ods] 완료. 다음: npm run generate:ods-paths && npm run sync:ods");
