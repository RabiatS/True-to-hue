/** Shared text for all model providers (same constraints). */
export function buildThemePromptBundle(
  appName: string,
  appDesc: string,
  colorPrefs: string,
  mode: string
): { promptText: string; schemaHint: string; combined: string } {
  const promptText = `Design one production-ready color system.
Project: ${appName || "Untitled Project"}
Description: ${appDesc || "A modern creative project"}
Preferences: ${colorPrefs || "AI suggestions"}
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

  return {
    promptText,
    schemaHint,
    combined: `${promptText}\n\n${schemaHint}`
  };
}

export const THEME_SYSTEM_INSTRUCTION =
  "You are an expert color design-system assistant. Always return valid JSON only matching the requested schema with no markdown fences or commentary.";
