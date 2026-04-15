import { parseThemeJsonFromText } from "./themeJsonParse.ts";
import { buildThemePromptBundle, THEME_SYSTEM_INSTRUCTION } from "./themePromptBlocks.ts";
import type { ThemeData } from "./themeTypes.ts";

export interface GeminiThemeParams {
  apiKey: string;
  model: string;
  appName: string;
  appDesc: string;
  colorPrefs: string;
  mode: string;
  images: string[];
}

function dataUrlToInlinePart(url: string): { inlineData: { mimeType: string; data: string } } {
  const m = url.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) {
    throw new Error("Invalid image data URL for Gemini.");
  }
  return { inlineData: { mimeType: m[1], data: m[2] } };
}

export async function generateThemeWithGemini(params: GeminiThemeParams): Promise<ThemeData> {
  const { apiKey, model, appName, appDesc, colorPrefs, mode, images } = params;
  const { combined } = buildThemePromptBundle(appName, appDesc, colorPrefs, mode);

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: `${THEME_SYSTEM_INSTRUCTION}\n\n${combined}` }
  ];

  for (const img of images) {
    parts.push(dataUrlToInlinePart(img));
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(buildGeminiError(response.status, err));
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(`Gemini: ${data.error.message}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return parseThemeJsonFromText(text);
}

function buildGeminiError(status: number, raw: string) {
  if (status === 400 || status === 403) {
    return "Gemini API key may be invalid or the model name is wrong. Check AI Studio key and model id.";
  }
  if (status === 429) {
    return "Gemini rate limit reached. Try again shortly.";
  }
  const compact = raw.replace(/\s+/g, " ").slice(0, 280);
  return `Gemini request failed (${status}). ${compact}`;
}
