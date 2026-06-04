import ForgotPasswordSection from "@/components/auth/forgot-password-section";
import Footer from "@/layouts/footer";
import Navbar from "@/layouts/navbar";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

const ROLE_ROUTES = { patient: "/patient-portal", doctor: "/doctor-portal", admin: "/admin-portal" };

export default function ForgotPassword() {
  const { token, role, ready } = useAuth();
  if (ready && token && role && ROLE_ROUTES[role]) return <Navigate to={ROLE_ROUTES[role]} replace />;

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <section className="flex-1 bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_50%,#FAF5FF_100%)]">
        <ForgotPasswordSection />
      </section>
      <Footer />
    </main>
  );
}
