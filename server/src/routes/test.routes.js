import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import aiService from "../services/ai.service.js";

const router = Router();

router.get("/db-test", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" },
    });

    res.json({
      ok: true,
      message: "Database connection works",
      categories,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: "Database request failed",
    });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    res.json({
      ok: true,
      users,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
    });
  }
});

router.get("/prompt", async (req, res) => {
  try {
    const prompt = await aiService.getCreateArticlePrompt();

    res.json({
      ok: true,
      prompt,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

router.post("/ai-article", async (req, res) => {
  try {
    const { text } = req.body;

    const article = await aiService.createArticle(text);

    res.json({
      ok: true,
      article,
    });
  } catch (error) {
    console.error("AI article test failed:", error);

    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

export default router;