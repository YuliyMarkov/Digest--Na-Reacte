import { Router } from "express";
import { prisma } from "../lib/prisma.js";

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

export default router;