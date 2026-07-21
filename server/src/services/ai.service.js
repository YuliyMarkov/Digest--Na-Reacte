import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { openai } from "../lib/openai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promptPath = path.join(
  __dirname,
  "../../prompts/createArticle.md"
);

class AIService {
  async getCreateArticlePrompt() {
    return fs.readFile(promptPath, "utf8");
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
}

export default new AIService();