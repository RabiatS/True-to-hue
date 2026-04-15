import { jsonrepair } from "jsonrepair";

import type { ThemeData } from "./themeTypes.ts";

export function parseThemeJsonFromText(raw: string): ThemeData {
  const jsonText = extractJsonObject(raw);
  const parsed = parsePossiblyMalformedJson(jsonText);
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

function extractJsonObject(raw: string) {
  const start = raw.indexOf("{");
  if (start < 0) {
    throw new Error("Could not find JSON object in model output.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(start, i + 1);
      }
    }
  }

  if (depth > 0) {
    return raw.slice(start);
  }

  throw new Error("Could not parse JSON boundaries from model output.");
}

function parsePossiblyMalformedJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (firstError) {
    try {
      const repaired = jsonrepair(text);
      return JSON.parse(repaired);
    } catch (err) {
      const primary = firstError instanceof Error ? firstError.message : "Unknown JSON parse error";
      const repairedDetails = err instanceof Error ? err.message : "Unknown JSON repair error";
      throw new Error(`Could not parse theme JSON: ${primary} (repair failed: ${repairedDetails})`);
    }
  }
}
