import { useEffect, useState } from "react";
import {
  TrendingUp,
  UserCheck,
  Users,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  GraduationCap
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import DoctorReviewCard from "./DoctorReviewCard";
import EmptyState from "@/components/ui/EmptyState";
import { adminApi, unwrapData } from "@/services/skinnerApi";
import { adaptAnalysis, toArray } from "@/services/apiAdapters";

function doctorId(doctor) {
  return doctor?.medical_syndicate_id_card || doctor?.doctor_id || doctor?.id || doctor?._id;
}

function formatDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function confidenceBadge(confidence) {
  const conf = Number(confidence);
  if (isNaN(conf) || conf == null) return "bg-green-100 text-green-700";
  if (conf >= 85) return "bg-red-100 text-red-700";
  if (conf >= 60) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}
// ── Analytics Tab ─────────────────────────────────────────────
function AnalyticsTab({ pendingCount }) {
  const [analyses, setAnalyses]     = useState([]);
  const [doctors,  setDoctors]      = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [error,    setError]        = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
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
        if (alive) setError("Could not load analytics data. Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

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
          { label: "Total Analyses",  value: totalAnalyses,  color: "text-[#9810FA]" },
          { label: "Active Doctors",  value: totalDoctors,   color: "text-[#00A63E]" },
          { label: "Pending Reviews", value: pendingCount,   color: "text-[#F54900]" },
          { label: "Conditions Found",value: Object.keys(conditionMap).length, color: "text-[#155DFC]" },
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
          <h3 className="mb-4 text-[14px] font-medium text-slate-900">Condition Breakdown</h3>
          {conditionBreakdown.length === 0 ? (
            <p className="text-[13px] text-gray-400">No analysis data available yet.</p>
          ) : (
            <div className="space-y-3">
              {conditionBreakdown.map(([condition, count]) => {
                const pct = totalAnalyses > 0 ? Math.round((count / totalAnalyses) * 100) : 0;
                return (
                  <div key={condition}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="font-medium text-slate-700">{condition}</span>
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
          <h3 className="mb-4 text-[14px] font-medium text-slate-900">Recent Analyses</h3>
          {recentAnalyses.length === 0 ? (
            <p className="text-[13px] text-gray-400">No analyses recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.map((a, idx) => (
                <div key={a.id || idx} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-slate-800">
                      {a.condition || "Unknown Condition"}
                    </p>
                    <p className="text-[10px] text-gray-500">{formatDate(a.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {a.confidence != null && (
                      <>
                        <span className={`rounded px-2 py-0.5 text-[10px] uppercase font-medium ${confidenceBadge(a.confidence)}`}>
                          {a.confidence >= 85 ? "High" : a.confidence >= 60 ? "Medium" : "Low"} Confidence
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-[13px] outline-none transition focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
          />
        </div>

        <div className="flex gap-2">
          {[
            { label: `All (${combinedUsers.length})`, value: "all" },
            { label: `Patients (${allPatients.length})`, value: "patient" },
            { label: `Doctors (${allDoctors.length})`, value: "doctor" },
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
        <EmptyState title="No users found" message="No registered users match your search criteria." />
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
                            {user.role}
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
                              {user.approval_status}
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
                          {user.age && <span><strong>Age:</strong> {user.age}</span>}
                          {user.gender && <span><strong>Gender:</strong> <span className="capitalize">{user.gender}</span></span>}
                        </div>
                        {user.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="size-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span className="truncate">{user.address}</span>
                          </div>
                        )}
                        {user.created_at && (
                          <div className="text-[10px] text-gray-400">
                            Registered: {formatDate(user.created_at)}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="size-3.5 text-gray-400 shrink-0" />
                          <span><strong>Specialization:</strong> {user.specialization || "Dermatology"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="size-3.5 text-gray-400 shrink-0" />
                          <span><strong>Experience:</strong> {user.year_of_experience || 0} years</span>
                        </div>
                        {user.clinic_address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="size-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span className="truncate">{user.clinic_address}</span>
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

// ── Main AdminTabsSection ─────────────────────────────────────
export default function AdminTabsSection({ onRefreshStats }) {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [serverMessage,  setServerMessage]  = useState("");
  const [serverError,    setServerError]    = useState("");
  const [busyDoctorId,   setBusyDoctorId]   = useState("");

  const [users, setUsers] = useState({ patients: [], doctors: [] });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");

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
        setServerError("Could not load pending doctors from API.");
      }

      if (usersRes.status === "fulfilled") {
        const uData = unwrapData(usersRes.value);
        setUsers({
          patients: uData?.patients || [],
          doctors: uData?.doctors || []
        });
      } else {
        setUsersError("Could not load users directory from API.");
      }
    } catch {
      if (alive) setServerError("Could not load admin portal data. Please try again.");
    } finally {
      if (alive) setLoadingUsers(false);
    }
  };

  useEffect(() => {
    let alive = true;
    loadData(alive);
    return () => { alive = false; };
  }, []);

  const handleDecision = async (doctor, action) => {
    const id = doctorId(doctor);
    if (!id) { setServerError("Missing doctor syndicate ID."); return; }
    setBusyDoctorId(id);
    setServerError("");
    setServerMessage("");
    try {
      if (action === "approve") await adminApi.approveDoctor(id);
      else await adminApi.rejectDoctor(id);
      setPendingDoctors((prev) => prev.filter((item) => doctorId(item) !== id));
      setServerMessage(action === "approve" ? "Doctor approved successfully." : "Doctor rejected successfully.");

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
      setServerError(error.message || "Admin action failed. Please try again.");
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
        <TabsList className="grid h-10 grid-cols-3 bg-[#ECECF0] p-1">
          <TabsTrigger value="doctor-verification" className="text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <UserCheck className="size-4" /> Doctor Verification ({pendingDoctors.length})
          </TabsTrigger>
          <TabsTrigger value="user-management" className="text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="size-4" /> User Management
          </TabsTrigger>
          <TabsTrigger value="Analytics" className="text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="size-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="doctor-verification" className="mt-5 space-y-4">
          {pendingDoctors.length ? (
            pendingDoctors.map((doctor) => (
              <DoctorReviewCard
                key={doctorId(doctor) || doctor.email}
                doctor={doctor}
                busy={busyDoctorId === doctorId(doctor)}
                onApprove={() => handleDecision(doctor, "approve")}
                onReject={() => handleDecision(doctor, "reject")}
              />
            ))
          ) : (
            <EmptyState title="No pending doctors" message="No doctor verifications are awaiting review right now." />
          )}
        </TabsContent>

        <TabsContent value="user-management" className="mt-5">
          <UserManagementTab users={users} loading={loadingUsers} error={usersError} />
        </TabsContent>

        <TabsContent value="Analytics" className="mt-5">
          <AnalyticsTab pendingCount={pendingDoctors.length} />
        </TabsContent>
      </Tabs>
    </>
  );
}
