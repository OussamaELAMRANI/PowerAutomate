/**
 * Cross-platform post-build copy.
 * 1. Copies public/ and .next/static/ into .next/standalone/
 * 2. Copies the complete standalone directory into electron/standalone/
 *    dereferencing symlinks but skipping broken ones (pnpm store links).
 */
import { cpSync, existsSync, rmSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const electronStandalone = path.join(root, "electron", "standalone");

/**
 * Skip broken symlinks — pnpm leaves dangling links inside
 * node_modules/.pnpm/node_modules/ that point to the global store.
 */
function safeCopy(src, dest, label) {
  if (!existsSync(src)) {
    console.log(`   ⏭ Skipping ${label || src} (not found)`);
    return;
  }
  cpSync(src, dest, {
    recursive: true,
    dereference: true,
    force: true,
    errorOnExist: false,
    filter: (source) => {
      try {
        statSync(source);          // follows symlinks — throws on broken ones
        return true;
      } catch {
        return false;              // skip broken symlink
      }
    },
  });
  console.log(`   ✅ ${label || path.relative(root, src)} → ${path.relative(root, dest)}`);
}

// Step 1 — copy static assets into the standalone dir
console.log("📦 Post-build: copying assets into standalone…");
safeCopy(path.join(root, "public"), path.join(standalone, "public"), "public/");
safeCopy(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static"),
  ".next/static/"
);

// Step 2 — copy the whole standalone dir into electron/standalone/
//          so it's outside electron-builder's default filtering
console.log("\n📦 Post-build: copying standalone → electron/standalone/…");
if (existsSync(electronStandalone)) {
  rmSync(electronStandalone, { recursive: true, force: true });
}
mkdirSync(electronStandalone, { recursive: true });
safeCopy(standalone, electronStandalone, "standalone → electron/standalone");

// Step 3 — verify critical files
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
