import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * GET все статьи
 * Примеры:
 * /api/articles
 * /api/articles?category=uzbekistan
 * /api/articles?category=uzbekistan&lang=uz
 * /api/articles?status=draft
 * /api/articles?search=ташкент
 */
router.get("/articles", async (req, res) => {
  try {
    const {
      category,
      lang = "ru",
      status = "published",
      search = "",
    } = req.query;

    const normalizedSearch =
      typeof search === "string" ? search.trim() : "";

    const articles = await prisma.article.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category
          ? {
              articleCategories: {
                some: {
                  category: {
                    slug: category,
                  },
                },
              },
            }
          : {}),
        ...(normalizedSearch
          ? {
              translations: {
                some: {
                  locale: lang,
                  OR: [
                    {
                      title: {
                        contains: normalizedSearch,
                        mode: "insensitive",
                      },
                    },
                    {
                      excerpt: {
                        contains: normalizedSearch,
                        mode: "insensitive",
                      },
                    },
                    {
                      content: {
                        contains: normalizedSearch,
                        mode: "insensitive",
                      },
                    },
                    {
                      seoTitle: {
                        contains: normalizedSearch,
                        mode: "insensitive",
                      },
                    },
                    {
                      seoDescription: {
                        contains: normalizedSearch,
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              },
            }
          : {}),
      },
      include: {
        category: true,
        reactions: true,
        translations: {
          where: {
            locale: lang,
          },
        },
        articleCategories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    const normalizedArticles = articles.map((article) => ({
      id: article.id,
      slug: article.slug,
      coverImage: article.coverImage,
      isFeatured: article.isFeatured,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      status: article.status,
      category: article.category,
      categories: article.articleCategories.map((item) => item.category),
      categoryIds: article.articleCategories.map((item) => item.categoryId),
      reactions: article.reactions,
      translation: article.translations[0] || null,
    }));

    res.json({
      ok: true,
      articles: normalizedArticles,
    });
  } catch (error) {
    console.error("GET /articles error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to load articles",
    });
  }
});

/**
 * GET одна статья по slug
 * Примеры:
 * /api/articles/first-news
 * /api/articles/first-news?lang=uz
 */
router.get("/articles/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { lang = "ru" } = req.query;

    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        category: true,
        reactions: true,
        translations: {
          where: {
            locale: lang,
          },
        },
        articleCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!article) {
      return res.status(404).json({
        ok: false,
        message: "Article not found",
      });
    }

    res.json({
      ok: true,
      article: {
        id: article.id,
        slug: article.slug,
        coverImage: article.coverImage,
        isFeatured: article.isFeatured,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        status: article.status,
        category: article.category,
        categories: article.articleCategories.map((item) => item.category),
        categoryIds: article.articleCategories.map((item) => item.categoryId),
        reactions: article.reactions,
        translation: article.translations[0] || null,
      },
    });
  } catch (error) {
    console.error("GET /articles/:slug error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to load article",
    });
  }
});

/**
 * POST создать статью
 */
router.post("/articles", requireAuth, async (req, res) => {
  try {
    const {
      slug,
      categoryId,
      categoryIds,
      coverImage,
      isFeatured,
      ru,
      uz,
    } = req.body;

    const normalizedCategoryIds = [
      ...new Set(
        (Array.isArray(categoryIds)
          ? categoryIds
          : categoryId
            ? [categoryId]
            : []
        )
          .map(Number)
          .filter(Boolean)
      ),
    ];

    const normalizedCoverImage =
      typeof coverImage === "string" && coverImage.trim()
        ? coverImage.trim()
        : null;

    if (
      !slug ||
      normalizedCategoryIds.length === 0 ||
      !ru ||
      !ru.title ||
      !ru.content
    ) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields",
      });
    }

    const existingArticleWithSlug = await prisma.article.findUnique({
      where: { slug },
    });

    if (existingArticleWithSlug) {
      return res.status(400).json({
        ok: false,
        message: "Статья с таким slug уже существует",
      });
    }

    const article = await prisma.article.create({
      data: {
        slug,
        categoryId: normalizedCategoryIds[0],
        authorId: req.user.userId,
        status: "published",
        coverImage: normalizedCoverImage,
        isFeatured: !!isFeatured,
        publishedAt: new Date(),

        articleCategories: {
          create: normalizedCategoryIds.map((id) => ({
            categoryId: id,
          })),
        },

        translations: {
          create: [
            {
              locale: "ru",
              title: ru.title,
              excerpt: ru.excerpt || null,
              content: ru.content,
              seoTitle: ru.seoTitle || null,
              seoDescription: ru.seoDescription || null,
              telegramEmbedUrl: ru.telegramEmbedUrl || null,
            },
            ...(uz && uz.title && uz.content
              ? [
                  {
                    locale: "uz",
                    title: uz.title,
                    excerpt: uz.excerpt || null,
                    content: uz.content,
                    seoTitle: uz.seoTitle || null,
                    seoDescription: uz.seoDescription || null,
                    telegramEmbedUrl: uz.telegramEmbedUrl || null,
                  },
                ]
              : []),
          ],
        },

        reactions: {
          create: {},
        },
      },
      include: {
        category: true,
        reactions: true,
        translations: true,
        articleCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    res.status(201).json({
      ok: true,
      article: {
        ...article,
        categories: article.articleCategories.map((item) => item.category),
        categoryIds: article.articleCategories.map((item) => item.categoryId),
      },
    });
  } catch (error) {
    console.error("POST /articles error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to create article",
    });
  }
});

/**
 * POST реакция на статью
 */
router.post("/articles/:id/react", async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    const fieldMap = {
      fire: "fireCount",
      heart: "heartCount",
      laugh: "laughCount",
      wow: "wowCount",
      angry: "angryCount",
    };

    const field = fieldMap[type];

    if (!field) {
      return res.status(400).json({
        ok: false,
        message: "Invalid reaction type",
      });
    }

    const updated = await prisma.articleReaction.update({
      where: {
        articleId: Number(id),
      },
      data: {
        [field]: {
          increment: 1,
        },
      },
    });

    res.json({
      ok: true,
      reactions: updated,
    });
  } catch (error) {
    console.error("POST /articles/:id/react error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to update reaction",
    });
  }
});

router.put("/articles/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slug,
      categoryId,
      categoryIds,
      coverImage,
      isFeatured,
      ru,
      uz,
    } = req.body;

    const normalizedCategoryIds = [
      ...new Set(
        (Array.isArray(categoryIds)
          ? categoryIds
          : categoryId
            ? [categoryId]
            : []
        )
          .map(Number)
          .filter(Boolean)
      ),
    ];

    const normalizedCoverImage =
      typeof coverImage === "string" && coverImage.trim()
        ? coverImage.trim()
        : null;

    if (
      !slug ||
      normalizedCategoryIds.length === 0 ||
      !ru ||
      !ru.title ||
      !ru.content
    ) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields",
      });
    }

    const articleId = Number(id);

    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        translations: true,
      },
    });

    if (!existingArticle) {
      return res.status(404).json({
        ok: false,
        message: "Article not found",
      });
    }

    const articleWithSameSlug = await prisma.article.findFirst({
      where: {
        slug,
        NOT: {
          id: articleId,
        },
      },
    });

    if (articleWithSameSlug) {
      return res.status(400).json({
        ok: false,
        message: "Статья с таким slug уже существует",
      });
    }

    await prisma.article.update({
      where: { id: articleId },
      data: {
        slug,
        categoryId: normalizedCategoryIds[0],
        coverImage: normalizedCoverImage,
        isFeatured: !!isFeatured,
      },
    });

    await prisma.articleCategory.deleteMany({
      where: {
        articleId,
      },
    });

    await prisma.articleCategory.createMany({
      data: normalizedCategoryIds.map((categoryId) => ({
        articleId,
        categoryId,
      })),
    });

    const ruTranslation = existingArticle.translations.find(
      (item) => item.locale === "ru"
    );

    if (ruTranslation) {
      await prisma.articleTranslation.update({
        where: { id: ruTranslation.id },
        data: {
          title: ru.title,
          excerpt: ru.excerpt || null,
          content: ru.content,
          seoTitle: ru.seoTitle || null,
          seoDescription: ru.seoDescription || null,
          telegramEmbedUrl: ru.telegramEmbedUrl || null,
        },
      });
    } else {
      await prisma.articleTranslation.create({
        data: {
          articleId,
          locale: "ru",
          title: ru.title,
          excerpt: ru.excerpt || null,
          content: ru.content,
          seoTitle: ru.seoTitle || null,
          seoDescription: ru.seoDescription || null,
          telegramEmbedUrl: ru.telegramEmbedUrl || null,
        },
      });
    }

    if (uz && (uz.title || uz.content || uz.excerpt || uz.telegramEmbedUrl)) {
      const uzTranslation = existingArticle.translations.find(
        (item) => item.locale === "uz"
      );

      if (uzTranslation) {
        await prisma.articleTranslation.update({
          where: { id: uzTranslation.id },
          data: {
            title: uz.title || "",
            excerpt: uz.excerpt || null,
            content: uz.content || "",
            seoTitle: uz.seoTitle || null,
            seoDescription: uz.seoDescription || null,
            telegramEmbedUrl: uz.telegramEmbedUrl || null,
          },
        });
      } else if (uz.title && uz.content) {
        await prisma.articleTranslation.create({
          data: {
            articleId,
            locale: "uz",
            title: uz.title,
            excerpt: uz.excerpt || null,
            content: uz.content,
            seoTitle: uz.seoTitle || null,
            seoDescription: uz.seoDescription || null,
            telegramEmbedUrl: uz.telegramEmbedUrl || null,
          },
        });
      }
    }

    const updatedArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        category: true,
        reactions: true,
        translations: true,
        articleCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    res.json({
      ok: true,
      article: {
        ...updatedArticle,
        categories: updatedArticle.articleCategories.map((item) => item.category),
        categoryIds: updatedArticle.articleCategories.map(
          (item) => item.categoryId
        ),
      },
    });
  } catch (error) {
    console.error("PUT /articles/:id error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to update article",
    });
  }
});

router.delete("/articles/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.article.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({
      ok: true,
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /articles/:id error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to delete article",
    });
  }
});

export default router;