import { access, readFile } from "node:fs/promises";

const required = [
  "index.html",
  "styles.css",
  "app.js",
  "favicon.svg",
  "openapi.json",
  "llms.txt",
  "robots.txt",
  "sitemap.xml",
  ".well-known/ai-plugin.json",
  "_headers",
  "_redirects",
  "functions/_shared/brief.js",
  "functions/_shared/compare.js",
  "functions/_shared/capabilities.js",
  "functions/_shared/dexscreener.js",
  "functions/_shared/report-store.js",
  "functions/api/brief.js",
  "functions/api/capabilities.js",
  "functions/api/compare.js",
  "functions/api/manifest.js",
  "functions/api/report.js",
  "functions/api/report/[id].js",
  "functions/api/scan.js",
  "functions/api/watch.js",
];

await Promise.all(required.map((file) => access(file)));

const html = await readFile("index.html", "utf8");
if (!html.includes('<div id="app"></div>')) {
  throw new Error("index.html is missing the app root");
}

const app = await readFile("app.js", "utf8");
if (!app.includes("DYOR.sh")) {
  throw new Error("app.js is missing DYOR.sh copy");
}

console.log("Static checks passed.");
