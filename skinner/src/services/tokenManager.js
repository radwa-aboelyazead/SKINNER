/**
 * tokenManager.js
 * ────────────────────────────────────────────────────────────
 * Handles JWT decode, expiry checks, proactive silent refresh,
 * and persistent storage (localStorage for "remember me",
 * sessionStorage otherwise).
 *
 * Storage keys are centralised here so every module imports
 * from one place.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://api.skinnerai.site").replace(/\/$/, "");
const REFRESH_ENDPOINT = `${API_BASE}/api/auth/refresh-token`;

// ─── Storage keys ────────────────────────────────────────────
export const STORAGE_KEYS = {
  token:               "skinner_auth_token",
  refreshToken:        "skinner_auth_refresh_token",
  user:                "skinner_auth_user",
  role:                "skinner_auth_role",
  latestAnalysisId:    "skinner_latest_analysis_id",
  latestAppointmentId: "skinner_latest_appointment_id",
  latestChatId:        "skinner_latest_chat_id",
};

// ─── Helpers ─────────────────────────────────────────────────
function base64Decode(str) {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return null;
  }
}

/** Parse a JWT and return its payload object, or null. */
export function decodeJwt(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payload = base64Decode(parts[1]);
  if (!payload) return null;
  try { return JSON.parse(payload); } catch { return null; }
}

/**
 * Returns true when the token has expired (or will expire within
 * `offsetSeconds`).  Default offset = 60 s for proactive refresh.
 */
export function isTokenExpired(token, offsetSeconds = 60) {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 < Date.now() + offsetSeconds * 1000;
}

// ─── Persistent storage helpers ──────────────────────────────
/** Pick the right storage based on where the token currently lives. */
function getActiveStorage() {
  return localStorage;
}

export function getAccessToken() {
  return (
    localStorage.getItem(STORAGE_KEYS.token) ||
    sessionStorage.getItem(STORAGE_KEYS.token) ||
    ""
  );
}

export function getRefreshToken() {
  return (
    localStorage.getItem(STORAGE_KEYS.refreshToken) ||
    sessionStorage.getItem(STORAGE_KEYS.refreshToken) ||
    ""
  );
}

/**
 * Persist the full auth session.
 * @param {object} payload   - raw API response
 * @param {string} fallbackRole
 * @param {boolean} remember - always saved to localStorage for cross-tab sync
 */
export function saveSession(payload = {}, fallbackRole = "patient", remember = true) {
  const storage = localStorage;
  // Also clear the OTHER storage so there are never two copies
  const other = sessionStorage;
  Object.values(STORAGE_KEYS).forEach((k) => other.removeItem(k));

  const token =
    payload.token ||
    payload.access_token ||
    payload.jwt ||
    payload.data?.token ||
    payload.data?.access_token ||
    "";

  const refreshToken =
    payload.refresh_token ||
    payload.refreshToken ||
    payload.data?.refresh_token ||
    payload.data?.refreshToken ||
    "";

  const user   = payload.user || payload.data?.user || payload.data?.profile || payload.data || {};
  const role   = payload.role || user?.role || fallbackRole;

  if (token)        storage.setItem(STORAGE_KEYS.token,        token);
  if (refreshToken) storage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  storage.setItem(STORAGE_KEYS.role, role);
  storage.setItem(STORAGE_KEYS.user, JSON.stringify({ ...user, role }));

  return { token, refreshToken, user: { ...user, role }, role };
}

/** Update only the access token (and optionally the refresh token) in place. */
export function updateTokens(newAccessToken, newRefreshToken) {
  const storage = getActiveStorage();
  if (!storage) return;
  if (newAccessToken)  storage.setItem(STORAGE_KEYS.token,        newAccessToken);
  if (newRefreshToken) storage.setItem(STORAGE_KEYS.refreshToken, newRefreshToken);
}

/** Wipe every auth key from both storages. */
export function clearSession() {
  [localStorage, sessionStorage].forEach((s) => {
    Object.values(STORAGE_KEYS).forEach((k) => s.removeItem(k));
    s.removeItem("skinner_latest_analysis_result");
    s.removeItem("skinner_booking_started");
  });
}

export function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEYS.user) ||
      sessionStorage.getItem(STORAGE_KEYS.user) ||
      "null"
    );
  } catch { return null; }
}

export function getCurrentRole() {
  return (
    localStorage.getItem(STORAGE_KEYS.role) ||
    sessionStorage.getItem(STORAGE_KEYS.role) ||
    getCurrentUser()?.role ||
    ""
  );
}

// ─── Token refresh ───────────────────────────────────────────
let _refreshPromise = null; // deduplicate concurrent refresh calls

/**
 * Call the backend refresh endpoint.
 * Uses the refresh token from storage (sent as Authorization header)
 * and also sends cookies in case the server uses HttpOnly cookies.
 * Returns parsed response JSON on success, null on failure.
 */
export async function refreshAccessToken() {
  // If a refresh is already in flight, reuse that promise
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const rt = getRefreshToken();
      const headers = { "Content-Type": "application/json" };
      if (rt) headers["Authorization"] = `Bearer ${rt}`;

      const res = await fetch(REFRESH_ENDPOINT, {
        method: "POST",
        credentials: "include", // include HttpOnly refresh cookie if server sets one
        headers,
        body: rt ? JSON.stringify({ refresh_token: rt }) : undefined,
      });

      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      if (!data) return null;

      // Persist updated tokens immediately
      const newAccess  = data.token || data.access_token || data.jwt || data.data?.token || data.data?.access_token || "";
      const newRefresh = data.refresh_token || data.refreshToken || data.data?.refresh_token || data.data?.refreshToken || "";
      if (newAccess) updateTokens(newAccess, newRefresh);

      return data;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ─── Silent background refresh ───────────────────────────────
let _silentTimer = null;

/**
 * Schedule a proactive token refresh BEFORE the token expires.
 * Call this once after login and once after each successful refresh.
 * Pass an `onExpired` callback that redirects to /sign-in if the
 * refresh ultimately fails.
 */
export function scheduleSilentRefresh(onExpired) {
  clearSilentRefresh();

  const token = getAccessToken();
  if (!token) return;

  const payload = decodeJwt(token);
  if (!payload?.exp) return;

  // Fire 90 seconds before expiry (or immediately if already close)
  const msUntilExpiry = payload.exp * 1000 - Date.now();
  const delay = Math.max(0, msUntilExpiry - 90_000);

  _silentTimer = setTimeout(async () => {
    const data = await refreshAccessToken();
    if (data) {
      // Re-schedule for the new token
      scheduleSilentRefresh(onExpired);
    } else {
      clearSession();
      onExpired?.();
    }
  }, delay);
}

export function clearSilentRefresh() {
  if (_silentTimer !== null) {
    clearTimeout(_silentTimer);
    _silentTimer = null;
  }
}

export default {
  decodeJwt,
  isTokenExpired,
  refreshAccessToken,
  saveSession,
  updateTokens,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getCurrentUser,
  getCurrentRole,
  scheduleSilentRefresh,
  clearSilentRefresh,
};
