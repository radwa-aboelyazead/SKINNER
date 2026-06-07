import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CircleCheck, Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import PasswordInput from "../ui/PasswordInput";
import { authApi } from "@/services/skinnerApi";
import { useTranslation } from "@/context/LanguageContext";

export default function ResetPasswordCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const email = location.state?.email || localStorage.getItem("skinner_reset_email") || sessionStorage.getItem("skinner_reset_email") || "";
  const otp = location.state?.otp || localStorage.getItem("skinner_reset_otp") || sessionStorage.getItem("skinner_reset_otp") || "";
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      setError("Please request and verify a password reset code first.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword: form.password });
      sessionStorage.removeItem("skinner_reset_email");
      sessionStorage.removeItem("skinner_reset_otp");
      localStorage.removeItem("skinner_reset_email");
      localStorage.removeItem("skinner_reset_otp");
      localStorage.removeItem("skinner_reset_email_sent_at");
      setSuccess("Password reset successfully. You can now sign in.");
      setTimeout(() => navigate("/sign-in"), 900);
    } catch (apiError) {
      setError(apiError.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-1 dark:bg-zinc-900">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => navigate("/verify-code")}
            className="text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="mt-0.5 flex size-8 aspect-square items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <Lock className="size-4 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-[16px] font-medium text-gray-900 dark:text-white">{t("reset_password_title")}</h2>
        </div>
        <p className="mt-1 text-[13px] text-gray-500 dark:text-zinc-400 leading-relaxed mb-6">
          {t("reset_password_desc_for")} {email || "your account"}
        </p>
        <div className="flex items-start gap-3 rounded-lg border border-[#B9F8CF] bg-[#F0FDF4] dark:border-green-900/30 dark:bg-green-950/20 p-3 mb-6">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-black dark:text-green-400" />
          <p className="text-sm text-[#016630] dark:text-green-300 leading-relaxed font-medium">
            {t("identity_verified")}
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-[#F4F8FF] dark:border-blue-900/30 dark:bg-blue-950/20 p-3 mb-6">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-black dark:text-blue-400" />
          <div className="text-sm text-[#193CB8] dark:text-blue-300 leading-relaxed font-medium">
            {t("password_requirements")}
            <ul className="list-disc font-normal list-inside mt-1 text-[#193CB8] dark:text-blue-300">
              <li>{t("pwd_req_1")}</li>
              <li>{t("pwd_req_2")}</li>
            </ul>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] dark:text-zinc-300">{t("new_password")}</Label>
            <PasswordInput
              value={form.password}
              onChange={update("password")}
              placeholder="Enter new password"
              className="text-xs dark:bg-zinc-900 dark:border-zinc-700 dark:text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] dark:text-zinc-300">{t("confirm_password")}</Label>
            <PasswordInput
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              placeholder="Confirm new password"
              className="text-xs dark:bg-zinc-900 dark:border-zinc-700 dark:text-white"
            />
          </div>
          {error && <p className="text-center text-[10px] font-medium text-red-600">{error}</p>}
          {success && <p className="text-center text-[10px] font-medium text-green-600">{success}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-full bg-[#0B0B1F] dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white text-[12px] hover:bg-[#16162b] disabled:opacity-60"
          >
            <Lock className="h-4 w-4" />
            {loading ? t("resetting") : t("reset_btn")}
          </Button>
        </form>
        <div className="mt-4 text-center text-[11px] text-gray-500 dark:text-zinc-400">
          {t("return_to_login")}{" "}
          <Link to="/sign-in" className="text-blue-600 dark:text-blue-400 hover:underline">
            {t("sign_in_here")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
