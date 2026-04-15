export type ThemeProviderId = "openai" | "gemini" | "anthropic";

export interface UserApiSettings {
  provider: ThemeProviderId;
  apiKey: string;
  /** Empty string = use default for provider */
  model: string;
}

const STORAGE_KEY = "true-to-hue-user-api-v1";

export function defaultModelFor(provider: ThemeProviderId): string {
  switch (provider) {
    case "openai":
      return "gpt-4.1-mini";
    case "gemini":
      return "gemini-2.0-flash";
    case "anthropic":
      return "claude-3-5-haiku-20241022";
  }
}

export function loadUserApiSettings(): UserApiSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const j = JSON.parse(raw) as Partial<UserApiSettings>;
    if (!j?.apiKey?.trim() || !j?.provider) {
      return null;
    }
    return {
      provider: j.provider,
      apiKey: j.apiKey.trim(),
      model: typeof j.model === "string" ? j.model : ""
    };
  } catch {
    return null;
  }
}

export function saveUserApiSettings(s: UserApiSettings): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      provider: s.provider,
      apiKey: s.apiKey.trim(),
      model: s.model?.trim() ?? ""
    })
  );
}

export function clearUserApiSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasUserApiKey(): boolean {
  return Boolean(loadUserApiSettings()?.apiKey?.trim());
}
