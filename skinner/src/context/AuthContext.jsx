/**
 * AuthContext.jsx
 * ────────────────────────────────────────────────────────────
 * Provides authentication state to the whole React tree.
 *
 * Features:
 *  • Reads persisted token from localStorage / sessionStorage on mount
 *  • Attempts a silent token refresh if the stored token is about to expire
 *  • Schedules proactive background refreshes after login
 *  • Exposes login(), logout(), and the current user/role/token
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearSession,
  clearSilentRefresh,
  getAccessToken,
  getCurrentRole,
  getCurrentUser,
  isTokenExpired,
  refreshAccessToken,
  saveSession,
  scheduleSilentRefresh,
} from "@/services/tokenManager";

// ─── Context ─────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [authState, setAuthState] = useState(() => ({
    token:   getAccessToken(),
    user:    getCurrentUser(),
    role:    getCurrentRole(),
    ready:   false,   // true once the bootstrap check finishes
  }));

  const onExpired = useCallback(() => {
    setAuthState({ token: "", user: null, role: "", ready: true });
    navigate("/sign-in", { replace: true });
  }, [navigate]);

  // ── Bootstrap: validate / refresh stored token on every page load ──
  useEffect(() => {
    let alive = true;

    async function bootstrap() {
      const stored = getAccessToken();

      if (!stored) {
        if (alive) setAuthState({ token: "", user: null, role: "", ready: true });
        return;
      }

      if (isTokenExpired(stored)) {
        // Token is expired (or about to) → try to refresh silently
        const data = await refreshAccessToken();
        if (!alive) return;

        if (data) {
          const token = getAccessToken(); // updated by refreshAccessToken
          setAuthState({ token, user: getCurrentUser(), role: getCurrentRole(), ready: true });
          scheduleSilentRefresh(onExpired);
        } else {
          clearSession();
          setAuthState({ token: "", user: null, role: "", ready: true });
        }
      } else {
        // Token is still valid → just schedule the next refresh
        if (alive) {
          setAuthState({ token: stored, user: getCurrentUser(), role: getCurrentRole(), ready: true });
          scheduleSilentRefresh(onExpired);
        }
      }
    }

    bootstrap();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── login() ──────────────────────────────────────────────
  const login = useCallback((apiResponse, fallbackRole = "patient", remember = true) => {
    const { token, user, role } = saveSession(apiResponse, fallbackRole, remember);
    setAuthState({ token, user, role, ready: true });
    scheduleSilentRefresh(onExpired);
    return { token, user, role };
  }, [onExpired]);

  // ── logout() ─────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSilentRefresh();
    clearSession();
    setAuthState({ token: "", user: null, role: "", ready: true });
    navigate("/sign-in", { replace: true });
  }, [navigate]);

  const value = { ...authState, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — throws if used outside <AuthProvider> */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export default AuthContext;
