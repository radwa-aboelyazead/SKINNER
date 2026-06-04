/**
 * GuestRoute.jsx
 * ────────────────────────────────────────────────────────────
 * Restricts access to public/guest-only pages (Home, Login, Register, etc.)
 * for authenticated users.
 *
 * If the user is already logged in, they are redirected to their
 * respective portal based on their role.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoaderPage from "@/components/Loader";

export default function GuestRoute({ element }) {
  const { token, role, ready } = useAuth();

  // Still verifying the stored token / bootstrapping
  if (!ready) return <LoaderPage />;

  // If already authenticated, redirect to their respective dashboard
  if (token) {
    if (role === "doctor") {
      return <Navigate to="/doctor-portal" replace />;
    }
    if (role === "admin") {
      return <Navigate to="/admin-portal" replace />;
    }
    return <Navigate to="/patient-portal" replace />;
  }

  return element;
}
