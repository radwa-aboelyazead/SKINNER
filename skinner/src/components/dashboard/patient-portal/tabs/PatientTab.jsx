import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CreditCard, Edit3, X, MapPin, Phone, Mail, Calendar, Clock } from "lucide-react";
import { cleanText, sanitizeText, validateProfile } from "@/lib/formValidation";
import { appointmentApi, profileApi, unwrapData } from "@/services/skinnerApi";
import { toArray } from "@/services/apiAdapters";
import { useTranslation } from "@/context/LanguageContext";

const initialPatient = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Status badge styling ──────────────────────────────────────
const STATUS_STYLES = {
  pending_payment: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending Payment" },
  confirmed:       { bg: "bg-green-100", text: "text-green-800", label: "Confirmed" },
  cancelled:       { bg: "bg-red-100",   text: "text-red-800",   label: "Cancelled" },
  completed:       { bg: "bg-blue-100",  text: "text-blue-800",  label: "Completed" },
  reviewed:        { bg: "bg-purple-100",text: "text-purple-800",label: "Reviewed" },
};

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const normalized = (status || "").toLowerCase().replace(/\s+/g, "_");
  const style = STATUS_STYLES[normalized] || { bg: "bg-gray-100", text: "text-gray-700" };
  const label = t(normalized) || status || t("unknown_condition");
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
      {label}
    </span>
  );
}

function CalendarCard({ appointmentsList = [], onPayNow, onSelectAppt }) {
  const { t } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  // Extract day numbers from appointments that fall in this month
  const appointmentDays = new Set();
  for (const appt of appointmentsList) {
    try {
      const dateStr = appt.rawDate || appt.date || "";
      // Try to parse various formats: "5/31/2026", "May 31, 2026", ISO, etc.
      const d = new Date(dateStr);
      if (!isNaN(d.getTime()) && d.getMonth() === month && d.getFullYear() === year) {
        appointmentDays.add(d.getDate());
      }
    } catch { /* skip */ }
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const changeMonth = (delta) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setMonth(newMonth);
    setYear(newYear);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-[14px] font-medium text-slate-900">{t("appointment_schedule")}</h2>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12px] font-medium text-slate-700">{t("month_" + month)} {year}</span>
        <div className="flex gap-2 text-slate-700">
          <button type="button" onClick={() => changeMonth(-1)}><ChevronLeft className="size-4" /></button>
          <button type="button" onClick={() => changeMonth(1)}><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[11px] text-gray-500">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => <span key={dayIndex}>{t("day_" + dayIndex)}</span>)}
        {cells.map((day, idx) => {
          if (day === null) return <span key={`e${idx}`} className="size-8" />;
          const isApptDay = appointmentDays.has(day);
          const isToday = day === todayDate && month === todayMonth && year === todayYear;
          return (
            <span
              key={day}
              className={`mx-auto flex size-8 items-center justify-center rounded-md text-[12px] ${
                isApptDay
                  ? "bg-blue-600 text-white font-medium"
                  : isToday
                  ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                  : "text-slate-700"
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>
      <div className="mt-5 flex gap-4 border-t border-gray-100 pt-4 text-[10px] text-gray-500">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-blue-600" />{t("appointment_day")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-blue-50 ring-1 ring-blue-200" />{t("today")}</span>
      </div>
      <div className="mt-5">
        <h3 className="mb-3 text-[13px] font-medium text-slate-900">{t("upcoming_appointments")}</h3>
        <div className="space-y-2">
          {appointmentsList.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-gray-400">{t("no_upcoming_appointments")}</p>
          ) : (
            appointmentsList.map((appointment, i) => {
              const isPending = (appointment.status || "").toLowerCase().replace(/\s+/g, "_") === "pending_payment";
              return (
                <div 
                  key={appointment.appointment_id || i} 
                  onClick={() => onSelectAppt?.(appointment)}
                  className={`rounded-md p-3 cursor-pointer transition hover:bg-opacity-80 ${isPending ? "border border-amber-200 bg-amber-50 hover:bg-amber-100/60" : "bg-blue-50 hover:bg-blue-100/60"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-medium text-slate-900">{appointment.doctor}</p>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <p className="mt-1 text-[10px] text-gray-500">{appointment.date} · {appointment.time}</p>
                    </div>
                    {isPending && onPayNow && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPayNow(appointment);
                        }}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-amber-700"
                      >
                        <CreditCard className="size-3" />
                        {t("pay_now")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

function PatientInfoCard({ patient, onEdit }) {
  const { t } = useTranslation();
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <h2 className="text-[14px] font-medium text-slate-900">{t("patient_information")}</h2>
        <button type="button" onClick={onEdit} className="rounded bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-600">{t("edit")}</button>
      </div>
      <dl className="mt-5 space-y-4 text-[12px]">
        <div><dt className="text-gray-500">{t("full_name")}</dt><dd className="mt-1 font-medium text-slate-900">{patient.name}</dd></div>
        <div><dt className="text-gray-500">{t("address")}</dt><dd className="mt-1 font-medium text-slate-900">{patient.address}</dd></div>
        <div><dt className="text-gray-500">{t("email")}</dt><dd className="mt-1 font-medium text-slate-900">{patient.email}</dd></div>
        <div><dt className="text-gray-500">{t("phone")}</dt><dd className="mt-1 font-medium text-slate-900">{patient.phone}</dd></div>
      </dl>
    </section>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-[10px] font-medium text-red-600">{message}</p>;
}

function EditModal({ patient, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(patient);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: sanitizeText(value, field === "address" ? 160 : 120) }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateProfile(form, { role: "patient" });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({
      name: cleanText(form.name, 80),
      email: cleanText(form.email, 120).toLowerCase(),
      phone: cleanText(form.phone, 24),
      address: cleanText(form.address, 160),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4">
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-[330px] rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
          <h3 className="flex items-center gap-2 text-[14px] font-medium text-slate-900"><Edit3 className="size-4" /> {t("patient_information")}</h3>
          <button type="button" onClick={onClose} className="text-blue-600"><X className="size-5" /></button>
        </div>
        <div className="space-y-3">
          <label className="block"><span className="mb-1 block text-[11px] text-slate-700">{t("full_name")}</span><input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="h-8 w-full rounded-md bg-gray-100 px-3 text-[12px] text-gray-700 outline-none focus:ring-1 focus:ring-blue-400" /><FieldError message={errors.name} /></label>
          <label className="block"><span className="mb-1 block text-[11px] text-slate-700">{t("email")}</span><input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="h-8 w-full rounded-md bg-gray-100 px-3 text-[12px] text-gray-700 outline-none focus:ring-1 focus:ring-blue-400" /><FieldError message={errors.email} /></label>
          <label className="block"><span className="mb-1 block text-[11px] text-slate-700">{t("phone")}</span><input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="h-8 w-full rounded-md bg-gray-100 px-3 text-[12px] text-gray-700 outline-none focus:ring-1 focus:ring-blue-400" /><FieldError message={errors.phone} /></label>
          <label className="block"><span className="mb-1 block text-[11px] text-slate-700">{t("address")}</span><input value={form.address} onChange={(e) => updateField("address", e.target.value)} className="h-8 w-full rounded-md bg-gray-100 px-3 text-[12px] text-gray-700 outline-none focus:ring-1 focus:ring-blue-400" /><FieldError message={errors.address} /></label>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <button type="submit" className="h-9 rounded-md bg-blue-600 px-5 text-[12px] font-medium text-white">{t("save_changes")}</button>
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-blue-500 px-7 text-[12px] font-medium text-blue-600">{t("cancel")}</button>
        </div>
      </form>
    </div>
  );
}

export default function PatientTab({ onPayNow }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [patient, setPatient] = useState(initialPatient);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [serverMessage, setServerMessage] = useState("");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    let alive = true;
    async function loadPatientData() {
      try {
        const [profileResponse, appointmentsResponse] = await Promise.allSettled([profileApi.me(), appointmentApi.my()]);
        if (!alive) return;
        if (profileResponse.status === "fulfilled") {
          const profile = unwrapData(profileResponse.value);
          setPatient((prev) => ({
            ...prev,
            name: profile?.name || prev.name,
            email: profile?.email || prev.email,
            phone: profile?.phone || prev.phone,
            address: profile?.address || prev.address,
            age: profile?.age !== undefined ? profile.age : prev.age,
            gender: profile?.gender || prev.gender,
          }));
        }
        if (appointmentsResponse.status === "fulfilled") {
          const apiAppointments = toArray(unwrapData(appointmentsResponse.value)).map((item) => ({
            appointment_id: item.appointment_id || item.id || item._id || "",
            status: item.status || "",
            title: item.title || item.status || "Appointment",
            date: item.date ? new Date(item.date).toLocaleDateString() : item.created_at ? new Date(item.created_at).toLocaleDateString() : "Scheduled",
            rawDate: item.date || item.created_at || "",
            time: item.date ? new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--",
            doctor: item.doctor_name || item.doctor?.name || "Doctor",
            doctor_name: item.doctor_name || item.doctor?.name || "Doctor",
            fee: item.consultation_fee || item.fee || item.doctor?.consultation_fee || "",
            doctor_phone: item.doctor_phone || "",
            doctor_address: item.doctor_address || "",
            doctor_email: item.doctor_email || "",
            classification: item.skin_disease_classification || "",
            skin_image: item.skin_image_upload || "",
          }));
          if (apiAppointments.length) setAppointmentsList(apiAppointments);
        }
      } catch {
        if (alive) setServerError("profile_load_error");
      }
    }
    loadPatientData();
    return () => { alive = false; };
  }, []);

  const savePatient = async (nextPatient) => {
    setPatient(nextPatient);
    setServerError("");
    setServerMessage("");
    try {
      await profileApi.update(nextPatient);
      setServerMessage("profile_updated");
    } catch (error) {
      setServerError(error.message || "profile_update_error");
    }
  };

  return (
    <>
      <section className="mx-auto max-w-[760px]">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
          <CalendarCard appointmentsList={appointmentsList} onPayNow={onPayNow} onSelectAppt={setSelectedAppt} />
          <PatientInfoCard patient={patient} onEdit={() => setOpen(true)} />
        </div>
      </section>
      {serverMessage && <div className="mx-auto mt-4 max-w-[760px] rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[12px] text-green-700">{t(serverMessage)}</div>}
      {serverError && <div className="mx-auto mt-4 max-w-[760px] rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">{t(serverError)}</div>}
      {open && <EditModal patient={patient} onSave={savePatient} onClose={() => setOpen(false)} />}
      {selectedAppt && (
        <AppointmentDetailsModal
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onPayNow={onPayNow}
        />
      )}
    </>
  );
}

function AppointmentDetailsModal({ appointment, onClose, onPayNow }) {
  const { t } = useTranslation();
  if (!appointment) return null;
  const isPending = (appointment.status || "").toLowerCase().replace(/\s+/g, "_") === "pending_payment";

  // Google Maps link
  const mapsSearchQuery = encodeURIComponent(appointment.doctor_address || "");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsSearchQuery}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-xl bg-white p-5 shadow-2xl dark:bg-[#111827] dark:border dark:border-zinc-800">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-zinc-800">
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">{t("appointment_details")}</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">ID: {appointment.appointment_id}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-[12px] text-slate-800 dark:text-zinc-300">
          {/* Doctor Info */}
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-zinc-900/50">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-[14px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {appointment.doctor_name.replace("Dr. ", "").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-[13px]">{appointment.doctor_name}</p>
              <p className="text-[11px] text-gray-500">{t("dermatologist")}</p>
            </div>
            <div className="ml-auto">
              <StatusBadge status={appointment.status} />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-md border border-gray-100 p-2 dark:border-zinc-800">
              <Calendar className="size-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500">{t("date")}</p>
                <p className="font-medium text-slate-900 dark:text-white">{appointment.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-gray-100 p-2 dark:border-zinc-800">
              <Clock className="size-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500">{t("time")}</p>
                <p className="font-medium text-slate-900 dark:text-white">{appointment.time}</p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5">
            {appointment.doctor_phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 text-gray-400 shrink-0" />
                <a href={`tel:${appointment.doctor_phone}`} className="hover:text-blue-600 hover:underline">
                  {appointment.doctor_phone}
                </a>
              </div>
            )}
            {appointment.doctor_email && (
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 text-gray-400 shrink-0" />
                <a href={`mailto:${appointment.doctor_email}`} className="hover:text-blue-600 hover:underline">
                  {appointment.doctor_email}
                </a>
              </div>
            )}
            {appointment.doctor_address && (
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p>{appointment.doctor_address}</p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {t("open_in_google_maps")}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Diagnosis & Scan Preview */}
          {(appointment.classification || appointment.skin_image) && (
            <div className="border-t border-gray-100 pt-3 dark:border-zinc-800 space-y-3">
              <p className="font-semibold text-slate-900 dark:text-white">{t("related_scan_analysis")}</p>
              <div className="flex gap-3 rounded-lg bg-gray-50 p-2.5 dark:bg-zinc-900/50">
                {appointment.skin_image && (
                  <img
                    src={normalizeImageUrl(appointment.skin_image)}
                    alt="Scan"
                    className="size-14 rounded-md object-cover border border-gray-200 dark:border-zinc-800 shrink-0"
                  />
                )}
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] text-gray-500">{t("ai_skin_classification")}</p>
                  <p className="font-medium text-slate-800 dark:text-zinc-200 mt-0.5">{appointment.classification || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-3 dark:border-zinc-800">
          {isPending && onPayNow && (
            <button
              type="button"
              onClick={() => {
                onPayNow(appointment);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-[12px] font-medium text-white transition hover:bg-amber-700 cursor-pointer"
            >
              <CreditCard className="size-3.5" />
              {t("pay_now")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md border border-gray-200 bg-white px-4 text-[12px] font-medium text-slate-800 hover:bg-gray-50 cursor-pointer dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeImageUrl(url = "") {
  const rawUrl = String(url).trim();
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  const baseUrl = String(import.meta.env.VITE_API_BASE_URL || "https://api.skinnerai.site").replace(/\/$/, "");
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return rawUrl;
  }
}

