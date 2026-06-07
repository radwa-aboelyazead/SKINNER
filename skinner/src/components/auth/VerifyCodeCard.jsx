import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { authApi } from "@/services/skinnerApi";
import { useTranslation } from "@/context/LanguageContext";

export default function VerifyCodeCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const email = location.state?.email || localStorage.getItem("skinner_reset_email") || "your email";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [timeLeft, setTimeLeft] = useState(() => {
    const sentAtStr = localStorage.getItem("skinner_reset_email_sent_at");
    if (sentAtStr) {
      const sentAt = parseInt(sentAtStr, 10);
      if (!isNaN(sentAt)) {
        const elapsedSeconds = Math.floor((Date.now() - sentAt) / 1000);
        return Math.max(0, 900 - elapsedSeconds);
      }
    }
    return 0; // Default to 0 (expired or not requested yet) if no sent timestamp is stored
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const submit = () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit verification code.");
      return;
    }
    if (timeLeft <= 0) {
      setError("Verification code has expired. Please request a new one.");
      return;
    }
    localStorage.setItem("skinner_reset_otp", otp);
    navigate("/reset-password", { state: { email, otp } });
  };

  const handleResend = async () => {
    if (resending || !email || email === "your email") return;
    setResending(true);
    setError("");
    setSuccessMsg("");
    try {
      const response = await authApi.forgotPassword(email, true); // force=true to request a new code
      
      let sentAtTimestamp = Date.now();
      if (response && response.expiresAt) {
        const expiryTime = new Date(response.expiresAt).getTime();
        sentAtTimestamp = expiryTime - 15 * 60 * 1000;
      }
      
      localStorage.setItem("skinner_reset_email_sent_at", sentAtTimestamp.toString());
      
      // Reset the local state timer
      setTimeLeft(900); // Reset countdown back to 15 minutes
      setOtp("");
      setError("");
      setSuccessMsg("A new code has been sent successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (apiError) {
      setError(apiError.message || "Could not resend the verification code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-1 dark:bg-zinc-900">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-[16px] font-medium text-gray-900 dark:text-white">{t("verify_otp_title")}</h2>
        </div>
        <p className="mt-1 text-[13px] text-gray-500 dark:text-zinc-400 leading-relaxed mb-6">
          {t("verify_otp_desc_sent")} {email}
        </p>
        {timeLeft > 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-[#F4F8FF] dark:border-blue-900/30 dark:bg-blue-950/20 p-3 mb-6">
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-black dark:text-blue-400" />
            <div className="text-sm text-[#193CB8] dark:text-blue-300 leading-relaxed font-medium">
              {t("code_expires_in")}
              <br />
              <span className="font-bold text-[#193CB8] dark:text-blue-200">{formatTime(timeLeft)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 p-3 mb-6">
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <div className="text-sm text-red-700 dark:text-red-300 leading-relaxed font-medium">
              {t("code_expired")}
              <br />
              <span className="font-normal text-red-600 dark:text-red-400 text-xs">{t("code_expired_desc")}</span>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex w-full justify-center py-2">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(v) => {
                setOtp(v.replace(/\D/g, ""));
                setError("");
              }}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="rounded-md border border-[#D1D5DC] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white border-[1.5px]"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {error && <p className="text-center text-[10px] font-medium text-red-600">{error}</p>}
          {successMsg && <p className="text-center text-[10px] font-medium text-green-600 dark:text-green-400">{successMsg}</p>}
          <Button
            type="button"
            onClick={submit}
            className="h-10 w-full bg-[#0B0B1F] dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white text-[12px] hover:bg-[#16162b]"
          >
            <ShieldCheck className="h-4 w-4" />
            {t("verify_btn")}
          </Button>
        </div>
        <div className="mt-4 text-center text-[11px] text-gray-500 dark:text-zinc-400 flex items-center justify-center gap-1 flex-wrap">
          {t("didnt_receive_code")}{" "}
          <button
            type="button"
            disabled={resending}
            onClick={handleResend}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
            {resending ? t("sending") : t("resend_code")}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
