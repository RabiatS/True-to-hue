import { providerFetch } from "@/shared/providerHttp.ts";
import { defaultModelFor, type ThemeProviderId } from "./userApiSettings.ts";

export interface KeyTestResult {
  ok: boolean;
  message: string;
}

/**
 * Verifies a key against the provider before the user commits to a full
 * generation. Each provider is checked with a single cheap metadata read of
 * the exact model that will be used, so a bad key and a bad model id produce
 * different, accurate messages instead of one vague failure at generate time.
 */
export async function testApiKey(
  provider: ThemeProviderId,
  apiKey: string,
  modelInput: string
): Promise<KeyTestResult> {
  const key = apiKey.trim();
  const model = modelInput.trim() || defaultModelFor(provider);

  if (!key) {
    return { ok: false, message: "Paste an API key first." };
  }

  try {
    if (provider === "openai") {
      return await testOpenAI(key, model);
    }
    if (provider === "gemini") {
      return await testGemini(key, model);
    }
    return await testAnthropic(key, model);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not reach the provider."
    };
  }
}

async function testOpenAI(key: string, model: string): Promise<KeyTestResult> {
  const res = await providerFetch(
    `https://api.openai.com/v1/models/${encodeURIComponent(model)}`,
    { headers: { Authorization: `Bearer ${key}` } },
    "OpenAI"
  );

  if (res.ok) {
    return { ok: true, message: `Key works. Model "${model}" is available.` };
  }
  if (res.status === 401) {
    return { ok: false, message: "OpenAI rejected this key. Check for a typo or an expired key." };
  }
  if (res.status === 404) {
    return {
      ok: false,
      message: `Key works, but your account has no model named "${model}". Try a different model id.`
    };
  }
  if (res.status === 429) {
    return { ok: false, message: "OpenAI rate limit hit while testing. Try again shortly." };
  }
  return { ok: false, message: `OpenAI returned ${res.status} while testing the key.` };
}

async function testGemini(key: string, model: string): Promise<KeyTestResult> {
  const res = await providerFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}?key=${encodeURIComponent(key)}`,
    {},
    "Google Gemini"
  );

  if (res.ok) {
    return { ok: true, message: `Key works. Model "${model}" is available.` };
  }
  if (res.status === 404) {
    return {
      ok: false,
      message: `Key works, but Gemini has no model named "${model}". Try a different model id.`
    };
  }
  if (res.status === 400 || res.status === 403) {
    return {
      ok: false,
      message: "Gemini rejected this key. Check the key from Google AI Studio and that the API is enabled."
    };
  }
  if (res.status === 429) {
    return { ok: false, message: "Gemini rate limit hit while testing. Try again shortly." };
  }
  return { ok: false, message: `Gemini returned ${res.status} while testing the key.` };
}

async function testAnthropic(key: string, model: string): Promise<KeyTestResult> {
  const res = await providerFetch(
    `https://api.anthropic.com/v1/models/${encodeURIComponent(model)}`,
    {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      }
    },
    "Claude (Anthropic)"
  );

  if (res.ok) {
    return { ok: true, message: `Key works. Model "${model}" is available.` };
  }
  if (res.status === 401) {
    return { ok: false, message: "Anthropic rejected this key. Check for a typo or an expired key." };
  }
  if (res.status === 404) {
    return {
      ok: false,
      message: `Key works, but Anthropic has no model named "${model}". Try a different model id.`
    };
  }
  if (res.status === 429) {
    return { ok: false, message: "Anthropic rate limit hit while testing. Try again shortly." };
  }
  return { ok: false, message: `Anthropic returned ${res.status} while testing the key.` };
}
