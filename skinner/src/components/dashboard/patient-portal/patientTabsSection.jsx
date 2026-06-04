import { useEffect, useRef, useState } from "react";
import { Upload, FileSearch, Calendar, User, Library, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import UploadTab from "./tabs/UploadTab";
import AnalysisTab from "./tabs/AnalysisTab";
import DoctorsTab from "./tabs/DoctorsTab";
import PatientTab from "./tabs/PatientTab";
import LibraryTab from "./tabs/LibraryTab";
import ChatTab from "./tabs/ChatTab";
import ErrorBoundary from "@/components/ErrorBoundary";
import { analysisApi, saveLatestAnalysisId, getAuthToken, chatApi, unwrapData } from "@/services/skinnerApi";
import { adaptAnalysis, toArray } from "@/services/apiAdapters";
import { io } from "socket.io-client";

const TAB_ORDER  = ["upload", "analysis", "doctors", "chat", "patient", "library"];
const TAB_LABELS = { upload: "Upload", analysis: "Analysis", doctors: "Doctors", chat: "Chat", patient: "Patient", library: "Library" };

const RESULT_KEY = "skinner_latest_analysis_result";

const tabClass =
  "h-8 gap-1.5 rounded-md px-3 text-[12px] font-normal text-gray-500 data-active:bg-white data-active:text-slate-900 data-active:shadow-sm";

export default function PatientTabsSection() {
  const [activeTab,        setActiveTab]        = useState("upload");
  const [hideTabs,         setHideTabs]         = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [analysisLoading,  setAnalysisLoading]  = useState(false);
  const [analysisError,    setAnalysisError]    = useState("");
  const [pendingPaymentAppointment, setPendingPaymentAppointment] = useState(null);

  const [socket, setSocket] = useState(null);
  const [totalUnread, setTotalUnread] = useState(0);

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const activeChatIdRef = useRef(null);
  const handleActiveChatChange = (chatId) => {
    activeChatIdRef.current = chatId;
  };

  // Load initial unread message count
  useEffect(() => {
    let alive = true;
    async function fetchUnreadCount() {
      try {
        const res = await chatApi.myChats();
        const list = toArray(unwrapData(res));
        const count = list.reduce((acc, chat) => acc + (chat.unread_count || chat.unreadCount || 0), 0);
        if (alive) setTotalUnread(count);
      } catch (err) {
        console.error("Failed to load initial unread count:", err);
      }
    }
    fetchUnreadCount();
    return () => { alive = false; };
  }, [activeTab]);

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
      // If we are currently on the chat tab AND viewing this specific chat, don't increment.
      if (activeTabRef.current === "chat" && activeChatIdRef.current === data.chat_id) {
        return;
      }
      setTotalUnread((prev) => prev + 1);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Called from PatientTab when user clicks "Pay Now" on a pending_payment appointment
  const handlePayNow = (appointment) => {
    setPendingPaymentAppointment(appointment);
    setActiveTab("doctors");
  };

  // Load the last analysis from localStorage on mount (persists across page reload)
  // Re-adapt through adaptAnalysis to ensure descriptions, recommendations, and
  // alternatives are populated correctly (handles old cached data format too)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RESULT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Re-adapt through adaptAnalysis to ensure all fields are current
        const readapted = adaptAnalysis(parsed.raw || parsed);
        // Preserve the local image URL which wouldn't be in the raw data
        if (parsed.localImageUrl) readapted.localImageUrl = parsed.localImageUrl;
        if (!readapted.imageUrl && parsed.imageUrl) readapted.imageUrl = parsed.imageUrl;
        setSelectedAnalysis(readapted);
        if (readapted?.id) {
          saveLatestAnalysisId(readapted.id);
        }
        // Update localStorage with re-adapted data
        try { localStorage.setItem(RESULT_KEY, JSON.stringify(readapted)); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (activeTab !== "doctors") setHideTabs(false);
  }, [activeTab]);

  // Called immediately when the AI analysis finishes (from UploadSkinImageCard)
  // → store result + jump to Analysis tab right away
  const handleAnalysisDone = (adapted) => {
    if (!adapted) return;
    setSelectedAnalysis(adapted);
    if (adapted.id) {
      saveLatestAnalysisId(adapted.id);
    }
    setAnalysisError("");
    try { localStorage.setItem(RESULT_KEY, JSON.stringify(adapted)); } catch { /* ignore */ }
    setActiveTab("analysis");
  };

  // Called when the user clicks a previous analysis from the history card
  const handleViewAnalysis = async (analysisId) => {
    if (!analysisId) return;
    saveLatestAnalysisId(analysisId);
    setActiveTab("analysis");
    setSelectedAnalysis(null);
    setAnalysisError("");
    setAnalysisLoading(true);
    try {
      const response = await analysisApi.getById(analysisId);
      const adapted  = adaptAnalysis(response);
      setSelectedAnalysis(adapted);
      if (adapted?.id) {
        saveLatestAnalysisId(adapted.id);
      }
      try { localStorage.setItem(RESULT_KEY, JSON.stringify(adapted)); } catch { /* ignore */ }
    } catch {
      setAnalysisError("Could not load the selected analysis. Please try again.");
      setSelectedAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Prev / Next navigation
  const currentIndex = TAB_ORDER.indexOf(activeTab);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < TAB_ORDER.length - 1;
  const goPrev  = () => { if (hasPrev) setActiveTab(TAB_ORDER[currentIndex - 1]); };
  const goNext  = () => { if (hasNext) setActiveTab(TAB_ORDER[currentIndex + 1]); };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {!hideTabs && (
        <div className="mb-7 flex justify-center">
          <TabsList className="h-9 rounded-xl border border-gray-100 bg-gray-100 p-1 shadow-sm">
            <TabsTrigger value="upload"   className={tabClass}><Upload        className="size-3.5" /> Upload</TabsTrigger>
            <TabsTrigger value="analysis" className={tabClass}><FileSearch    className="size-3.5" /> Analysis</TabsTrigger>
            <TabsTrigger value="doctors"  className={tabClass}><Calendar      className="size-3.5" /> Doctors</TabsTrigger>
            <TabsTrigger value="chat"     className={tabClass}>
              <MessageCircle className="size-3.5" />
              Chat
              {totalUnread > 0 && (
                <span className="ml-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-semibold text-white">
                  {totalUnread}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="patient"  className={tabClass}><User          className="size-3.5" /> Patient</TabsTrigger>
            <TabsTrigger value="library"  className={tabClass}><Library       className="size-3.5" /> Library</TabsTrigger>
          </TabsList>
        </div>
      )}

      <TabsContent value="upload">
        <UploadTab onAnalyze={handleAnalysisDone} onViewAnalysis={handleViewAnalysis} />
      </TabsContent>

      <TabsContent value="analysis">
        <AnalysisTab
          analysis={selectedAnalysis}
          isLoading={analysisLoading}
          errorMessage={analysisError}
          onFindDoctors={() => setActiveTab("doctors")}
        />
      </TabsContent>

      <TabsContent value="doctors">
        <DoctorsTab
          onChromeChange={setHideTabs}
          onSwitchToPatient={() => setActiveTab("patient")}
          onSwitchToChat={() => setActiveTab("chat")}
          pendingAppointment={pendingPaymentAppointment}
          onClearPending={() => setPendingPaymentAppointment(null)}
        />
      </TabsContent>

      <TabsContent value="patient">
        {activeTab === "patient" && <PatientTab onPayNow={handlePayNow} />}
      </TabsContent>
      <TabsContent value="library"><LibraryTab /></TabsContent>
      <TabsContent value="chat">
        <ErrorBoundary>
          {activeTab === "chat" && (
            <ChatTab
              socket={socket}
              totalUnread={totalUnread}
              setTotalUnread={setTotalUnread}
              onActiveChatChange={handleActiveChatChange}
            />
          )}
        </ErrorBoundary>
      </TabsContent>

      {/* Prev / Next navigation */}
      <div className="mt-8 flex items-center justify-between px-1">
        <button
          type="button" onClick={goPrev} disabled={!hasPrev}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
          {hasPrev ? TAB_LABELS[TAB_ORDER[currentIndex - 1]] : "Previous"}
        </button>

        <span className="text-[11px] text-gray-400">{currentIndex + 1} / {TAB_ORDER.length}</span>

        <button
          type="button" onClick={goNext} disabled={!hasNext}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {hasNext ? TAB_LABELS[TAB_ORDER[currentIndex + 1]] : "Next"}
          <ChevronRight className="size-4" />
        </button>
      </div>
    </Tabs>
  );
}
