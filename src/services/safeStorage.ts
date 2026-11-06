/**
 * Guarded localStorage access.
 *
 * `localStorage` is not always available or writable: Safari Private Browsing,
 * "block all cookies"/site-data settings, aggressive privacy extensions, and
 * partitioned webviews all make `getItem`/`setItem` throw. An unguarded call
 * throws straight out of a React event handler, so the UI appears to do
 * nothing at all. Every access in the app goes through here instead.
 */

export type StorageFailure = "unavailable" | "quota" | "unknown";

export class StorageError extends Error {
  readonly kind: StorageFailure;

  constructor(kind: StorageFailure, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "StorageError";
    this.kind = kind;
  }
}

/** True when this browser lets us actually write to localStorage. */
export function isStorageAvailable(): boolean {
  try {
    const probe = "__tth_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Throws a `StorageError` with a human-readable reason on failure. */
export function writeItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (cause) {
    throw new StorageError(classify(cause), messageFor(classify(cause)), { cause });
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing useful to do — the value is already unreachable.
  }
}

function classify(cause: unknown): StorageFailure {
  const name = (cause as { name?: string } | null)?.name ?? "";
  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return "quota";
  }
  if (name === "SecurityError" || !isStorageAvailable()) {
    return "unavailable";
  }
  return "unknown";
}

function messageFor(kind: StorageFailure): string {
  if (kind === "quota") {
    return "Browser storage is full. Clear some saved history and try again.";
  }
  if (kind === "unavailable") {
    return "This browser is blocking local storage, so nothing can be saved. Turn off private browsing, or allow site data for this page, then try again.";
  }
  return "Could not write to browser storage.";
}
