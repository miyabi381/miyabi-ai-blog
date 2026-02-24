/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const workerIndexPath = path.join(
  process.cwd(),
  ".vercel",
  "output",
  "static",
  "_worker.js",
  "index.js"
);

function fixRootRoute() {
  if (!fs.existsSync(workerIndexPath)) {
    console.warn("[fix-cloudflare-root-route] Worker output not found. Skipped.");
    return;
  }

  const source = fs.readFileSync(workerIndexPath, "utf8");
  const indexRouteMatch = source.match(/"\/index":\{type:"function",entrypoint:"([^"]+)"\}/);
  if (!indexRouteMatch) {
    console.warn("[fix-cloudflare-root-route] /index function route not found. Skipped.");
    return;
  }

  const rootFunctionRoute = `"/":{type:"function",entrypoint:"${indexRouteMatch[1]}"}`;
  const rootOverridePattern =
    /"\/":\{type:"override",path:"\/_next\/static\/not-found\.txt",headers:\{"content-type":"text\/plain"\}\}/;

  if (source.includes(rootFunctionRoute)) {
    console.log("[fix-cloudflare-root-route] Root route already points to index function.");
    return;
  }

  if (!rootOverridePattern.test(source)) {
    console.warn("[fix-cloudflare-root-route] Root override pattern not found. Skipped.");
    return;
  }

  const patched = source.replace(rootOverridePattern, rootFunctionRoute);
  fs.writeFileSync(workerIndexPath, patched, "utf8");
  console.log("[fix-cloudflare-root-route] Patched root route to index function.");
}

fixRootRoute();
