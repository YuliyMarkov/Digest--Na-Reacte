import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY не найден в server/.env");
}

export const openai = new OpenAI({
  apiKey,
});