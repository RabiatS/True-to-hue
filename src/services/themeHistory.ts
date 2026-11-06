import type { ThemeData } from "@/shared/themeTypes.ts";
import { StorageError, isStorageAvailable, readItem, removeItem, writeItem } from "./safeStorage.ts";

/**
 * Local-only history of generated design systems.
 *
 * Everything lives in this browser's localStorage: it survives reloads and
 * closing the tab, and disappears the moment the user clears site data. No
 * copy is ever sent anywhere.
 */

const STORAGE_KEY = "true-to-hue-history-v1";

/** Newest-first cap. Entries are a few KB each, well inside the ~5MB budget. */
const MAX_ENTRIES = 25;

export interface ThemeHistoryEntry {
  id: string;
  /** Epoch milliseconds. */
  savedAt: number;
  appName: string;
  mode: string;
  themeName: string;
  /** Small set of hexes for the list preview, so we needn't parse the theme. */
  swatches: string[];
  theme: ThemeData;
}

export function isHistoryAvailable(): boolean {
  return isStorageAvailable();
}

export function loadHistory(): ThemeHistoryEntry[] {
  try {
    const raw = readItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidEntry).sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

/**
 * Saves a generated theme and returns the updated list.
 *
 * Test-mode themes are included: `!test` is how most people try the app
 * without a key, and an always-empty history would just read as broken.
 */
export function addToHistory(
  theme: ThemeData,
  context: { appName: string; mode: string }
): ThemeHistoryEntry[] {
  const entry: ThemeHistoryEntry = {
    id: makeId(),
    savedAt: Date.now(),
    appName: context.appName.trim() || "Untitled project",
    mode: context.mode,
    themeName: theme.themeName || "Untitled system",
    swatches: previewSwatches(theme),
    theme
  };

  const next = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
  persistWithTrim(next);
  return loadHistory();
}

export function removeFromHistory(id: string): ThemeHistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  persistWithTrim(next);
  return loadHistory();
}

export function clearHistory(): void {
  removeItem(STORAGE_KEY);
}

/**
 * Writes the list, dropping the oldest entries if the browser reports the
 * quota is full. Losing the oldest history is a far better outcome than
 * throwing away the system the user just generated.
 */
function persistWithTrim(entries: ThemeHistoryEntry[]): void {
  let working = [...entries];

  while (working.length > 0) {
    try {
      writeItem(STORAGE_KEY, JSON.stringify(working));
      return;
    } catch (error) {
      if (error instanceof StorageError && error.kind === "quota" && working.length > 1) {
        working = working.slice(0, working.length - 1);
        continue;
      }
      // Storage is blocked entirely, or a single entry still will not fit.
      // History is a convenience, so fail quietly rather than break generation.
      return;
    }
  }
}

function previewSwatches(theme: ThemeData): string[] {
  const hexes = [
    ...(theme.primaryVariations ?? []).map((v) => v.hex),
    ...(theme.palette?.primary ?? []).map((c) => c.hex),
    ...(theme.secondaryVariations ?? []).map((v) => v.hex)
  ].filter((h): h is string => typeof h === "string" && /^#[0-9a-f]{3,8}$/i.test(h));

  return Array.from(new Set(hexes)).slice(0, 5);
}

function isValidEntry(value: unknown): value is ThemeHistoryEntry {
  const e = value as Partial<ThemeHistoryEntry> | null;
  return Boolean(
    e &&
      typeof e.id === "string" &&
      typeof e.savedAt === "number" &&
      e.theme &&
      typeof e.theme === "object"
  );
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
