/**
 * electron-builder afterPack hook.
 * Copies electron/standalone/ into the packaged app's resources/ directory.
 * This bypasses electron-builder's built-in node_modules filtering.
 */
import { cpSync } from "node:fs";
import path from "node:path";

export default async function afterPack(context) {
  const src = path.join(context.packager.projectDir, "electron", "standalone");
  const dest = path.join(context.appOutDir, "resources", "standalone");

  console.log(`\n📂 afterPack: copying standalone server…`);
  console.log(`   from: ${src}`);
  console.log(`   to:   ${dest}`);

  cpSync(src, dest, { recursive: true, dereference: true });

  console.log(`   ✅ Done\n`);
}
