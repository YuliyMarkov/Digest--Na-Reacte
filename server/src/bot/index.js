import { Bot, InlineKeyboard } from "grammy";
import { prisma } from "../lib/prisma.js";
import aiService from "../services/ai.service.js";
import articleService from "../services/article.service.js";

let telegramBot = null;

/**
 * Незавершённые публикации хранятся только в памяти процесса.
 * До нажатия кнопки «Опубликовать» в базу ничего не записывается.
 *
 * Ключ Map — Telegram ID пользователя.
 */
const publicationSessions = new Map();

const SESSION_STEPS = {
  WAITING_IMAGE: "WAITING_IMAGE",
  WAITING_CATEGORY: "WAITING_CATEGORY",
  READY_TO_PUBLISH: "READY_TO_PUBLISH",
  PUBLISHING: "PUBLISHING",
};

/**
 * Получает список Telegram ID, которым разрешён доступ.
 *
 * Пример:
 * TELEGRAM_ALLOWED_USER_IDS=123456789,987654321
 */
function getAllowedUserIds() {
  const rawIds = process.env.TELEGRAM_ALLOWED_USER_IDS || "";

  return rawIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function isUserAllowed(ctx) {
  const allowedUserIds = getAllowedUserIds();

  // Если список пустой, доступ закрыт для всех.
  if (allowedUserIds.length === 0) {
    return false;
  }

  const userId = String(ctx.from?.id || "");

  return allowedUserIds.includes(userId);
}

function getSessionKey(ctx) {
  return String(ctx.from?.id || "");
}

function getPublicationSession(ctx) {
  return publicationSessions.get(getSessionKey(ctx));
}

function setPublicationSession(ctx, session) {
  publicationSessions.set(getSessionKey(ctx), session);
}

function deletePublicationSession(ctx) {
  publicationSessions.delete(getSessionKey(ctx));
}

/**
 * ID пользователя из таблицы User, от имени которого бот создаёт статьи.
 *
 * В server/.env:
 * TELEGRAM_ARTICLE_AUTHOR_ID=1
 */
function getArticleAuthorId() {
  const authorId = Number(process.env.TELEGRAM_ARTICLE_AUTHOR_ID);

  if (!Number.isInteger(authorId) || authorId <= 0) {
    throw new Error(
      "TELEGRAM_ARTICLE_AUTHOR_ID не указан или имеет неверный формат",
    );
  }

  return authorId;
}

/**
 * Публичный адрес сайта.
 *
 * В server/.env:
 * PUBLIC_SITE_URL=https://digest-news.uz
 */
function getPublicSiteUrl() {
  return (process.env.PUBLIC_SITE_URL || "https://digest-news.uz").replace(
    /\/+$/,
    "",
  );
}

function normalizeImageUrl(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Простая транслитерация русского заголовка в slug.
 */
function transliterate(value) {
  const symbols = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  return String(value)
    .toLowerCase()
    .split("")
    .map((symbol) => symbols[symbol] ?? symbol)
    .join("");
}

function createBaseSlug(title) {
  const slug = transliterate(title)
    .replace(/['’`"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "")
    .slice(0, 100);

  return slug || `news-${Date.now()}`;
}

/**
 * Проверяет slug в базе и при необходимости добавляет -2, -3 и т. д.
 */
async function createUniqueSlug(title) {
  const baseSlug = createBaseSlug(title);

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existingArticle = await prisma.article.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existingArticle) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

function getCategoryDisplayName(category) {
  return category.nameRu || category.slug || `Категория ${category.id}`;
}

function formatArticle(article) {
  const breakingStatus = article.isBreaking ? "Да" : "Нет";

  return [
    "✅ Статья подготовлена",
    "",
    "📰 Заголовок:",
    article.title,
    "",
    "📝 Краткое описание:",
    article.excerpt || "Не указано",
    "",
    "📄 Текст статьи:",
    article.content,
    "",
    "🔎 SEO-заголовок:",
    article.seoTitle || "Не указан",
    "",
    "📌 SEO-описание:",
    article.seoDescription || "Не указано",
    "",
    `🚨 Срочная новость: ${breakingStatus}`,
  ].join("\n");
}

function formatPublicationPreview(session) {
  return [
    "✅ Всё готово к публикации",
    "",
    "📰 Заголовок:",
    session.article.title,
    "",
    "📝 Краткое описание:",
    session.article.excerpt || "Не указано",
    "",
    `🖼 Обложка: ${session.imageUrl}`,
    "",
    `📂 Категория: ${session.category.nameRu}`,
    "",
    "Новость будет сразу опубликована на сайте.",
  ].join("\n");
}

async function sendLongMessage(ctx, text, options = {}) {
  const telegramLimit = 4096;

  if (text.length <= telegramLimit) {
    await ctx.reply(text, options);
    return;
  }

  const chunks = [];
  let remainingText = text;

  while (remainingText.length > telegramLimit) {
    let splitIndex = remainingText.lastIndexOf("\n", telegramLimit);

    if (splitIndex <= 0) {
      splitIndex = telegramLimit;
    }

    chunks.push(remainingText.slice(0, splitIndex));

    remainingText = remainingText.slice(splitIndex).trimStart();
  }

  if (remainingText) {
    chunks.push(remainingText);
  }

  for (let index = 0; index < chunks.length; index += 1) {
    const isLastChunk = index === chunks.length - 1;

    await ctx.reply(chunks[index], isLastChunk ? options : {});
  }
}

async function safelyDeleteMessage(ctx, message) {
  if (!message?.chat?.id || !message?.message_id) {
    return;
  }

  try {
    await ctx.api.deleteMessage(message.chat.id, message.message_id);
  } catch (error) {
    console.warn("Не удалось удалить сообщение:", error.message);
  }
}

function getArticleActionsKeyboard() {
  return new InlineKeyboard()
    .text("➡️ Добавить обложку", "article:add_image")
    .row()
    .text("❌ Отмена", "article:cancel");
}

function getReadyToPublishKeyboard() {
  return new InlineKeyboard()
    .text("🚀 Опубликовать", "article:publish")
    .row()
    .text("🖼 Сменить картинку", "article:change_image")
    .row()
    .text("📂 Сменить категорию", "article:change_category")
    .row()
    .text("❌ Отмена", "article:cancel");
}

function getCategoriesKeyboard(categories) {
  const keyboard = new InlineKeyboard();

  categories.forEach((category, index) => {
    keyboard.text(
      getCategoryDisplayName(category),
      `article:category:${category.id}`,
    );

    if (index % 2 === 1) {
      keyboard.row();
    }
  });

  keyboard.row().text("❌ Отмена", "article:cancel");

  return keyboard;
}

async function loadCategories() {
  return prisma.category.findMany({
    where: {
      isVisible: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        id: "asc",
      },
    ],
  });
}

async function askForImageUrl(ctx) {
  const session = getPublicationSession(ctx);

  if (!session) {
    await ctx.reply("Сначала отправьте текст новости.");
    return;
  }

  session.step = SESSION_STEPS.WAITING_IMAGE;
  setPublicationSession(ctx, session);

  await ctx.reply(
    [
      "🖼 Пришлите публичную ссылку на изображение.",
      "",
      "Например:",
      "https://example.com/image.jpg",
      "",
      "Ссылка должна начинаться с http:// или https://",
    ].join("\n"),
  );
}

async function askForCategory(ctx) {
  const session = getPublicationSession(ctx);

  if (!session) {
    await ctx.reply("Сначала отправьте текст новости.");
    return;
  }

  const categories = await loadCategories();

  if (categories.length === 0) {
    await ctx.reply("❌ В базе нет доступных категорий.");
    return;
  }

  session.step = SESSION_STEPS.WAITING_CATEGORY;
  session.category = null;

  setPublicationSession(ctx, session);

  await ctx.reply("📂 Выберите категорию новости:", {
    reply_markup: getCategoriesKeyboard(categories),
  });
}

async function showPublicationPreview(ctx) {
  const session = getPublicationSession(ctx);

  if (!session?.article || !session?.imageUrl || !session?.category) {
    deletePublicationSession(ctx);

    await ctx.reply(
      [
        "❌ Не хватает данных для публикации.",
        "",
        "Отправьте исходный текст новости заново.",
      ].join("\n"),
    );

    return;
  }

  session.step = SESSION_STEPS.READY_TO_PUBLISH;
  setPublicationSession(ctx, session);

  await ctx.reply(formatPublicationPreview(session), {
    reply_markup: getReadyToPublishKeyboard(),
  });
}

async function publishArticle(ctx) {
  const session = getPublicationSession(ctx);

  if (!session) {
    await ctx.answerCallbackQuery({
      text: "Сессия не найдена. Отправьте новость заново.",
      show_alert: true,
    });

    return;
  }

  if (session.step === SESSION_STEPS.PUBLISHING) {
    await ctx.answerCallbackQuery({
      text: "Публикация уже выполняется.",
    });

    return;
  }

  if (!session.article || !session.imageUrl || !session.category?.id) {
    await ctx.answerCallbackQuery({
      text: "Не хватает данных для публикации.",
      show_alert: true,
    });

    return;
  }

  session.step = SESSION_STEPS.PUBLISHING;
  setPublicationSession(ctx, session);

  await ctx.answerCallbackQuery({
    text: "Публикую статью...",
  });

  const processingMessage = await ctx.reply("⏳ Публикую новость на сайте...");

  try {
    const authorId = getArticleAuthorId();
    const slug = await createUniqueSlug(session.article.title);

    const publishedArticle = await articleService.createArticle({
      slug,

      categoryIds: [session.category.id],

      authorId,
      status: "published",
      coverImage: session.imageUrl,
      isFeatured: false,

      ru: {
        title: session.article.title,
        excerpt: session.article.excerpt || null,
        content: session.article.content,
        seoTitle: session.article.seoTitle || null,
        seoDescription: session.article.seoDescription || null,
        telegramEmbedUrl: null,
        youtubeEmbedUrl: null,
      },

      uz: null,
    });

    deletePublicationSession(ctx);
    await safelyDeleteMessage(ctx, processingMessage);

    const articleUrl = `${getPublicSiteUrl()}/news/${publishedArticle.slug}`;

    await ctx.reply(
      [
        "✅ Новость опубликована",
        "",
        publishedArticle.translations?.find(
          (translation) => translation.locale === "ru",
        )?.title || session.article.title,
        "",
        `🔗 ${articleUrl}`,
      ].join("\n"),
      {
        reply_markup: new InlineKeyboard().url(
          "🌐 Открыть новость",
          articleUrl,
        ),
      },
    );
  } catch (error) {
    console.error("Telegram article publication failed:", error);

    session.step = SESSION_STEPS.READY_TO_PUBLISH;

    setPublicationSession(ctx, session);

    await safelyDeleteMessage(ctx, processingMessage);

    let message = "Не удалось опубликовать статью.";

    if (error.code === "AUTHOR_NOT_FOUND") {
      message = "Автор статьи не найден. Проверьте TELEGRAM_ARTICLE_AUTHOR_ID.";
    } else if (error.code === "CATEGORY_NOT_FOUND") {
      message = "Выбранная категория больше не существует.";
    } else if (error.code === "SLUG_ALREADY_EXISTS") {
      message =
        "Статья с таким адресом уже существует. Попробуйте опубликовать ещё раз.";
    } else if (error.message) {
      message += `\n\nОшибка: ${error.message}`;
    }

    await ctx.reply(`❌ ${message}`, {
      reply_markup: getReadyToPublishKeyboard(),
    });
  }
}

export function getTelegramBot() {
  if (telegramBot) {
    return telegramBot;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN не указан в server/.env");
  }

  telegramBot = new Bot(token);

  telegramBot.catch((error) => {
    console.error("Telegram bot error:", error.error);
  });

  /**
   * Проверка доступа.
   */
  telegramBot.use(async (ctx, next) => {
    if (!ctx.from) {
      return;
    }

    if (!isUserAllowed(ctx)) {
      console.warn(
        `Telegram access denied: user_id=${ctx.from.id}, username=@${
          ctx.from.username || "unknown"
        }`,
      );

      await ctx.reply(
        [
          "⛔ У вас нет доступа к этому боту.",
          "",
          `Ваш Telegram ID: ${ctx.from.id}`,
        ].join("\n"),
      );

      return;
    }

    await next();
  });

  telegramBot.command("start", async (ctx) => {
    await ctx.reply(
      [
        "Привет! Это бот управления Digest News.",
        "",
        "Отправьте текст новости, Telegram-пост, пресс-релиз или заметку.",
        "Я подготовлю статью и помогу сразу опубликовать её на сайте.",
        "",
        "Команды:",
        "/id — показать Telegram ID",
        "/cancel — отменить текущую публикацию",
      ].join("\n"),
    );
  });

  telegramBot.command("id", async (ctx) => {
    await ctx.reply(`Ваш Telegram ID: ${ctx.from.id}`);
  });

  telegramBot.command("cancel", async (ctx) => {
    const session = getPublicationSession(ctx);

    if (!session) {
      await ctx.reply("Сейчас нет незавершённой публикации.");
      return;
    }

    deletePublicationSession(ctx);

    await ctx.reply(
      [
        "❌ Публикация отменена.",
        "",
        "Можете отправить текст новой новости.",
      ].join("\n"),
    );
  });

  telegramBot.callbackQuery("article:add_image", async (ctx) => {
    await ctx.answerCallbackQuery();
    await askForImageUrl(ctx);
  });

  telegramBot.callbackQuery("article:change_image", async (ctx) => {
    await ctx.answerCallbackQuery();
    await askForImageUrl(ctx);
  });

  telegramBot.callbackQuery("article:change_category", async (ctx) => {
    await ctx.answerCallbackQuery();

    try {
      await askForCategory(ctx);
    } catch (error) {
      console.error("Failed to load categories:", error);

      await ctx.reply(
        [
          "❌ Не удалось загрузить категории.",
          "",
          error.message ? `Ошибка: ${error.message}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
  });

  telegramBot.callbackQuery("article:cancel", async (ctx) => {
    deletePublicationSession(ctx);

    await ctx.answerCallbackQuery({
      text: "Публикация отменена",
    });

    await ctx.reply(
      [
        "❌ Публикация отменена.",
        "",
        "Можете отправить текст новой новости.",
      ].join("\n"),
    );
  });

  telegramBot.callbackQuery(/^article:category:(\d+)$/, async (ctx) => {
    const session = getPublicationSession(ctx);

    if (!session) {
      await ctx.answerCallbackQuery({
        text: "Сессия не найдена. Отправьте новость заново.",
        show_alert: true,
      });

      return;
    }

    const categoryId = Number(ctx.match[1]);

    try {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          isVisible: true,
        },
      });

      if (!category) {
        await ctx.answerCallbackQuery({
          text: "Категория не найдена или скрыта.",
          show_alert: true,
        });

        return;
      }

      session.category = {
        id: category.id,
        slug: category.slug,
        nameRu: category.nameRu,
        nameUz: category.nameUz,
      };

      setPublicationSession(ctx, session);

      await ctx.answerCallbackQuery({
        text: `Выбрана категория: ${category.nameRu}`,
      });

      await showPublicationPreview(ctx);
    } catch (error) {
      console.error("Telegram category selection failed:", error);

      await ctx.answerCallbackQuery({
        text: "Не удалось выбрать категорию.",
        show_alert: true,
      });
    }
  });

  telegramBot.callbackQuery("article:publish", async (ctx) => {
    await publishArticle(ctx);
  });

  telegramBot.on("message:text", async (ctx) => {
    const sourceText = ctx.message.text.trim();

    if (!sourceText) {
      await ctx.reply("Пришлите текст новости.");
      return;
    }

    if (sourceText.startsWith("/")) {
      return;
    }

    const session = getPublicationSession(ctx);

    /**
     * Бот ожидает ссылку на обложку.
     */
    if (session?.step === SESSION_STEPS.WAITING_IMAGE) {
      const imageUrl = normalizeImageUrl(sourceText);

      if (!isValidHttpUrl(imageUrl)) {
        await ctx.reply(
          [
            "❌ Это не похоже на корректную ссылку.",
            "",
            "Пришлите публичную ссылку, начинающуюся с http:// или https://",
          ].join("\n"),
        );

        return;
      }

      session.imageUrl = imageUrl;
      setPublicationSession(ctx, session);

      await ctx.reply("✅ Ссылка на обложку сохранена.");

      try {
        await askForCategory(ctx);
      } catch (error) {
        console.error("Failed to load categories:", error);

        await ctx.reply(
          [
            "❌ Не удалось загрузить категории.",
            "",
            error.message ? `Ошибка: ${error.message}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        );
      }

      return;
    }

    /**
     * Пока бот ждёт выбора категории или публикации,
     * новый текст не запускает новую генерацию.
     */
    if (
      session?.step === SESSION_STEPS.WAITING_CATEGORY ||
      session?.step === SESSION_STEPS.READY_TO_PUBLISH ||
      session?.step === SESSION_STEPS.PUBLISHING
    ) {
      await ctx.reply(
        [
          "Сейчас уже готовится другая публикация.",
          "",
          "Используйте кнопки под сообщением или команду /cancel.",
        ].join("\n"),
      );

      return;
    }

    if (sourceText.length < 20) {
      await ctx.reply(
        "Текст слишком короткий. Пришлите полноценную новость или заметку.",
      );

      return;
    }

    const processingMessage = await ctx.reply(
      "⏳ Обрабатываю текст и готовлю статью...",
    );

    try {
      const article = await aiService.createArticle(sourceText);

      const uzArticle = await aiService.translateArticleToUzbek(article);

      setPublicationSession(ctx, {
        step: SESSION_STEPS.WAITING_IMAGE,
        sourceText,
        article,
        uzArticle,
        imageUrl: null,
        category: null,
        createdAt: new Date(),
      });

      const formattedArticle = formatArticle(article);

      await sendLongMessage(ctx, formattedArticle, {
        reply_markup: getArticleActionsKeyboard(),
      });

      await safelyDeleteMessage(ctx, processingMessage);

      await ctx.reply("Теперь пришлите ссылку на изображение для обложки.");
    } catch (error) {
      console.error("Telegram AI article generation failed:", error);

      await safelyDeleteMessage(ctx, processingMessage);

      let message = "Не удалось подготовить статью.";

      if (error.status === 429 || String(error.message).includes("429")) {
        message =
          "OpenAI временно отклонил запрос из-за лимита или отсутствия доступного баланса.";
      } else if (
        error.status === 401 ||
        String(error.message).includes("401")
      ) {
        message = "Ошибка авторизации OpenAI. Проверьте API-ключ.";
      } else if (error.message) {
        message += `\n\nОшибка: ${error.message}`;
      }

      await ctx.reply(`❌ ${message}`);
    }
  });

  telegramBot.on("message", async (ctx) => {
    const session = getPublicationSession(ctx);

    if (session?.step === SESSION_STEPS.WAITING_IMAGE) {
      await ctx.reply(
        "Пришлите ссылку на изображение обычным текстовым сообщением.",
      );

      return;
    }

    await ctx.reply(
      "Пока я обрабатываю только текстовые сообщения. Пришлите текст новости.",
    );
  });

  return telegramBot;
}

export async function startTelegramBot() {
  const bot = getTelegramBot();

  console.log("Telegram bot is starting...");

  await bot.start({
    onStart: (botInfo) => {
      console.log(`Telegram bot @${botInfo.username} started`);
    },
  });
}
