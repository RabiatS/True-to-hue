function getOpenAIConfig() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4.1-mini";
  if (!apiKey) {
    throw new Error("Missing VITE_OPENAI_API_KEY. Add it to .env.local and restart the dev server.");
  }
  return { apiKey, model };
}

export interface ThemeVariation {
  name: string;
  hex: string;
  description: string;
  darkHex: string;
  lightHex: string;
  bgHex: string;
}

export interface ColorChip {
  name: string;
  hex: string;
  role: string;
}

export interface PreviewCard {
  tag: string;
  title: string;
  body: string;
}

export interface ThemeData {
  themeName: string;
  description: string;
  primaryAccentName: string;
  primaryVariations: ThemeVariation[];
  secondaryAccentName: string;
  secondaryUsageRule: string;
  secondaryVariations: ThemeVariation[];
  previewCards: PreviewCard[];
  palette: {
    backgrounds: ColorChip[];
    text: ColorChip[];
    primary: ColorChip[];
    secondary: ColorChip[];
  };
}

export async function generateTheme(appName: string, appDesc: string, colorPrefs: string, mode: string, images: string[]): Promise<ThemeData> {
  const { apiKey, model } = getOpenAIConfig();

  const promptText = `Design one production-ready color system.
Project: ${appName || 'Untitled Project'}
Description: ${appDesc || 'A modern creative project'}
Preferences: ${colorPrefs || 'AI suggestions'}
Mode: ${mode}

Priority: explicit user color/hex preferences > project tone > cohesion/accessibility > naming.
Use dark-first backgrounds for DARK mode and light-first backgrounds for LIGHT mode.
Keep practical UI contrast and readable body text.
Primary accent should lead visually; secondary should be intentionally rarer.`;

  const schemaHint = `Return JSON only with this shape:
{
  "themeName":"string",
  "description":"string",
  "primaryAccentName":"string",
  "primaryVariations":[{"name":"string","hex":"#000000","description":"string","darkHex":"#000000","lightHex":"#000000","bgHex":"#000000"}],
  "secondaryAccentName":"string",
  "secondaryUsageRule":"string",
  "secondaryVariations":[{"name":"string","hex":"#000000","description":"string","darkHex":"#000000","lightHex":"#000000","bgHex":"#000000"}],
  "previewCards":[{"tag":"string","title":"string","body":"string"}],
  "palette":{
    "backgrounds":[{"name":"string","hex":"#000000","role":"string"}],
    "text":[{"name":"string","hex":"#000000","role":"string"}],
    "primary":[{"name":"string","hex":"#000000","role":"string"}],
    "secondary":[{"name":"string","hex":"#000000","role":"string"}]
  }
}
Constraints:
- exactly 4 items in primaryVariations and secondaryVariations
- exactly 3 previewCards
- exactly 4 items in each palette category
- use full #RRGGBB hex values
- names/roles must be specific`;

  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: "text", text: `${promptText}\n\n${schemaHint}` }
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
    max_tokens: 1400,
    messages: [
      {
        role: "system" as const,
        content: "You are an expert color design-system assistant. Always return valid JSON only."
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

    // Some models reject json_object response_format; retry once without it.
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
      throw new Error(buildRequestError(response.status, firstErrorText));
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(buildRequestError(response.status, errorText));
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("OpenAI returned an empty response.");
  }

  return parseThemeData(text);
}

function parseThemeData(raw: string): ThemeData {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Could not parse JSON from model output.");
  }
  const parsed = JSON.parse(raw.slice(start, end + 1));
  validateThemeData(parsed);
  return parsed as ThemeData;
}

function validateThemeData(parsed: unknown) {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model response was not valid JSON object data.");
  }

  const p = parsed as Partial<ThemeData>;
  if (!p.themeName || !p.description || !p.palette) {
    throw new Error("Theme response is missing required fields.");
  }

  const pri = p.primaryVariations;
  const sec = p.secondaryVariations;
  const cards = p.previewCards;
  const pal = p.palette;

  if (!Array.isArray(pri) || pri.length !== 4) {
    throw new Error("Theme response had invalid primary variations.");
  }
  if (!Array.isArray(sec) || sec.length !== 4) {
    throw new Error("Theme response had invalid secondary variations.");
  }
  if (!Array.isArray(cards) || cards.length !== 3) {
    throw new Error("Theme response had invalid preview cards.");
  }
  if (
    !pal ||
    !Array.isArray(pal.backgrounds) || pal.backgrounds.length !== 4 ||
    !Array.isArray(pal.text) || pal.text.length !== 4 ||
    !Array.isArray(pal.primary) || pal.primary.length !== 4 ||
    !Array.isArray(pal.secondary) || pal.secondary.length !== 4
  ) {
    throw new Error("Theme response had invalid palette groups.");
  }
}

function buildRequestError(status: number, rawError: string) {
  if (status === 401) {
    return "OpenAI API key is invalid or missing. Set VITE_OPENAI_API_KEY in .env.local and restart the app.";
  }
  if (status === 429) {
    return "OpenAI rate limit reached. Wait a moment and try again.";
  }
  if (status >= 500) {
    return "OpenAI service is temporarily unavailable. Please try again shortly.";
  }

  const compact = rawError.replace(/\s+/g, " ").slice(0, 280);
  return `Theme generation request failed (${status}). ${compact}`;
}
