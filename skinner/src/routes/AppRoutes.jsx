import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoaderPage from "@/components/Loader";
import ResetPassword from "@/pages/resetPassword";
import AdminPortal from "@/pages/adminPortal";
import DoctorPortal from "@/pages/doctorPortal";
import PatientPortal from "@/pages/patientPortal";
import Home from "@/pages/home";
import ContactUs from "@/pages/contactUs";
import Features from "@/pages/features";
import ProtectedRoute from "@/components/ProtectedRoute";
import GuestRoute from "@/components/GuestRoute";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";

const SignIn        = lazy(() => import("../pages/sign-in"));
const Register      = lazy(() => import("../pages/register"));
const ForgotPassword = lazy(() => import("../pages/forgotPassword"));
const VerifyCode    = lazy(() => import("../pages/verifyCode"));

export default function AppRoutes() {
  return (
    // AuthProvider must be inside BrowserRouter (already in main.jsx)
    // so that useNavigate() works inside the provider.
    <AuthProvider>
      <LanguageProvider>
        <Suspense fallback={<LoaderPage />}>
          <Routes>
            <Route path="/"               element={<GuestRoute element={<Home />} />} />
            <Route path="/contact-us"     element={<ContactUs />} />
            <Route path="/features"       element={<Features />} />
            <Route path="/sign-in"        element={<GuestRoute element={<SignIn />} />} />
            <Route path="/register"       element={<GuestRoute element={<Register />} />} />
            <Route path="/forgot-password" element={<GuestRoute element={<ForgotPassword />} />} />
            <Route path="/verify-code"    element={<GuestRoute element={<VerifyCode />} />} />
            <Route path="/reset-password" element={<GuestRoute element={<ResetPassword />} />} />

            <Route
              path="/patient-portal"
              element={<ProtectedRoute element={<PatientPortal />} requiredRole="patient" />}
            />
            <Route
              path="/admin-portal"
              element={<ProtectedRoute element={<AdminPortal />} requiredRole="admin" />}
            />
            <Route
              path="/doctor-portal"
              element={<ProtectedRoute element={<DoctorPortal />} requiredRole="doctor" />}
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </LanguageProvider>
    </AuthProvider>
  );
}
