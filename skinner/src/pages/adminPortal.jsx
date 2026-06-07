import { useEffect, useState } from "react";
import DashboardNavbar from "@/layouts/dashboardNavbar";
import AdminDashboardSection from "@/components/dashboard/admin-portal/adminDashboardSection";
import { getCurrentUser, profileApi, unwrapData } from "@/services/skinnerApi";
import { decodeJwt, getAccessToken } from "@/services/tokenManager";

export default function AdminPortal() {
  const sessionUser = getCurrentUser() || {};

  // Read admin_role from JWT token payload (most reliable source)
  const tokenPayload = decodeJwt(getAccessToken()) || {};
  const [adminRole, setAdminRole] = useState(tokenPayload.admin_role || sessionUser.admin_role || "admin");

  const [admin, setAdmin] = useState({
    name: sessionUser.name || sessionUser.username || sessionUser.email?.split("@")[0] || "Admin",
  });

  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      try {
        const response = await profileApi.me();
        const profile = unwrapData(response);
        if (!alive || !profile) return;
        setAdmin({
          name: profile.name || profile.username || profile.email?.split("@")[0] || "Admin",
        });
        if (profile.admin_role) setAdminRole(profile.admin_role);
      } catch {
        // keep session data when API is unavailable
      }
    }
    loadProfile();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <DashboardNavbar role="admin" name={admin.name} />
      <section className="flex-1 bg-gray-50">
        <AdminDashboardSection adminRole={adminRole} />
      </section>
    </main>
  );
}
