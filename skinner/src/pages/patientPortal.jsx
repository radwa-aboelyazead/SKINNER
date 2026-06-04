import { useEffect, useState } from "react";
import DashboardNavbar from "@/layouts/dashboardNavbar";
import PatientDashboardSection from "@/components/dashboard/patient-portal/patientDashboardSection";
import FloatingChatButton from "@/components/dashboard/patient-portal/FloatingChatButton";
import { getCurrentUser, profileApi, unwrapData } from "@/services/skinnerApi";

export default function PatientPortal() {
  const sessionUser = getCurrentUser() || {};
  const [user, setUser] = useState({
    name: sessionUser.name || sessionUser.username || "User",
    email: sessionUser.email || "",
  });

  // Try to refresh from API in case the stored data is outdated
  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      try {
        const response = await profileApi.me();
        const profile = unwrapData(response);
        if (!alive || !profile) return;
        setUser({
          name: profile.name || profile.username || sessionUser.name || "User",
          email: profile.email || sessionUser.email || "",
        });
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
      <DashboardNavbar role="patient" name={user.name} email={user.email} />
      <section className="flex-1 bg-gray-50">
        <PatientDashboardSection />
      </section>
      <FloatingChatButton userName={user.name} />
    </main>
  );
}
