/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const functionsDir = path.join(
  process.cwd(),
  ".vercel",
  "output",
  "static",
  "_worker.js",
  "__next-on-pages-dist__",
  "functions"
);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".func.js")) {
      files.push(fullPath);
    }
  }
  return files;
}

function patchFunctionFiles() {
  if (!fs.existsSync(functionsDir)) {
    console.warn("[fix-cloudflare-function-async-hooks] Function output not found. Skipped.");
    return;
  }

  const targets = walk(functionsDir);
  let patchedCount = 0;

  const asyncHooksRequirePattern = /=\s*[A-Za-z_$][\w$]*\((["'])async_hooks\1\)/g;

  for (const filePath of targets) {
    const source = fs.readFileSync(filePath, "utf8");
    const patched = source.replace(
      asyncHooksRequirePattern,
      "={AsyncLocalStorage:globalThis.AsyncLocalStorage}"
    );
    if (patched !== source) {
      fs.writeFileSync(filePath, patched, "utf8");
      patchedCount += 1;
    }
  }

  if (patchedCount === 0) {
    console.log("[fix-cloudflare-function-async-hooks] No async_hooks patch target found.");
    return;
  }

  console.log(`[fix-cloudflare-function-async-hooks] Patched ${patchedCount} function file(s).`);
}

patchFunctionFiles();
