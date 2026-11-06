import type { ThemeData } from "./themeTypes.ts";
import { parseThemeJsonFromText } from "./themeJsonParse.ts";
import { providerFetch } from "./providerHttp.ts";
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

  type Payload = Record<string, unknown>;

  // Newer OpenAI models reject `max_tokens` and a non-default `temperature`,
  // and some reject `response_format`. Start with the richest payload and
  // strip whatever the API objects to, retrying only when the payload
  // actually changed.
  let payload: Payload = {
    model,
    temperature: 0.4,
    max_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system" as const, content: THEME_SYSTEM_INSTRUCTION },
      { role: "user" as const, content }
    ]
  };

  let lastStatus = 0;
  let lastError = "";

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await providerFetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      },
      "OpenAI"
    );

    if (response.ok) {
      const ok = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const okText = ok?.choices?.[0]?.message?.content;
      if (!okText || typeof okText !== "string") {
        throw new Error("OpenAI returned an empty response.");
      }
      return parseThemeJsonFromText(okText);
    }

    lastStatus = response.status;
    lastError = await response.text();

    const adapted = adaptPayloadForError(payload, response.status, lastError);
    if (!adapted) {
      break;
    }
    payload = adapted;
  }

  throw new Error(buildOpenAIError(lastStatus, lastError));
}

/**
 * Returns a modified payload when the error names a parameter this model does
 * not accept, or `null` when there is nothing left to try. Returning `null`
 * matters: retrying an unchanged payload just burns a second request and
 * reports the same failure.
 */
function adaptPayloadForError(
  payload: Record<string, unknown>,
  status: number,
  errorText: string
): Record<string, unknown> | null {
  if (status !== 400) {
    return null;
  }

  const next = { ...payload };
  let changed = false;

  if ("max_tokens" in next && /max_tokens/i.test(errorText)) {
    if (/max_completion_tokens/i.test(errorText)) {
      next.max_completion_tokens = next.max_tokens;
    }
    delete next.max_tokens;
    changed = true;
  }

  if ("temperature" in next && /temperature/i.test(errorText)) {
    delete next.temperature;
    changed = true;
  }

  if ("response_format" in next && /response_format|json_object/i.test(errorText)) {
    delete next.response_format;
    changed = true;
  }

  return changed ? next : null;
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
