import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { openai } from "../lib/openai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promptPath = path.join(
  __dirname,
  "../../prompts/createArticle.md",
);

const translatePromptPath = path.join(
  __dirname,
  "../../prompts/translateArticleToUzbek.md",
);

const editArticlePromptPath = path.join(
  __dirname,
  "../../prompts/editArticle.md",
);

const editUzbekArticlePromptPath = path.join(
  __dirname,
  "../../prompts/editUzbekArticle.md",
);

class AIService {
  async getCreateArticlePrompt() {
    return fs.readFile(promptPath, "utf8");
  }

  async getTranslateArticlePrompt() {
    return fs.readFile(translatePromptPath, "utf8");
  }

  async getEditArticlePrompt() {
    return fs.readFile(editArticlePromptPath, "utf8");
  }

  async getEditUzbekArticlePrompt() {
    return fs.readFile(editUzbekArticlePromptPath, "utf8");
  }

  getArticleSchema({ includeBreaking = true } = {}) {
    const properties = {
      title: {
        type: "string",
      },
      excerpt: {
        type: "string",
      },
      content: {
        type: "string",
      },
      seoTitle: {
        type: "string",
      },
      seoDescription: {
        type: "string",
      },
    };

    const required = [
      "title",
      "excerpt",
      "content",
      "seoTitle",
      "seoDescription",
    ];

    if (includeBreaking) {
      properties.isBreaking = {
        type: "boolean",
      };

      required.push("isBreaking");
    }

    return {
      type: "object",
      additionalProperties: false,
      properties,
      required,
    };
  }

  parseResponse(response, emptyMessage, invalidJsonMessage) {
    if (!response.output_text) {
      throw new Error(emptyMessage);
    }

    try {
      return JSON.parse(response.output_text);
    } catch (error) {
      console.error(
        "Не удалось разобрать ответ OpenAI:",
        response.output_text,
      );

      throw new Error(invalidJsonMessage);
    }
  }

  async createArticle(sourceText) {
    if (!sourceText || !sourceText.trim()) {
      throw new Error("Исходный текст новости не передан");
    }

    const instructions = await this.getCreateArticlePrompt();

    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      instructions,
      input: sourceText.trim(),
      text: {
        format: {
          type: "json_schema",
          name: "digest_news_article",
          strict: true,
          schema: this.getArticleSchema({
            includeBreaking: true,
          }),
        },
      },
    });

    return this.parseResponse(
      response,
      "OpenAI вернул пустой ответ",
      "OpenAI вернул некорректный JSON",
    );
  }

  async translateArticleToUzbek(article) {
    if (!article) {
      throw new Error("Статья для перевода не передана");
    }

    const instructions = await this.getTranslateArticlePrompt();

    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      instructions,
      input: JSON.stringify({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
      }),
      text: {
        format: {
          type: "json_schema",
          name: "digest_news_article_translation",
          strict: true,
          schema: this.getArticleSchema({
            includeBreaking: false,
          }),
        },
      },
    });

    return this.parseResponse(
      response,
      "OpenAI вернул пустой перевод",
      "OpenAI вернул некорректный JSON перевода",
    );
  }

  async editArticle(article, instruction) {
    if (!article) {
      throw new Error("Статья для редактирования не передана");
    }

    if (!instruction || !instruction.trim()) {
      throw new Error("Инструкция для редактирования не передана");
    }

    const instructions = await this.getEditArticlePrompt();

    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      instructions,
      input: JSON.stringify(
        {
          instruction: instruction.trim(),
          article: {
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            seoTitle: article.seoTitle,
            seoDescription: article.seoDescription,
            isBreaking: Boolean(article.isBreaking),
          },
        },
        null,
        2,
      ),
      text: {
        format: {
          type: "json_schema",
          name: "digest_news_article_edited",
          strict: true,
          schema: this.getArticleSchema({
            includeBreaking: true,
          }),
        },
      },
    });

    return this.parseResponse(
      response,
      "OpenAI вернул пустую отредактированную статью",
      "OpenAI вернул некорректный JSON отредактированной статьи",
    );
  }

  async editUzbekArticle(article, instruction) {
    if (!article) {
      throw new Error(
        "Узбекская статья для редактирования не передана",
      );
    }

    if (!instruction || !instruction.trim()) {
      throw new Error("Инструкция для редактирования не передана");
    }

    const instructions = await this.getEditUzbekArticlePrompt();

    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      instructions,
      input: JSON.stringify(
        {
          instruction: instruction.trim(),
          article: {
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            seoTitle: article.seoTitle,
            seoDescription: article.seoDescription,
          },
        },
        null,
        2,
      ),
      text: {
        format: {
          type: "json_schema",
          name: "digest_news_uzbek_article_edited",
          strict: true,
          schema: this.getArticleSchema({
            includeBreaking: false,
          }),
        },
      },
    });

    return this.parseResponse(
      response,
      "OpenAI вернул пустую отредактированную узбекскую статью",
      "OpenAI вернул некорректный JSON отредактированной узбекской статьи",
    );
  }
}

export default new AIService();