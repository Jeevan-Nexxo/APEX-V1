// ============================================================
// ensure-native-binding.mjs
//
// PERMANENT fix for "Cannot find native binding
// @rolldown/binding-<platform>" errors.
//
// Root cause: this repository can be used from more than one OS
// (e.g. a dual-boot Windows/Linux shared volume). node_modules
// contains OS-specific native binaries for rolldown/vite, so after
// switching OSes the binding for the current platform may be absent.
// npm does not re-install filtered optional dependencies on a plain
// `npm install`, and deleting node_modules every time is not viable.
//
// This guard runs automatically before `npm run dev` / `npm run build`
// (npm pre-hooks) and repairs ONLY what is missing:
//   1. If rolldown itself is missing -> full `npm install`.
//   2. If the platform binding for THIS machine is missing ->
//      targeted `npm install --no-save @rolldown/binding-<platform>@<version>`
//      (never saved into package.json / lockfile, never cross-platform).
//
// It never copies node_modules between machines/OSes and never
// changes locked dependency versions.
// ============================================================

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRoot = createRequire(path.join(root, "package.json"));

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (cmd) =>
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });

// Ordered candidates per platform, mirroring rolldown's own loader order.
function bindingCandidates(platform, arch) {
  if (platform === "win32") {
    return arch === "arm64"
      ? ["@rolldown/binding-win32-arm64-msvc"]
      : ["@rolldown/binding-win32-x64-msvc"];
  }
  if (platform === "darwin") {
    return [arch === "arm64" ? "@rolldown/binding-darwin-arm64" : "@rolldown/binding-darwin-x64"];
  }
  if (platform === "linux") {
    let musl = false;
    try {
      const header = process.report?.getReport?.()?.header;
      // No glibc runtime version reported => musl (Alpine) or another libc.
      musl = !header || !header.glibcVersionRuntime;
    } catch {
      musl = false;
    }
    const suffix = musl ? "-musl" : "-gnu";
    if (arch === "x64") return [`@rolldown/binding-linux-x64${suffix}`];
    if (arch === "arm64") return [`@rolldown/binding-linux-arm64${suffix}`];
    if (arch === "arm") return ["@rolldown/binding-linux-arm-gnueabihf"];
    if (arch === "ppc64") return ["@rolldown/binding-linux-ppc64-gnu"];
    if (arch === "s390x") return ["@rolldown/binding-linux-s390x-gnu"];
    return [];
  }
  if (platform === "android") {
    return ["@rolldown/binding-android-arm64"];
  }
  if (platform === "freebsd") {
    return ["@rolldown/binding-freebsd-x64"];
  }
  return [];
}

function bindingInstalled(name) {
  try {
    // Resolving the .node entry point proves the native binary is present.
    requireFromRoot.resolve(name);
    return true;
  } catch {
    return false;
  }
}

// External/shared volumes can briefly lag right after npm finishes writing,
// so verify a few times before concluding anything is missing.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const bindingInstalledStable = async (name) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!bindingInstalled(name)) return false;
    if (attempt < 2) await sleep(250);
  }
  return true;
};

const rolldownDir = path.join(root, "node_modules", "rolldown");

// Case 1: dependencies not installed at all (fresh clone).
if (!existsSync(rolldownDir)) {
  console.log("[apex] node_modules incomplete - running npm install...");
  run(`${npm} install --no-audit --no-fund`);
}

let version;
try {
  version = JSON.parse(readFileSync(path.join(rolldownDir, "package.json"), "utf8")).version;
} catch {
  console.error("[apex] rolldown is not installed correctly. Run: npm install");
  process.exit(1);
}

const candidates = bindingCandidates(process.platform, process.arch);
if (candidates.length === 0) {
  console.warn(`[apex] Unsupported platform ${process.platform}/${process.arch}; skipping native binding check.`);
  process.exit(0);
}

// Main guard: async wrapper so verification can retry.
(async () => {
  for (const candidate of candidates) {
    if (await bindingInstalledStable(candidate)) {
      process.exit(0);
    }
  }

  // Case 2: platform binding missing (OS switched / partial install).
  const target = `${candidates[0]}@${version}`;
  console.log(`[apex] Native binding for ${process.platform}/${process.arch} is missing.`);
  console.log(`[apex] Repairing with a targeted install of ${target} ...`);
  run(`${npm} install --no-save --no-audit --no-fund ${target}`);

  for (const candidate of candidates) {
    if (await bindingInstalledStable(candidate)) {
      console.log(`[apex] ${candidate} available. Continuing...`);
      process.exit(0);
    }
  }

  console.error(
    `[apex] Failed to install ${candidates[0]}.\n` +
      "       Run 'npm install' inside client/ on this operating system.\n" +
      "       Do NOT reuse one node_modules folder between Windows and Linux."
  );
  process.exit(1);
})();
