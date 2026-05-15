import fs from "fs/promises";
import path from "path";
import http from "http";
import puppeteer from "puppeteer";

const DIST_DIR = path.resolve("dist");
const PORT = 4177;
const LOCAL_URL = `http://127.0.0.1:${PORT}`;

const routes = [
  "/ru",
  "/uz",

  "/ru/category/uzbekistan",
  "/ru/category/world",
  "/ru/category/auto",
  "/ru/category/incidents",
  "/ru/category/science",
  "/ru/category/economy",

  "/uz/category/uzbekistan",
  "/uz/category/world",
  "/uz/category/auto",
  "/uz/category/incidents",
  "/uz/category/science",
  "/uz/category/economy",
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, LOCAL_URL);
      let pathname = decodeURIComponent(url.pathname);

      if (pathname.endsWith("/")) {
        pathname += "index.html";
      }

      let filePath = path.join(DIST_DIR, pathname);

      if (!(await fileExists(filePath))) {
        filePath = path.join(DIST_DIR, "index.html");
      }

      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || "application/octet-stream";
      const content = await fs.readFile(filePath);

      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } catch {
      res.writeHead(500);
      res.end("Server error");
    }
  });

  return new Promise((resolve) => {
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function saveHtml(route, html) {
  const cleanRoute = route.replace(/^\/+/, "").replace(/\/+$/, "");
  const outputDir = path.join(DIST_DIR, cleanRoute);
  const outputPath = path.join(outputDir, "index.html");

  await ensureDir(outputDir);
  await fs.writeFile(outputPath, html, "utf8");

  console.log(`Saved: ${outputPath}`);
}

async function prerender() {
  const server = await startServer();

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on("request", (request) => {
      const url = request.url();

      if (
        url.includes("yandex.ru/ads") ||
        url.includes("mc.yandex.ru") ||
        url.includes("googletagmanager.com") ||
        url.includes("googlesyndication.com") ||
        url.includes("google-analytics.com")
      ) {
        request.abort();
        return;
      }

      request.continue();
    });

    await page.setViewport({
      width: 1366,
      height: 900,
      deviceScaleFactor: 1,
    });

    for (const route of routes) {
      const url = `${LOCAL_URL}${route}`;

      console.log(`Prerendering: ${route}`);

      try {
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });

        await page.waitForSelector("#root", {
          timeout: 15000,
        });

        await new Promise((resolve) => setTimeout(resolve, 1500));

        const html = await page.content();

        await saveHtml(route, html);
      } catch (error) {
        console.error(`Failed to prerender ${route}:`, error.message);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
}

prerender();