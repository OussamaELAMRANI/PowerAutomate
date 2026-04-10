/**
 * electron-builder afterPack hook.
 * Copies electron/standalone/ into the packaged app's resources/ directory.
 * Uses a filter to skip broken pnpm symlinks.
 */
import { cpSync, statSync } from "node:fs";
import path from "node:path";

export default async function afterPack(context) {
  const src = path.join(context.packager.projectDir, "electron", "standalone");
  const dest = path.join(context.appOutDir, "resources", "standalone");

  console.log(`\n📂 afterPack: copying standalone server…`);
  console.log(`   from: ${src}`);
  console.log(`   to:   ${dest}`);

  cpSync(src, dest, {
    recursive: true,
    dereference: true,
    force: true,
    errorOnExist: false,
    filter: (source) => {
      try {
        statSync(source);
        return true;
      } catch {
        return false; // skip broken symlinks
      }
    },
  });

  console.log(`   ✅ Done\n`);
}
