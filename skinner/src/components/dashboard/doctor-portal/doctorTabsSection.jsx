import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileText,
  Info,
  Lock,
  MapPin,
  Paperclip,
  Send,
  Shield,
  User,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/EmptyState";
import { PendingCasesCard } from "./pendingCases-card";
import { cleanMultiline, cleanText, sanitizeMultiline, sanitizeText, validateMessage, validateProfile, validateReport } from "@/lib/formValidation";
import { chatApi, doctorApi, doctorApi as _doctorApi, profileApi, unwrapData, analysisApi, getAuthToken } from "@/services/skinnerApi";
import { adaptAnalysis, adaptDoctorCase, adaptMessage, toArray } from "@/services/apiAdapters";
import DoctorSchedule from "./doctorSchedule";
import { io } from "socket.io-client";


function DashboardTabs({ pendingCount = 2 }) {
  return (
    <div className="flex justify-center">
      <TabsList className="grid h-9 grid-cols-3 rounded-xl bg-[#ECECF0] p-1 shadow-sm">
        <TabsTrigger value="pending-cases" className="text-[12px] data-active:bg-white data-active:shadow-sm">
          <Info className="size-4" /> Pending Cases ({pendingCount})
        </TabsTrigger>
        <TabsTrigger value="reviewed-cases" className="text-[12px] data-active:bg-white data-active:shadow-sm">
          <FileText className="size-4" /> Finished Cases
        </TabsTrigger>
        <TabsTrigger value="schedule" className="text-[12px] data-active:bg-white data-active:shadow-sm">
          <Calendar className="size-4" /> Schedule
        </TabsTrigger>
      </TabsList>
    </div>
  );
}

function CaseReviewDetail({ item, onBack, onStartChat, onViewReport, hasChatMessages }) {
  const reportText = item.raw?.report_diagnosis || item.raw?.notes || item.raw?.diagnosis || "";

  const getButtonText = () => {
    if (item?.status === "completed" || reportText) {
      return "Read Chat";
    }
    if (hasChatMessages) {
      return "Continue Chat";
    }
    return "Start Chat with Patient";
  };

  return (
    <section className="mx-auto max-w-[760px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-[#111827] dark:border-zinc-800">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[16px] font-medium text-slate-900 dark:text-white">Case Review: {item.patient_name}</h1>
          <p className="text-[12px] text-gray-500 dark:text-zinc-400">Submitted on {item.submitted_on}</p>
        </div>
        <button onClick={onBack} className="rounded-md border border-gray-200 bg-white px-4 py-2 text-[12px] text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">Back to List</button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <p className="mb-3 text-[12px] text-gray-500 dark:text-zinc-400">Patient Image</p>
          <img src={item.patient_image} alt="Patient case" className="h-[240px] w-full rounded-md object-cover" />
        </div>
        <div className="space-y-5">
          <section>
            <h2 className="mb-3 text-[12px] text-gray-500 dark:text-zinc-400">Patient Information</h2>
            <div className="space-y-3 text-[13px] dark:text-zinc-300">
              <p><span className="font-semibold">Age:</span> {item.patient_age}</p>
              <p><span className="font-semibold">Gender:</span> {item.patient_gender}</p>
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-[12px] text-gray-500 dark:text-zinc-400">AI Analysis</h2>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:bg-zinc-950 dark:border-zinc-800">
              <p className="text-[14px] font-medium text-slate-900 dark:text-white">{item.ai_diagnosis || "N/A"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={item.ai_confidence_level?.toLowerCase() === "high" ? "destructive" : "medium"} className="rounded-md uppercase">
                  {item.ai_confidence_level || "unknown"} Confidence
                </Badge>
                <Badge variant="outline" className="rounded-md dark:border-zinc-800 dark:text-zinc-300">{item.ai_confidence || "0%"} Confidence</Badge>
              </div>
            </div>
          </section>
          {item.ai_note && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-[12px] leading-relaxed text-amber-900 dark:bg-zinc-950 dark:border-zinc-800">
              <div className="flex gap-2">
                <Info className="mt-0.5 size-4" />
                <span>{item.ai_note}</span>
              </div>
            </div>
          )}
          {reportText && onViewReport && (
            <button
              onClick={() => onViewReport(item, reportText)}
              className="h-9 w-full rounded-md border border-gray-200 bg-white text-[12px] font-medium text-slate-800 hover:bg-gray-50 transition cursor-pointer dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              View & Edit Report
            </button>
          )}
          <button onClick={onStartChat} className="h-9 w-full rounded-md bg-[#050316] text-[12px] font-medium text-white transition hover:bg-opacity-95">
            {getButtonText()}
          </button>
        </div>
      </div>
    </section>
  );
}

// Download report as a plain text file
function downloadReport(reportText, patientName) {
  const filename = `report-${(patientName || "patient").toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.txt`;
  const blob = new Blob([reportText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function DoctorReportEditor({ onBack, onSubmit, initialReport = "", patientName = "", existingReport = "", backLabel = "Back to Chat" }) {
  // If a submitted report already exists, start in read-only "view" mode
  const [mode, setMode] = useState(existingReport ? "view" : "edit");
  const [report, setReport] = useState(existingReport || initialReport);
  const [draft, setDraft] = useState(existingReport || initialReport);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const cleanReport = cleanMultiline(draft, 2500);
    const nextError = validateReport(cleanReport);
    setError(nextError);
    if (nextError) return;
    try {
      await onSubmit(cleanReport);
      setReport(cleanReport);
      setMode("view");
    } catch (err) {
      // Keep in edit mode so doctor doesn't lose changes on network error
    }
  };

  const handleBackClick = () => {
    if (mode === "edit" && existingReport) {
      setDraft(report);
      setMode("view");
      setError("");
    } else {
      onBack();
    }
  };

  return (
    <section className="mx-auto max-w-[720px]">
      <button 
        type="button" 
        onClick={handleBackClick} 
        className="mb-5 inline-flex items-center gap-2 text-[12px] text-slate-900"
      >
        <ArrowLeft className="size-3.5" /> {mode === "edit" && existingReport ? "Back to Report" : backLabel}
      </button>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-[16px] font-semibold text-slate-900">
          Medical Report{patientName ? ` — ${patientName}` : ""}
        </h1>
        {mode === "view" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadReport(report, patientName)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-[12px] text-slate-700 hover:bg-gray-50"
            >
              <FileText className="size-3.5" /> Download Report
            </button>
            <button
              type="button"
              onClick={() => { setDraft(report); setMode("edit"); setError(""); }}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#050316] px-3 text-[12px] text-white hover:bg-[#111026]"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* ── VIEW MODE ── */}
      {mode === "view" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-7 shadow-sm">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-900">{report}</p>
        </div>
      )}

      {/* ── EDIT MODE ── */}
      {mode === "edit" && (
        <>
          <textarea
            className={`min-h-[390px] w-full rounded-xl border bg-blue-50/70 p-7 text-[15px] leading-snug text-slate-900 outline-none shadow-sm ${error ? "border-red-300" : "border-blue-200"}`}
            value={draft}
            onChange={(e) => { setDraft(sanitizeMultiline(e.target.value, 2500)); setError(""); }}
            maxLength={2500}
            placeholder="Write your medical report here..."
          />
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-red-600">{error}</span>
            <span className="text-gray-500">{draft.length}/2500</span>
          </div>
          <div className="mt-6 flex items-center justify-between gap-4">
            {existingReport && (
              <button type="button" onClick={() => { setDraft(report); setMode("view"); setError(""); }}
                className="h-9 rounded-md border border-gray-200 px-5 text-[12px] text-slate-700">
                Cancel
              </button>
            )}
            <div className="ml-auto flex gap-3">
              {report && (
                <button
                  type="button"
                  onClick={() => downloadReport(draft || report, patientName)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-200 px-4 text-[12px] text-slate-700 hover:bg-gray-50"
                >
                  <FileText className="size-3.5" /> Download
                </button>
              )}
              <button type="button" onClick={handleSubmit}
                className="h-9 rounded-md bg-[#050316] px-7 text-[12px] font-medium text-white">
                Submit to Patient
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function formatDate(raw) {
  if (!raw) return "Recently";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function ReviewedCaseCard({ item, onDetails, onViewReport }) {
  const diagnosis = item.ai_diagnosis || "";
  // The submitted report is stored in item.diagnosis or item.raw?.diagnosis from the API
  const reportText = item.raw?.diagnosis || item.raw?.notes || "";

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-5">
        {item.patient_image
          ? <img src={item.patient_image} alt="Reviewed case" className="size-20 shrink-0 rounded-md object-cover" />
          : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-gray-100 text-[11px] uppercase text-gray-500">No Image</div>}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-medium text-slate-900">{item.patient_name || "Patient"}</h3>
          <p className="mt-1 line-clamp-1 text-[12px] text-gray-500">{diagnosis || "Reviewed Case"}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded bg-green-100 px-2 py-1 text-green-700">Reviewed</span>
            <span className="rounded border border-gray-200 px-2 py-1 text-slate-800">{formatDate(item.submitted_on)}</span>
          </div>
        </div>
        <button onClick={() => onDetails(item)} className="h-8 shrink-0 rounded-md border border-gray-200 px-4 text-[12px] text-slate-800">
          View Details
        </button>
      </div>

      {/* Report preview — clickable to open full report */}
      {reportText && (
        <button
          type="button"
          onClick={() => onViewReport?.(item, reportText)}
          className="mt-4 w-full rounded-lg border border-blue-100 bg-blue-50 p-3 text-left transition hover:bg-blue-100"
        >
          <div className="mb-1 flex items-center gap-1.5">
            <FileText className="size-3.5 text-blue-600" />
            <span className="text-[11px] font-medium text-blue-700">Doctor's Report — click to view</span>
          </div>
          <p className="line-clamp-2 text-[12px] text-slate-700">{reportText}</p>
        </button>
      )}
    </article>
  );
}

function ReviewedCases({ items = [], onDetails, onViewReport }) {
  if (!items.length) {
    return <EmptyState title="No reviewed cases" message="There are no reviewed cases to display right now." />;
  }
  return (
    <section className="mx-auto max-w-[820px] space-y-6">
      {items.map((item) => (
        <ReviewedCaseCard
          key={item.id || item.appointment_id}
          item={item}
          onDetails={onDetails}
          onViewReport={onViewReport}
        />
      ))}
    </section>
  );
}


const initialDoctorInfo = { name: "Dr John Doe", email: "name@example.com", phone: "+1 (555) 000-0000", address: "Medical Center Downtown", consultationFee: "150" };

function FieldError({ message }) { return message ? <p className="mt-1 text-[10px] font-medium text-red-600">{message}</p> : null; }


function DoctorInfoModal({ doctorInfo, onClose, onSave }) {
  const [form, setForm] = useState(doctorInfo);
  const [errors, setErrors] = useState({});
  const updateField = (field, value) => { const clean = field === "consultationFee" ? value.replace(/[^0-9.]/g, "").slice(0, 6) : sanitizeText(value, field === "address" ? 160 : 120); setForm((prev) => ({ ...prev, [field]: clean })); setErrors((prev) => ({ ...prev, [field]: "" })); };
  const handleSubmit = (event) => { event.preventDefault(); const nextErrors = validateProfile(form, { role: "doctor" }); setErrors(nextErrors); if (Object.keys(nextErrors).length) return; onSave({ name: cleanText(form.name, 80), email: cleanText(form.email, 120).toLowerCase(), phone: cleanText(form.phone, 24), address: cleanText(form.address, 160), consultationFee: cleanText(form.consultationFee, 10) }); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4"><form onSubmit={handleSubmit} noValidate className="w-full max-w-[330px] rounded-xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3"><h3 className="flex items-center gap-2 text-[14px] font-medium text-slate-900"><Edit3 className="size-4" /> Doctor Information</h3><button type="button" onClick={onClose} className="text-blue-600"><X className="size-5" /></button></div><div className="space-y-3"><label className="block"><span className="mb-1 block text-[11px] text-slate-700">Full Name</span><input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="h-8 w-full rounded-md bg-gray-100 px-3 text-[12px] text-gray-700 outline-none focus:ring-1 focus:ring-blue-400" /><FieldError message={errors.name} /></label><label className="block"><span className="mb-1 block text-[11px] text-slate-700">Email</span><input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="h-8 w-full rounded-md bg-gray-100 px-3 text-[12px] text-gray-700 outline-none focus:ring-1 focus:ring-blue-400" /><FieldError message={errors.email} /></label><label className="block"><span className="mb-1 block text-[11px] text-slate-700">Phone Number</span><input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="h-8 w-full rounded-md bg-gray-100 px-3 text-[12px] text-gray-700 outline-none focus:ring-1 focus:ring-blue-400" /><FieldError message={errors.phone} /></label><label className="block"><span className="mb-1 block text-[11px] text-slate-700">Clinic Address</span><input value={form.address} onChange={(e) => updateField("address", e.target.value)} className="h-8 w-full rounded-md bg-gray-100 px-3 text-[12px] text-gray-700 outline-none focus:ring-1 focus:ring-blue-400" /><FieldError message={errors.address} /></label><label className="block"><span className="mb-1 block text-[11px] text-slate-700">Consultation Fee</span><div className="flex h-8 rounded-md bg-gray-100 focus-within:ring-1 focus-within:ring-blue-400"><input value={form.consultationFee} onChange={(e) => updateField("consultationFee", e.target.value)} inputMode="decimal" className="min-w-0 flex-1 rounded-md bg-gray-100 px-3 text-[12px] text-gray-700 outline-none" /><span className="flex w-9 items-center justify-center text-[12px] text-gray-500">$</span></div><FieldError message={errors.consultationFee} /></label></div><div className="mt-5 flex items-center justify-between gap-4"><button type="submit" className="h-9 rounded-md bg-blue-600 px-5 text-[12px] font-medium text-white">Save Change</button><button type="button" onClick={onClose} className="h-9 rounded-md border border-blue-500 px-7 text-[12px] font-medium text-blue-600">Cancel</button></div></form></div>
  );
}function parseClinicalSummary(text, fallbackImage = "") {
  // Strip the header line the backend prepends
  const cleaned = text.replace(/^📋\s*CLINICAL SUMMARY CARD\s*\n?/i, "").trim();
  const lines = cleaned.split("\n");
  let patient = "N/A";
  let prediction = "N/A";
  let confidence = "N/A";

  let date = "Recently";
  let scanUrl = fallbackImage;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Patient:")) {
      patient = trimmed.replace("Patient:", "").trim();
    } else if (trimmed.startsWith("Age:")) {
      const val = trimmed.replace("Age:", "").trim();
      patient = patient === "N/A" ? val : `${patient}, Age: ${val}`;
    } else if (trimmed.startsWith("Gender:")) {
      const val = trimmed.replace("Gender:", "").trim();
      patient = patient === "N/A" ? val : `${val}, ${patient}`;
    } else if (trimmed.startsWith("AI Prediction:") || trimmed.startsWith("AI Prediction")) {
      prediction = trimmed.replace(/AI Prediction:?/i, "").trim();
    } else if (trimmed.startsWith("Confidence:") || trimmed.startsWith("Confidence")) {
      confidence = trimmed.replace(/Confidence:?/i, "").trim();

    } else if (trimmed.startsWith("Analysis Date:") || trimmed.startsWith("Analysis Date")) {
      date = trimmed.replace(/Analysis Date:?/i, "").trim();
    } else if (trimmed.startsWith("Scan URL:") || trimmed.startsWith("Scan URL")) {
      const rawUrl = trimmed.replace(/Scan URL:?/i, "").trim();
      if (/^(https?:|blob:)/i.test(rawUrl)) {
        scanUrl = rawUrl;
      } else if (rawUrl) {
        const base = String(import.meta.env.VITE_API_BASE_URL || "https://api.skinnerai.site").replace(/\/$/, "");
        try {
          scanUrl = new URL(rawUrl, base).toString();
        } catch {
          scanUrl = rawUrl;
        }
      }
    }
  }

  // Fallbacks for older/different formats:
  if (prediction === "N/A") {
    const predMatch = /AI Prediction\s*:\s*([^\n]+)/i.exec(text) || /Predicted\s*class\s*:\s*([^\n,]+)/i.exec(text);
    if (predMatch) prediction = predMatch[1].trim();
  }
  if (confidence === "N/A") {
    const confMatch = /Confidence\s*:\s*([^\n]+)/i.exec(text);
    if (confMatch) confidence = confMatch[1].trim();
  }
  if (patient === "N/A") {
    const ageMatch = /Age\s*:\s*([^\n]+)/i.exec(text);
    const genMatch = /Gender\s*:\s*([^\n]+)/i.exec(text);
    if (ageMatch && genMatch) {
      patient = `${genMatch[1].trim()}, ${ageMatch[1].trim()}`;
    } else if (ageMatch) {
      patient = `Age: ${ageMatch[1].trim()}`;
    } else if (genMatch) {
      patient = genMatch[1].trim();
    }
  }


  return { patient, prediction, confidence, date, scanUrl };
}

function ChatScreen({ onBack, onWriteReport, submittedReport = "", patientName = "Patient", patientInitial = "P", chatId = "", caseItem = null, socket }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sendErr, setSendErr] = useState("");
  const [messages, setMessages] = useState([]);
  const [liveReportText, setLiveReportText] = useState(submittedReport);

  useEffect(() => {
    setLiveReportText(submittedReport);
  }, [submittedReport]);

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Build a synthetic pinned analysis card from an adapted analysis object
  function buildSyntheticCard(analysis) {
    const confidence = analysis.confidence != null ? `${analysis.confidence}%` : "N/A";

    const condition  = analysis.condition  || "N/A";
    const date       = analysis.createdAt
      ? new Date(analysis.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const imageUrl   = analysis.imageUrl   || "";

    const patientGender = caseItem?.patient_gender ? (caseItem.patient_gender.charAt(0).toUpperCase() + caseItem.patient_gender.slice(1)) : "N/A";
    const patientAge = caseItem?.patient_age || "N/A";
    const patientName = caseItem?.patient_name || "Patient";
    const detailsStr = [patientGender, patientAge].filter(v => v !== "N/A").join(", ");

    const text = [
      `AI Prediction: ${condition}`,
      `Confidence: ${confidence}`,
      `Patient: ${patientName}${detailsStr ? ` (${detailsStr})` : ""}`,
      `Analysis Date: ${date}`,
      imageUrl ? `Scan URL: ${imageUrl}` : "",
    ].filter(Boolean).join("\n");
    return {
      id:          "__clinical_summary__",
      side:        "left",
      text,
      time:        analysis.createdAt || new Date().toISOString(),
      fileUrl:     imageUrl,
      raw:         { sender_role: "system", original_filename: "skin_analysis.jpg" },
      __synthetic: true,
    };
  }

  // Try to fetch the analysis linked to this case/appointment
  async function fetchLinkedAnalysis() {
    // 1. Try analysis_id directly from the case item
    const analysisId =
      caseItem?.analysis_id || caseItem?.analysisId ||
      caseItem?.raw?.analysis_id || caseItem?.raw?.analysisId || "";
    if (analysisId) {
      try {
        const res = await analysisApi.getById(analysisId);
        return adaptAnalysis(unwrapData(res));
      } catch { /* fall through */ }
    }

    // 2. Try to get the full case details via the appointment id
    const appointmentId = caseItem?.appointment_id || caseItem?.id || "";
    if (appointmentId) {
      try {
        const res = await doctorApi.caseDetails(appointmentId);
        const details = unwrapData(res);
        const aId = details?.analysis_id || details?.analysisId || details?.raw?.analysis_id;
        if (aId) {
          const aRes = await analysisApi.getById(aId);
          return adaptAnalysis(unwrapData(aRes));
        }
        // If case details carry embedded analysis data, adapt directly
        if (details?.condition || details?.ai_diagnosis) {
          return {
            condition:   details.ai_diagnosis  || details.condition  || "N/A",
            confidence:  details.ai_confidence ? parseInt(String(details.ai_confidence)) : null,

            createdAt:   details.created_at    || null,
            imageUrl:    details.patient_image || null,
          };
        }
      } catch { /* fall through */ }
    }

    // 3. Fall back to embedded case data we already have
    if (caseItem?.ai_diagnosis || caseItem?.condition) {
      return {
        condition:   caseItem.ai_diagnosis  || caseItem.condition  || "N/A",
        confidence:  caseItem.ai_confidence ? parseInt(String(caseItem.ai_confidence)) : null,

        createdAt:   caseItem.submitted_on  || null,
        imageUrl:    caseItem.patient_image || null,
      };
    }

    return null;
  }

  // Load messages from API on mount — strip any old cards, pin the correct one
  useEffect(() => {
    if (!chatId) { setLoading(false); return; }
    let alive = true;
    async function load() {
      setLoading(true);
      setLoadErr("");
      try {
        const res = await chatApi.messages(chatId);
        const raw = toArray(unwrapData(res)).map((m) => adaptMessage(m, "doctor"));

        if (!alive) return;

        // Separate analysis cards from regular messages
        const isAnalysisCard = (m) =>
          (m.raw?.sender_role === "system" && m.raw?.original_filename === "skin_analysis.jpg")
          || (m.raw?.sender_role === "system" && /AI Prediction:/i.test(m.text || ""))
          || /^AI Prediction:/m.test(m.text || "");

        const cards = raw.filter(isAnalysisCard);
        const nonCards = raw.filter((m) => !isAnalysisCard(m));

        if (cards.length > 0) {
          // Use the LAST card (most recent appointment)
          const latestCard = cards[cards.length - 1];
          setMessages([latestCard, ...nonCards]);
        } else {
          // No card found — build one from the case data
          const analysis = await fetchLinkedAnalysis();
          if (!alive) return;
          if (analysis && (analysis.condition || analysis.confidence)) {
            setMessages([buildSyntheticCard(analysis), ...nonCards]);
          } else {
            setMessages(nonCards);
          }
        }
      } catch (err) {
        if (alive) setLoadErr(err.message || "Could not load messages.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [chatId]);

  // Connect to room and listen to real-time events
  useEffect(() => {
    if (!socket || !chatId) return;

    socket.emit("join_chat", { chat_id: chatId });

    const handleNewMessage = (response) => {
      if (response.success && response.data) {
        if (response.data.chat_id !== chatId) return;
        const msg = response.data;
        const text = msg.message_text || msg.text || "";
        if (msg.message_type === "system" || msg.sender_role === "system") {
          if (text.startsWith("📋 Report submitted:") || text.startsWith("📋 Report updated:")) {
            const cleanText = text.replace(/^📋\s*Report (submitted|updated):\s*\n*/i, "").trim();
            setLiveReportText(cleanText);
          }
        }
        setMessages((prev) => {
          const msgId = msg.message_id || msg.id;
          if (prev.some((m) => m.id === msgId)) return prev;
          return [...prev, adaptMessage(msg, "doctor")];
        });
        // Mark message as read in DB since we are actively viewing the chat
        chatApi.messages(chatId).catch(() => {});
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, chatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Limit to 10 MB
    if (file.size > 10 * 1024 * 1024) {
      setSendErr("File size must be under 10 MB.");
      return;
    }
    setSelectedFile(file);
    setSendErr("");
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canSend = !sending && (cleanText(draft, 500).length >= 1 || selectedFile);

  const submitMessage = async (event) => {
    event.preventDefault();
    if (!canSend) return;

    const text = cleanText(draft, 500);

    // If text-only, validate it
    if (!selectedFile && validateMessage(draft)) {
      setSendErr(validateMessage(draft));
      return;
    }

    setSendErr("");
    const fileToSend = selectedFile;
    setSending(true);
    try {
      if (chatId) {
        await chatApi.send({
          chat_id: chatId,
          message_text: text || undefined,
          chat_file: fileToSend || undefined,
        });
        setDraft("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (apiErr) {
      setSendErr(apiErr.message || "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const bubbleStyle = (side) =>
    side === "right"
      ? "bg-blue-600 text-white"
      : "border border-gray-200 bg-white text-slate-800 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/80";

  const formatTime = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section className="mx-auto max-w-[980px] space-y-4">
      {/* Chat window */}
      <div className="flex h-[600px] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <button type="button" onClick={onBack} className="flex items-center gap-3 text-left">
            <ArrowLeft className="size-4 text-slate-700" />
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-600">
              {patientInitial}
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-slate-900">{patientName}</h1>
              <p className="text-[11px] text-gray-500">patient</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-[11px] font-medium text-green-700">
              <Shield className="size-3" /> SECURE
            </span>
            {/* Write Report button — lives in chat header */}
            <button
              type="button"
              onClick={onWriteReport}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#050316] px-3 text-[12px] font-medium text-white hover:bg-[#111026]"
            >
              <FileText className="size-3.5" />
              {submittedReport ? "Edit Report" : "Write Report"}
            </button>
          </div>
        </div>

        {/* Security notice */}
        <div className="flex items-center justify-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-3 text-[12px] text-gray-600 dark:bg-zinc-950/40 dark:border-zinc-800/80 dark:text-zinc-400">
          <Lock className="size-3.5 text-blue-600" />
          End-to-end encrypted conversation. Your privacy is protected.
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-5 bg-gray-50/60 dark:bg-zinc-900/40 px-8 py-6">
          {loading && (
            <div className="flex h-40 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          )}
          {loadErr && !loading && (
            <p className="text-center text-[12px] text-red-500">{loadErr}</p>
          )}
          {!loading && !loadErr && messages.length === 0 && (
            <p className="text-center text-[12px] text-gray-400">
              No messages yet. Start the conversation with your patient.
            </p>
          )}
          {messages.map((message) => {
            const isRight = message.side === "right";
            const rawFileUrl = message.fileUrl || "";
            let resolvedUrl = "";
            if (rawFileUrl) {
              const trimmed = String(rawFileUrl).trim();
              if (/^(https?:|blob:)/i.test(trimmed)) { resolvedUrl = trimmed; }
              else if (trimmed) {
                const base = String(import.meta.env.VITE_API_BASE_URL || "https://api.skinnerai.site").replace(/\/$/, "");
                try { resolvedUrl = new URL(trimmed, base).toString(); } catch { resolvedUrl = trimmed; }
              }
            }
            const isImage = resolvedUrl && (/\.(jpe?g|png|gif|webp|bmp|svg)($|\?)/i.test(resolvedUrl) || resolvedUrl.startsWith("blob:"));
            const isFile = !!resolvedUrl && !isImage;

            const isAnalysisCard = (message.raw?.sender_role === 'system' && message.raw?.original_filename === 'skin_analysis.jpg')
              || (message.raw?.sender_role === 'system' && /AI Prediction:/i.test(message.text || ""))
              || /^AI Prediction:/m.test(message.text || "");

            if (isAnalysisCard) {
              const summary = parseClinicalSummary(message.text || "", resolvedUrl);
              const pName = caseItem?.patient_name;
              if (pName && !summary.patient.includes(pName)) {
                let cleanedDetails = summary.patient === "N/A" || summary.patient === "N/A, N/A" || summary.patient === "Patient" ? "" : summary.patient;
                if (!cleanedDetails) {
                  const genderStr = caseItem.patient_gender ? (caseItem.patient_gender.charAt(0).toUpperCase() + caseItem.patient_gender.slice(1)) : "";
                  const ageStr = caseItem.patient_age ? `${caseItem.patient_age}` : "";
                  cleanedDetails = [genderStr, ageStr].filter(Boolean).join(", ");
                }
                summary.patient = cleanedDetails ? `${pName} (${cleanedDetails})` : pName;
              }


              return (
                <div key={message.id} className="w-full max-w-[460px] my-4 self-start rounded-xl border border-blue-200 bg-blue-50/70 p-5 shadow-md backdrop-blur-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-[#111827]">
                  {/* Header */}
                  <div className="mb-4 flex items-center gap-2 pb-3 border-b border-blue-100 dark:border-zinc-800">
                    <FileText className="size-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Clinical Summary</h3>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-400">System-generated AI Analysis</p>
                    </div>
                  </div>

                  {/* Body Grid */}
                  <div className="grid grid-cols-2 gap-4 text-[12px] leading-relaxed text-slate-700 dark:text-zinc-300">
                    <div>
                      <p className="text-gray-400 font-medium">Patient</p>
                      <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{summary.patient}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Analysis Date</p>
                      <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{summary.date}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">AI Prediction</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{summary.prediction}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Confidence</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-white">{summary.confidence}</span>
                        <div className="h-1.5 w-16 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600" 
                            style={{ width: summary.confidence.includes("%") ? summary.confidence : "50%" }}
                          />
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const parsedConf = parseInt(summary.confidence);
                      const confidenceLevel = !isNaN(parsedConf)
                        ? (parsedConf >= 85 ? "High" : parsedConf >= 60 ? "Medium" : "Low")
                        : null;
                      if (!confidenceLevel) return null;
                      return (
                        <div className="col-span-2">
                          <p className="text-gray-400 font-medium mb-1">Confidence Level</p>
                          <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium border rounded-md uppercase tracking-wider ${
                            confidenceLevel === "High" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50" :
                            confidenceLevel === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" :
                            "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50"
                          }`}>
                            {confidenceLevel} Confidence
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Action Link */}
                  {summary.scanUrl && (
                    <div className="mt-5 pt-3 border-t border-blue-100 dark:border-zinc-800">
                      <a 
                        href={summary.scanUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 h-9 rounded-md bg-[#050316] text-[12px] font-medium text-white hover:bg-opacity-90 transition dark:bg-blue-600 dark:hover:bg-blue-500"
                      >
                        <FileText className="size-4" />
                        View Skin Scan
                      </a>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={message.id} className={`flex flex-col ${isRight ? "items-end" : "items-start"}`}>
                <div className={`max-w-[620px] rounded-lg shadow-sm overflow-hidden ${bubbleStyle(message.side)}`}>
                  {isImage && (
                    <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={resolvedUrl}
                        alt="Shared image"
                        className="max-h-60 w-full object-cover"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    </a>
                  )}
                  {isFile && (
                    <a
                      href={resolvedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-4 py-2.5 text-[12px] transition ${
                        isRight ? "text-blue-200 hover:text-blue-100" : "text-blue-600 hover:text-blue-800"
                      }`}
                    >
                      <FileText className="size-4 shrink-0" />
                      <span className="truncate underline">{resolvedUrl.split("/").pop() || "Attachment"}</span>
                    </a>
                  )}
                  {message.text && (
                    <div className="px-4 py-3 text-[13px]">
                      {message.text}
                    </div>
                  )}
                  {!message.text && !resolvedUrl && (
                    <div className="px-4 py-3 text-[13px] opacity-50">
                      (empty message)
                    </div>
                  )}
                </div>
                <div className="mt-1 block text-[10px] uppercase text-gray-400 dark:text-neutral-400">{formatTime(message.time)}</div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Conditional message input / locked banner */}
        {submittedReport ? (
          <div className="border-t border-gray-200 bg-gray-50 px-8 py-5 text-center text-[12px] text-gray-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 flex items-center justify-center gap-2">
            <Lock className="size-4 text-gray-400" />
            <span>This chat is locked because the case has been completed.</span>
          </div>
        ) : (
          <>
            {/* File preview strip */}
            {selectedFile && (
              <div className="flex items-center gap-2 border-t border-gray-100 bg-blue-50/60 px-8 py-2 dark:bg-[#1F2937]/50 dark:border-[#374151]">
                <Paperclip className="size-3.5 text-blue-500" />
                <span className="min-w-0 flex-1 truncate text-[12px] text-slate-700 dark:text-gray-300">
                  {selectedFile.name}
                </span>
                <span className="shrink-0 text-[10px] text-gray-400">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={removeFile}
                  className="shrink-0 rounded-full p-0.5 text-gray-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
            />

            {/* Input */}
            <form onSubmit={submitMessage} className="border-t border-gray-200 bg-white px-8 py-5 dark:bg-zinc-950 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className={`flex h-10 flex-1 items-center rounded-lg border bg-white px-4 dark:bg-[#1F2937] dark:border-[#374151] ${error || sendErr ? "border-red-300" : "border-gray-200"}`}>
                  <input
                    value={draft}
                    onChange={(e) => { setDraft(sanitizeText(e.target.value, 500)); setError(""); setSendErr(""); }}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-gray-400 dark:text-[#F9FAFB]"
                    placeholder="Type your message..."
                    maxLength={500}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="ml-2 rounded-md p-1 text-gray-400 transition hover:bg-gray-200 hover:text-slate-600 dark:hover:bg-[#374151]"
                    title="Attach file"
                  >
                    <Paperclip className="size-4" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!canSend}
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white disabled:opacity-50"
                >
                  {sending
                    ? <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <Send className="size-5" />}
                </button>
              </div>
              {error && <p className="mt-2 text-[11px] font-medium text-red-600">{error}</p>}
              {sendErr && <p className="mt-2 text-[11px] font-medium text-red-600">{sendErr}</p>}
              <p className="mt-3 text-center text-[10px] uppercase text-gray-400">
                Messages are monitored for quality assurance and training purposes
              </p>
            </form>
          </>
        )}
      </div>

      {/* Submitted report preview — shown below chat once a report exists */}
      {liveReportText && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm dark:bg-green-950/20 dark:border-green-900/50">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-green-700 dark:text-green-400" />
              <span className="text-[13px] font-medium text-green-900 dark:text-green-300">Report Submitted</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadReport(liveReportText, patientName)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-green-300 bg-white px-3 text-[12px] text-green-800 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-900/50"
              >
                <FileText className="size-3.5" /> Download Report
              </button>
              <button
                type="button"
                onClick={onWriteReport}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#050316] px-3 text-[12px] text-white hover:bg-[#111026] dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Edit Report
              </button>
            </div>
          </div>
          <p className="line-clamp-3 text-[12px] leading-relaxed text-green-800 dark:text-zinc-300">{liveReportText}</p>
        </div>
      )}
    </section>
  );
}

export default function DoctorTabsSection({ onAnalyticsChange, onAnalyticsData }) {
  const [activeTab, setActiveTab] = useState("pending-cases");
  const [screen, setScreen] = useState("tabs");
  const [pendingCases, setPendingCases] = useState([]);
  const [reviewedCases, setReviewedCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState(initialDoctorInfo);
  const [submittedReport, setSubmittedReport] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [dateSlots, setDateSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const [dateMessage, setDateMessage] = useState("");
  const [dateError, setDateError] = useState("");
  const [socket, setSocket] = useState(null);
  const [chatBackTarget, setChatBackTarget] = useState("review");
  const [reportBackTarget, setReportBackTarget] = useState("chat");

  const activeChatId = screen === "chat" ? (selectedCase?.chat_id || selectedCase?.raw?.chat_id || null) : null;
  const activeChatIdRef = useRef(null);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDoctorData = async () => {
    try {
      const [pendingResponse, reviewedResponse, profileResponse] = await Promise.allSettled([
        doctorApi.pendingCases(),
        doctorApi.reviewedCases(),
        profileApi.me(),
      ]);
      if (!isMountedRef.current) return;
      if (pendingResponse.status === "fulfilled") {
        const list = toArray(unwrapData(pendingResponse.value)).map((item) => adaptDoctorCase(item));
        setPendingCases(list);
        if (list.length) setSelectedCase(list[0]);
        onAnalyticsData?.((prev) => ({ ...prev, pendingCount: list.length }));
      }
      if (reviewedResponse.status === "fulfilled") {
        const list = toArray(unwrapData(reviewedResponse.value)).map((item) => adaptDoctorCase(item));
        setReviewedCases(list);
        const today = new Date().toDateString();
        const reviewedToday = list.filter((item) => {
          const d = item.submitted_on ? new Date(item.submitted_on) : null;
          return d && d.toDateString() === today;
        }).length;
        onAnalyticsData?.((prev) => ({ ...prev, reviewedTodayCount: reviewedToday }));
      }
      // Count distinct patients across pending + reviewed cases
      if (pendingResponse.status === "fulfilled" || reviewedResponse.status === "fulfilled") {
        const pendingList = pendingResponse.status === "fulfilled"
          ? toArray(unwrapData(pendingResponse.value)) : [];
        const reviewedList = reviewedResponse.status === "fulfilled"
          ? toArray(unwrapData(reviewedResponse.value)) : [];
        const allPatientIds = new Set([
          ...pendingList.map((r) => r.patient_id || r.raw?.patient_id).filter(Boolean),
          ...reviewedList.map((r) => r.patient_id || r.raw?.patient_id).filter(Boolean),
        ]);
        onAnalyticsData?.((prev) => ({ ...prev, totalPatients: allPatientIds.size }));
      }
      if (profileResponse.status === "fulfilled") {
        const profile = unwrapData(profileResponse.value);
        setDoctorInfo((prev) => ({
          ...prev,
          name: profile?.name || prev.name,
          email: profile?.email || prev.email,
          phone: profile?.phone || prev.phone,
          address: profile?.clinic_address || profile?.address || prev.address,
          consultationFee: profile?.consultation_fee ? String(profile.consultation_fee) : prev.consultationFee,
        }));
      }
    } catch {
      if (isMountedRef.current) setServerError("Could not load doctor data from API. Please try again later.");
    }
  };

  const loadDoctorDataRef = useRef(loadDoctorData);
  useEffect(() => {
    loadDoctorDataRef.current = loadDoctorData;
  }, [loadDoctorData]);

  // Connect socket
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const host = import.meta.env.VITE_API_BASE_URL || "https://api.skinnerai.site";
    const s = io(host, {
      auth: { token }
    });

    setSocket(s);

    s.on("unread_update", (data) => {
      // If we are currently chatting in this chat, don't increment the unread count
      if (activeChatIdRef.current === data.chat_id) {
        return;
      }
      // Increment unread count for that case in pendingCases and reviewedCases
      setPendingCases((prev) =>
        prev.map((c) => {
          const id = c.chat_id || c.raw?.chat_id;
          if (id === data.chat_id) {
            return {
              ...c,
              unread_count: (c.unread_count || 0) + 1,
              unreadCount: (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
      setReviewedCases((prev) =>
        prev.map((c) => {
          const id = c.chat_id || c.raw?.chat_id;
          if (id === data.chat_id) {
            return {
              ...c,
              unread_count: (c.unread_count || 0) + 1,
              unreadCount: (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    });

    s.on("appointment_booked", (data) => {
      console.log("Real-time notification: new appointment booked!", data);
      loadDoctorDataRef.current();
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const [hasChatMessages, setHasChatMessages] = useState(false);

  useEffect(() => {
    let alive = true;
    async function checkMessages() {
      const chatId = selectedCase?.chat_id || selectedCase?.raw?.chat_id;
      if (!chatId) {
        setHasChatMessages(false);
        return;
      }
      try {
        const res = await chatApi.messages(chatId, { peek: "true" });
        const list = toArray(unwrapData(res));
        const nonSystem = list.filter((m) => {
          const role = m.sender_role || m.role || m.sender || m.raw?.sender_role;
          const type = m.message_type || m.type || m.raw?.message_type;
          return role !== "system" && type !== "system";
        });
        if (alive) {
          setHasChatMessages(nonSystem.length > 0);
        }
      } catch {
        if (alive) setHasChatMessages(false);
      }
    }
    checkMessages();
    return () => { alive = false; };
  }, [selectedCase]);

  useEffect(() => {
    const showAnalytics = screen === "tabs" && activeTab === "pending-cases";
    onAnalyticsChange?.(showAnalytics);
  }, [activeTab, screen, onAnalyticsChange]);

  useEffect(() => {
    loadDoctorData();
    // Load current month date availability
    loadDateSlotsForMonth(new Date().getFullYear(), new Date().getMonth());
  }, []);

  const saveDoctorInfo = async (nextInfo) => {
    setDoctorInfo(nextInfo);
    setServerError("");
    try {
      await profileApi.update({
        name: nextInfo.name,
        phone: nextInfo.phone,
        clinic_address: nextInfo.address,
        consultation_fee: Number(nextInfo.consultationFee),
      });
      setServerMessage("Doctor profile updated successfully.");
    } catch (error) {
      setServerError(error.message || "Profile could not be updated on the API.");
    }
  };

  // ── Per-date availability helpers ──
  const clampTime = (t) => { if (!t) return "09:00"; if (t < "09:00") return "09:00"; if (t > "21:00") return "21:00"; return t; };
  const loadDateSlotsForMonth = async (yr, mo) => {
    setLoadingDates(true);
    try {
      const startDate = `${yr}-${String(mo + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(yr, mo + 1, 0).getDate();
      const endDate = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      const res = await doctorApi.getDateAvailability(startDate, endDate);
      const data = toArray(unwrapData(res));
      const grouped = {};
      for (const entry of data) {
        const d = new Date(entry.available_date).toISOString().split("T")[0];
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push({
          start_time: clampTime(entry.start_time?.slice(0, 5) || entry.start_time),
          end_time: clampTime(entry.end_time?.slice(0, 5) || entry.end_time),
          slot_duration_minutes: entry.slot_duration_minutes || 30,
          _uid: entry.id || `${d}-${grouped[d].length}`,
        });
      }
      setDateSlots((prev) => ({ ...prev, ...grouped }));
    } catch { /* silent — will show empty */ }
    finally { setLoadingDates(false); }
  };

  const handleSlotsChange = (dateStr, slots) => {
    setDateSlots((prev) => ({ ...prev, [dateStr]: slots }));
  };

  const handleSaveDate = async (dateStr) => {
    const slots = dateSlots[dateStr] || [];
    if (slots.length === 0) { setDateError("Add at least one time slot."); return; }
    setSavingDate(true);
    setDateMessage("");
    setDateError("");
    try {
      await doctorApi.setDateAvailability(dateStr, slots.map((s) => ({
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration_minutes: s.slot_duration_minutes,
      })));
      setDateMessage("Availability saved!");
      setTimeout(() => setDateMessage(""), 4000);
    } catch (error) {
      setDateError(error.message || "Could not save availability.");
    } finally { setSavingDate(false); }
  };

  const handleRemoveDate = async (dateStr) => {
    setSavingDate(true);
    setDateMessage("");
    setDateError("");
    try {
      await doctorApi.removeDateAvailability(dateStr);
      setDateSlots((prev) => { const next = { ...prev }; delete next[dateStr]; return next; });
      setDateMessage("Day removed.");
      setTimeout(() => setDateMessage(""), 4000);
    } catch (error) {
      setDateError(error.message || "Could not remove availability.");
    } finally { setSavingDate(false); }
  };

  const submitReport = async (cleanReport) => {
    const oldReport = submittedReport;
    setSubmittedReport(cleanReport);
    setServerError("");
    const appointmentId = selectedCase?.appointment_id || selectedCase?.id;
    if (!appointmentId) {
      setServerError("Missing appointment ID for this case.");
      return;
    }
    setIsSubmittingReport(true);
    try {
      if (oldReport) {
        await doctorApi.updateReport({
          appointment_id: appointmentId,
          diagnosis: cleanReport,
        });
        setServerMessage("Report updated successfully.");
        setScreen(reportBackTarget);
      } else {
        await doctorApi.reviewCase({
          appointment_id: appointmentId,
          diagnosis: cleanReport,
        });
        setServerMessage("Report submitted successfully.");
        setScreen(reportBackTarget); // go back sequentially to where we came from (chat, review, or tabs)
      }

      // Sync local lists so that CaseReviewDetail and other panels get the updated text immediately
      const syncCaseList = (c) => {
        const id = c.appointment_id || c.id;
        if (id === appointmentId) {
          return {
            ...c,
            raw: {
              ...c.raw,
              report_diagnosis: cleanReport,
              diagnosis: cleanReport,
              notes: cleanReport,
            }
          };
        }
        return c;
      };
      setPendingCases((prev) => prev.map(syncCaseList));
      setReviewedCases((prev) => prev.map(syncCaseList));
      setSelectedCase((prev) => {
        if (prev && (prev.appointment_id === appointmentId || prev.id === appointmentId)) {
          return {
            ...prev,
            raw: {
              ...prev.raw,
              report_diagnosis: cleanReport,
              diagnosis: cleanReport,
              notes: cleanReport,
            }
          };
        }
        return prev;
      });

    } catch (error) {
      setSubmittedReport(oldReport);
      setServerError(error.message || "Could not submit the report.");
      throw error;
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleStartChat = (caseItem, backTarget = "tabs") => {
    if (!caseItem) return;
    setSelectedCase(caseItem);
    setSubmittedReport(caseItem.raw?.report_diagnosis || caseItem.raw?.notes || caseItem.raw?.diagnosis || "");
    setChatBackTarget(backTarget);
    setScreen("chat");

    // Reset unread count locally for instant feedback
    setPendingCases((prev) => 
      prev.map((c) => {
        const id1 = c.appointment_id || c.id;
        const id2 = caseItem.appointment_id || caseItem.id;
        if (id1 === id2) return { ...c, unread_count: 0, unreadCount: 0 };
        return c;
      })
    );
    setReviewedCases((prev) => 
      prev.map((c) => {
        const id1 = c.appointment_id || c.id;
        const id2 = caseItem.appointment_id || caseItem.id;
        if (id1 === id2) return { ...c, unread_count: 0, unreadCount: 0 };
        return c;
      })
    );
  };

  if (screen === "review") {
    return (
      <CaseReviewDetail
        item={selectedCase}
        onBack={() => setScreen("tabs")}
        onStartChat={() => handleStartChat(selectedCase, "review")}
        onViewReport={(item, reportText) => {
          setSelectedCase(item);
          setSubmittedReport(reportText);
          setReportBackTarget("review");
          setScreen("report");
        }}
        hasChatMessages={hasChatMessages}
      />
    );
  }

  if (screen === "chat") {
    return (
      <ChatScreen
        onBack={() => setScreen(chatBackTarget)}
        onWriteReport={() => {
          setReportBackTarget("chat");
          setScreen("report");
        }}
        submittedReport={submittedReport}
        patientName={selectedCase?.patient_name || "Patient"}
        patientInitial={(selectedCase?.patient_name || "P").charAt(0).toUpperCase()}
        chatId={selectedCase?.chat_id || selectedCase?.raw?.chat_id || ""}
        caseItem={selectedCase}
        socket={socket}
      />
    );
  }

  if (screen === "report") {
    return (
      <>
        {serverError && <div className="mx-auto mb-4 max-w-[720px] rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{serverError}</div>}
        {isSubmittingReport && <div className="mx-auto mb-4 max-w-[720px] rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] text-blue-700">Submitting report...</div>}
        <DoctorReportEditor
          initialReport={submittedReport}
          existingReport={submittedReport}
          patientName={selectedCase?.patient_name || ""}
          onBack={() => setScreen(reportBackTarget)}
          backLabel={
            reportBackTarget === "review" ? "Back to Case Review" :
            reportBackTarget === "tabs" ? "Back to List" :
            "Back to Chat"
          }
          onSubmit={submitReport}
        />
      </>
    );
  }

  return (
    <>
      {serverMessage && <div className="mx-auto mb-4 max-w-[820px] rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[12px] text-green-700">{serverMessage}</div>}
      {serverError && <div className="mx-auto mb-4 max-w-[820px] rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">{serverError}</div>}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <DashboardTabs pendingCount={pendingCases.length} />

        <TabsContent value="pending-cases" className="mt-6 space-y-4">
          {pendingCases.length ? pendingCases.map((item) => (
            <PendingCasesCard 
              key={item.id || item.appointment_id} 
              item={item} 
              onReview={() => { setSelectedCase(item); setSubmittedReport(""); setScreen("review"); }} 
              onChat={() => handleStartChat(item)}
            />
          )) : <EmptyState title="No pending cases" message="There are no pending cases assigned to you at the moment." />}
        </TabsContent>

        <TabsContent value="reviewed-cases" className="mt-6">
          <ReviewedCases
            items={reviewedCases}
            onDetails={(item) => {
              setSelectedCase(item);
              const reportText = item.raw?.report_diagnosis || item.raw?.notes || item.raw?.diagnosis || "";
              setSubmittedReport(reportText);
              setScreen("review");
            }}
            onViewReport={(item, reportText) => {
              setSelectedCase(item);
              setSubmittedReport(reportText);
              setReportBackTarget("tabs");
              setScreen("report");
            }}
          />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <DoctorSchedule
            doctorInfo={doctorInfo}
            onOpenModal={() => setModalOpen(true)}
            dateSlots={dateSlots}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSlotsChange={handleSlotsChange}
            onSaveDate={handleSaveDate}
            onRemoveDate={handleRemoveDate}
            savingDate={savingDate}
            dateMessage={dateMessage}
            dateError={dateError}
            loadingDates={loadingDates}
            onMonthChange={loadDateSlotsForMonth}
            upcomingAppointments={pendingCases}
          />
        </TabsContent>
      </Tabs>
      {modalOpen && <DoctorInfoModal doctorInfo={doctorInfo} onSave={saveDoctorInfo} onClose={() => setModalOpen(false)} />}
    </>
  );
}
