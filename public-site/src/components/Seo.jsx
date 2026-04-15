import { Helmet } from "react-helmet-async";

function Seo({
  title = "Дайджест — новости Узбекистана",
  description = "Свежие новости Узбекистана и мира.",
  canonical = "",  
  type = "website",
  schema = null,
  locale = "ru_RU",
  preloadImage = "",
  publishedTime = "",
  modifiedTime = "",
  section = "",
}) {
  const siteUrl = "https://digest-news.uz";
  const siteName = "Дайджест";

  const safeTitle =
    typeof title === "string" && title.trim()
      ? title.trim()
      : "Дайджест — новости Узбекистана";

  const safeDescription =
    typeof description === "string" && description.trim()
      ? description.trim()
      : "Свежие новости Узбекистана и мира.";

  const safeImage = "/preview.jpg";

  const safePreloadImage =
    typeof preloadImage === "string" && preloadImage.trim()
      ? preloadImage.trim()
      : "";

  const safePublishedTime =
    typeof publishedTime === "string" && publishedTime.trim()
      ? publishedTime.trim()
      : "";

  const safeModifiedTime =
    typeof modifiedTime === "string" && modifiedTime.trim()
      ? modifiedTime.trim()
      : "";

  const safeSection =
    typeof section === "string" && section.trim() ? section.trim() : "";

  const fullTitle = safeTitle.includes("Дайджест")
    ? safeTitle
    : `${safeTitle} — Дайджест`;

  const fullUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;

  const fullImage = safeImage.startsWith("http")
    ? safeImage
    : `${siteUrl}${safeImage}`;

  const fullPreloadImage = safePreloadImage
    ? safePreloadImage.startsWith("http")
      ? safePreloadImage
      : `${siteUrl}${safePreloadImage}`
    : "";

  const normalizedSchema = schema
    ? JSON.parse(
        JSON.stringify(schema).replaceAll('"__PAGE_URL__"', `"${fullUrl}"`),
      )
    : null;

  return (
    <Helmet>
      <html lang={locale === "uz_UZ" ? "uz" : "ru"} />

      <title>{fullTitle}</title>

      <meta name="description" content={safeDescription} />
      <meta name="robots" content="index,follow" />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {type === "article" && safePublishedTime && (
        <meta property="article:published_time" content={safePublishedTime} />
      )}

      {type === "article" && safeModifiedTime && (
        <meta property="article:modified_time" content={safeModifiedTime} />
      )}

      {type === "article" && safeSection && (
        <meta property="article:section" content={safeSection} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={fullTitle} />
      <meta name="twitter:url" content={fullUrl} />

      <link rel="canonical" href={fullUrl} />

      {fullPreloadImage && (
        <link
          rel="preload"
          as="image"
          href={fullPreloadImage}
          fetchpriority="high"
        />
      )}

      {normalizedSchema && (
        <script type="application/ld+json">
          {JSON.stringify(normalizedSchema)}
        </script>
      )}
    </Helmet>
  );
}

export default Seo;