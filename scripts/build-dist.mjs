import { cp, mkdir, rm } from "node:fs/promises";

const files = [
  "index.html",
  "styles.css",
  "app.js",
  "favicon.svg",
  "openapi.json",
  "llms.txt",
  "robots.txt",
  "sitemap.xml",
  "_headers",
  "_redirects",
];
const directories = [".well-known"];

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

await Promise.all(files.map((file) => cp(file, `dist/${file}`)));
await Promise.all(directories.map((directory) => cp(directory, `dist/${directory}`, { recursive: true })));

console.log("Built dist/.");
