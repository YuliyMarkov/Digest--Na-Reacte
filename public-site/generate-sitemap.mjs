import fs from "fs/promises";

const SITE_URL = "https://digest-news.uz";
const OUTPUT_PATH = "./public/sitemap.xml";

const staticPages = [
  "/ru",
  "/uz",
  "/ru/about",
  "/ru/contacts",
  "/ru/privacy",
  "/uz/about",
  "/uz/contacts",
  "/uz/privacy",
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

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatLastMod(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function buildUrlEntry(loc, options = {}) {
  const { lastmod, changefreq, priority } = options;

  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${escapeXml(changefreq)}</changefreq>` : null,
    priority ? `    <priority>${escapeXml(priority)}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

async function fetchArticles(lang) {
  const url = `${SITE_URL}/api/articles?lang=${encodeURIComponent(lang)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${lang} articles: ${response.status}`);
  }

  const data = await response.json();
  if (!data?.ok || !Array.isArray(data.articles)) {
    throw new Error(`Invalid API response for lang=${lang}`);
  }

  return data.articles;
}

async function generateSitemap() {
  try {
    const [ruArticles, uzArticles] = await Promise.all([
      fetchArticles("ru"),
      fetchArticles("uz"),
    ]);

    const entries = [];

    for (const path of staticPages) {
      entries.push(
        buildUrlEntry(`${SITE_URL}${path}`, {
          changefreq: path === "/ru" || path === "/uz" ? "hourly" : "daily",
          priority:
            path === "/ru" || path === "/uz"
              ? "1.0"
              : path.includes("/category/")
                ? "0.9"
                : "0.5",
        }),
      );
    }

    for (const article of ruArticles) {
      if (!article?.slug) continue;

      entries.push(
        buildUrlEntry(`${SITE_URL}/ru/news/${article.slug}`, {
          lastmod: formatLastMod(article.updatedAt || article.publishedAt),
          changefreq: "daily",
          priority: "0.8",
        }),
      );
    }

    for (const article of uzArticles) {
      if (!article?.slug) continue;

      entries.push(
        buildUrlEntry(`${SITE_URL}/uz/news/${article.slug}`, {
          lastmod: formatLastMod(article.updatedAt || article.publishedAt),
          changefreq: "daily",
          priority: "0.8",
        }),
      );
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      "</urlset>",
      "",
    ].join("\n");

    await fs.writeFile(OUTPUT_PATH, xml, "utf8");
    console.log(`Sitemap generated successfully: ${OUTPUT_PATH}`);
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    process.exit(1);
  }
}

generateSitemap();