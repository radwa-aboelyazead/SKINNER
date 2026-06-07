import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Info,
  Lock,
  Mail,
  MapPin,
  MessageCircle,

  Paperclip,
  RefreshCcw,
  Send,
  Shield,
  Star,
} from "lucide-react";
import { adaptDoctor, adaptMessage, extractId, toArray } from "@/services/apiAdapters";
import EmptyState from "@/components/ui/EmptyState";
import { appointmentApi, chatApi, doctorsApi, getLatestAnalysisId, getLatestChatId, paymentApi, saveLatestAppointmentId, saveLatestChatId, unwrapData } from "@/services/skinnerApi";
import { useTranslation } from "@/context/LanguageContext";
import {
  cleanText,
  digitsOnly,
  formatCardNumber,
  getCardBrand,
  sanitizeText,
  validateMessage,
  validatePaymentForm,
} from "@/lib/formValidation";

function getSpecialtyLabel(spec, t) {
  if (!spec) return "";
  const normalized = spec.toLowerCase().replace(/[\s_-]+/g, "_");
  const key = `specialty_${normalized}`;
  const translated = t(key);
  return translated !== key ? translated : spec;
}

function getExperienceLabel(doctor, t) {
  if (doctor?.experienceYears !== null && doctor?.experienceYears !== undefined) {
    return t("years_experience").replace("{n}", doctor.experienceYears);
  }
  return doctor?.experience || "";
}

function getAddressLabel(address, t) {
  if (!address) return "";
  const normalized = address.toLowerCase().replace(/[\s,_-]+/g, "_");
  const key = `address_${normalized}`;
  const translated = t(key);
  return translated !== key ? translated : address;
}

function DoctorAvatar({ initials, className = "" }) {
  return (
    <div
      className={`flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[13px] font-medium text-blue-600 ${className}`}
    >
      {initials}
    </div>
  );
}

function VerifiedBadge() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
      <CheckCircle2 className="size-3" />
      {t("verified")}
    </span>
  );
}

function DoctorMeta({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}

function DoctorTags({ tags }) {
  const { t } = useTranslation();
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => {
        // Try specialty key first
        let normalized = tag.toLowerCase().replace(/[\s_-]+/g, "_");
        let key = `specialty_${normalized}`;
        let translated = t(key);
        if (translated !== key) {
          return (
            <span
              key={tag}
              className="rounded-md bg-gray-100 px-2 py-1 text-[10px] text-gray-700"
            >
              {translated}
            </span>
          );
        }
        // Try address key next
        normalized = tag.toLowerCase().replace(/[\s,_-]+/g, "_");
        key = `address_${normalized}`;
        translated = t(key);
        const displayTag = translated !== key ? translated : tag;
        return (
          <span
            key={tag}
            className="rounded-md bg-gray-100 px-2 py-1 text-[10px] text-gray-700"
          >
            {displayTag}
          </span>
        );
      })}
    </div>
  );
}

function RecommendationCard({ doctor, onBook, onMap }) {
  const { t } = useTranslation();
  return (
    <article className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 md:grid-cols-[1fr_138px]">
      <button
        type="button"
        onClick={onMap}
        className="flex min-w-0 gap-4 text-left"
      >
        <DoctorAvatar initials={doctor.initials} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-medium text-slate-900">
              {doctor.name}
            </h3>
            <VerifiedBadge />
          </div>
          <p className="mt-0.5 text-[12px] text-gray-600">{getSpecialtyLabel(doctor.specialty, t)}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <DoctorMeta icon={Star}>
              <span className="text-amber-500">{doctor.rating}</span> ({doctor.reviews})
            </DoctorMeta>
            <DoctorMeta icon={Award}>{getExperienceLabel(doctor, t)}</DoctorMeta>
            <DoctorMeta icon={MapPin}>{getAddressLabel(doctor.clinic, t)}</DoctorMeta>
            <DoctorMeta icon={Clock}>{doctor.availability || t("hours_not_available")}</DoctorMeta>
          </div>
          <DoctorTags tags={doctor.tags} />
        </div>
      </button>

      <div className="border-gray-200 md:border-l md:pl-5">
        <p className="text-[12px] text-gray-500">{t("consultation_fee")}</p>
        <p className="mt-1 text-[14px] font-medium text-blue-600">{t("currency_format").replace("{val}", parseFee(doctor.fee))}</p>
        <button
          type="button"
          onClick={onBook}
          className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#050316] px-4 text-[12px] font-medium text-white transition hover:bg-[#111026]"
        >
          <Calendar className="size-3.5" />
          {t("book_appointment")}
        </button>
      </div>
    </article>
  );
}

function RecommendationList({ onBook, onMap, doctorList = [], loading, error }) {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-[640px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-[15px] font-medium text-slate-900">
          {t("available_specialists")}
        </h2>
        <p className="mt-1 text-[13px] text-gray-500">
          {t("browse_verified_doctors")}
        </p>
      </div>
      {loading && <p className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-[12px] text-blue-700">{t("loading_doctors_api")}</p>}
      {error && <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">{error}</p>}
      {doctorList.length === 0 && !loading && !error ? (
        <EmptyState
          title={t("no_specialists_available")}
          message={t("no_specialists_desc")}
        />
      ) : (
        <div className="space-y-4">
          {doctorList.map((doctor) => (
            <RecommendationCard
              key={doctor.id}
              doctor={doctor}
              onBook={() => onBook(doctor)}
              onMap={() => onMap(doctor)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function GoogleMapEmbed({ address, doctorName }) {
  const { t } = useTranslation();
  const query = encodeURIComponent(address || "Dermatology Clinic");
  if (!address) {
    return (
      <div className="relative flex h-[330px] items-center justify-center overflow-hidden rounded-md bg-gray-100">
        <div className="text-center">
          <MapPin className="mx-auto size-8 text-gray-300" />
          <p className="mt-2 text-[12px] text-gray-400">{t("no_address_available")}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative h-[330px] overflow-hidden rounded-md">
      <iframe
        title={`Map for ${doctorName || "Doctor"}`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${query}`}
      />
    </div>
  );
}

function DoctorMapView({ onBack, onBook, doctorList = [], currentDoctor, onSelect }) {
  const { t } = useTranslation();
  if (!currentDoctor) {
    return (
      <section className="mx-auto max-w-[900px]">
        <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-[12px] text-slate-900"><ArrowLeft className="size-3.5" />{t("back")}</button>
        <EmptyState title={t("no_doctor_selected")} message={t("select_doctor_first")} />
      </section>
    );
  }
  const doctorName = currentDoctor?.name || t("dermatologist");
  const clinicLocation = currentDoctor?.clinic || t("no_address_available");
  const doctorAvailability = currentDoctor?.availability || t("hours_not_available");
  return (
    <section className="mx-auto max-w-[900px]">
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-[12px] text-slate-900">
        <ArrowLeft className="size-3.5" />
        {t("back_to_doctors")}
      </button>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.45fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-medium text-slate-900">{t("recommended_specialists")}</h2>
          <div className="space-y-3">
            {doctorList.map((doctor, index) => (
              <button
                key={doctor.id}
                type="button"
                className={`w-full rounded-lg border p-4 text-left ${doctor.id === currentDoctor?.id ? "border-blue-100 bg-blue-50/70" : "border-gray-200 bg-white"}`}
                onClick={() => onSelect?.(doctor)}
              >
                <div className="flex gap-4">
                  <DoctorAvatar initials={doctor.initials} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[13px] font-medium text-slate-900">{doctor.name}</h3>
                      <VerifiedBadge />
                    </div>
                    <p className="text-[11px] text-gray-500">{getSpecialtyLabel(doctor.specialty, t)}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      <DoctorMeta icon={Star}>{doctor.rating} ({doctor.reviews})</DoctorMeta>
                      <DoctorMeta icon={Award}>{getExperienceLabel(doctor, t)}</DoctorMeta>
                      <DoctorMeta icon={MapPin}>{getAddressLabel(doctor.clinic, t)}</DoctorMeta>
                      <DoctorMeta icon={Clock}>{doctor.availability || t("hours_not_available")}</DoctorMeta>
                    </div>
                    <DoctorTags tags={doctor.tags} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <GoogleMapEmbed address={clinicLocation} doctorName={doctorName} />
          <div className="mt-3">
            <button className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 text-[13px] font-medium text-white">
              <Car className="size-4" />
              {doctorAvailability}
            </button>
          </div>
          <div className="mt-5 grid gap-4 rounded-lg bg-white p-5 md:grid-cols-2">
            <div className="text-[12px]">
              <p className="text-gray-500">{t("clinic")}</p>
              <p className="mt-1 font-medium text-slate-900">{getAddressLabel(clinicLocation, t)}</p>
              <p className="mt-4 text-gray-500">{t("contact")}</p>
              <p className="mt-1 text-blue-600">{currentDoctor?.phone || currentDoctor?.email || t("not_available")}</p>
            </div>
            <div className="text-[12px]">
              <p className="text-gray-500">{t("doctor")}</p>
              <p className="mt-1 leading-relaxed text-slate-900">{doctorName}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-7 flex justify-center">
        <button
          type="button"
          onClick={() => onBook(currentDoctor)}
          disabled={!currentDoctor}
          className="inline-flex h-9 min-w-[150px] items-center justify-center gap-2 rounded-md bg-[#050316] px-5 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Calendar className="size-3.5" />
          {t("book_appointment")}
        </button>
      </div>
    </section>
  );
}

const fallbackDates = [];
const fallbackMorningSlots = [];
const fallbackAfternoonSlots = [];

/* ── Adapters: normalize API responses into the shapes the UI expects ── */
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const FULL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isToday(dateStr) {
  const today = new Date();
  const d = new Date(dateStr + "T00:00:00");
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

function adaptDateEntry(raw) {
  // Accept: "2026-06-01", { date: "2026-06-01" }, { id: "2026-06-01", ... }
  const dateStr = typeof raw === "string" ? raw : (raw?.date || raw?.id || raw?.value || "");
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const dayIndex = d.getDay();
  const monthIndex = d.getMonth();
  const dayOfMonth = String(d.getDate());
  const monthShort = MONTH_NAMES[monthIndex];
  const dayName = isToday(dateStr) ? "Today" : DAY_NAMES[dayIndex];
  const label = `${FULL_DAY_NAMES[dayIndex]}, ${FULL_MONTH_NAMES[monthIndex]} ${dayOfMonth}, ${d.getFullYear()}`;
  return { id: dateStr, day: dayName, date: dayOfMonth, month: monthShort, label, dayIndex, monthIndex, isToday: isToday(dateStr), year: d.getFullYear() };
}

function adaptDatesResponse(response) {
  const data = response?.data !== undefined ? response.data : response;
  const arr = Array.isArray(data) ? data : (Array.isArray(data?.dates) ? data.dates : (Array.isArray(data?.available_dates) ? data.available_dates : []));
  return arr.map(adaptDateEntry).filter(Boolean);
}

function formatHour24to12(h, m) {
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

function adaptSlotEntry(raw) {
  // Accept: "09:00", "09:00 AM", { time: "09:00", available: true }, { slot: "09:00 AM" }, { start_time: "09:00" }
  if (!raw && raw !== 0) return null;
  let timeStr = "";
  let available = true;
  if (typeof raw === "string") {
    timeStr = raw.trim();
  } else if (typeof raw === "object") {
    timeStr = (raw.time || raw.slot || raw.start_time || raw.label || raw.value || "").trim();
    if (raw.available === false || raw.is_available === false || raw.booked === true || raw.status === "booked" || raw.status === "reserved" || raw.status === "unavailable") {
      available = false;
    }
  }
  if (!timeStr) return null;
  // If 24h format like "09:00" or "14:30", convert to 12h
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(":").map(Number);
    timeStr = formatHour24to12(h, m);
  }
  // If already "09:00 AM" format, normalize
  const match12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeStr);
  if (match12) {
    const hh = String(match12[1]).padStart(2, "0");
    timeStr = `${hh}:${match12[2]} ${match12[3].toUpperCase()}`;
  }
  return { time: timeStr, available };
}

function adaptSlotsResponse(response) {
  const data = response?.data !== undefined ? response.data : response;
  const arr = Array.isArray(data) ? data : (Array.isArray(data?.slots) ? data.slots : (Array.isArray(data?.available_slots) ? data.available_slots : (Array.isArray(data?.times) ? data.times : [])));
  return arr.map(adaptSlotEntry).filter(Boolean);
}

function splitSlots(slots) {
  const morning = [];
  const afternoon = [];
  const disabled = new Set();
  for (const s of slots) {
    const isPM = s.time.toUpperCase().includes("PM");
    const hourMatch = /^(\d{1,2}):/.exec(s.time);
    const hour = hourMatch ? Number(hourMatch[1]) : 0;
    // 12 PM = afternoon, 12 AM = morning
    const isAfternoon = isPM && hour !== 12 ? true : (isPM && hour === 12 ? true : false);
    if (isAfternoon) afternoon.push(s.time);
    else morning.push(s.time);
    if (!s.available) disabled.add(s.time);
  }
  return { morning, afternoon, disabled };
}

function DateCard({ item, selected, onSelect }) {
  const { t } = useTranslation();
  const dayIndex = DAY_NAMES.indexOf(item.day);
  const translatedDay = item.day === "Today" ? t("today") : (dayIndex !== -1 ? t("day_" + dayIndex) : item.day);
  const monthIndex = MONTH_NAMES.indexOf(item.month);
  const translatedMonth = monthIndex !== -1 ? t("month_" + monthIndex) : item.month;

  return (
    <button type="button" onClick={() => onSelect(item)} aria-pressed={selected} className={`booking-date-card flex h-[58px] flex-col items-center justify-center rounded-md border text-center ${selected ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-400" : "border-gray-200 bg-white hover:border-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"}`}>
      <span className="text-[11px] text-gray-600 dark:text-zinc-400">{translatedDay}</span>
      <span className="mt-1 text-[13px] font-medium text-slate-900 dark:text-white">{item.date}</span>
      <span className="mt-1 text-[10px] text-gray-500 dark:text-zinc-500">{translatedMonth}</span>
    </button>
  );
}

function TimeButton({ time, selected, disabled, onSelect }) {
  return (
    <button type="button" disabled={disabled} onClick={() => !disabled && onSelect(time)} aria-pressed={selected} className={`booking-time-btn h-8 rounded-md border text-[12px] ${selected ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-400 dark:text-blue-300" : disabled ? "border-gray-100 bg-gray-50 text-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600" : "border-gray-200 bg-white text-slate-700 hover:border-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-500"}`}>
      {time}
    </button>
  );
}

function AppointmentBooking({ doctor, appointment, onBack, onProceed, onAppointmentChange, serverError, isSubmitting, dates, morningSlots, afternoonSlots, disabledSlots, loadingDates, loadingSlots, onDateSelect, availabilityError }) {
  const { t } = useTranslation();
  const activeDoctor = doctor;
  const [error, setError] = useState("");
  if (!activeDoctor) {
    return (
      <section className="mx-auto max-w-[640px]">
        <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-[12px] text-slate-900"><ArrowLeft className="size-3.5" />{t("back_to_doctors")}</button>
        <EmptyState title={t("no_doctor_selected")} message={t("select_doctor_first")} />
      </section>
    );
  }
  const activeDates = dates;
  const selectedDate = appointment?.date || null;
  const selectedTime = appointment?.time || "";
  const activeMorning = morningSlots;
  const activeAfternoon = afternoonSlots;
  const activeDisabled = disabledSlots;
  const noSlots = !loadingSlots && activeMorning.length === 0 && activeAfternoon.length === 0;

  const proceed = () => {
    if (!selectedDate || !selectedTime) {
      setError(t("select_date_time_error"));
      return;
    }
    setError("");
    onProceed({ date: selectedDate, time: selectedTime });
  };
  const selectDate = (date) => { setError(""); onDateSelect(date); };
  const selectTime = (time) => { setError(""); onAppointmentChange({ date: selectedDate, time }); };

  const parsedDate = selectedDate ? new Date(selectedDate.id + "T00:00:00") : null;
  const formattedDate = parsedDate && !isNaN(parsedDate.getTime())
    ? `${t("full_day_" + parsedDate.getDay())}, ${t("month_" + parsedDate.getMonth())} ${selectedDate.date}, ${parsedDate.getFullYear()}`
    : "–";

  return (
    <section className="mx-auto max-w-[640px]">
      <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-[12px] text-slate-900 dark:text-zinc-300"><ArrowLeft className="size-3.5" />{t("back_to_doctors")}</button>
      {availabilityError && <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/50! dark:bg-amber-950/20! px-3 py-2 text-[12px] text-amber-700 dark:text-amber-400!">{t(availabilityError)}</p>}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-4"><DoctorAvatar initials={activeDoctor.initials} className="size-10" /><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-[14px] font-medium text-slate-900 dark:text-white">{activeDoctor.name}</h2><VerifiedBadge /></div><p className="text-[12px] text-gray-500 dark:text-zinc-400">{getSpecialtyLabel(activeDoctor.specialty, t)}</p></div></div>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-gray-100 pt-3 dark:border-zinc-700"><DoctorMeta icon={MapPin}>{getAddressLabel(activeDoctor.clinic || activeDoctor.address, t) || "Medical Center Downtown"}</DoctorMeta><DoctorMeta icon={DollarSign}>{t("currency_format").replace("{val}", parseFee(activeDoctor.fee))} {t("consultation_fee")}</DoctorMeta></div>
      </div>
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-start gap-2"><Calendar className="mt-0.5 size-4 dark:text-zinc-400" /><div><h3 className="text-[13px] font-medium text-slate-900 dark:text-white">{t("select_date")}</h3><p className="mt-1 text-[12px] text-gray-500 dark:text-zinc-400">{t("choose_available_date")}</p></div></div>
        {loadingDates ? <div className="flex items-center justify-center py-6"><RefreshCcw className="size-5 animate-spin text-blue-500" /><span className="ml-2 text-[12px] text-gray-500 dark:text-zinc-400">{t("loading_available_dates")}</span></div> : activeDates.length === 0 ? <p className="py-4 text-center text-[12px] text-gray-500 dark:text-zinc-400">{t("no_available_dates")}</p> : <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">{activeDates.map((date) => <DateCard key={date.id} item={date} selected={date.id === selectedDate?.id} onSelect={selectDate} />)}</div>}
      </div>
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-start gap-2"><Clock className="mt-0.5 size-4 dark:text-zinc-400" /><div><h3 className="text-[13px] font-medium text-slate-900 dark:text-white">{t("select_time_slot")}</h3><p className="mt-1 text-[12px] text-gray-500 dark:text-zinc-400">{t("available_slots_for")} {selectedDate ? `${selectedDate.day === "Today" ? t("today") : t("day_" + DAY_NAMES.indexOf(selectedDate.day))}, ${t("month_" + MONTH_NAMES.indexOf(selectedDate.month))} ${selectedDate.date}` : "–"}</p></div></div>
        {loadingSlots ? <div className="flex items-center justify-center py-6"><RefreshCcw className="size-5 animate-spin text-blue-500" /><span className="ml-2 text-[12px] text-gray-500 dark:text-zinc-400">{t("loading_available_slots")}</span></div> : noSlots ? <p className="py-4 text-center text-[12px] text-gray-500 dark:text-zinc-400">{t("no_available_slots")}</p> : <>{activeMorning.length > 0 && <><p className="mb-2 text-[11px] text-gray-600 dark:text-zinc-400">{t("morning")}</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-6">{activeMorning.map((time) => <TimeButton key={time} time={time} selected={selectedTime === time} disabled={activeDisabled.has(time)} onSelect={selectTime} />)}</div></>}{activeAfternoon.length > 0 && <><p className="mb-2 mt-5 text-[11px] text-gray-600 dark:text-zinc-400">{t("afternoon")}</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-6">{activeAfternoon.map((time) => <TimeButton key={time} time={time} selected={selectedTime === time} disabled={activeDisabled.has(time)} onSelect={selectTime} />)}</div></>}</>}
        <div className="mt-5 flex flex-wrap gap-4 text-[10px] text-gray-600 dark:text-zinc-400"><span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-blue-500 bg-blue-50 dark:bg-blue-950/40" /> {t("selected")}</span><span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-gray-200 bg-white dark:border-zinc-600 dark:bg-zinc-800" /> {t("available")}</span><span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-gray-100 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900" /> {t("unavailable")}</span></div>
      </div>
      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/20"><div className="flex flex-col items-start justify-between gap-4 sm:flex-row"><div><h3 className="text-[13px] font-semibold text-blue-800 dark:text-blue-300">{t("appointment_summary")}</h3><div className="mt-3 space-y-2 text-[12px] text-slate-800 dark:text-zinc-300"><p className="flex items-center gap-2"><Calendar className="size-3.5 text-blue-600 dark:text-blue-400" /> {formattedDate}</p><p className="flex items-center gap-2"><Clock className="size-3.5 text-blue-600 dark:text-blue-400" /> {selectedTime || "–"}</p><p className="flex items-center gap-2"><MapPin className="size-3.5 text-blue-600 dark:text-blue-400" /> {t("in_person_at")} {getAddressLabel(activeDoctor.clinic || activeDoctor.address, t) || "–"}</p><p className="font-semibold">{t("currency_format").replace("{val}", parseFee(activeDoctor.fee))} {t("consultation_fee")}</p></div>{error && <p className="mt-3 text-[11px] font-medium text-red-600 dark:text-red-500!">{t(error)}</p>}{serverError && <p className="mt-3 text-[11px] font-medium text-red-600 dark:text-red-500!">{t(serverError)}</p>}</div><button type="button" onClick={proceed} disabled={isSubmitting || !selectedTime} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-[#050316] px-4 text-[12px] font-medium text-white disabled:opacity-60">{isSubmitting ? t("booking_dots") : t("proceed_to_payment")}<CheckCircle2 className="size-3.5" /></button></div><div className="mt-4 rounded-md border border-blue-200 bg-white p-3 text-[11px] leading-relaxed text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">{t("redirect_payment_notice")}</div></div>
    </section>
  );
}

function parseFee(fee = "$150") {
  const amount = Number(String(fee).replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? amount : 150;
}

function PaymentSummary({ doctor, appointment, total }) {
  const { t } = useTranslation();
  const consultationFee = parseFee(doctor?.fee);
  const tax = Math.max(0, total - consultationFee);

  const dateObj = appointment?.date;
  let displayDate = "";
  if (dateObj) {
    const d = new Date(dateObj.id + "T00:00:00");
    if (!isNaN(d.getTime())) {
      displayDate = `${t("full_day_" + d.getDay())}, ${t("month_" + d.getMonth())} ${d.getDate()}, ${d.getFullYear()}`;
    } else {
      displayDate = dateObj.label;
    }
  }

  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
      <h2 className="text-[15px] font-medium text-slate-900">{t("appointment_summary")}</h2>
      <div className="mx-auto mt-4 flex h-6 max-w-[190px] items-center justify-center rounded-md border border-blue-300 bg-blue-50 text-[11px] font-semibold text-blue-700">{t("prices_include_tax")}</div>
      <div className="mt-4 border-b border-gray-200 pb-4"><p className="text-[12px] text-gray-500">{t("doctor")}</p><p className="mt-1 text-[15px] font-semibold text-slate-900">{doctor?.name || "Dr. Sarah Johnson"}</p></div>
      <div className="space-y-4 border-b border-gray-200 py-4 text-[12px]"><div className="flex gap-2"><Calendar className="mt-0.5 size-4 text-gray-500" /><div><p className="text-gray-500">{t("date")}</p><p className="font-semibold text-slate-900">{displayDate}</p></div></div><div className="flex gap-2"><Clock className="mt-0.5 size-4 text-gray-500" /><div><p className="text-gray-500">{t("time")}</p><p className="font-semibold text-slate-900">{appointment?.time || "09:00 AM"}</p></div></div></div>
      <div className="space-y-2 border-b border-gray-200 py-4 text-[12px]"><div className="flex justify-between"><span className="text-gray-500">{t("consultation_fee")}</span><span className="font-semibold text-slate-900">{t("currency_format").replace("{val}", consultationFee)}</span></div><div className="flex justify-between"><span className="text-gray-500">{t("booking_fee")}</span><span className="font-semibold text-slate-900">{t("currency_format").replace("{val}", 0)}</span></div><div className="flex justify-between"><span className="text-gray-500">{t("tax")}</span><span className="font-semibold text-slate-900">{t("currency_format").replace("{val}", tax)}</span></div></div>
      <div className="flex justify-between py-3 text-[15px] font-semibold"><span>{t("total")}</span><span className="text-blue-600">{t("currency_format").replace("{val}", total)}</span></div>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-[11px] leading-snug text-blue-800"><div className="mb-1 flex items-center gap-1.5 font-semibold"><Info className="size-3.5" /> {t("cancellation_policy")}</div>{t("cancellation_policy_desc")}</div>
    </aside>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-[10px] font-medium text-red-600 dark:text-red-500!">{message}</p>;
}

function CardInput({ name, label, value, error, right, onChange, inputMode = "text", maxLength }) {
  const { t } = useTranslation();
  const translatedLabel = t(label.toLowerCase().replace(/\s+/g, "_"));
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[12px] text-slate-700">{label === "Card Number" && <CreditCard className="size-3.5" />}{label === "Cardholder Name" && <span className="text-[13px]">♙</span>}{translatedLabel}</span>
      <div className={`flex h-9 items-center justify-between rounded-md bg-gray-100 px-3 text-[12px] ${error ? "ring-1 ring-red-400" : "focus-within:ring-1 focus-within:ring-blue-400"}`}>
        <input name={name} value={value} onChange={onChange} inputMode={inputMode} maxLength={maxLength} autoComplete="off" className="min-w-0 flex-1 bg-transparent text-gray-700 outline-none placeholder:text-gray-400" />
        {right && <span className="ml-2 shrink-0 text-[10px] text-gray-500">{right}</span>}
      </div>
      <FieldError message={error} />
    </label>
  );
}

function PaymentCard({ onConfirm, otpSent = false, paymentData, onPaymentChange, amount = 150, isSubmitting = false }) {
  const { t } = useTranslation();
  const [errors, setErrors] = useState({});
  const cardBrand = getCardBrand(paymentData.cardNumber);
  const handleChange = (field) => (event) => {
    let value = event.target.value;
    if (field === "cardNumber") value = formatCardNumber(value);
    if (field === "cvv") value = digitsOnly(value).slice(0, 4);
    if (field === "otp") value = digitsOnly(value).slice(0, 6);
    if (field === "expiryDate") value = value.replace(/[^0-9/]/g, "").slice(0, 5);
    if (field === "cardholderName") value = sanitizeText(value, 80).toUpperCase();
    onPaymentChange({ ...paymentData, [field]: value });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  const handleSubmit = () => {
    const nextErrors = validatePaymentForm(paymentData, otpSent);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onConfirm();
  };
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-2"><Lock className="mt-0.5 size-4 text-green-600" /><div><h1 className="text-[16px] font-medium text-slate-900">{t("secure_payment")}</h1><p className="mt-1 text-[14px] text-gray-500">{t("payment_encrypted_desc")}</p></div></div>
      <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4"><div className="flex gap-2"><Shield className="mt-0.5 size-4 text-green-700" /><p className="text-[12px] leading-relaxed text-green-800"><span className="font-semibold">{t("pci_dss_compliant")}</span><br />{t("pci_dss_desc")}</p></div></div>
      <div className="mt-5 space-y-4"><CardInput name="cardNumber" label="Card Number" value={paymentData.cardNumber} onChange={handleChange("cardNumber")} error={errors.cardNumber} right={paymentData.cardNumber ? cardBrand : undefined} inputMode="numeric" maxLength={19} /><CardInput name="cardholderName" label="Cardholder Name" value={paymentData.cardholderName} onChange={handleChange("cardholderName")} error={errors.cardholderName} /><div className="grid grid-cols-2 gap-4"><CardInput name="expiryDate" label="Expiry Date" value={paymentData.expiryDate} onChange={handleChange("expiryDate")} error={errors.expiryDate} inputMode="numeric" maxLength={5} /><CardInput name="cvv" label="CVV" value={paymentData.cvv} onChange={handleChange("cvv")} error={errors.cvv} inputMode="numeric" maxLength={4} /></div><p className="pl-4 text-[12px] text-gray-500">{t("save_card_future")}</p></div>
      {otpSent ? <div className="mt-5 space-y-3"><div className="rounded-lg border border-green-200 bg-green-50 p-4 text-[12px] leading-relaxed text-green-800"><div className="font-semibold">{t("otp_sent")}</div>{t("otp_sent_desc")}</div><label className="block"><span className="mb-1.5 block text-[12px] font-medium text-slate-700">{t("enter_otp")}</span><input className={`h-9 w-full rounded-md bg-gray-100 px-3 text-[13px] tracking-[0.35em] outline-none ${errors.otp ? "ring-1 ring-red-400" : "focus:ring-1 focus:ring-blue-400"}`} value={paymentData.otp} onChange={handleChange("otp")} inputMode="numeric" maxLength={6} placeholder="000000" /><FieldError message={errors.otp} /></label><div className="flex items-center justify-between text-[11px] text-gray-500"><span>{t("code_expires")} <span className="text-blue-600">1:29</span></span><button type="button" onClick={() => onPaymentChange({ ...paymentData, otp: "" })} className="text-blue-600">{t("resend_otp")}</button></div></div> : <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-[12px] leading-relaxed text-blue-800"><div className="font-semibold">{t("security_verification_title")}</div>{t("security_verification_desc")}</div>}
      <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="mt-8 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#050316] text-[12px] font-medium text-white disabled:opacity-60"><Lock className="size-3.5" />{isSubmitting ? t("processing") : otpSent ? t("final_payment_confirmation") : `${t("confirm_payment")} - ${t("currency_format").replace("{val}", amount)}`}</button>
      <p className="mx-auto mt-5 max-w-[420px] text-center text-[10px] leading-relaxed text-gray-500">{t("payment_agreement_desc")}</p>
    </section>
  );
}

function PaymentMethods() {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-[11px] text-gray-600 shadow-sm">
      <span>{t("we_accept")}</span>
      <div className="flex flex-wrap gap-2">
        {['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'].map((method) => (
          <span key={method} className="rounded bg-gray-100 px-3 py-1 font-bold text-slate-800">{method}</span>
        ))}
      </div>
    </div>
  );
}

function PaymentScreen({ onBack, onConfirm, otpSent = false, doctor, appointment, paymentData, onPaymentChange, serverError, isSubmitting }) {
  const { t } = useTranslation();
  const consultationFee = parseFee(doctor?.fee);
  const total = consultationFee + 50;
  return (
    <section className="mx-auto max-w-[950px]">
      <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-[12px] text-slate-900"><ArrowLeft className="size-3.5" />{t("back_appointment_selection")}</button>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,520px)_260px] lg:items-start lg:justify-center"><div><PaymentCard onConfirm={onConfirm} otpSent={otpSent} paymentData={paymentData} onPaymentChange={onPaymentChange} amount={total} isSubmitting={isSubmitting} />{serverError && <p className="mt-3 rounded-md border border-red-200 bg-red-50 dark:border-red-900/50! dark:bg-red-950/20! px-3 py-2 text-[12px] text-red-700 dark:text-red-400!">{t(serverError)}</p>}<PaymentMethods /></div><PaymentSummary doctor={doctor} appointment={appointment} total={total} /></div>
    </section>
  );
}

function PaymentSuccess({ onChat, onHome, onAddToCalendar, doctor, appointment, paymentData }) {
  const { t } = useTranslation();
  const consultationFee = parseFee(doctor?.fee);
  const total = consultationFee + 50;
  const confirmationNumber = `TXN${Date.now()}`;
  const lastFour = digitsOnly(paymentData.cardNumber).slice(-4).padStart(4, "*");

  const dateObj = appointment?.date;
  let displayDate = "";
  if (dateObj) {
    const d = new Date(dateObj.id + "T00:00:00");
    if (!isNaN(d.getTime())) {
      displayDate = `${t("full_day_" + d.getDay())}, ${t("month_" + d.getMonth())} ${d.getDate()}, ${d.getFullYear()}`;
    } else {
      displayDate = dateObj.label;
    }
  }

  return (
    <section className="mx-auto max-w-[650px] space-y-5">
      <div className="rounded-xl border border-green-400 bg-green-50 dark:border-emerald-800/40! dark:bg-emerald-950/20! p-7 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border-4 border-green-200 bg-green-100 text-green-700 dark:border-emerald-900/30! dark:bg-emerald-900/30! dark:text-emerald-400!">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-5 text-[18px] font-semibold text-green-900 dark:text-emerald-400!">{t("payment_successful")}</h1>
        <p className="mt-3 text-[12px] text-green-700 dark:text-emerald-300/80!">{t("payment_success_desc")}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-[15px] font-medium text-slate-900">{t("appointment_confirmation")}</h2>
        <p className="mt-1 text-[12px] text-gray-500">{t("save_records_desc")}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-blue-100 bg-blue-50 dark:border-blue-900/50! dark:bg-blue-950/20! px-3 py-2 text-[12px]">
          <FileText className="size-4 text-blue-700 dark:text-blue-400!" />
          <span className="font-semibold text-blue-800 dark:text-blue-300!">{t("confirmation_number")}</span>
          <span className="tracking-wider text-blue-700 dark:text-blue-200!">{confirmationNumber}</span>
          <button type="button" className="ml-auto inline-flex items-center gap-1 rounded bg-white dark:bg-zinc-800! px-3 py-1 text-[11px] text-slate-700 dark:text-zinc-200! border dark:border-zinc-700!">
            <Download className="size-3" /> {t("download_receipt")}
          </button>
        </div>

        <div className="mt-5 grid gap-8 md:grid-cols-2">
          <div className="space-y-3 text-[12px]">
            <div>
              <p className="text-gray-500">{t("doctor")}</p>
              <p className="mt-1 font-semibold text-slate-900">{doctor?.name}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-gray-500">
                <Calendar className="size-3.5 dark:text-zinc-400!" /> {t("date")}
              </p>
              <p className="font-semibold text-slate-900">{displayDate}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-gray-500">
                <Clock className="size-3.5 dark:text-zinc-400!" /> {t("time")}
              </p>
              <p className="font-semibold text-slate-900">{appointment?.time}</p>
            </div>
          </div>
          <div className="space-y-2 text-[12px]">
            <p className="text-gray-500">{t("appointment_details")}</p>
            <p>Card: **** {lastFour}</p>
            <p>{t("amount_paid")}: {t("currency_format").replace("{val}", total)}</p>
            <p className="text-[10px] text-gray-500">Transaction ID: {confirmationNumber}</p>
          </div>
        </div>

        <div className="mt-5 border-t border-gray-200 pt-4 text-center">
          <button type="button" onClick={onAddToCalendar} className="h-8 min-w-[190px] rounded-md border border-gray-200 bg-white dark:bg-zinc-800! text-[12px] text-slate-700 dark:text-zinc-200! hover:bg-gray-50 dark:hover:bg-zinc-700! border dark:border-zinc-700! transition-colors">
            <Calendar className="mr-1.5 inline size-3.5 dark:text-zinc-400!" />{t("add_to_calendar")}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-[14px] font-medium text-slate-900">{t("whats_next")}</h2>
        <div className="space-y-3 text-[12px] text-gray-600">
          <p>
            <span className="mr-2 inline-flex size-6 items-center justify-center rounded bg-blue-100 text-blue-600 dark:bg-blue-950/40! dark:text-blue-400!">✉</span>
            <b>{t("email_confirmation_title")}</b>
            <br />
            <span className="ml-8">{t("email_confirmation_desc")}</span>
          </p>
          <p>
            <span className="mr-2 inline-flex size-6 items-center justify-center rounded bg-green-100 text-green-600 dark:bg-emerald-950/40! dark:text-emerald-400!">▣</span>
            <b>{t("calendar_reminder_title")}</b>
            <br />
            <span className="ml-8">{t("calendar_reminder_desc")}</span>
          </p>
          <p>
            <span className="mr-2 inline-flex size-6 items-center justify-center rounded bg-purple-100 text-purple-600 dark:bg-purple-950/40! dark:text-purple-400!">!</span>
            <b>{t("arrive_early_title")}</b>
            <br />
            <span className="ml-8">{t("arrive_early_desc")}</span>
          </p>
          <p>
            <span className="mr-2 inline-flex size-6 items-center justify-center rounded bg-amber-100 text-amber-600 dark:bg-amber-950/40! dark:text-amber-400!">□</span>
            <b>{t("prepare_info_title")}</b>
            <br />
            <span className="ml-8">{t("prepare_info_desc")}</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-[14px] font-semibold text-slate-900">{t("need_changes_title")}</h2>
        <p className="mt-2 text-[12px] text-gray-600">{t("need_changes_desc")}</p>
        <div className="mt-3 flex flex-wrap gap-6 text-[12px] text-blue-600">
          <span className="text-blue-600 dark:text-blue-400!">Call: 1-800-SKIN-CARE</span>
          <span className="text-blue-600 dark:text-blue-400!">Email: support@skinidentification.com</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 pb-6">
        <button type="button" onClick={onChat} className="inline-flex h-9 min-w-[160px] items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-medium text-white">
          <MessageCircle className="size-3.5" /> {t("chat_with_this_doctor")}
        </button>
        <button type="button" onClick={onHome} className="inline-flex h-9 min-w-[160px] items-center justify-center gap-2 rounded-md bg-[#050316] dark:bg-zinc-800! dark:hover:bg-zinc-700! px-4 text-[12px] font-medium text-white">
          {t("return_to_dashboard")}
        </button>
      </div>
    </section>
  );
}

function MessageBubble({ side = "left", text, time }) {
  return (
    <div className={`flex flex-col ${side === "right" ? "items-end" : "items-start"}`}>
      <div className={`${side === "right" ? "bg-blue-600 text-white" : "bg-white text-slate-800"} max-w-[620px] rounded-lg border border-gray-200 px-4 py-3 text-[13px] leading-relaxed shadow-sm`}>
        {text}
      </div>
      <span className="mt-1 text-[10px] uppercase text-gray-400">{time}</span>
    </div>
  );
}

function PatientDoctorChat({ onBack, onReportList, fromDoctor = false, doctor, appointment }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const chatId = getLatestChatId();
    if (!chatId) return;
    let alive = true;
    async function loadMessages() {
      try {
        const response = await chatApi.messages(chatId);
        const list = toArray(unwrapData(response)).map((item) => adaptMessage(item, fromDoctor ? "doctor" : "patient"));
        if (alive && list.length) setMessages(list);
      } catch {
        setMessages([]);
      }
    }
    loadMessages();
    return () => { alive = false; };
  }, [fromDoctor]);

  const handleSend = async (event) => {
    event.preventDefault();
    const nextError = validateMessage(draft);
    setError(nextError);
    if (nextError || isSending) return;
    const messageText = cleanText(draft, 500);
    const chatId = getLatestChatId();
    const optimistic = { id: Date.now(), side: fromDoctor ? "left" : "right", text: messageText, time: "Now" };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    if (!chatId) return;
    setIsSending(true);
    try {
      await chatApi.send({ chat_id: chatId, message_text: messageText });
    } catch (apiError) {
      setError(apiError.message || "message_send_failed");
    } finally {
      setIsSending(false);
    }
  };
  return (
    <section className="mx-auto max-w-[980px] rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3"><button type="button" onClick={onBack} className="flex items-center gap-3 text-left"><ArrowLeft className="size-4 text-slate-700" /><DoctorAvatar initials={fromDoctor ? "K" : doctor?.initials || "SJ"} className="size-8" /><div><h1 className="text-[14px] font-semibold text-slate-900">{fromDoctor ? "karim" : doctor?.name || "Dr. Sarah Johnson"}</h1><p className="text-[11px] text-gray-500">{fromDoctor ? "patient" : "Dermatology"}</p></div></button><span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-[11px] font-medium text-green-700"><Shield className="size-3" /> {t("secure")}</span></div>
      <div className="flex items-center justify-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-3 text-[12px] text-gray-600"><Lock className="size-3.5 text-blue-600" />{t("powered_by_ai")}</div>
      <div className="flex justify-center py-4"><button type="button" onClick={onReportList} className="h-8 min-w-[135px] rounded-md border border-gray-300 bg-blue-100 px-4 text-[12px] text-slate-900">{fromDoctor ? t("get_report") : t("write_report")}</button></div>
      <div className="min-h-[360px] space-y-7 bg-gray-50/60 px-8 py-4">{messages.map((message) => <MessageBubble key={message.id} side={message.side === "right" ? "right" : "left"} text={message.text} time={message.time} />)}</div>
      <form onSubmit={handleSend} className="border-t border-gray-200 bg-white px-8 py-5"><div className="flex items-center gap-2"><div className={`flex h-10 flex-1 items-center rounded-lg border bg-white px-4 ${error ? "border-red-300" : "border-gray-200"}`}><input value={draft} onChange={(e) => { setDraft(sanitizeText(e.target.value, 500)); setError(""); }} className="min-w-0 flex-1 text-[13px] text-slate-700 outline-none placeholder:text-gray-400" placeholder={t("type_message")} maxLength={500} /><Paperclip className="ml-auto size-4 text-gray-400" /></div><button type="submit" disabled={Boolean(validateMessage(draft)) || isSending} className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white disabled:opacity-50"><Send className="size-4 shrink-0" /></button></div>{error && <p className="mt-2 text-[11px] text-red-600">{t(error)}</p>}</form>
    </section>
  );
}

const reportText = `Patient presented with persistent, pruritic lesions on the antecubital and popliteal fossae. Clinical presentation is consistent with a flare-up of chronic atopic condition, potentially triggered by seasonal environmental allergens. Recommended immediate topical intervention and oral antihistamine course. Patient presented with persistent, pruritic lesions on the antecubital and popliteal fossae. Clinical presentation is consistent with a flare-up of chronic atopic condition, potentially triggered by seasonal environmental allergens. Recommended immediate topical intervention and oral antihistamine course. Patient presented with persistent, pruritic lesions on the antecubital and popliteal fossae. Clinical presentation is consistent with a flare-up of chronic atopic condition, potentially triggered by seasonal environmental allergens. Recommended immediate topical intervention and oral antihistamine ...`;

function ReportList({ onBack, onOpen }) {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-[860px] rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-[12px] text-slate-900"><ArrowLeft className="size-3.5" /> {t("back_to_chat")}</button>
      <h1 className="text-[15px] font-medium text-slate-900">{t("all_reports")}</h1>
      <div className="mt-6 space-y-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <button key={item} onClick={onOpen} className="flex w-full items-center justify-between rounded-md bg-blue-50 px-5 py-4 text-left transition hover:bg-blue-100">
            <div>
              <p className="text-[12px] font-semibold text-slate-800">{t("report_doctor").replace("{name}", "Dr. Sarah")}</p>
              <p className="mt-1 max-w-[520px] truncate text-[10px] text-slate-600">Hello! Thank you for booking an appointment with me. I've reviewed your payment confirmation for February 7, 2026 at 09:00 AM. Do</p>
            </div>
            <span className="text-[24px] text-slate-900">&gt;</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function MedicalReport({ onBack }) {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-[640px]">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-[12px] text-slate-900"><ArrowLeft className="size-3.5" /> {t("back")}</button>
      <h1 className="mb-4 text-[16px] font-semibold text-slate-900">{t("report_doctor").replace("{name}", "Dr. Sarah")}</h1>
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-7 shadow-sm">
        <p className="max-w-[460px] text-[19px] font-bold leading-snug text-slate-900">
          {reportText}
        </p>
      </div>
    </section>
  );
}

function toAppointmentIso(dateId, timeLabel) {
  if (!dateId || !timeLabel) return new Date().toISOString();
  const [hourPart, minutePart] = timeLabel.replace(/\s+/g, " ").split(":");
  const minute = Number(minutePart?.slice(0, 2) || 0);
  const period = timeLabel.toUpperCase().includes("PM") ? "PM" : "AM";
  let hour = Number(hourPart || 0);
  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return new Date(`${dateId}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`).toISOString();
}

export default function DoctorsTab({ onChromeChange, onSwitchToPatient, onSwitchToChat, pendingAppointment, onClearPending }) {
  const [view, setView] = useState("recommendations");
  const [apiDoctors, setApiDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorsError, setDoctorsError] = useState("");
  const doctorList = apiDoctors;
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointment, setAppointment] = useState({ date: null, time: "" });
  const [appointmentId, setAppointmentId] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentData, setPaymentData] = useState({ cardNumber: "", cardholderName: "", expiryDate: "", cvv: "", otp: "" });

  /* ── Dynamic availability state ── */
  const [dynamicDates, setDynamicDates] = useState([]);
  const [dynamicMorning, setDynamicMorning] = useState([]);
  const [dynamicAfternoon, setDynamicAfternoon] = useState([]);
  const [dynamicDisabled, setDynamicDisabled] = useState(new Set());
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  useEffect(() => {
    let alive = true;
    async function loadDoctors() {
      setLoadingDoctors(true);
      try {
        // Fetch all approved doctors with no specialization filter
        const response = await doctorsApi.list();
        const list = toArray(unwrapData(response)).map((item) => adaptDoctor(item));
        if (alive) {
          setApiDoctors(list);
          if (list.length) setSelectedDoctor(list[0]);
        }
      } catch { if (alive) setDoctorsError("doctors_load_error"); }
      finally { if (alive) setLoadingDoctors(false); }
    }
    loadDoctors();
    return () => { alive = false; };
  }, []);

  /* ── Resume payment: when pendingAppointment arrives, skip straight to payment ── */
  useEffect(() => {
    if (!pendingAppointment) return;
    const apptId = pendingAppointment.appointment_id || "";
    if (!apptId) return;
    // Set up state so the payment flow works with the existing appointment
    setAppointmentId(apptId);
    saveLatestAppointmentId(apptId);
    // Build a minimal doctor object for the payment summary display
    setSelectedDoctor({
      name: pendingAppointment.doctor_name || pendingAppointment.doctor || "Doctor",
      initials: (pendingAppointment.doctor_name || pendingAppointment.doctor || "D").charAt(0).toUpperCase(),
      fee: pendingAppointment.fee ? `$${String(pendingAppointment.fee).replace(/^\$/, "")}` : "$0",
    });
    setAppointment({
      date: { label: pendingAppointment.date || "", id: pendingAppointment.rawDate || "" },
      time: pendingAppointment.time || "",
    });
    setPaymentData({ cardNumber: "", cardholderName: "", expiryDate: "", cvv: "", otp: "" });
    setPaymentError("");
    setView("payment");
  }, [pendingAppointment]);

  /* ── Fetch available time slots for a given doctor + date ── */
  const fetchSlots = useCallback(async (doctorId, dateId) => {
    if (!doctorId || !dateId) return;
    setLoadingSlots(true);
    try {
      const response = await doctorsApi.availableSlots(doctorId, dateId);
      const slots = adaptSlotsResponse(response);
      const { morning, afternoon, disabled } = splitSlots(slots);
      setDynamicMorning(morning);
      setDynamicAfternoon(afternoon);
      setDynamicDisabled(disabled);
    } catch {
      // Fallback: clear dynamic slots so fallback renders (only if dates also failed)
      setDynamicMorning([]);
      setDynamicAfternoon([]);
      setDynamicDisabled(new Set());
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  /* ── Fetch available dates when entering booking view ── */
  const fetchDatesAndSlots = useCallback(async (doctor) => {
    const doctorId = doctor?.medical_syndicate_id_card || doctor?.id;
    if (!doctorId) return;
    setLoadingDates(true);
    setAvailabilityError("");
    setDynamicDates([]);
    setDynamicMorning([]);
    setDynamicAfternoon([]);
    setDynamicDisabled(new Set());
    try {
      const response = await doctorsApi.availableDates(doctorId, 60);
      const dates = adaptDatesResponse(response);
      setDynamicDates(dates);
      if (dates.length) {
        const firstDate = dates[0];
        setAppointment({ date: firstDate, time: "" });
        // Also fetch slots for the first date
        await fetchSlots(doctorId, firstDate.id);
      } else {
        setAppointment({ date: null, time: "" });
      }
    } catch {
      setAvailabilityError("availability_load_error");
      setDynamicDates([]);
      setAppointment({ date: null, time: "" });
    } finally {
      setLoadingDates(false);
    }
  }, [fetchSlots]);

  /* ── Handle date selection: update appointment + fetch slots ── */
  const handleDateSelect = useCallback((date) => {
    setAppointment({ date, time: "" });
    const doctorId = selectedDoctor?.medical_syndicate_id_card || selectedDoctor?.id;
    fetchSlots(doctorId, date.id);
  }, [selectedDoctor, fetchSlots]);

  useEffect(() => { const hideChrome = ["booking", "payment", "otp", "success", "chat", "reportList", "reportDetail"].includes(view); onChromeChange?.(hideChrome); return () => onChromeChange?.(false); }, [view, onChromeChange]);
  const openBooking = (doctor) => { setSelectedDoctor(doctor); setBookingError(""); setView("booking"); fetchDatesAndSlots(doctor); };
  const openMap = (doctor) => { setSelectedDoctor(doctor); setView("map"); };

  const proceedToPayment = async (nextAppointment) => {
    setAppointment(nextAppointment);
    setBookingError("");
    const doctorId = selectedDoctor?.medical_syndicate_id_card || selectedDoctor?.id;
    if (!doctorId || !nextAppointment?.date || !nextAppointment?.time) {
      setBookingError("select_date_time_error");
      return;
    }
    // analysis_id is required by the backend
    const analysisId = getLatestAnalysisId();
    if (!analysisId) {
      setBookingError("upload_analysis_required");
      return;
    }
    setIsBooking(true);
    try {
      const isoDate = toAppointmentIso(nextAppointment.date?.id, nextAppointment.time);
      const response = await appointmentApi.book({
        medical_syndicate_id_card: doctorId,
        date: isoDate,
        analysis_id: analysisId,
      });
      const nextAppointmentId = extractId(response, ["appointment_id"]);
      const nextChatId = extractId(response, ["chat_id"]);
      if (nextAppointmentId) { setAppointmentId(nextAppointmentId); saveLatestAppointmentId(nextAppointmentId); }
      if (nextChatId) saveLatestChatId(nextChatId);
      setView("payment");
    } catch (error) { setBookingError(error.message || "booking_failed"); }
    finally { setIsBooking(false); }
  };

  const confirmPayment = async () => {
    const activeAppointmentId = appointmentId || sessionStorage.getItem("skinner_latest_appointment_id");
    if (!activeAppointmentId) { setPaymentError("missing_appointment_id"); return; }
    setIsPaying(true); setPaymentError("");
    try {
      const response = await paymentApi.pay({ appointment_id: activeAppointmentId, method: "card", card_holder_name: cleanText(paymentData.cardholderName, 80), card_last4: digitsOnly(paymentData.cardNumber).slice(-4) });
      const nextChatId = extractId(response, ["chat_id"]);
      if (nextChatId) saveLatestChatId(nextChatId);
      onClearPending?.();
      setView("success");
    } catch (error) { setPaymentError(error.message || "payment_failed"); }
    finally { setIsPaying(false); }
  };

  // Helper: go back from payment — if this was a resume flow, go back to recommendations and clear pending
  const handlePaymentBack = () => {
    if (pendingAppointment) {
      onClearPending?.();
      setView("recommendations");
    } else {
      setView("booking");
    }
  };

  if (view === "booking") return <AppointmentBooking doctor={selectedDoctor} appointment={appointment} onAppointmentChange={setAppointment} onBack={() => setView("recommendations")} onProceed={proceedToPayment} serverError={bookingError} isSubmitting={isBooking} dates={dynamicDates} morningSlots={dynamicMorning} afternoonSlots={dynamicAfternoon} disabledSlots={dynamicDisabled} loadingDates={loadingDates} loadingSlots={loadingSlots} onDateSelect={handleDateSelect} availabilityError={availabilityError} />;
  if (view === "map") return <DoctorMapView onBack={() => setView("recommendations")} onBook={openBooking} doctorList={doctorList} currentDoctor={selectedDoctor} onSelect={setSelectedDoctor} />;
  if (view === "payment") return <PaymentScreen doctor={selectedDoctor} appointment={appointment} paymentData={paymentData} onPaymentChange={setPaymentData} onBack={handlePaymentBack} onConfirm={() => setView("otp")} />;
  if (view === "otp") return <PaymentScreen otpSent doctor={selectedDoctor} appointment={appointment} paymentData={paymentData} onPaymentChange={setPaymentData} onBack={() => setView("payment")} onConfirm={confirmPayment} serverError={paymentError} isSubmitting={isPaying} />;
  if (view === "success") return <PaymentSuccess doctor={selectedDoctor} appointment={appointment} paymentData={paymentData} onChat={() => { onClearPending?.(); setView("recommendations"); onSwitchToChat?.(); }} onHome={() => { onClearPending?.(); setView("recommendations"); }} onAddToCalendar={() => { onClearPending?.(); setView("recommendations"); onSwitchToPatient?.(); }} />;
  if (view === "chat") return <PatientDoctorChat doctor={selectedDoctor} appointment={appointment} onBack={() => setView("success")} onReportList={() => setView("reportList")} />;
  if (view === "reportList") return <ReportList onBack={() => setView("chat")} onOpen={() => setView("reportDetail")} />;
  if (view === "reportDetail") return <MedicalReport onBack={() => setView("reportList")} />;
  return <RecommendationList onBook={openBooking} onMap={openMap} doctorList={doctorList} loading={loadingDoctors} error={doctorsError} />;
}

