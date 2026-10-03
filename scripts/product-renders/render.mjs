/**
 * Rendert productbeelden voor de voorbeeldcatalogus met headless Chromium.
 *
 *   node scripts/product-renders/render.mjs specs.json
 *
 * specs.json bevat [{ "out": "public/products/x.webp", "spec": { ... } }].
 * Lijst voor de catalogus maken: npx tsx scripts/product-renders/specs.ts > specs.json
 * Chromium-pad via CHROMIUM_PATH (standaard het Playwright-pad).
 */
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { chromium } from "playwright-core";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "../..");
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript" };

const server = createServer(async (req, res) => {
  try {
    const path = join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!path.startsWith(root)) throw new Error("buiten root");
    const body = await readFile(path);
    res.writeHead(200, { "Content-Type": types[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const port = server.address().port;

const jobs = JSON.parse(await readFile(process.argv[2], "utf8"));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

let done = 0;
for (const job of jobs) {
  const size = job.spec.size ?? 1200;
  const page = await browser.newPage({
    viewport: { width: job.spec.width ?? size, height: job.spec.height ?? size },
  });
  page.on("pageerror", (e) => console.error("pagina-fout", job.out, e.message));
  await page.goto(
    `http://localhost:${port}/scripts/product-renders/index.html#${encodeURIComponent(JSON.stringify(job.spec))}`,
  );
  await page.waitForFunction(() => window.__done === true, null, { timeout: 120000 });
  await mkdir(dirname(resolve(root, job.out)), { recursive: true });
  const png = await page.locator("canvas").screenshot();
  const out = resolve(root, job.out);
  if (out.endsWith(".webp")) {
    // Supersampled render verkleinen naar het webformaat.
    const target = job.spec.width ? Math.round(job.spec.width * 0.75) : Math.round(size * (5 / 6));
    await sharp(png).resize({ width: target }).webp({ quality: 82 }).toFile(out);
  } else {
    await sharp(png).toFile(out);
  }
  await page.close();
  done++;
  if (done % 10 === 0 || done === jobs.length) console.log(`${done}/${jobs.length}`);
}

await browser.close();
server.close();
