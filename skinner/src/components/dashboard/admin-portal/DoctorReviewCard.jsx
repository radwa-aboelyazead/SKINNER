import React, { useState } from "react";
import {
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTrigger } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { useFileUpload } from "@/hooks/use-file-upload";
import DoctorReviewActions from "./DoctorReviewActions";
import { useTranslation } from "@/context/LanguageContext";

function valueOf(source, keys, fallback = "") {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "https://api.skinnerai.site").replace(/\/$/, "");

function normalizeImageUrl(url = "") {
  const rawUrl = String(url).trim();
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  try {
    return new URL(rawUrl, API_BASE_URL).toString();
  } catch {
    return rawUrl;
  }
}

function getSpecialtyLabel(spec, t) {
  if (!spec) return "";
  const normalized = spec.toLowerCase().replace(/[\s_-]+/g, "_");
  const key = `specialty_${normalized}`;
  const translated = t(key);
  return translated !== key ? translated : spec;
}

export default function DoctorReviewCard({ doctor = {}, onApprove, onReject, busy }) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [notes, setNotes] = useState("");
  const { t, lang } = useTranslation();

  const name = valueOf(doctor, ["name", "doctor_name"], t("doctor"));
  const email = valueOf(doctor, ["email"], "");
  const rawSpecialization = valueOf(doctor, ["specialization", "specialty"], "");
  const specialization = rawSpecialization ? getSpecialtyLabel(rawSpecialization, t) : t("not_available");
  const rawSubmitted = valueOf(doctor, ["created_at", "submitted_on", "date"], "");
  const phone = valueOf(doctor, ["phone"], t("not_available"));
  const rawDocImage = valueOf(doctor, ["syndicate_card_image", "document_url", "medical_syndicate_image"], "");
  const documentImage = rawDocImage ? normalizeImageUrl(rawDocImage) : "";

  // Localized date formatting
  let submitted = rawSubmitted;
  if (rawSubmitted && rawSubmitted !== "Unknown date") {
    try {
      const dateObj = new Date(rawSubmitted);
      if (!isNaN(dateObj.getTime())) {
        submitted = dateObj.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch (e) {
      // fallback to raw string
    }
  }
  if (!submitted) {
    submitted = t("not_available");
  }

  // --- 1. SUMMARY VIEW (The original card) ---
  if (!isReviewing) {
    return (
      <Card className="w-full p-6 shadow-sm transition-all animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col space-y-1.5 min-w-[250px]">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-slate-900">
                {name}
              </h3>
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-600 border-orange-200 px-2 py-0.5 flex items-center gap-1 font-medium"
              >
                <Clock className="w-3.5 h-3.5" /> {t("pending")}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm">{email}</p>
            <p className="text-slate-500 text-xs mt-1">{t("submitted_on")}: {submitted}</p>
          </div>
          <div className="flex-1 text-slate-600 text-[15px]">
            {t("verify_info_id")}
          </div>
          <div className="flex-1 text-slate-600 text-[15px]">{specialization}</div>
          <Button
            onClick={() => setIsReviewing(true)}
            className="bg-[#0a0a14] hover:bg-[#1a1a2e] text-white px-6"
          >
            {t("review_application_btn")}
          </Button>
        </div>
      </Card>
    );
  }

  // --- 2. DETAILED REVIEW VIEW ---
  return (
    <Card className="w-full p-6 shadow-md">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            {t("verify_doctor_colon")} {name}
          </h2>
          <p className="text-slate-500 text-sm">{t("submitted_on")} {submitted}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsReviewing(false)}
          className="text-slate-600"
        >
          {t("back_to_list")}
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="bg-[#EFF6FF] border-[#BEDBFF] mb-4 py-3">
        <Activity className="h-4 w-4" />
        <AlertDescription className="text-[13px] ml-2 font-medium text-[#193CB8]">
          {t("verify_alert_desc")}
        </AlertDescription>
      </Alert>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 mb-4">
        <div className="space-y-1">
          <Label className="text-slate-500 font-normal text-xs">
            {t("full_name")}
          </Label>
          <p className="text-slate-800 font-medium">{name}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-slate-500 font-normal text-xs">
            {t("specialization")}
          </Label>
          <p className="text-slate-800 font-medium">{specialization}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-slate-500 font-normal text-xs">{t("email")}</Label>
          <p className="text-slate-800 font-medium">{email}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-slate-500 font-normal text-xs">
            {t("submission_date")}
          </Label>
          <p className="text-slate-800 font-medium">{submitted}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-slate-500 font-normal text-xs">
            {t("phone")}
          </Label>
          <p className="text-slate-800 font-medium">{phone}</p>
        </div>

        {/* Document Link Card */}
        <div className="space-y-1 mt-2">
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative">
                <Input
                  placeholder={t("id_doctor_placeholder")}
                  className={`h-9 text-[12px] cursor-pointer ${lang === "ar" ? "pl-10 text-right" : "pr-10 text-left"}`}
                  readOnly
                />

                {lang === "ar" ? (
                  <ChevronLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                )}
              </div>
            </DialogTrigger>

            {/* Modal */}
            <DialogContent className="sm:max-w-lg">
              <div className="flex flex-col gap-5">
                {/* HEADER */}
                <div className="text-center">
                  <h2 className="text-xl font-bold text-[#193CB8]">
                    {t("doctor_id_title")}
                  </h2>
                </div>
                <img
                  className="w-full rounded-sm h-auto"
                  src={documentImage}
                  alt={t("doctor_id_title")}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Verification Notes */}
      <div className="space-y-3 mb-4">
        <Label htmlFor="notes" className="text-slate-500 font-medium text-sm">
          {t("verification_notes")}
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("enter_notes_comments")}
          className="min-h-[80px] resize-none "
        />
      </div>

      {/* Action Buttons */}
      <DoctorReviewActions doctorName={name} onApprove={() => onApprove(notes)} onReject={() => onReject(notes)} busy={busy} />
    </Card>
  );
}
