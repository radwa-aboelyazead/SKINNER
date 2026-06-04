import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectValue, SelectTrigger, SelectItem } from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import PasswordInput from "../ui/PasswordInput";
import { FeatureCard } from "./featureCard";
import { ProfessionalCard } from "./professionalCard";
import { authApi } from "@/services/skinnerApi";
import { useAuth } from "@/context/AuthContext";
import { cleanText, isValidEmail } from "@/lib/formValidation";

export function SignInCard() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role,         setRole]         = useState("patient");
  const [form,         setForm]         = useState({ email: "", password: "" });
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError,  setServerError]  = useState("");
  const [remember,     setRemember]     = useState(true);

  const updateField = (field) => (event) => {
    const value = field === "email"
      ? cleanText(event.target.value, 120).toLowerCase()
      : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setServerError("");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!isValidEmail(form.email))                  nextErrors.email    = "Enter a valid email address.";
    if (!form.password || form.password.length < 6) nextErrors.password = "Password must be at least 6 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setServerError("");

    try {
      const response = await authApi.login({ role, email: form.email, password: form.password });

      // login() persists the session AND schedules silent refresh
      const { role: savedRole } = login(response, role, remember);

      if (savedRole === "patient") navigate("/patient-portal", { replace: true });
      else if (savedRole === "doctor") navigate("/doctor-portal", { replace: true });
      else if (savedRole === "admin")  navigate("/admin-portal", { replace: true });
    } catch (error) {
      setServerError(error.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm rounded-lg border border-gray-200 shadow-sm">
      <CardContent>
        <h2 className="text-sm font-semibold text-gray-800">Sign In</h2>
        <p className="mt-1 text-[11px] text-gray-500">
          Enter your credentials to access your account
        </p>

        <form onSubmit={handleSignIn} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-[11px] text-gray-700">I am a</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-9 text-xs w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="p-1">
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[11px] text-gray-700">Email</Label>
            <Input
              id="email" type="email" placeholder="name@example.com"
              className={`h-9 text-xs ${errors.email ? "border-red-300" : ""}`}
              value={form.email} onChange={updateField("email")}
            />
            {errors.email && <p className="text-[10px] font-medium text-red-600">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[11px] text-gray-700">Password</Label>
            <PasswordInput className="text-xs" value={form.password} onChange={updateField("password")} />
            {errors.password && <p className="text-[10px] font-medium text-red-600">{errors.password}</p>}
          </div>

          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-gray-600 select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-[#0B0B1F]"
              />
              Remember me
            </label>
          </div>

          <Button
            type="submit" disabled={isSubmitting}
            className="h-9 w-full bg-[#0B0B1F] text-xs hover:bg-[#16162b] disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center text-[11px] text-gray-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">Register here</Link>
        </div>
        <div className="mt-2 text-center">
          <Link to="/forgot-password" className="text-[11px] text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SignInSection() {
  return (
    <section className="w-full py-16">
      <div className="mx-auto grid max-w-4xl gap-10 px-6 md:grid-cols-2 md:items-start">
        <div className="space-y-4">
          <FeatureCard />
          <ProfessionalCard />
        </div>
        <div className="flex justify-center md:justify-end">
          <SignInCard />
        </div>
      </div>
    </section>
  );
}
