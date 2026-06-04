import { useEffect, useState } from "react";
import DashboardNavbar from "@/layouts/dashboardNavbar";
import DoctorDashboardSection from "@/components/dashboard/doctor-portal/doctorDashboardSection";
import FloatingChatButton from "@/components/dashboard/patient-portal/FloatingChatButton";
import { getCurrentUser, profileApi, unwrapData } from "@/services/skinnerApi";

export default function DoctorPortal() {
  const sessionUser = getCurrentUser() || {};
  const [doctor, setDoctor] = useState({
    name: sessionUser.name || sessionUser.username || "Doctor",
    specialization: sessionUser.specialization || sessionUser.specialty || "Dermatology",
  });

  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      try {
        const response = await profileApi.me();
        const profile = unwrapData(response);
        if (!alive || !profile) return;
        setDoctor({
          name: profile.name || profile.username || sessionUser.name || "Doctor",
          specialization:
            profile.specialization || profile.specialty || sessionUser.specialization || "Dermatology",
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
      <DashboardNavbar
        role="doctor"
        name={doctor.name}
        specialization={doctor.specialization}
      />
      <section className="flex-1 bg-gray-50">
        <DoctorDashboardSection />
      </section>
      <FloatingChatButton userName={doctor.name} />
    </main>
  );
}
