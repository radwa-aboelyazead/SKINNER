/**
 * ProtectedRoute.jsx
 * ────────────────────────────────────────────────────────────
 * Guards a route behind authentication.
 *
 * While the auth context is still bootstrapping (verifying the
 * stored token / running a silent refresh), a full-page loader
 * is shown so the user never sees a flash redirect to /sign-in.
 *
 * Once ready:
 *  • No token  → redirect to /sign-in
 *  • Wrong role → redirect to /
 *  • OK         → render the protected element
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoaderPage from "@/components/Loader";

export default function ProtectedRoute({ element, requiredRole }) {
  const { token, role, ready } = useAuth();

  // Still verifying the stored token
  if (!ready) return <LoaderPage />;

  // Not authenticated at all
  if (!token) return <Navigate to="/sign-in" replace />;

  // Authenticated but wrong role
  if (requiredRole && role && role !== requiredRole) return <Navigate to="/" replace />;

  return element;
}
