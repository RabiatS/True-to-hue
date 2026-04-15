import type { ThemeData } from "./themeTypes.ts";
import { parseThemeJsonFromText } from "./themeJsonParse.ts";
import { buildThemePromptBundle, THEME_SYSTEM_INSTRUCTION } from "./themePromptBlocks.ts";

export type { ThemeData };

export interface OpenAIThemeParams {
  apiKey: string;
  model: string;
  appName: string;
  appDesc: string;
  colorPrefs: string;
  mode: string;
  images: string[];
}

export async function generateThemeWithOpenAI(params: OpenAIThemeParams): Promise<ThemeData> {
  const { apiKey, model, appName, appDesc, colorPrefs, mode, images } = params;

  const { combined } = buildThemePromptBundle(appName, appDesc, colorPrefs, mode);

  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: "text", text: combined }
  ];

  for (const img of images) {
    content.push({
      type: "image_url",
      image_url: { url: img }
    });
  }

  const basePayload = {
    model,
    temperature: 0.4,
    max_tokens: 4096,
    messages: [
      {
        role: "system" as const,
        content: THEME_SYSTEM_INSTRUCTION
      },
      {
        role: "user" as const,
        content
      }
    ]
  };

  let response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      ...basePayload,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const firstErrorText = await response.text();
    const maybeUnsupportedJsonFormat =
      response.status === 400 &&
      /response_format|json_object|unsupported/i.test(firstErrorText);

    if (maybeUnsupportedJsonFormat) {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(basePayload)
      });
    } else {
      throw new Error(buildOpenAIError(response.status, firstErrorText));
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(buildOpenAIError(response.status, errorText));
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("OpenAI returned an empty response.");
  }

  return parseThemeJsonFromText(text);
}

export function buildOpenAIError(status: number, rawError: string) {
  if (status === 401) {
    return "OpenAI API key is invalid or missing.";
  }
  if (status === 429) {
    return "OpenAI rate limit reached. Wait a moment and try again.";
  }
  if (status >= 500) {
    return "OpenAI service is temporarily unavailable. Please try again shortly.";
  }

  const compact = rawError.replace(/\s+/g, " ").slice(0, 280);
  return `OpenAI request failed (${status}). ${compact}`;
}
