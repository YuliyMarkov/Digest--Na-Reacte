import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { openai } from "../lib/openai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promptPath = path.join(__dirname, "../../prompts/createArticle.md");

const translatePromptPath = path.join(
  __dirname,
  "../../prompts/translateArticleToUzbek.md",
);

class AIService {
  async getCreateArticlePrompt() {
    return fs.readFile(promptPath, "utf8");
  }

  async getTranslateArticlePrompt() {
    return fs.readFile(translatePromptPath, "utf8");
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
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
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
              isBreaking: {
                type: "boolean",
              },
            },
            required: [
              "title",
              "excerpt",
              "content",
              "seoTitle",
              "seoDescription",
              "isBreaking",
            ],
          },
        },
      },
    });

    if (!response.output_text) {
      throw new Error("OpenAI вернул пустой ответ");
    }

    try {
      return JSON.parse(response.output_text);
    } catch (error) {
      console.error("Не удалось разобрать ответ OpenAI:", response.output_text);
      throw new Error("OpenAI вернул некорректный JSON");
    }
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
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
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
            },
            required: [
              "title",
              "excerpt",
              "content",
              "seoTitle",
              "seoDescription",
            ],
          },
        },
      },
    });

    if (!response.output_text) {
      throw new Error("OpenAI вернул пустой перевод");
    }

    try {
      return JSON.parse(response.output_text);
    } catch (error) {
      console.error(
        "Не удалось разобрать перевод OpenAI:",
        response.output_text,
      );

      throw new Error("OpenAI вернул некорректный JSON перевода");
    }
  }
}

export default new AIService();