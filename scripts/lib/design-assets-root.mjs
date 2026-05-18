import fs from "node:fs";
import path from "node:path";

/**
 * design-assets 클론 루트 (우선순위):
 * 1. DESIGN_ASSETS_ROOT
 * 2. vendor/design-assets
 * 3. ~/Documents/GitHub/design-assets
 */
export function resolveDesignAssetsRoot(projectRoot) {
  const fromEnv = process.env.DESIGN_ASSETS_ROOT?.trim();
  if (fromEnv) {
    const resolved = path.resolve(fromEnv);
    if (fs.existsSync(resolved)) return resolved;
    throw new Error(`[design-assets] DESIGN_ASSETS_ROOT not found: ${resolved}`);
  }

  const vendor = path.join(projectRoot, "vendor", "design-assets");
  if (fs.existsSync(vendor)) return vendor;

  const homeFallback = path.join(
    process.env.HOME || "",
    "Documents",
    "GitHub",
    "design-assets"
  );
  if (homeFallback && fs.existsSync(homeFallback)) return homeFallback;

  return vendor;
}
