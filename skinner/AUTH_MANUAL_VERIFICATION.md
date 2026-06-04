Manual verification checklist — Session & Refresh

1. Start dev server:

```bash
npm install
npm run dev
```

2. Sign in with `Remember me` checked.
   - Confirm `localStorage` contains `skinner_auth_token`, `skinner_auth_user`, `skinner_auth_role`.

3. Sign in with `Remember me` unchecked.
   - Confirm `sessionStorage` contains `skinner_auth_token` etc., and `localStorage` does not.

4. Token refresh flow (requires backend support):
   - Configure backend to issue short-lived access token and a refresh endpoint at `/api/auth/refresh-token`.
   - After login, wait for access token to expire.
   - Trigger a protected API call (e.g., visit `patient-portal` which calls `profileApi.me()`).
   - Expect client to call refresh endpoint, update storage, and continue without redirecting to sign-in.

5. Unauthorized handling:
   - If refresh fails or backend returns 401, expect a toast: "Session expired. Please sign in again." and redirect to `/sign-in`.

6. Logout:
   - Click Logout. Expect client to call `/api/auth/logout` (best-effort), clear storage, and navigate to `/`.

Notes:
- Backend must support `POST /api/auth/refresh-token` or set httpOnly cookies for automatic refresh.
- To emulate refresh failure, delete refresh tokens server-side or block the refresh endpoint URL.
