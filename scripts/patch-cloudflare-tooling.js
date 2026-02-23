/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const root = process.cwd();
const nextOnPagesPath = path.join(root, "node_modules", "@cloudflare", "next-on-pages", "dist", "index.js");
const blakeWasmPath = path.join(
  root,
  "node_modules",
  "blake3-wasm",
  "dist",
  "wasm",
  "nodejs",
  "blake3_js_bg.wasm"
);

function patchNextOnPages() {
  if (!fs.existsSync(nextOnPagesPath)) {
    console.warn("[patch-cloudflare-tooling] next-on-pages dist file not found, skipped.");
    return;
  }

  const source = fs.readFileSync(nextOnPagesPath, "utf8");
  const fromA = 'external: ["node:*", "./__next-on-pages-dist__/*", "cloudflare:*"],';
  const toA = 'external: ["node:*", "async_hooks", "crypto", "./__next-on-pages-dist__/*", "cloudflare:*"],';
  const fromB = 'external: ["node:*", `${relativeNopDistPath}/*`, "*.wasm", "cloudflare:*"],';
  const toB = 'external: ["node:*", "async_hooks", "crypto", `${relativeNopDistPath}/*`, "*.wasm", "cloudflare:*"],';

  let patched = source;
  patched = patched.replace(fromA, toA);
  patched = patched.replace(fromB, toB);

  if (patched !== source) {
    fs.writeFileSync(nextOnPagesPath, patched, "utf8");
    console.log("[patch-cloudflare-tooling] Patched next-on-pages externals.");
  } else {
    console.log("[patch-cloudflare-tooling] next-on-pages externals already patched.");
  }
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function download(url, filePath) {
  return new Promise((resolve, reject) => {
    ensureDir(filePath);
    const request = https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 400) {
        reject(new Error(`Failed to download ${url}. Status: ${response.statusCode}`));
        return;
      }
      const stream = fs.createWriteStream(filePath);
      response.pipe(stream);
      stream.on("finish", () => {
        stream.close();
        resolve();
      });
      stream.on("error", reject);
    });
    request.on("error", reject);
  });
}

async function ensureBlakeWasm() {
  if (fs.existsSync(blakeWasmPath)) {
    console.log("[patch-cloudflare-tooling] blake3 wasm already present.");
    return;
  }

  const url = "https://unpkg.com/blake3-wasm@2.1.5/dist/wasm/nodejs/blake3_js_bg.wasm";
  await download(url, blakeWasmPath);
  console.log("[patch-cloudflare-tooling] Downloaded missing blake3 wasm.");
}

async function main() {
  patchNextOnPages();
  await ensureBlakeWasm();
}

main().catch((error) => {
  console.error("[patch-cloudflare-tooling] Failed:", error);
  process.exit(1);
});
