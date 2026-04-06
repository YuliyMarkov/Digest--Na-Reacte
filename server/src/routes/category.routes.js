import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    res.json({
      ok: true,
      categories,
    });
  } catch (error) {
    console.error("GET /categories error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to load categories",
    });
  }
});

router.post("/categories", requireAuth, async (req, res) => {
  try {
    const { slug, nameRu, nameUz, sortOrder, isVisible } = req.body;

    if (!slug || !nameRu || !nameUz) {
      return res.status(400).json({
        ok: false,
        message: "slug, nameRu and nameUz are required",
      });
    }

    const category = await prisma.category.create({
      data: {
        slug,
        nameRu,
        nameUz,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        isVisible: typeof isVisible === "boolean" ? isVisible : true,
      },
    });

    res.status(201).json({
      ok: true,
      category,
    });
  } catch (error) {
    console.error("POST /categories error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to create category",
    });
  }
});

export default router;