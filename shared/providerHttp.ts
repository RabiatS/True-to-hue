/**
 * Shared fetch wrapper for direct browser -> provider calls.
 *
 * A CORS rejection, offline network, or blocked request surfaces from `fetch`
 * as a bare `TypeError` ("Failed to fetch" / "Load failed"), which tells the
 * user nothing. This converts those into an actionable message.
 */
export async function providerFetch(
  url: string,
  init: RequestInit,
  providerLabel: string
): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (cause) {
    throw new Error(
      `Could not reach ${providerLabel}. This is a network or browser-block issue, not a bad key — ` +
        `check your connection, and any ad blocker, VPN, or privacy extension that may be blocking the request.`,
      { cause }
    );
  }
}
