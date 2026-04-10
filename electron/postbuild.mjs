/**
 * Cross-platform post-build copy.
 * 1. Copies public/ and .next/static/ into .next/standalone/
 * 2. Copies the complete standalone directory into electron/standalone/
 *    so electron-builder can package it reliably (avoids its node_modules filtering).
 */
import { cpSync, existsSync, rmSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const electronStandalone = path.join(root, "electron", "standalone");

function copy(src, dest, label) {
  if (!existsSync(src)) {
    console.log(`   ⏭ Skipping ${label || src} (not found)`);
    return;
  }
  cpSync(src, dest, { recursive: true, dereference: true });
  console.log(`   ✅ ${label || path.relative(root, src)} → ${path.relative(root, dest)}`);
}

console.log("📦 Post-build: copying assets into standalone…");
copy(path.join(root, "public"), path.join(standalone, "public"), "public/");
copy(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static"),
  ".next/static/"
);

// Copy the complete standalone directory into electron/standalone/
// This works around electron-builder silently excluding node_modules from extraResources.
console.log("\n📦 Post-build: copying standalone → electron/standalone/…");
if (existsSync(electronStandalone)) {
  rmSync(electronStandalone, { recursive: true, force: true });
}
mkdirSync(electronStandalone, { recursive: true });
cpSync(standalone, electronStandalone, { recursive: true, dereference: true });

// Verify critical files exist
const checks = [
  "server.js",
  "node_modules/next/dist/server/next-server.js",
  ".next/BUILD_ID",
];
let allGood = true;
for (const check of checks) {
  const p = path.join(electronStandalone, check);
  if (existsSync(p)) {
    console.log(`   ✅ ${check}`);
  } else {
    console.log(`   ❌ MISSING: ${check}`);
    allGood = false;
  }
}

if (allGood) {
  console.log("\n   ✅ All critical files verified!\n");
} else {
  console.error("\n   ⚠ Some critical files are missing. The packaged app may not work.\n");
  process.exit(1);
}
