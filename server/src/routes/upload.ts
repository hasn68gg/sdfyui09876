import { Router } from "express";
import { authMiddleware, adminOnly } from "../lib/auth";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const router = Router();

// Simple base64 file upload endpoint (no external CDN needed)
router.post("/upload", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { base64, filename, mimeType } = req.body;

    if (!base64 || !filename) {
      res.status(400).json({ error: "base64 and filename required" });
      return;
    }

    // Decode base64
    const buffer = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ""), "base64");
    const ext = path.extname(filename) || ".png";
    const uniqueName = `${crypto.randomBytes(8).toString("hex")}${ext}`;

    // Store uploads at project root /uploads (served statically by Express)
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    // Return a URL path that would be served
    const url = `/assets/uploads/${uniqueName}`;
    res.json({ success: true, url });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
