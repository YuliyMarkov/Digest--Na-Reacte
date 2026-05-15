import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";

const SITE_URL = "https://digest-news.uz";
const DIST_DIR = path.resolve("dist");

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

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function saveHtml(route, html) {
  const cleanRoute = route.replace(/^\/+/, "");
  const outputDir = path.join(DIST_DIR, cleanRoute);
  const outputPath = path.join(outputDir, "index.html");

  await ensureDir(outputDir);
  await fs.writeFile(outputPath, html, "utf8");

  console.log(`Saved: ${outputPath}`);
}

async function prerender() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: 1366,
      height: 900,
      deviceScaleFactor: 1,
    });

    for (const route of routes) {
      const url = `${SITE_URL}${route}`;

      console.log(`Prerendering: ${url}`);

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
  }
}

prerender();