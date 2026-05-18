#!/usr/bin/env node
/**
 * 로컬 ODS 프리뷰 일괄 설정:
 * 1. design-assets 클론
 * 2. public/ods-static 동기화
 * 3. .env.local 에 NEXT_PUBLIC_USE_LOCAL_ODS=true
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function run(script) {
  const r = spawnSync("node", [path.join(__dirname, script)], {
    stdio: "inherit",
    cwd: root,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("clone-design-assets.mjs");
run("generate-ods-asset-paths.mjs");
run("sync-ods-static.mjs");

const envPath = path.join(root, ".env.local");
const line = "NEXT_PUBLIC_USE_LOCAL_ODS=true";
const lineIframe = "NEXT_PUBLIC_PREVIEW_IFRAME=true";

let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
for (const l of [line, lineIframe]) {
  if (!content.includes(l.split("=")[0])) {
    content = content.trimEnd() + (content ? "\n" : "") + l + "\n";
  }
}
fs.writeFileSync(envPath, content);
console.log("[setup:local-ods] .env.local 갱신 완료");
console.log("[setup:local-ods] npm run dev 후 빌더 프리뷰에서 로컬 ODS·iframe 을 사용합니다.");
