"use client";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/skinnerApi";
import { cleanText, isValidEmail } from "@/lib/formValidation";
import { useTranslation } from "@/context/LanguageContext";

export default function ForgotPasswordCard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const cleanEmail = cleanText(email, 120).toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await authApi.forgotPassword(cleanEmail);
      localStorage.setItem("skinner_reset_email", cleanEmail);
      
      let sentAtTimestamp = Date.now();
      if (response && response.expiresAt) {
        const expiryTime = new Date(response.expiresAt).getTime();
        sentAtTimestamp = expiryTime - 15 * 60 * 1000;
      }
      
      localStorage.setItem("skinner_reset_email_sent_at", sentAtTimestamp.toString());
      navigate("/verify-code", { state: { email: cleanEmail } });
    } catch (apiError) {
      setError(apiError.message || "Could not send the verification code.");
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
            onClick={() => navigate("/sign-in")}
            className="text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-[16px] font-medium text-gray-900 dark:text-white">{t("forgot_password_title")}</h2>
        </div>
        <p className="mt-1 text-[13px] text-gray-500 dark:text-zinc-400 leading-relaxed mb-6">
          {t("forgot_password_desc_ext")}
        </p>
        <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-[#F4F8FF] dark:border-blue-900/30 dark:bg-blue-950/20 p-3 mb-6">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-black dark:text-blue-400" />
          <p className="text-sm text-[#193CB8] dark:text-blue-300 leading-relaxed font-medium">
            {t("verify_otp_info")}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] text-gray-900 dark:text-zinc-300 font-medium">{t("email")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(cleanText(e.target.value, 120));
                setError("");
              }}
              placeholder="name@example.com"
              className={`h-9 text-[12px] dark:bg-zinc-900 dark:border-zinc-700 dark:text-white ${error ? "border-red-300" : ""}`}
            />
            {error && <p className="text-[10px] font-medium text-red-600">{error}</p>}
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-full bg-[#0B0B1F] dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white text-[12px] hover:bg-[#16162b] disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {loading ? t("sending") : t("send_verification_code")}
          </Button>
        </form>
        <div className="mt-4 text-center text-[11px] text-gray-500 dark:text-zinc-400">
          {t("remember_password")}{" "}
          <Link to="/sign-in" className="text-blue-600 dark:text-blue-400 hover:underline">
            {t("sign_in_here")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
