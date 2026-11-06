import { parseThemeJsonFromText } from "./themeJsonParse.ts";
import { providerFetch } from "./providerHttp.ts";
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

  const response = await providerFetch(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    },
    "Google Gemini"
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(buildGeminiError(response.status, err, model));
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

function buildGeminiError(status: number, raw: string, model: string) {
  const detail = extractGeminiMessage(raw);

  // 400 and 403 mean different things and must not be collapsed together:
  // reporting a wrong model id as a bad key sends people to regenerate a
  // key that was fine all along.
  if (status === 400) {
    if (/api[_ ]?key|api key not valid/i.test(raw)) {
      return `Gemini rejected the API key. Check the key from Google AI Studio.${detail ? ` (${detail})` : ""}`;
    }
    return `Gemini rejected the request${detail ? `: ${detail}` : "."} Model in use: "${model}".`;
  }
  if (status === 403) {
    return `Gemini denied access to this key${detail ? `: ${detail}` : "."} The key may lack permission or the API may not be enabled for its project.`;
  }
  if (status === 404) {
    return `Gemini has no model named "${model}". Change the model id in the API key dialog.`;
  }
  if (status === 429) {
    return "Gemini rate limit reached. Try again shortly.";
  }
  if (status >= 500) {
    return "Gemini is temporarily unavailable. Please try again shortly.";
  }
  return `Gemini request failed (${status}).${detail ? ` ${detail}` : ` ${raw.replace(/\s+/g, " ").slice(0, 280)}`}`;
}

/** Pull the human-readable message out of Google's error envelope. */
function extractGeminiMessage(raw: string): string {
  try {
    const j = JSON.parse(raw) as { error?: { message?: string } };
    const m = j?.error?.message;
    if (typeof m === "string" && m.trim()) {
      return m.replace(/\s+/g, " ").slice(0, 280);
    }
  } catch {
    // fall through to the raw text
  }
  return "";
}
