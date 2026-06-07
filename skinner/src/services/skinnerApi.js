/**
 * skinnerApi.js
 * ────────────────────────────────────────────────────────────
 * All HTTP calls to the SKINNER backend.
 *
 * Token lifecycle is delegated entirely to tokenManager so this
 * file only needs to:
 *   1. Attach the Authorization header before every request
 *   2. Retry once with a fresh token on 401
 *   3. Clear the session and throw if the retry also fails
 */

import {
  clearSession,
  getAccessToken,
  isTokenExpired,
  refreshAccessToken,
  STORAGE_KEYS,
  // Re-export conveniences used by other modules
  saveSession    as saveAuthSession,
  clearSession   as clearAuthSession,
  getCurrentUser,
  getCurrentRole,
  getRefreshToken,
} from "./tokenManager";

export { saveAuthSession, clearAuthSession, getCurrentUser, getCurrentRole };

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://api.skinnerai.site").replace(/\/$/, "");

export const skinnerConfig = { baseUrl: API_BASE_URL };

// ── Convenience token read ────────────────────────────────────
export function getAuthToken() { return getAccessToken(); }

// ── Misc session helpers (used across the codebase) ──────────
export function saveLatestAnalysisId(value)    { if (value) { localStorage.setItem(STORAGE_KEYS.latestAnalysisId,    value); sessionStorage.setItem(STORAGE_KEYS.latestAnalysisId,    value); } }
export function getLatestAnalysisId()          { return localStorage.getItem(STORAGE_KEYS.latestAnalysisId)    || sessionStorage.getItem(STORAGE_KEYS.latestAnalysisId)    || ""; }
export function saveLatestAppointmentId(value) { if (value) { localStorage.setItem(STORAGE_KEYS.latestAppointmentId, value); sessionStorage.setItem(STORAGE_KEYS.latestAppointmentId, value); } }
export function getLatestAppointmentId()       { return localStorage.getItem(STORAGE_KEYS.latestAppointmentId) || sessionStorage.getItem(STORAGE_KEYS.latestAppointmentId) || ""; }
export function saveLatestChatId(value)        { if (value) { localStorage.setItem(STORAGE_KEYS.latestChatId,        value); sessionStorage.setItem(STORAGE_KEYS.latestChatId,        value); } }
export function getLatestChatId()              { return localStorage.getItem(STORAGE_KEYS.latestChatId)        || sessionStorage.getItem(STORAGE_KEYS.latestChatId)        || ""; }

// ── URL builder ───────────────────────────────────────────────
function buildUrl(endpoint, query) {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url  = new URL(`${API_BASE_URL}${path}`);
  if (query) Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v); });
  return url.toString();
}

function isFormData(value) { return typeof FormData !== "undefined" && value instanceof FormData; }

async function parseResponse(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// ── Error class ───────────────────────────────────────────────
export class SkinnerApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name   = "SkinnerApiError";
    this.status = status;
    this.data   = data;
  }
}

// ── Core request function ─────────────────────────────────────
export async function apiRequest(endpoint, { method = "GET", body, query, auth = true, headers = {} } = {}) {
  const reqHeaders = { ...headers };
  let token = getAccessToken();

  // ── 1. Proactive refresh if token is about to expire ────────
  if (auth && token && isTokenExpired(token)) {
    const refreshData = await refreshAccessToken();
    if (refreshData) {
      token = getAccessToken(); // updated by refreshAccessToken()
    } else {
      clearSession();
      throw new SkinnerApiError("Session expired. Please sign in again.", { status: 401 });
    }
  }

  if (auth && token) reqHeaders["Authorization"] = `Bearer ${token}`;

  // ── 2. Build request ────────────────────────────────────────
  const reqOptions = { method, headers: reqHeaders };
  if (body !== undefined && body !== null) {
    if (isFormData(body)) {
      reqOptions.body = body;
    } else {
      reqHeaders["Content-Type"] = "application/json";
      reqOptions.body = JSON.stringify(body);
    }
  }

  // ── 3. First attempt ────────────────────────────────────────
  let response;
  try {
    response = await fetch(buildUrl(endpoint, query), reqOptions);
  } catch (err) {
    throw new SkinnerApiError("Cannot connect to SKINNER API. Please check server/network.", { status: 0, data: err });
  }

  // ── 4. Handle 401 → refresh + single retry ──────────────────
  if (response.status === 401 && auth) {
    const refreshData = await refreshAccessToken();
    if (refreshData) {
      token = getAccessToken();
      reqHeaders["Authorization"] = `Bearer ${token}`;
      try {
        response = await fetch(buildUrl(endpoint, query), { method, headers: reqHeaders, body: reqOptions.body });
      } catch (err) {
        throw new SkinnerApiError("Cannot connect to SKINNER API. Please check server/network.", { status: 0, data: err });
      }
      if (response.status === 401) {
        clearSession();
        throw new SkinnerApiError("Session expired. Please sign in again.", { status: 401 });
      }
    } else {
      clearSession();
      const errData = await parseResponse(response).catch(() => ({}));
      throw new SkinnerApiError(
        errData?.message || errData?.error || "Session expired. Please sign in again.",
        { status: 401, data: errData }
      );
    }
  }

  // ── 5. Parse & return ────────────────────────────────────────
  const data = await parseResponse(response);
  if (!response.ok) {
    throw new SkinnerApiError(
      data?.message || data?.error || `Request failed (${response.status})`,
      { status: response.status, data }
    );
  }
  return data;
}

export function unwrapData(response) {
  return response?.data !== undefined ? response.data : response;
}

// ── API namespaces ────────────────────────────────────────────
export const authApi = {
  login:           (payload) => apiRequest("/api/auth/login",           { method: "POST", body: payload, auth: false }),
  logout:          ()        => apiRequest("/api/auth/logout",          { method: "POST" }),
  registerPatient: (payload) => apiRequest("/api/auth/register-patient",{ method: "POST", body: payload, auth: false }),
  registerAdmin:   (payload) => apiRequest("/api/auth/register-admin",  { method: "POST", body: payload, auth: false }),
  registerDoctor:  (payload, file) => {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") fd.append(k, v); });
    if (file) fd.append("syndicate_card_image", file);
    return apiRequest("/api/auth/register-doctor", { method: "POST", body: fd, auth: false });
  },
  forgotPassword:  (email, force = false) => apiRequest("/api/auth/forgot-password",  { method: "POST", body: { email, force }, auth: false }),
  resetPassword:   ({ email, otp, newPassword }) =>
    apiRequest("/api/auth/reset-password", { method: "POST", body: { email, otp, new_password: newPassword }, auth: false }),
};

export const profileApi = {
  me:     ()        => apiRequest("/api/profile/me"),
  update: (payload) => apiRequest("/api/profile/update", { method: "PUT", body: payload }),
};

export const analysisApi = {
  uploadAndAnalyze: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return apiRequest("/api/analysis/upload-and-analyze", { method: "POST", body: fd });
  },
  history: ()   => apiRequest("/api/analysis/history"),
  getById: (id) => apiRequest(`/api/analysis/${encodeURIComponent(id)}`),
};

export const doctorsApi = {
  list:           (query)      => apiRequest("/api/doctors", { query }),
  getById:        (id)         => apiRequest(`/api/doctors/${encodeURIComponent(id)}`),
  availableDates: (id, days=7) => apiRequest(`/api/doctors/${encodeURIComponent(id)}/available-dates`, { query: { days } }),
  availableSlots: (id, date)   => apiRequest(`/api/doctors/${encodeURIComponent(id)}/available-slots`, { query: { date } }),
};

export const appointmentApi = {
  book:      (payload) => apiRequest("/api/appointment/book",            { method: "POST", body: payload }),
  my:        ()        => apiRequest("/api/appointment/my"),
  myReports: ()        => apiRequest("/api/appointment/my-reports"),
  report:    (id)      => apiRequest(`/api/appointment/report/${encodeURIComponent(id)}`),
};

export const paymentApi = {
  pay:           (payload) => apiRequest("/api/payment/pay",                                    { method: "POST", body: payload }),
  byAppointment: (id)      => apiRequest(`/api/payment/appointment/${encodeURIComponent(id)}`),
  my:            ()        => apiRequest("/api/payment/my"),
};

export const chatbotApi = {
  send:               (payload) => apiRequest("/api/chatbot/send",                                            { method: "POST", body: payload }),
  conversations:      ()        => apiRequest("/api/chatbot/conversations"),
  messages:           (id)      => apiRequest(`/api/chatbot/conversations/${encodeURIComponent(id)}`),
  deleteConversation: (id)      => apiRequest(`/api/chatbot/conversations/${encodeURIComponent(id)}`,         { method: "DELETE" }),
};

export const chatApi = {
  myChats:  ()        => apiRequest("/api/chat/my-chats"),
  access:   (id)      => apiRequest(`/api/chat/access/${encodeURIComponent(id)}`),
  messages: (id, query) => apiRequest(`/api/chat/messages/${encodeURIComponent(id)}`, { query }),
  send:     ({ chat_id, message_text, chat_file }) => {
    const fd = new FormData();
    fd.append("chat_id", chat_id);
    if (message_text) fd.append("message_text", message_text);
    if (chat_file)    fd.append("chat_file",    chat_file);
    return apiRequest("/api/chat/send", { method: "POST", body: fd });
  },
};

export const doctorApi = {
  pendingCases:        ()             => apiRequest("/api/doctor/pending-cases"),
  reviewedCases:       ()             => apiRequest("/api/doctor/reviewed-cases"),
  caseDetails:         (id)           => apiRequest(`/api/doctor/case/${encodeURIComponent(id)}`),
  reviewCase:          (payload)      => apiRequest("/api/doctor/review-case",      { method: "POST", body: payload }),
  updateReport:        (payload)      => apiRequest("/api/doctor/update-report",     { method: "PUT",  body: payload }),
  getAvailability:     ()             => apiRequest("/api/doctor/availability"),
  updateAvailability:  (schedule)     => apiRequest("/api/doctor/availability",     { method: "PUT",  body: { schedule } }),
  setDateAvailability: (date, slots)  => apiRequest("/api/doctor/date-availability",{ method: "PUT",  body: { date, slots } }),
  getDateAvailability: (start, end)   => apiRequest("/api/doctor/date-availability",{ query: { start_date: start, end_date: end } }),
  removeDateAvailability: (date)      => apiRequest(`/api/doctor/date-availability/${encodeURIComponent(date)}`, { method: "DELETE" }),
};

export const adminApi = {
  pendingDoctors:    ()    => apiRequest("/api/admin/pending-doctors"),
  approveDoctor:     (id, notes)  => apiRequest("/api/admin/approve-doctor",      { method: "POST", body: { medical_syndicate_id_card: id, notes } }),
  rejectDoctor:      (id, notes)  => apiRequest("/api/admin/reject-doctor",       { method: "POST", body: { medical_syndicate_id_card: id, notes } }),
  reports:           ()    => apiRequest("/api/admin/reports"),
  generateAdminCode: ()    => apiRequest("/api/admin/generate-admin-code", { method: "POST" }),
  activeInviteCode:  ()    => apiRequest("/api/admin/active-invite-code"),
  stats:             ()    => apiRequest("/api/admin/stats"),
  analyses:          ()    => apiRequest("/api/admin/analyses"),
  users:             ()    => apiRequest("/api/admin/users"),
};
