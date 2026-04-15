import { generateThemeWithOpenAI } from "@/shared/openaiThemeCore.ts";
import type { ColorChip, PreviewCard, ThemeData, ThemeVariation } from "@/shared/themeTypes.ts";

export type { ColorChip, PreviewCard, ThemeData, ThemeVariation };

export async function generateTheme(
  appName: string,
  appDesc: string,
  colorPrefs: string,
  mode: string,
  images: string[]
): Promise<ThemeData> {
  if (shouldUseTestMode(appName, appDesc, colorPrefs)) {
    return buildTestTheme(appName, appDesc, mode);
  }

  const themeApi = normalizeBaseUrl(import.meta.env.VITE_THEME_API_URL);
  if (themeApi) {
    return generateThemeViaProxy(themeApi, appName, appDesc, colorPrefs, mode, images);
  }

  if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
    return generateThemeWithOpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4.1-mini",
      appName,
      appDesc,
      colorPrefs,
      mode,
      images
    });
  }

  throw new Error(
    "Theme generation is not configured. For local dev, add VITE_OPENAI_API_KEY to .env.local (never commit secrets). " +
      "For the public site, deploy the server in /server (see .env.example), set OPENAI_API_KEY on the host only, " +
      "then add the VITE_THEME_API_URL repository variable in GitHub Actions to your proxy base URL."
  );
}

function normalizeBaseUrl(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t) {
    return undefined;
  }
  return t.replace(/\/$/, "");
}

async function generateThemeViaProxy(
  baseUrl: string,
  appName: string,
  appDesc: string,
  colorPrefs: string,
  mode: string,
  images: string[]
): Promise<ThemeData> {
  const res = await fetch(`${baseUrl}/generate-theme`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appName, appDesc, colorPrefs, mode, images })
  });

  const raw = await res.text();
  if (!res.ok) {
    let msg = `Theme API failed (${res.status}).`;
    try {
      const j = JSON.parse(raw) as { error?: string };
      if (j.error) {
        msg = j.error;
      }
    } catch {
      if (raw) {
        msg = `${msg} ${raw.slice(0, 200)}`;
      }
    }
    throw new Error(msg);
  }

  return JSON.parse(raw) as ThemeData;
}

function shouldUseTestMode(appName: string, appDesc: string, colorPrefs: string) {
  const triggers = ["!test", "#test", "!dev", "#dev", "7777", "0000", "tth-test"];
  return [appName, appDesc, colorPrefs].some((value) => startsWithAnyTrigger(value, triggers));
}

function startsWithAnyTrigger(value: string, triggers: string[]) {
  const normalized = (value || "").trim().toLowerCase();
  return triggers.some((trigger) => normalized.startsWith(trigger));
}

function buildTestTheme(appName: string, appDesc: string, mode: string): ThemeData {
  const isLight = String(mode).toUpperCase() === "LIGHT";
  const name = appName?.trim() ? `${appName.trim()} Tester` : "True to Hue Tester";

  const backgrounds = isLight
    ? [
        { name: "Paper", hex: "#F6F4EF", role: "Main page background" },
        { name: "Shell", hex: "#ECE8DF", role: "Secondary background" },
        { name: "Card", hex: "#FFFFFF", role: "Card surface" },
        { name: "Depth", hex: "#D9D2C3", role: "Dividers and low emphasis" },
      ]
    : [
        { name: "Void", hex: "#0A0A0A", role: "Main page background" },
        { name: "Obsidian", hex: "#141414", role: "Secondary background" },
        { name: "Card", hex: "#1E1E1E", role: "Card surface" },
        { name: "Depth", hex: "#2A2A2A", role: "Dividers and low emphasis" },
      ];

  const text = isLight
    ? [
        { name: "Ink", hex: "#171717", role: "Primary text" },
        { name: "Graphite", hex: "#383838", role: "Secondary text" },
        { name: "Smoke", hex: "#636363", role: "Muted text" },
        { name: "Inverse", hex: "#FFFFFF", role: "Text on dark accents" },
      ]
    : [
        { name: "Bone", hex: "#F5F5F0", role: "Primary text" },
        { name: "Pearl", hex: "#E8E8E3", role: "Secondary text" },
        { name: "Ash", hex: "#A0A09A", role: "Muted text" },
        { name: "Slate", hex: "#7A7A75", role: "Subdued text" },
      ];

  return {
    themeName: name,
    description: `Admin dev mode test palette generated locally with no API usage.${appDesc ? ` Input summary: ${appDesc.slice(0, 120)}` : ""}`,
    isTestMode: true,
    testModeLabel: "Admin Dev Mode · Local Tester (No API)",
    primaryAccentName: "Primary",
    primaryVariations: [
      { name: "Signal Ember", hex: "#A81C1C", description: "Strong action red", darkHex: "#6B0000", lightHex: "#E66565", bgHex: "#2A0C0C" },
      { name: "Warm Gold", hex: "#D59600", description: "Energetic highlight", darkHex: "#8A6200", lightHex: "#F0C75A", bgHex: "#2B1F05" },
      { name: "Royal Violet", hex: "#8B6AD9", description: "Creative authority", darkHex: "#5E45A8", lightHex: "#B49CEE", bgHex: "#211734" },
      { name: "Ocean Mint", hex: "#3EB489", description: "Balanced freshness", darkHex: "#2A8A61", lightHex: "#84D6B7", bgHex: "#0B241B" },
    ],
    secondaryAccentName: "Secondary",
    secondaryUsageRule: "Use the secondary accent sparingly for highlights, tags, and low-frequency interactions to preserve hierarchy.",
    secondaryVariations: [
      { name: "Soft Lilac", hex: "#B39DDB", description: "Gentle supportive tone", darkHex: "#7F6AA9", lightHex: "#D7CBEE", bgHex: "#1F1A2B" },
      { name: "Pastel Coral", hex: "#F4978E", description: "Warm and friendly cue", darkHex: "#C46D66", lightHex: "#F8C4BE", bgHex: "#2C1917" },
      { name: "Teal Mist", hex: "#73C6B6", description: "Calm data hint", darkHex: "#4D9186", lightHex: "#A3DDD2", bgHex: "#142523" },
      { name: "Sky Bloom", hex: "#8CB9FF", description: "Cool auxiliary accent", darkHex: "#5E85C2", lightHex: "#B8D3FF", bgHex: "#151F33" },
    ],
    previewCards: [
      { tag: "Test", title: "Local Mode Active", body: "This preview confirms your layout and exports without spending API credits." },
      { tag: "Workflow", title: "Fast Iteration", body: "Use this mode for UX, PDF, and export testing before real generation." },
      { tag: "Ready", title: "Switch To Live", body: "Remove trigger text to return to OpenAI-generated brand systems." },
    ],
    palette: {
      backgrounds,
      text,
      primary: [
        { name: "Crimson", hex: "#A81C1C", role: "Main brand color" },
        { name: "Sunset", hex: "#D59600", role: "Warm supporting brand" },
        { name: "Plum", hex: "#8B6AD9", role: "Creative support color" },
        { name: "Jade", hex: "#3EB489", role: "Fresh tertiary support" },
      ],
      secondary: [
        { name: "Lilac", hex: "#B39DDB", role: "Auxiliary accent" },
        { name: "Coral", hex: "#F4978E", role: "Soft signal accent" },
        { name: "Teal", hex: "#73C6B6", role: "Data/support accent" },
        { name: "Sky", hex: "#8CB9FF", role: "Info accent" },
      ],
    },
  };
}
