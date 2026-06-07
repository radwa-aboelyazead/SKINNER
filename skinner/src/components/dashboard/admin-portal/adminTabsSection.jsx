import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  UserCheck,
  Users,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  GraduationCap,
  KeyRound,
  Copy,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import { Button } from "../../ui/button";
import DoctorReviewCard from "./DoctorReviewCard";
import EmptyState from "@/components/ui/EmptyState";
import { io } from "socket.io-client";
import { adminApi, unwrapData, getAuthToken } from "@/services/skinnerApi";
import { adaptAnalysis, toArray } from "@/services/apiAdapters";
import { useTranslation } from "@/context/LanguageContext";

function doctorId(doctor) {
  return doctor?.medical_syndicate_id_card || doctor?.doctor_id || doctor?.id || doctor?._id;
}

function formatDate(raw, lang = "en") {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}
function confidenceBadge(confidence) {
  const conf = Number(confidence);
  if (isNaN(conf) || conf == null) return "bg-green-100 text-green-700";
  if (conf >= 85) return "bg-red-100 text-red-700";
  if (conf >= 60) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}
// ── Analytics Tab ─────────────────────────────────────────────
function AnalyticsTab({ pendingCount, socket }) {
  const [analyses, setAnalyses]     = useState([]);
  const [doctors,  setDoctors]      = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [error,    setError]        = useState("");
  const { t, lang }                 = useTranslation();

  const getConditionLabel = (cond) => {
    const key = `${String(cond).toLowerCase()}_title`;
    const translated = t(key);
    return translated === key ? cond : translated;
  };

  const loadData = useCallback(async (alive = true) => {
    setLoading(true);
    setError("");
    try {
      const [analysesRes, usersRes] = await Promise.allSettled([
        adminApi.analyses(),
        adminApi.users(),
      ]);

      if (!alive) return;

      if (analysesRes.status === "fulfilled") {
        const list = toArray(unwrapData(analysesRes.value)).map((item) => adaptAnalysis(item));
        setAnalyses(list);
      }
      if (usersRes.status === "fulfilled") {
        const usersData = unwrapData(usersRes.value);
        setDoctors(toArray(usersData?.doctors || []).filter(d => d.approval_status === "approved"));
      }
    } catch {
      if (alive) setError(t("could_not_load_analytics"));
    } finally {
      if (alive) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let alive = true;
    loadData(alive);

    if (socket) {
      const handleRefresh = () => {
        loadData(alive);
      };

      socket.on("new_analysis_performed", handleRefresh);
      socket.on("patient_registered", handleRefresh);
      socket.on("admin_registered", handleRefresh);
      socket.on("doctor_status_changed", handleRefresh);
      socket.on("new_pending_doctor", handleRefresh);

      return () => {
        alive = false;
        socket.off("new_analysis_performed", handleRefresh);
        socket.off("patient_registered", handleRefresh);
        socket.off("admin_registered", handleRefresh);
        socket.off("doctor_status_changed", handleRefresh);
        socket.off("new_pending_doctor", handleRefresh);
      };
    }

    return () => {
      alive = false;
    };
  }, [socket, loadData]);

  const totalAnalyses  = analyses.length;
  const totalDoctors   = doctors.length;

  // Condition breakdown
  const conditionMap = {};
  analyses.forEach((a) => {
    const key = a.condition || "Unknown";
    conditionMap[key] = (conditionMap[key] || 0) + 1;
  });
  const conditionBreakdown = Object.entries(conditionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Recent analyses (last 10)
  const recentAnalyses = [...analyses]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-[13px] text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: t("ai_analyses"),  value: totalAnalyses,  color: "text-[#9810FA]" },
          { label: t("active_doctors"),  value: totalDoctors,   color: "text-[#00A63E]" },
          { label: t("pending_reviews"), value: pendingCount,   color: "text-[#F54900]" },
          { label: t("conditions_found"),value: Object.keys(conditionMap).length, color: "text-[#155DFC]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${color}`}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Condition Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-[14px] font-medium text-slate-900">{t("condition_breakdown")}</h3>
          {conditionBreakdown.length === 0 ? (
            <p className="text-[13px] text-gray-400">{t("no_analysis_data")}</p>
          ) : (
            <div className="space-y-3">
              {conditionBreakdown.map(([condition, count]) => {
                const pct = totalAnalyses > 0 ? Math.round((count / totalAnalyses) * 100) : 0;
                return (
                  <div key={condition}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="font-medium text-slate-700">
                        {getConditionLabel(condition)}
                      </span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-[#050316] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Analyses */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-[14px] font-medium text-slate-900">{t("recent_analyses")}</h3>
          {recentAnalyses.length === 0 ? (
            <p className="text-[13px] text-gray-400">{t("no_analyses_recorded")}</p>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.map((a, idx) => (
                <div key={a.id || idx} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-slate-800">
                      {getConditionLabel(a.condition)}
                    </p>
                    <p className="text-[10px] text-gray-500">{formatDate(a.createdAt, lang)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {a.confidence != null && (
                      <>
                        <span className={`rounded px-2 py-0.5 text-[10px] uppercase font-medium ${confidenceBadge(a.confidence)}`}>
                          {a.confidence >= 85 ? t("high_confidence") : a.confidence >= 60 ? t("medium_confidence") : t("low_confidence")}
                        </span>
                        <span className="text-[10px] text-gray-500">{a.confidence}%</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── User Management Tab ───────────────────────────────────────
function UserManagementTab({ users, loading, error }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { t, lang } = useTranslation();

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-[13px] text-red-700">
        {error}
      </div>
    );
  }

  const allPatients = users?.patients || [];
  const allDoctors = users?.doctors || [];

  const combinedUsers = [
    ...allPatients,
    ...allDoctors
  ];

  const filtered = combinedUsers.filter(u => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ${lang === "ar" ? "right-3" : "left-3"}`} />
          <input
            type="text"
            placeholder={t("search_users_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full rounded-lg border border-gray-200 py-2 text-[13px] outline-none transition focus:border-slate-800 focus:ring-1 focus:ring-slate-800 ${
              lang === "ar" ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
            }`}
          />
        </div>

        <div className="flex gap-2">
          {[
            { label: `${t("all_filter")} (${combinedUsers.length})`, value: "all" },
            { label: `${t("patients_filter")} (${allPatients.length})`, value: "patient" },
            { label: `${t("doctors_filter")} (${allDoctors.length})`, value: "doctor" },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                roleFilter === tab.value
                  ? "bg-[#050316] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filtered.length === 0 ? (
        <EmptyState title={t("no_users_found")} message={t("no_users_match")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((user) => {
            const isDoctor = user.role === "doctor";
            const initials = user.name ? user.name.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase() : "U";

            return (
              <div
                key={user.id + "-" + user.role}
                className="relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
                        isDoctor ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-[14px] font-semibold text-slate-900">{user.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            isDoctor ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {isDoctor ? t("doctor") : t("patient")}
                          </span>
                          {isDoctor && (
                            <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              user.approval_status === "approved"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : user.approval_status === "pending"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              {user.approval_status === "approved" && <CheckCircle className="size-3" />}
                              {user.approval_status === "pending" && <AlertCircle className="size-3" />}
                              {user.approval_status === "rejected" && <XCircle className="size-3" />}
                              {user.approval_status === "approved" ? t("approved") : user.approval_status === "pending" ? t("pending") : t("rejected")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info list */}
                  <div className="mt-4 space-y-2 text-[12px] text-gray-500">
                    <div className="flex items-center gap-2">
                      <Mail className="size-3.5 text-gray-400" />
                      <a href={`mailto:${user.email}`} className="hover:underline text-slate-700 truncate">{user.email}</a>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 text-gray-400" />
                        <a href={`tel:${user.phone}`} className="hover:underline text-slate-700">{user.phone}</a>
                      </div>
                    )}

                    {!isDoctor ? (
                      <>
                        <div className="flex gap-4">
                          {user.age && <span><strong>{t("age")}:</strong> {user.age}</span>}
                          {user.gender && <span><strong>{t("gender")}:</strong> <span className="capitalize">{user.gender === "male" ? t("male") : user.gender === "female" ? t("female") : user.gender}</span></span>}
                        </div>
                        {user.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="size-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span className="truncate">{user.address}</span>
                          </div>
                        )}
                        {user.created_at && (
                          <div className="text-[10px] text-gray-400">
                            {t("registered_colon")} {formatDate(user.created_at, lang)}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="size-3.5 text-gray-400 shrink-0" />
                          <span><strong>{t("specialization_bold")}</strong> {(() => {
                            const spec = user.specialization;
                            if (!spec) return t("specialty_dermatology");
                            const normalized = spec.toLowerCase().replace(/[\s_-]+/g, "_");
                            const key = `specialty_${normalized}`;
                            const translated = t(key);
                            return translated !== key ? translated : spec;
                          })()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="size-3.5 text-gray-400 shrink-0" />
                          <span><strong>{t("experience_bold")}</strong> {user.year_of_experience || 0} {t("years")}</span>
                        </div>
                        {user.clinic_address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="size-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span className="truncate">{(() => {
                              const addr = user.clinic_address;
                              if (!addr) return "";
                              const normalized = addr.toLowerCase().replace(/[\s,_-]+/g, "_");
                              const key = `address_${normalized}`;
                              const translated = t(key);
                              return translated !== key ? translated : addr;
                            })()}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Invite Code Tab (Super Admin Only) ────────────────────────
function InviteCodeTab({ socket }) {
  const [inviteCode, setInviteCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const { t, lang } = useTranslation();

  // Automatically fetch existing active invite code on mount
  useEffect(() => {
    let alive = true;
    async function loadActiveCode() {
      try {
        const response = await adminApi.activeInviteCode();
        if (!alive) return;
        const data = unwrapData(response);
        const code = data?.invite_code || data?.inviteCode || data?.code || "";
        const expiry = data?.expires_at || data?.expiresAt || "";
        if (code) {
          setInviteCode(code);
          setExpiresAt(expiry);
        } else {
          setInviteCode("");
          setExpiresAt("");
        }
      } catch {
        // ignore background fetch failures on mount
      }
    }
    loadActiveCode();
    return () => {
      alive = false;
    };
  }, []);

  // Expiration countdown timer
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft("");
      return;
    }

    const updateTimer = () => {
      const msLeft = new Date(expiresAt).getTime() - Date.now();
      if (msLeft <= 0) {
        setTimeLeft("");
        setInviteCode("");
        setExpiresAt("");
      } else {
        const mins = Math.floor(msLeft / 60_000);
        const secs = Math.floor((msLeft % 60_000) / 1000);
        const minText = mins === 1 ? t("minute") : t("minutes");
        const secText = secs === 1 ? t("second") : t("seconds");
        if (mins > 0) {
          setTimeLeft(`${mins} ${minText} ${secs} ${secText} ${t("remaining")}`);
        } else {
          setTimeLeft(`${secs} ${secText} ${t("remaining")}`);
        }
      }
    };

    updateTimer(); // run once immediately
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, t]);

  // Socket listener for when an admin registers using an invite code
  useEffect(() => {
    if (!socket) return;

    const onInviteCodeUsed = (data) => {
      if (data?.invite_code && inviteCode && data.invite_code.toUpperCase() === inviteCode.toUpperCase()) {
        setInviteCode("");
        setExpiresAt("");
        setTimeLeft("");
        setSuccess(t("invite_code_used_success").replace("{code}", data.invite_code).replace("{email}", data.email || t("new_admin")));
      }
    };

    socket.on("invite_code_used", onInviteCodeUsed);
    return () => {
      socket.off("invite_code_used", onInviteCodeUsed);
    };
  }, [socket, inviteCode, t]);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setSuccess("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [success]);

  // Auto-dismiss error message after 5 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setCopied(false);
    try {
      const response = await adminApi.generateAdminCode();
      const data = unwrapData(response);
      const code = data?.invite_code || data?.inviteCode || data?.code || "";
      const expiry = data?.expires_at || data?.expiresAt || "";
      if (code) {
        setInviteCode(code);
        setExpiresAt(expiry);
        setSuccess(response.message || t("admin_code_generated_success"));
      } else {
        setError(t("admin_code_generated_fail"));
      }
    } catch (err) {
      setError(err.message || t("admin_code_generated_fail_err"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = inviteCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-card-foreground">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h3 className="text-[14px] font-medium text-foreground">{t("generate_admin_code")}</h3>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {t("generate_admin_code_desc")}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 h-9 text-[12px] font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t("generating_dots")}
              </>
            ) : (
              <>
                <KeyRound className="size-3.5" />
                {t("generate_new_code")}
              </>
            )}
          </Button>
        </div>

        {success && (
          <div className="mt-4 rounded-md border border-green-500/20 bg-green-500/10 px-3 py-2 text-[12px] text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {inviteCode ? (
          <div className="mt-5 rounded-lg border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/10 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-purple-700 dark:text-purple-400">{t("generated_invite_code")}</p>
              {timeLeft && (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="size-3" /> {timeLeft}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <code className="flex-1 rounded-md border border-purple-500/20 bg-background px-4 py-2.5 text-[15px] font-mono font-semibold tracking-widest text-foreground">
                {inviteCode}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition ${
                  copied
                    ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="size-3.5" />
                    {t("copied_excl")}
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    {t("copy")}
                  </>
                )}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-purple-600 dark:text-purple-400/80">
              {t("share_code_desc")}
            </p>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-border bg-slate-950/20 p-6 text-center">
            <p className="text-[13px] text-muted-foreground">{t("no_active_invite_code")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main AdminTabsSection ─────────────────────────────────────
export default function AdminTabsSection({ onRefreshStats, adminRole = "admin" }) {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [serverMessage,  setServerMessage]  = useState("");
  const [serverError,    setServerError]    = useState("");
  const [busyDoctorId,   setBusyDoctorId]   = useState("");

  const [users, setUsers] = useState({ patients: [], doctors: [] });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [socket, setSocket] = useState(null);
  const { t, lang } = useTranslation();

  const loadData = async (alive = true) => {
    try {
      const [pendingRes, usersRes] = await Promise.allSettled([
        adminApi.pendingDoctors(),
        adminApi.users()
      ]);

      if (!alive) return;

      if (pendingRes.status === "fulfilled") {
        setPendingDoctors(toArray(unwrapData(pendingRes.value)));
      } else {
        setServerError(t("could_not_load_pending"));
      }

      if (usersRes.status === "fulfilled") {
        const uData = unwrapData(usersRes.value);
        setUsers({
          patients: uData?.patients || [],
          doctors: uData?.doctors || []
        });
      } else {
        setUsersError(t("could_not_load_users"));
      }
    } catch {
      if (alive) setServerError(t("could_not_load_admin"));
    } finally {
      if (alive) setLoadingUsers(false);
    }
  };

  useEffect(() => {
    let alive = true;
    loadData(alive);
    return () => { alive = false; };
  }, []);

  // Connect socket for real-time dashboard analytics updates
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const host = import.meta.env.VITE_API_BASE_URL || "https://api.skinnerai.site";
    const s = io(host, {
      auth: { token }
    });

    setSocket(s);

    s.on("new_pending_doctor", (newDoctor) => {
      setPendingDoctors((prev) => {
        const id = doctorId(newDoctor);
        if (prev.some((item) => doctorId(item) === id)) return prev;
        return [...prev, newDoctor];
      });
      loadData(true);
      if (onRefreshStats) {
        onRefreshStats();
      }
    });

    s.on("doctor_status_changed", (data) => {
      setPendingDoctors((prev) => prev.filter((item) => doctorId(item) !== data.medical_syndicate_id_card));
      loadData(true);
      if (onRefreshStats) {
        onRefreshStats();
      }
    });

    s.on("patient_registered", () => {
      loadData(true);
      if (onRefreshStats) {
        onRefreshStats();
      }
    });

    s.on("admin_registered", () => {
      loadData(true);
      if (onRefreshStats) {
        onRefreshStats();
      }
    });

    s.on("new_analysis_performed", () => {
      loadData(true);
      if (onRefreshStats) {
        onRefreshStats();
      }
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [onRefreshStats]);

  const handleDecision = async (doctor, action, notes) => {
    const id = doctorId(doctor);
    if (!id) {
      setServerError(t("missing_syndicate_id"));
      setTimeout(() => setServerError(""), 4000);
      return;
    }
    setBusyDoctorId(id);
    setServerError("");
    setServerMessage("");
    try {
      if (action === "approve") await adminApi.approveDoctor(id, notes);
      else await adminApi.rejectDoctor(id, notes);
      setPendingDoctors((prev) => prev.filter((item) => doctorId(item) !== id));
      setServerMessage(action === "approve" ? t("doctor_approved_success") : t("doctor_rejected_success"));
      setTimeout(() => setServerMessage(""), 4000);

      // Sync the user directory to reflect the decision immediately
      const usersRes = await adminApi.users();
      const uData = unwrapData(usersRes);
      setUsers({
        patients: uData?.patients || [],
        doctors: uData?.doctors || []
      });

      // Refresh admin dashboard statistics
      if (onRefreshStats) {
        onRefreshStats();
      }
    } catch (error) {
      setServerError(error.message || t("admin_action_fail"));
      setTimeout(() => setServerError(""), 4000);
    } finally {
      setBusyDoctorId("");
    }
  };

  return (
    <>
      {serverMessage && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[12px] text-green-700">
          {serverMessage}
        </div>
      )}
      {serverError && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
          {serverError}
        </div>
      )}

      <Tabs defaultValue="doctor-verification" className="mt-5">
        <TabsList className={`grid h-10 ${adminRole === "super_admin" ? "grid-cols-4" : "grid-cols-3"} bg-[#ECECF0] p-1`}>
          <TabsTrigger value="doctor-verification" className="text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <UserCheck className="size-4" /> {t("doctor_verification")} ({pendingDoctors.length})
          </TabsTrigger>
          <TabsTrigger value="user-management" className="text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="size-4" /> {t("user_management")}
          </TabsTrigger>
          <TabsTrigger value="Analytics" className="text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="size-4" /> {t("analytics")}
          </TabsTrigger>
          {adminRole === "super_admin" && (
            <TabsTrigger value="invite-codes" className="text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <KeyRound className="size-4" /> {t("invite_codes")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="doctor-verification" className="mt-5 space-y-4">
          {pendingDoctors.length ? (
            pendingDoctors.map((doctor) => (
              <DoctorReviewCard
                key={doctorId(doctor) || doctor.email}
                doctor={doctor}
                busy={busyDoctorId === doctorId(doctor)}
                onApprove={(notes) => handleDecision(doctor, "approve", notes)}
                onReject={(notes) => handleDecision(doctor, "reject", notes)}
              />
            ))
          ) : (
            <EmptyState title={t("no_pending_doctors")} message={t("no_pending_doctors_desc")} />
          )}
        </TabsContent>

        <TabsContent value="user-management" className="mt-5">
          <UserManagementTab users={users} loading={loadingUsers} error={usersError} />
        </TabsContent>

        <TabsContent value="Analytics" className="mt-5">
          <AnalyticsTab pendingCount={pendingDoctors.length} socket={socket} />
        </TabsContent>

        {adminRole === "super_admin" && (
          <TabsContent value="invite-codes" className="mt-5">
            <InviteCodeTab socket={socket} />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
