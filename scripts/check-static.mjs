import { access, readFile } from "node:fs/promises";

const required = ["index.html", "styles.css", "app.js", "favicon.svg", "_headers", "_redirects"];

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
