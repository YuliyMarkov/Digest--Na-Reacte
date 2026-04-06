import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * GET все media items
 * Примеры:
 * /api/media
 * /api/media?type=reel
 * /api/media?visibleOnly=true
 */
router.get("/media", async (req, res) => {
  try {
    const { type, visibleOnly = "false" } = req.query;

    const mediaItems = await prisma.mediaItem.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(visibleOnly === "true" ? { isVisible: true } : {}),
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    res.json({
      ok: true,
      mediaItems,
    });
  } catch (error) {
    console.error("GET /media error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to load media items",
    });
  }
});

/**
 * GET один media item
 */
router.get("/media/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const mediaItem = await prisma.mediaItem.findUnique({
      where: { id: Number(id) },
    });

    if (!mediaItem) {
      return res.status(404).json({
        ok: false,
        message: "Media item not found",
      });
    }

    res.json({
      ok: true,
      mediaItem,
    });
  } catch (error) {
    console.error("GET /media/:id error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to load media item",
    });
  }
});

/**
 * POST создать media item
 */
router.post("/media", requireAuth, async (req, res) => {
  try {
    const {
      titleRu,
      titleUz,
      type,
      previewImage,
      videoUrl,
      sortOrder,
      isVisible,
    } = req.body;

    const normalizedPreviewImage =
      typeof previewImage === "string" && previewImage.trim()
        ? previewImage.trim()
        : null;

    const normalizedVideoUrl =
      typeof videoUrl === "string" ? videoUrl.trim() : "";

    if (!type || !normalizedVideoUrl) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields",
      });
    }

    const mediaItem = await prisma.mediaItem.create({
      data: {
        titleRu: titleRu || null,
        titleUz: titleUz || null,
        type,
        previewImage: normalizedPreviewImage,
        videoUrl: normalizedVideoUrl,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        isVisible: typeof isVisible === "boolean" ? isVisible : true,
      },
    });

    res.status(201).json({
      ok: true,
      mediaItem,
    });
  } catch (error) {
    console.error("POST /media error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to create media item",
    });
  }
});

/**
 * PUT обновить media item
 */
router.put("/media/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titleRu,
      titleUz,
      type,
      previewImage,
      videoUrl,
      sortOrder,
      isVisible,
    } = req.body;

    const mediaItemId = Number(id);

    const existingMediaItem = await prisma.mediaItem.findUnique({
      where: { id: mediaItemId },
    });

    if (!existingMediaItem) {
      return res.status(404).json({
        ok: false,
        message: "Media item not found",
      });
    }

    const normalizedPreviewImage =
      typeof previewImage === "string" && previewImage.trim()
        ? previewImage.trim()
        : null;

    const normalizedVideoUrl =
      typeof videoUrl === "string" ? videoUrl.trim() : "";

    if (!type || !normalizedVideoUrl) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields",
      });
    }

    const updatedMediaItem = await prisma.mediaItem.update({
      where: { id: mediaItemId },
      data: {
        titleRu: titleRu || null,
        titleUz: titleUz || null,
        type,
        previewImage: normalizedPreviewImage,
        videoUrl: normalizedVideoUrl,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        isVisible: typeof isVisible === "boolean" ? isVisible : true,
      },
    });

    res.json({
      ok: true,
      mediaItem: updatedMediaItem,
    });
  } catch (error) {
    console.error("PUT /media/:id error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to update media item",
    });
  }
});

/**
 * DELETE media item
 */
router.delete("/media/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.mediaItem.delete({
      where: { id: Number(id) },
    });

    res.json({
      ok: true,
      message: "Media item deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /media/:id error:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to delete media item",
    });
  }
});

export default router;