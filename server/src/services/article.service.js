import { prisma } from "../lib/prisma.js";

function normalizeCategoryIds(categoryId, categoryIds) {
  return [
    ...new Set(
      (
        Array.isArray(categoryIds)
          ? categoryIds
          : categoryId
            ? [categoryId]
            : []
      )
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];
}

function normalizeCoverImage(coverImage) {
  if (typeof coverImage !== "string") {
    return null;
  }

  const normalized = coverImage.trim();

  return normalized || null;
}

class ArticleService {
  async createArticle({
    slug,
    categoryId,
    categoryIds,
    authorId,
    status = "draft",
    coverImage = null,
    isFeatured = false,
    ru,
    uz = null,
  }) {
    const normalizedSlug =
      typeof slug === "string" ? slug.trim().toLowerCase() : "";

    const normalizedCategoryIds = normalizeCategoryIds(
      categoryId,
      categoryIds
    );

    const normalizedAuthorId = Number(authorId);

    if (
      !normalizedSlug ||
      normalizedCategoryIds.length === 0 ||
      !Number.isInteger(normalizedAuthorId) ||
      normalizedAuthorId <= 0 ||
      !ru?.title?.trim() ||
      !ru?.content?.trim()
    ) {
      throw new Error("Missing required article fields");
    }

    const allowedStatuses = ["draft", "published", "archived"];

    if (!allowedStatuses.includes(status)) {
      throw new Error("Invalid article status");
    }

    const existingArticle = await prisma.article.findUnique({
      where: {
        slug: normalizedSlug,
      },
      select: {
        id: true,
      },
    });

    if (existingArticle) {
      const error = new Error("Статья с таким slug уже существует");
      error.code = "SLUG_ALREADY_EXISTS";
      throw error;
    }

    const categoriesCount = await prisma.category.count({
      where: {
        id: {
          in: normalizedCategoryIds,
        },
      },
    });

    if (categoriesCount !== normalizedCategoryIds.length) {
      const error = new Error("Одна или несколько категорий не найдены");
      error.code = "CATEGORY_NOT_FOUND";
      throw error;
    }

    const author = await prisma.user.findUnique({
      where: {
        id: normalizedAuthorId,
      },
      select: {
        id: true,
      },
    });

    if (!author) {
      const error = new Error("Автор статьи не найден");
      error.code = "AUTHOR_NOT_FOUND";
      throw error;
    }

    const hasUzTranslation =
      Boolean(uz?.title?.trim()) && Boolean(uz?.content?.trim());

    const article = await prisma.article.create({
      data: {
        slug: normalizedSlug,
        categoryId: normalizedCategoryIds[0],
        authorId: normalizedAuthorId,
        status,
        coverImage: normalizeCoverImage(coverImage),
        isFeatured: Boolean(isFeatured),
        publishedAt: status === "published" ? new Date() : null,

        articleCategories: {
          create: normalizedCategoryIds.map((id) => ({
            categoryId: id,
          })),
        },

        translations: {
          create: [
            {
              locale: "ru",
              title: ru.title.trim(),
              excerpt: ru.excerpt?.trim() || null,
              content: ru.content.trim(),
              seoTitle: ru.seoTitle?.trim() || null,
              seoDescription: ru.seoDescription?.trim() || null,
              telegramEmbedUrl: ru.telegramEmbedUrl?.trim() || null,
              youtubeEmbedUrl: ru.youtubeEmbedUrl?.trim() || null,
            },

            ...(hasUzTranslation
              ? [
                  {
                    locale: "uz",
                    title: uz.title.trim(),
                    excerpt: uz.excerpt?.trim() || null,
                    content: uz.content.trim(),
                    seoTitle: uz.seoTitle?.trim() || null,
                    seoDescription: uz.seoDescription?.trim() || null,
                    telegramEmbedUrl:
                      uz.telegramEmbedUrl?.trim() || null,
                    youtubeEmbedUrl:
                      uz.youtubeEmbedUrl?.trim() || null,
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

    return {
      ...article,
      categories: article.articleCategories.map(
        (item) => item.category
      ),
      categoryIds: article.articleCategories.map(
        (item) => item.categoryId
      ),
    };
  }
}

export default new ArticleService();