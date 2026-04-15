import { parseThemeJsonFromText } from "./themeJsonParse.ts";
import { buildThemePromptBundle, THEME_SYSTEM_INSTRUCTION } from "./themePromptBlocks.ts";
import type { ThemeData } from "./themeTypes.ts";

export interface ClaudeThemeParams {
  apiKey: string;
  model: string;
  appName: string;
  appDesc: string;
  colorPrefs: string;
  mode: string;
  images: string[];
}

type ClaudeContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

function dataUrlToClaudeBlock(url: string): ClaudeContentBlock {
  const m = url.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) {
    throw new Error("Invalid image data URL for Claude.");
  }
  const mediaType = m[1] === "image/jpg" ? "image/jpeg" : m[1];
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data: m[2] }
  };
}

export async function generateThemeWithClaude(params: ClaudeThemeParams): Promise<ThemeData> {
  const { apiKey, model, appName, appDesc, colorPrefs, mode, images } = params;
  const { combined } = buildThemePromptBundle(appName, appDesc, colorPrefs, mode);

  const content: ClaudeContentBlock[] = [{ type: "text", text: combined }];

  for (const img of images) {
    content.push(dataUrlToClaudeBlock(img));
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      temperature: 0.4,
      system: THEME_SYSTEM_INSTRUCTION,
      messages: [{ role: "user", content }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(buildClaudeError(response.status, err));
  }

  const data = (await response.json()) as { content?: { type?: string; text?: string }[] };
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  if (!text) {
    throw new Error("Claude returned an empty response.");
  }

  return parseThemeJsonFromText(text);
}

function buildClaudeError(status: number, raw: string) {
  if (status === 401) {
    return "Anthropic API key is invalid or missing.";
  }
  if (status === 429) {
    return "Claude rate limit reached. Try again shortly.";
  }
  const compact = raw.replace(/\s+/g, " ").slice(0, 280);
  return `Claude request failed (${status}). ${compact}`;
}
