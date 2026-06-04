/**
 * ChatTab.jsx
 * ─────────────────────────────────────────────────────────────
 * Patient ↔ Doctor real-time chat tab inside the patient portal.
 *
 * Flow:
 *  1. Load all patient chats from GET /api/chat/my-chats
 *  2. Show a list of conversations (one per doctor/appointment)
 *  3. Patient selects a conversation → load its messages
 *  4. Patient can type and send new messages
 *  5. If a report exists in a conversation it's shown below the chat
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Lock,
  MessageCircle,
  Paperclip,
  RefreshCcw,
  Send,
  Shield,
} from "lucide-react";
import {
  analysisApi,
  appointmentApi,
  chatApi,
  getLatestChatId,
  unwrapData,
  profileApi,
} from "@/services/skinnerApi";
import { adaptAnalysis, adaptMessage, toArray } from "@/services/apiAdapters";
import { cleanText, sanitizeText, validateMessage } from "@/lib/formValidation";

// ── Helpers ───────────────────────────────────────────────────
function formatTime(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initialsFrom(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ── Sub-components ────────────────────────────────────────────
function Avatar({ name = "", size = "md" }) {
  const sizeClass = size === "sm" ? "size-8 text-[11px]" : "size-10 text-[13px]";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 ${sizeClass}`}>
      {initialsFrom(name) || "?"}
    </div>
  );
}

function isImageUrl(url) {
  if (!url) return false;
  if (url.startsWith("blob:")) return true;
  return /\.(jpe?g|png|gif|webp|bmp|svg)($|\?)/i.test(url);
}

function resolveFileUrl(url) {
  if (!url) return "";
  const raw = String(url).trim();
  if (!raw) return "";
  if (/^(https?:|blob:)/i.test(raw)) return raw;
  const base = String(import.meta.env.VITE_API_BASE_URL || "https://api.skinnerai.site").replace(/\/$/, "");
  try { return new URL(raw, base).toString(); } catch { return raw; }
}

function parseClinicalSummary(text, fallbackImage = "") {
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

  if (prediction === "N/A") {
    const predMatch = /AI Prediction\s*:\s*([^\n]+)/i.exec(text) || /Predicted\s*class\s*:\s*([^\n,]+)/i.exec(text);
    if (predMatch) prediction = predMatch[1].trim();
  }
  if (confidence === "N/A") {
    const confMatch = /Confidence\s*:\s*([^\n]+)/i.exec(text);
    if (confMatch) confidence = confMatch[1].trim();
  }
  return { patient, prediction, confidence, date, scanUrl };
}

function MessageBubble({ side, text, time, fileUrl }) {
  const isRight = side === "right";
  const resolvedUrl = resolveFileUrl(fileUrl);
  const hasImage = isImageUrl(resolvedUrl);
  const hasFile = !!resolvedUrl && !hasImage;

  return (
    <div className={`flex flex-col ${isRight ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl shadow-sm overflow-hidden ${isRight
            ? "rounded-br-sm bg-[#050316] dark:bg-blue-600 text-white"
            : "rounded-bl-sm border border-gray-200 bg-white text-slate-800 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/80"
          }`}
      >
        {/* Image attachment */}
        {hasImage && (
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={resolvedUrl}
              alt="Shared image"
              className="max-h-60 w-full rounded-t-2xl object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </a>
        )}
        {/* Non-image file attachment */}
        {hasFile && (
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2.5 text-[12px] transition ${isRight ? "text-blue-200 hover:text-blue-100" : "text-blue-600 hover:text-blue-800"
              }`}
          >
            <FileText className="size-4 shrink-0" />
            <span className="truncate underline">{resolvedUrl.split("/").pop() || "Attachment"}</span>
          </a>
        )}
        {/* Text content */}
        {text && (
          <div className="px-4 py-2.5 text-[13px] leading-relaxed">
            {text}
          </div>
        )}
        {/* If no text and no file, show empty state */}
        {!text && !resolvedUrl && (
          <div className="px-4 py-2.5 text-[13px] leading-relaxed opacity-50">
            (empty message)
          </div>
        )}
      </div>
      {time && (
        <div className="mt-1 text-[10px] text-gray-400 dark:text-neutral-400">{formatTime(time)}</div>
      )}
    </div>
  );
}

// ── ConversationList ──────────────────────────────────────────
function ConversationList({ chats, loading, error, onSelect, onRefresh }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-center">
        <p className="text-[13px] text-red-600">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-[12px] text-red-700 hover:bg-red-100"
        >
          <RefreshCcw className="size-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (!chats.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
        <MessageCircle className="mx-auto mb-3 size-10 text-gray-300" />
        <p className="text-[14px] font-medium text-slate-700">No conversations yet</p>
        <p className="mt-1 text-[12px] text-gray-400">
          Your chats with doctors will appear here after booking an appointment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chats.map((chat) => {
        const doctorName = chat.doctor_name || chat.doctorName || "Doctor";
        const rawLastMsg = chat.last_message || chat.lastMessage || "";
        const lastMsg = typeof rawLastMsg === "object" && rawLastMsg !== null
          ? (rawLastMsg.message_text || rawLastMsg.text || rawLastMsg.content || "")
          : String(rawLastMsg);
        const lastTime = chat.updated_at || chat.updatedAt || chat.created_at || "";
        const chatId = chat.chat_id || chat.id || chat._id;
        const hasReport = !!(chat.diagnosis || chat.report);

        return (
          <button
            key={chatId}
            type="button"
            onClick={() => onSelect(chat)}
            className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/30 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-blue-500 dark:hover:bg-zinc-800/50"
          >
            <Avatar name={doctorName} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13px] font-medium text-slate-900">{doctorName}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {(chat.unread_count > 0 || chat.unreadCount > 0) && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                      {chat.unread_count || chat.unreadCount}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">{formatDate(lastTime)}</span>
                </div>
              </div>
              <p className="mt-0.5 line-clamp-1 text-[12px] text-gray-500">
                {lastMsg || "Tap to open conversation"}
              </p>
              {hasReport && (
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-green-600">
                  <FileText className="size-3" /> Report available
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── ChatWindow ────────────────────────────────────────────────
function ChatWindow({ chat, onBack, socket }) {
  const chatId = chat?.chat_id || chat?.id || chat?._id || "";
  const doctorName = chat?.doctor_name || chat?.doctorName || "Doctor";

  const [chatStatus, setChatStatus] = useState(chat?.status || "active");
  const [messages, setMessages] = useState([]);
  const [liveReportText, setLiveReportText] = useState(chat?.diagnosis || chat?.report || "");

  useEffect(() => {
    setLiveReportText(chat?.diagnosis || chat?.report || "");
  }, [chatId, chat?.diagnosis, chat?.report]);
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [sendErr, setSendErr] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const [patientProfile, setPatientProfile] = useState(null);

  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      try {
        const res = await profileApi.me();
        if (alive) {
          setPatientProfile(unwrapData(res));
        }
      } catch (err) {
        console.error("Failed to load patient profile for chat card:", err);
      }
    }
    loadProfile();
    return () => { alive = false; };
  }, [chatId]);

  const isLocked = chat?.status === "locked" || chatStatus === "locked" || !!liveReportText;

  useEffect(() => {
    setChatStatus(chat?.status || "active");
  }, [chatId, chat?.status]);

  // ── Build a synthetic pinned analysis card from an analysis object ──
  function buildSyntheticCard(analysis) {
    const confidence = analysis.confidence != null ? `${analysis.confidence}%` : "N/A";

    const condition = analysis.condition || "N/A";
    const date = analysis.createdAt
      ? new Date(analysis.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const imageUrl = analysis.imageUrl || "";

    const patientGender = patientProfile?.gender ? (patientProfile.gender.charAt(0).toUpperCase() + patientProfile.gender.slice(1)) : "N/A";
    const patientAge = patientProfile?.age || "N/A";
    const patientName = patientProfile?.name || "Patient";
    const detailsStr = [patientGender, patientAge].filter(v => v !== "N/A").join(", ");

    const text = [
      `AI Prediction: ${condition}`,
      `Confidence: ${confidence}`,
      `Patient: ${patientName}${detailsStr ? ` (${detailsStr})` : ""}`,
      `Analysis Date: ${date}`,
      imageUrl ? `Scan URL: ${imageUrl}` : "",
    ].filter(Boolean).join("\n");

    return {
      id: "__clinical_summary__",
      side: "left",
      text,
      time: analysis.createdAt || new Date().toISOString(),
      fileUrl: imageUrl,
      raw: { sender_role: "system", original_filename: "skin_analysis.jpg" },
      __synthetic: true,
    };
  }

  // ── Try to resolve the analysis linked to this chat/appointment ──
  async function fetchLinkedAnalysis() {
    // Find the most-recent confirmed appointment for this doctor-patient pair
    // GET /api/appointment/my returns analysis_id per appointment.
    const doctorId = chat?.medical_syndicate_id_card || chat?.doctor_id || "";
    try {
      const res = await appointmentApi.my();
      const appointments = toArray(unwrapData(res));
      // Filter to this doctor, sort newest first
      const sorted = appointments
        .filter((a) => !doctorId || a.medical_syndicate_id_card === doctorId)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      // Prefer newest non-cancelled appointment (confirmed, completed, pending_payment)
      const match = sorted.find((a) => a.status !== "cancelled") || sorted[0];
      if (match?.analysis_id) {
        try {
          const aRes = await analysisApi.getById(match.analysis_id);
          return adaptAnalysis(unwrapData(aRes));
        } catch { /* fall through */ }
      }
    } catch { /* fall through */ }

    return null;
  }

  // Load messages on mount — pin the correct analysis card at the top
  useEffect(() => {
    if (!chatId) { setLoading(false); return; }
    let alive = true;
    async function load() {
      setLoading(true);
      setLoadErr("");
      try {
        const res = await chatApi.messages(chatId);
        let list = [];
        try {
          list = toArray(unwrapData(res))
            .filter((m) => m && typeof m === "object")
            .map((m) => adaptMessage(m, "patient"));
        } catch {
          list = [];
        }

        if (!alive) return;

        if (res && res.chat_status) {
          setChatStatus(res.chat_status);
        }

        // Separate analysis cards from regular messages
        // Detection: system sender + skin_analysis.jpg filename, OR text containing AI Prediction line
        const isAnalysisCard = (m) =>
          (m.raw?.sender_role === "system" && m.raw?.original_filename === "skin_analysis.jpg")
          || (m.raw?.sender_role === "system" && /AI Prediction:/i.test(m.text || ""))
          || /^AI Prediction:/m.test(m.text || "");

        const cards = list.filter(isAnalysisCard);
        const nonCards = list.filter((m) => !isAnalysisCard(m));

        // Find the latest report message in the messages list to set liveReportText
        const reportMsg = list.slice().reverse().find(m =>
          (m.raw?.sender_role === "system" || m.sender_role === "system") &&
          (m.text?.startsWith("📋 Report submitted:") || m.text?.startsWith("📋 Report updated:"))
        );
        if (reportMsg) {
          const cleanText = reportMsg.text.replace(/^📋\s*Report (submitted|updated):\s*\n*/i, "").trim();
          setLiveReportText(cleanText);
        }

        if (cards.length > 0) {
          // Use the LAST card — backend inserts newest last (most recent appointment)
          const latestCard = cards[cards.length - 1];
          setMessages([latestCard, ...nonCards]);
        } else {
          // No card in messages at all — build one from the analysis API
          const analysis = await fetchLinkedAnalysis();
          if (!alive) return;
          if (analysis && (analysis.condition || analysis.confidence)) {
            setMessages([buildSyntheticCard(analysis), ...nonCards]);
          } else {
            setMessages(nonCards);
          }
        }
      } catch (err) {
        if (alive) setLoadErr(err?.message || "Could not load messages.");
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
            setChatStatus("locked");
          }
        }
        setMessages((prev) => {
          const msgId = msg.message_id || msg.id;
          if (prev.some((m) => m.id === msgId)) return prev;
          return [...prev, adaptMessage(msg, "patient")];
        });
        // Mark message as read in DB since we are actively viewing the chat
        chatApi.messages(chatId).catch(() => { });
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

  const handleSend = async (e) => {
    e.preventDefault();
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
      await chatApi.send({
        chat_id: chatId,
        message_text: text || undefined,
        chat_file: fileToSend || undefined,
      });
      setDraft("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (apiErr) {
      setSendErr(apiErr?.message || "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex h-[600px] flex-col rounded-xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-3 text-left"
          >
            <ArrowLeft className="size-4 text-slate-600 dark:text-zinc-400" />
            <Avatar name={doctorName} size="sm" />
            <div>
              <p className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100">{doctorName}</p>
              <p className="text-[11px] text-gray-400 dark:text-zinc-400">Dermatologist</p>
            </div>
          </button>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-[11px] font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border dark:border-green-900/50">
            <Shield className="size-3" /> Secure
          </span>
        </div>

        {/* Encryption notice */}
        <div className="flex items-center justify-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2 text-[11px] text-gray-500 dark:bg-zinc-950/40 dark:border-zinc-800/80 dark:text-zinc-400">
          <Lock className="size-3 text-blue-500" />
          End-to-end encrypted
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-zinc-900/40 px-6 py-5">
          {loading && (
            <div className="flex h-40 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#050316]" />
            </div>
          )}
          {loadErr && !loading && (
            <p className="text-center text-[12px] text-red-500">{loadErr}</p>
          )}
          {!loading && !loadErr && messages.length === 0 && (
            <p className="text-center text-[12px] text-gray-400 pt-10">
              No messages yet. Say hello to your doctor!
            </p>
          )}
          <div className="space-y-4">
            {messages.map((msg) => {
              const rawFileUrl = msg.fileUrl || "";
              let resolvedUrl = "";
              if (rawFileUrl) {
                const trimmed = String(rawFileUrl).trim();
                if (/^(https?:|blob:)/i.test(trimmed)) { resolvedUrl = trimmed; }
                else if (trimmed) {
                  const base = String(import.meta.env.VITE_API_BASE_URL || "https://api.skinnerai.site").replace(/\/$/, "");
                  try { resolvedUrl = new URL(trimmed, base).toString(); } catch { resolvedUrl = trimmed; }
                }
              }

              const isAnalysisCard = (msg.raw?.sender_role === 'system' && msg.raw?.original_filename === 'skin_analysis.jpg')
                || (msg.raw?.sender_role === 'system' && /AI Prediction:/i.test(msg.text || ""))
                || /^AI Prediction:/m.test(msg.text || "");

              if (isAnalysisCard) {
                const summary = parseClinicalSummary(msg.text || "", resolvedUrl);
                const pName = patientProfile?.name;
                if (pName && !summary.patient.includes(pName)) {
                  let cleanedDetails = summary.patient === "N/A" || summary.patient === "N/A, N/A" || summary.patient === "Patient" ? "" : summary.patient;
                  if (!cleanedDetails) {
                    const genderStr = patientProfile.gender ? (patientProfile.gender.charAt(0).toUpperCase() + patientProfile.gender.slice(1)) : "";
                    const ageStr = patientProfile.age ? `${patientProfile.age}` : "";
                    cleanedDetails = [genderStr, ageStr].filter(Boolean).join(", ");
                  }
                  summary.patient = cleanedDetails ? `${pName} (${cleanedDetails})` : pName;
                }

                return (
                  <div key={msg.id} className="w-full max-w-[460px] my-4 self-start rounded-xl border border-blue-200 bg-blue-50/70 p-5 shadow-md backdrop-blur-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-[#111827]">
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
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium border rounded-md uppercase tracking-wider ${confidenceLevel === "High" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50" :
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
                <MessageBubble
                  key={msg.id}
                  side={msg.side}
                  text={msg.text}
                  time={msg.time}
                  fileUrl={msg.fileUrl}
                />
              );
            })}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Conditional message input / locked banner */}
        {isLocked ? (
          <div className="border-t border-gray-200 bg-gray-50 px-5 py-4 text-center text-[12px] text-gray-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 flex items-center justify-center gap-2">
            <Lock className="size-4 text-gray-400" />
            <span>Chat is locked. Book a new appointment with this doctor to reopen.</span>
          </div>
        ) : (
          <>
            {/* File preview strip */}
            {selectedFile && (
              <div className="flex items-center gap-2 border-t border-gray-100 bg-blue-50/60 px-5 py-2 dark:bg-[#1F2937]/50 dark:border-[#374151]">
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
            <form
              onSubmit={handleSend}
              className="border-t border-gray-200 bg-white px-5 py-4 dark:bg-zinc-950 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <div className={`flex flex-1 items-center rounded-xl border bg-gray-50 px-4 py-2.5 dark:bg-[#1F2937] dark:border-[#374151] ${sendErr ? "border-red-300" : "border-gray-200"}`}>
                  <input
                    value={draft}
                    onChange={(e) => { setDraft(sanitizeText(e.target.value, 500)); setSendErr(""); }}
                    placeholder="Type a message…"
                    maxLength={500}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-gray-400 dark:text-[#F9FAFB]"
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
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#050316] text-white transition hover:bg-[#111026] disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {sending
                    ? <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <Send className="size-4" />}
                </button>
              </div>
              {sendErr && <p className="mt-2 text-[11px] text-red-500 dark:text-red-500!">{sendErr}</p>}
              <p className="mt-2 text-center text-[10px] uppercase text-gray-400">
                Messages are monitored for quality assurance
              </p>
            </form>
          </>
        )}
      </div>

      {/* Report panel — shown when a doctor has submitted a report */}
      {liveReportText && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm dark:bg-green-950/20 dark:border-green-900/50">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-green-700 dark:text-green-400" />
              <span className="text-[13px] font-medium text-green-900 dark:text-green-300">Report Submitted</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([liveReportText], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `report-${doctorName.replace(/\s+/g, "-").toLowerCase()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-green-300 bg-white px-3 text-[12px] text-green-800 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-900/50"
            >
              <FileText className="size-3.5" /> Download Report
            </button>
          </div>
          <p className="line-clamp-3 text-[12px] leading-relaxed text-green-800 dark:text-zinc-300">{liveReportText}</p>
        </div>
      )}
    </div>
  );
}

// ── Main ChatTab component ────────────────────────────────────
export default function ChatTab({ socket, totalUnread, setTotalUnread, onActiveChatChange }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeChat, setActiveChat] = useState(null);

  // Sync active chat ID with parent
  useEffect(() => {
    if (onActiveChatChange) {
      const activeId = activeChat ? (activeChat.chat_id || activeChat.id || activeChat._id) : null;
      onActiveChatChange(activeId);
    }
  }, [activeChat, onActiveChatChange]);

  // Listen for unread updates when not in active chat
  useEffect(() => {
    if (!socket) return;

    const handleUnreadUpdate = (data) => {
      const activeId = activeChat?.chat_id || activeChat?.id || activeChat?._id;
      if (activeId === data.chat_id) return;

      setChats((prev) => {
        const updated = prev.map((c) => {
          const id = c.chat_id || c.id || c._id;
          if (id === data.chat_id) {
            return {
              ...c,
              unread_count: (c.unread_count || 0) + 1,
              unreadCount: (c.unreadCount || 0) + 1,
              last_message: data.message,
              lastMessage: data.message,
              updated_at: data.message.sent_at
            };
          }
          return c;
        });
        return updated.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      });
    };

    socket.on("unread_update", handleUnreadUpdate);
    return () => {
      socket.off("unread_update", handleUnreadUpdate);
    };
  }, [socket, activeChat]);

  const loadChats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await chatApi.myChats();
      let list = [];
      try {
        const raw = unwrapData(res);
        list = toArray(raw).filter((c) => c && typeof c === "object");
      } catch {
        list = [];
      }
      setChats(list);

      // Calculate total unread count from the list of chats and update it
      const count = list.reduce((acc, chat) => acc + (chat.unread_count || chat.unreadCount || 0), 0);
      setTotalUnread(count);

      // Auto-open the chat that matches the latest stored chatId
      const latestId = getLatestChatId();
      if (latestId && list.length) {
        const match = list.find(
          (c) => (c.chat_id || c.id || c._id) === latestId
        );
        if (match) {
          setActiveChat(match);
          const matchUnread = match.unread_count || match.unreadCount || 0;
          if (matchUnread > 0) {
            setTotalUnread((prev) => Math.max(0, prev - matchUnread));
            match.unread_count = 0;
            match.unreadCount = 0;
          }
        }
        localStorage.removeItem("skinner_latest_chat_id");
        sessionStorage.removeItem("skinner_latest_chat_id");
      }
    } catch (err) {
      console.error("[ChatTab] loadChats error:", err);
      setError(err?.message || "Could not load your conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadChats(); }, [loadChats]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    const chatId = chat.chat_id || chat.id || chat._id;
    setChats((prev) =>
      prev.map((c) => {
        const id = c.chat_id || c.id || c._id;
        if (id === chatId) {
          const cUnread = c.unread_count || c.unreadCount || 0;
          setTotalUnread((prevCount) => Math.max(0, prevCount - cUnread));
          return { ...c, unread_count: 0, unreadCount: 0 };
        }
        return c;
      })
    );
  };

  // ── Render ──────────────────────────────────────────────────
  if (activeChat) {
    return (
      <div className="mx-auto max-w-[760px]">
        <ChatWindow
          chat={activeChat}
          onBack={() => {
            setActiveChat(null);
            localStorage.removeItem("skinner_latest_chat_id");
            sessionStorage.removeItem("skinner_latest_chat_id");
          }}
          socket={socket}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px]">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-medium text-slate-900">My Conversations</h2>
          <p className="mt-0.5 text-[12px] text-gray-500">
            Chat with your doctors securely
          </p>
        </div>
        <button
          type="button"
          onClick={loadChats}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] text-slate-600 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RefreshCcw className="size-3.5" /> Refresh
        </button>
      </div>

      <ConversationList
        chats={chats}
        loading={loading}
        error={error}
        onSelect={handleSelectChat}
        onRefresh={loadChats}
      />
    </div>
  );
}
