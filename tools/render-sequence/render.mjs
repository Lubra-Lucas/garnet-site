// Renderiza scene.html em N frames WebP (com transparência) para a sequência do scroll.
// Uso: npm run render  (variáveis opcionais FRAMES, SIZE, QUALITY, CHROMIUM)
import { createServer } from "node:http";
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "../../assets/seq");
const FRAMES = Number(process.env.FRAMES || 150);
const SIZE = Number(process.env.SIZE || 900);
const QUALITY = Number(process.env.QUALITY || 0.8);
const CHROMIUM = process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript" };
const server = createServer(async (req, res) => {
  try {
    const path = join(here, decodeURIComponent(new URL(req.url, "http://x").pathname));
    const body = await readFile(path);
    res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: CHROMIUM,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
page.on("pageerror", (e) => console.error("erro na cena:", e.message));
await page.goto(`http://localhost:${port}/scene.html?size=${SIZE}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (let i = 0; i < FRAMES; i++) {
  const t = i / (FRAMES - 1);
  const data = await page.evaluate(([t, q]) => {
    window.setTime(t);
    return document.querySelector("canvas").toDataURL("image/webp", q);
  }, [t, QUALITY]);
  const name = `compact-${String(i).padStart(3, "0")}.webp`;
  await writeFile(join(OUT, name), Buffer.from(data.split(",")[1], "base64"));
  if (i % 25 === 0) console.log(`frame ${i + 1}/${FRAMES}`);
}
await writeFile(join(OUT, "manifest.json"), JSON.stringify({ frames: FRAMES, size: SIZE, pattern: "compact-{i}.webp", pad: 3 }, null, 2));
await browser.close();
server.close();
console.log(`ok: ${FRAMES} frames em ${OUT}`);
