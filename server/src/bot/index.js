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
  WAITING_RU_EDIT: "WAITING_RU_EDIT",
  WAITING_UZ_EDIT: "WAITING_UZ_EDIT",
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
 * Экранирует специальные HTML-символы.
 * Это не позволяет тексту от AI случайно превратиться в HTML-разметку.
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Преобразует обычный текст с абзацами в HTML,
 * который используется редактором и страницей статьи.
 *
 * Пустая строка между фрагментами создаёт новый <p>.
 * Одинарный перенос внутри абзаца превращается в <br>.
 */
function plainTextToHtml(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedText = value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!normalizedText) {
    return "";
  }

  /**
   * Не оборачиваем контент повторно, если AI или редактор
   * уже вернул полноценную HTML-разметку.
   */
  if (
    /<(?:p|div|h[1-6]|ul|ol|li|blockquote|br)\b[^>]*>/i.test(normalizedText)
  ) {
    return normalizedText;
  }

  return normalizedText
    .split(/\n\s*\n+/)
    .map((paragraph) => {
      const paragraphHtml = escapeHtml(paragraph.trim()).replace(/\n/g, "<br>");

      return `<p>${paragraphHtml}</p>`;
    })
    .join("\n");
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

/**
 * Форматирует русскую версию статьи для показа в Telegram.
 */
function formatArticle(article) {
  const breakingStatus = article.isBreaking ? "Да" : "Нет";

  return [
    "✅ Русская версия статьи подготовлена",
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

/**
 * Форматирует узбекскую версию статьи для показа в Telegram.
 */
function formatUzbekArticle(article) {
  const breakingStatus = article.isBreaking ? "Ha" : "Yo‘q";

  return [
    "🇺🇿 O‘zbekcha versiya tayyor",
    "",
    "📰 Sarlavha:",
    article.title,
    "",
    "📝 Qisqacha tavsif:",
    article.excerpt || "Ko‘rsatilmagan",
    "",
    "📄 Maqola matni:",
    article.content,
    "",
    "🔎 SEO sarlavha:",
    article.seoTitle || "Ko‘rsatilmagan",
    "",
    "📌 SEO tavsifi:",
    article.seoDescription || "Ko‘rsatilmagan",
    "",
    `🚨 Shoshilinch yangilik: ${breakingStatus}`,
  ].join("\n");
}

function formatPublicationPreview(session) {
  const translationStatus = session.uzArticle
    ? "✅ Узбекская версия готова"
    : "⚠️ Узбекская версия не создана";

  return [
    "✅ Всё готово к публикации",
    "",
    "📰 Заголовок:",
    session.article.title,
    "",
    "📝 Краткое описание:",
    session.article.excerpt || "Не указано",
    "",
    `🇺🇿 Перевод: ${translationStatus}`,
    "",
    `🖼 Обложка: ${session.imageUrl}`,
    "",
    `📂 Категория: ${session.category.nameRu}`,
    "",
    session.uzArticle
      ? "Новость будет опубликована на русском и узбекском языках."
      : "Новость будет опубликована только на русском языке.",
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

/**
 * Кнопки, которые отображаются сразу после подготовки статьи,
 * до добавления обложки и выбора категории.
 */
function getArticleActionsKeyboard(hasUzbekTranslation = false) {
  const keyboard = new InlineKeyboard();

  keyboard
    .text(
      hasUzbekTranslation
        ? "🔄 Перевести на узбекский заново"
        : "🌍 Перевести на узбекский",
      "article:translate_uz",
    )
    .row()
    .text("✏️ Изменить RU", "article:edit_ru");

  if (hasUzbekTranslation) {
    keyboard.text("✏️ Изменить UZ", "article:edit_uz").row();
  } else {
    keyboard.row();
  }

  keyboard
    .text("➡️ Добавить обложку", "article:add_image")
    .row()
    .text("❌ Отмена", "article:cancel");

  return keyboard;
}

/**
 * Кнопки, которые отображаются после добавления обложки
 * и выбора категории.
 */
function getReadyToPublishKeyboard(hasUzbekTranslation = false) {
  const keyboard = new InlineKeyboard();

  keyboard
    .text("🚀 Опубликовать", "article:publish")
    .row()
    .text(
      hasUzbekTranslation ? "🔄 Перевести UZ заново" : "🌍 Добавить перевод UZ",
      "article:translate_uz",
    )
    .row()
    .text("✏️ Изменить RU", "article:edit_ru");

  if (hasUzbekTranslation) {
    keyboard.text("✏️ Изменить UZ", "article:edit_uz").row();
  } else {
    keyboard.row();
  }

  keyboard
    .text("🖼 Сменить картинку", "article:change_image")
    .row()
    .text("📂 Сменить категорию", "article:change_category")
    .row()
    .text("❌ Отмена", "article:cancel");

  return keyboard;
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
    reply_markup: getReadyToPublishKeyboard(Boolean(session.uzArticle)),
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
        content: plainTextToHtml(session.article.content),
        seoTitle: session.article.seoTitle || null,
        seoDescription: session.article.seoDescription || null,
        telegramEmbedUrl: null,
        youtubeEmbedUrl: null,
      },

      uz: session.uzArticle
        ? {
            title: session.uzArticle.title,
            excerpt: session.uzArticle.excerpt || null,
            content: plainTextToHtml(session.uzArticle.content),
            seoTitle: session.uzArticle.seoTitle || null,
            seoDescription: session.uzArticle.seoDescription || null,
            telegramEmbedUrl: null,
            youtubeEmbedUrl: null,
          }
        : null,
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
        session.uzArticle
          ? "🇷🇺 Русская и 🇺🇿 узбекская версии опубликованы"
          : "🇷🇺 Опубликована только русская версия",
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
      reply_markup: getReadyToPublishKeyboard(Boolean(session.uzArticle)),
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

  /**
   * Перевод готовой русской статьи на узбекский язык.
   */
  telegramBot.callbackQuery("article:translate_uz", async (ctx) => {
    const session = getPublicationSession(ctx);

    if (!session?.article) {
      await ctx.answerCallbackQuery({
        text: "Сессия не найдена. Отправьте новость заново.",
        show_alert: true,
      });

      return;
    }

    if (session.step === SESSION_STEPS.PUBLISHING) {
      await ctx.answerCallbackQuery({
        text: "Сейчас выполняется публикация.",
        show_alert: true,
      });

      return;
    }

    if (session.isTranslating) {
      await ctx.answerCallbackQuery({
        text: "Перевод уже выполняется.",
      });

      return;
    }

    session.isTranslating = true;
    setPublicationSession(ctx, session);

    await ctx.answerCallbackQuery({
      text: session.uzArticle
        ? "Перевожу статью заново..."
        : "Перевожу статью...",
    });

    const processingMessage = await ctx.reply(
      "⏳ Перевожу статью на узбекский язык...",
    );

    try {
      const uzArticle = await aiService.translateArticleToUzbek(
        session.article,
      );

      session.uzArticle = uzArticle;
      session.isTranslating = false;

      setPublicationSession(ctx, session);

      await safelyDeleteMessage(ctx, processingMessage);

      const keyboard =
        session.step === SESSION_STEPS.READY_TO_PUBLISH
          ? getReadyToPublishKeyboard(true)
          : getArticleActionsKeyboard(true);

      await sendLongMessage(ctx, formatUzbekArticle(uzArticle), {
        reply_markup: keyboard,
      });

      if (session.step === SESSION_STEPS.READY_TO_PUBLISH) {
        await ctx.reply(
          "✅ Перевод сохранён. Теперь можно публиковать обе версии статьи.",
        );
      } else {
        await ctx.reply(
          [
            "✅ Перевод сохранён.",
            "",
            "Теперь можно добавить обложку и продолжить публикацию.",
          ].join("\n"),
        );
      }
    } catch (error) {
      console.error("Uzbek translation failed:", error);

      session.isTranslating = false;
      setPublicationSession(ctx, session);

      await safelyDeleteMessage(ctx, processingMessage);

      let message = "Не удалось перевести статью на узбекский язык.";

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

      const keyboard =
        session.step === SESSION_STEPS.READY_TO_PUBLISH
          ? getReadyToPublishKeyboard(Boolean(session.uzArticle))
          : getArticleActionsKeyboard(Boolean(session.uzArticle));

      await ctx.reply(`❌ ${message}`, {
        reply_markup: keyboard,
      });
    }
  });

  telegramBot.callbackQuery("article:edit_ru", async (ctx) => {
    const session = getPublicationSession(ctx);

    if (!session?.article) {
      await ctx.answerCallbackQuery({
        text: "Сессия не найдена.",
        show_alert: true,
      });

      return;
    }

    if (session.step === SESSION_STEPS.PUBLISHING) {
      await ctx.answerCallbackQuery({
        text: "Сейчас выполняется публикация.",
        show_alert: true,
      });

      return;
    }

    session.step = SESSION_STEPS.WAITING_RU_EDIT;
    setPublicationSession(ctx, session);

    await ctx.answerCallbackQuery();

    await ctx.reply(
      [
        "✏️ Что нужно изменить в русской версии?",
        "",
        "Например:",
        "• сократи текст",
        "• перепиши заголовок",
        "• сделай спокойнее",
        "• исправь ошибки",
        "• сделай SEO лучше",
      ].join("\n"),
    );
  });

  telegramBot.callbackQuery("article:edit_uz", async (ctx) => {
    const session = getPublicationSession(ctx);

    if (!session?.uzArticle) {
      await ctx.answerCallbackQuery({
        text: "Сначала создайте перевод.",
        show_alert: true,
      });

      return;
    }

    if (session.step === SESSION_STEPS.PUBLISHING) {
      await ctx.answerCallbackQuery({
        text: "Сейчас выполняется публикация.",
        show_alert: true,
      });

      return;
    }

    session.step = SESSION_STEPS.WAITING_UZ_EDIT;
    setPublicationSession(ctx, session);

    await ctx.answerCallbackQuery();

    await ctx.reply("✏️ Напишите, что нужно изменить в узбекской версии.");
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

    if (session?.step === SESSION_STEPS.WAITING_RU_EDIT) {
      const processingMessage = await ctx.reply(
        "⏳ Редактирую русскую версию...",
      );

      try {
        const article = await aiService.editArticle(
          session.article,
          sourceText,
        );

        session.article = article;

        session.step =
          session.imageUrl && session.category
            ? SESSION_STEPS.READY_TO_PUBLISH
            : SESSION_STEPS.WAITING_IMAGE;

        setPublicationSession(ctx, session);

        await safelyDeleteMessage(ctx, processingMessage);

        await sendLongMessage(ctx, formatArticle(article), {
          reply_markup:
            session.step === SESSION_STEPS.READY_TO_PUBLISH
              ? getReadyToPublishKeyboard(Boolean(session.uzArticle))
              : getArticleActionsKeyboard(Boolean(session.uzArticle)),
        });

        return;
      } catch (error) {
        console.error("Russian article editing failed:", error);

        session.step =
          session.imageUrl && session.category
            ? SESSION_STEPS.READY_TO_PUBLISH
            : SESSION_STEPS.WAITING_IMAGE;

        setPublicationSession(ctx, session);

        await safelyDeleteMessage(ctx, processingMessage);

        await ctx.reply(
          [
            "❌ Не удалось изменить статью.",
            "",
            error.message || "Неизвестная ошибка",
          ].join("\n"),
          {
            reply_markup:
              session.step === SESSION_STEPS.READY_TO_PUBLISH
                ? getReadyToPublishKeyboard(Boolean(session.uzArticle))
                : getArticleActionsKeyboard(Boolean(session.uzArticle)),
          },
        );

        return;
      }
    }

    if (session?.step === SESSION_STEPS.WAITING_UZ_EDIT) {
      const processingMessage = await ctx.reply(
        "⏳ Редактирую узбекскую версию...",
      );

      try {
        const article = await aiService.editUzbekArticle(
          session.uzArticle,
          sourceText,
        );

        session.uzArticle = article;

        session.step =
          session.imageUrl && session.category
            ? SESSION_STEPS.READY_TO_PUBLISH
            : SESSION_STEPS.WAITING_IMAGE;

        setPublicationSession(ctx, session);

        await safelyDeleteMessage(ctx, processingMessage);

        await sendLongMessage(ctx, formatUzbekArticle(article), {
          reply_markup:
            session.step === SESSION_STEPS.READY_TO_PUBLISH
              ? getReadyToPublishKeyboard(true)
              : getArticleActionsKeyboard(true),
        });

        return;
      } catch (error) {
        console.error("Uzbek article editing failed:", error);

        session.step =
          session.imageUrl && session.category
            ? SESSION_STEPS.READY_TO_PUBLISH
            : SESSION_STEPS.WAITING_IMAGE;

        setPublicationSession(ctx, session);

        await safelyDeleteMessage(ctx, processingMessage);

        await ctx.reply(
          [
            "❌ Не удалось изменить перевод.",
            "",
            error.message || "Неизвестная ошибка",
          ].join("\n"),
          {
            reply_markup:
              session.step === SESSION_STEPS.READY_TO_PUBLISH
                ? getReadyToPublishKeyboard(true)
                : getArticleActionsKeyboard(true),
          },
        );

        return;
      }
    }

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
            "",
            "Либо используйте кнопки под статьёй.",
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
      "⏳ Обрабатываю текст и готовлю русскую версию статьи...",
    );

    try {
      /**
       * На этом этапе создаётся только русская версия.
       * Узбекский перевод запускается отдельно по кнопке.
       */
      const article = await aiService.createArticle(sourceText);

      setPublicationSession(ctx, {
        step: SESSION_STEPS.WAITING_IMAGE,
        sourceText,
        article,
        uzArticle: null,
        imageUrl: null,
        category: null,
        isTranslating: false,
        createdAt: new Date(),
      });

      const formattedArticle = formatArticle(article);

      await sendLongMessage(ctx, formattedArticle, {
        reply_markup: getArticleActionsKeyboard(false),
      });

      await safelyDeleteMessage(ctx, processingMessage);

      await ctx.reply(
        [
          "Русская версия готова.",
          "",
          "Нажмите «Перевести на узбекский», чтобы создать и проверить перевод.",
          "После этого можно перейти к добавлению обложки.",
        ].join("\n"),
      );
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
