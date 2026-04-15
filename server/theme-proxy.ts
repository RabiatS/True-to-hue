/**
 * Theme API proxy: OpenAI key lives in OPENAI_API_KEY (never VITE_*).
 * Deploy separately (Fly, Railway, Render) and point the static site's VITE_THEME_API_URL here.
 */
import "dotenv/config";
import express from "express";
import { generateThemeWithOpenAI } from "../shared/openaiThemeCore.ts";

const app = express();
const port = Number(process.env.PORT) || 8787;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "25mb" }));

function originAllowed(req: express.Request): boolean {
  const allowList = process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowList?.length) {
    return true;
  }

  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const candidate = origin || referer;
  if (!candidate) {
    return false;
  }

  return allowList.some((prefix) => candidate.startsWith(prefix));
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/generate-theme", async (req, res) => {
  if (!originAllowed(req)) {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server missing OPENAI_API_KEY" });
    return;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const { appName, appDesc, colorPrefs, mode, images } = req.body as {
    appName?: string;
    appDesc?: string;
    colorPrefs?: string;
    mode?: string;
    images?: string[];
  };

  try {
    const theme = await generateThemeWithOpenAI({
      apiKey,
      model,
      appName: appName ?? "",
      appDesc: appDesc ?? "",
      colorPrefs: colorPrefs ?? "",
      mode: mode ?? "DARK",
      images: Array.isArray(images) ? images : []
    });
    res.json(theme);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Theme generation failed";
    res.status(502).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Theme proxy listening on http://localhost:${port}`);
});
