import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Plus, X, Trash2 } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOT_DURATIONS = [30, 60];

function buildTimeOptions() {
  const opts = [];
  for (let h = 9; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 21 && m > 0) break;          // stop at 21:00 (9 PM)
      opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return opts;
}
const TIME_OPTIONS = buildTimeOptions();

function formatTime12(t, lang) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? (lang === "ar" ? "م" : "PM") : (lang === "ar" ? "ص" : "AM");
  return `${(h % 12) || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

/** Format YYYY-MM-DD to readable date */
function formatDate(dateStr, lang) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateVal, lang) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const datePart = d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
  const timePart = d.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function makeUid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Calendar day cell – clickable to select a specific date */
function DayCell({ value, hasSlots, isSelected, isToday, isPast, onClick }) {
  if (value === null) return <span className="size-8" />;
  const base =
    "flex size-8 items-center justify-center rounded-md text-[12px] select-none transition-all duration-150";

  let style;
  if (isSelected) {
    style = `${base} bg-blue-600 text-white font-semibold shadow-md ring-2 ring-blue-300 cursor-pointer`;
  } else if (hasSlots) {
    style = `${base} bg-blue-100 text-blue-700 font-medium cursor-pointer hover:bg-blue-200`;
  } else if (isToday) {
    style = `${base} bg-gray-100 text-blue-600 ring-1 ring-blue-200 cursor-pointer hover:bg-blue-50`;
  } else if (isPast) {
    style = `${base} text-gray-300`;
  } else {
    style = `${base} text-slate-700 cursor-pointer hover:bg-gray-100`;
  }

  return (
    <span className={style} onClick={isPast ? undefined : onClick}>
      {value}
      {hasSlots && !isSelected && (
        <span className="absolute -bottom-0.5 size-1.5 rounded-full bg-blue-500" />
      )}
    </span>
  );
}

export default function DoctorSchedule({
  doctorInfo,
  onOpenModal,
  // Per-date availability props
  dateSlots,           // Map<dateStr, Array<{start_time, end_time, slot_duration_minutes, _uid}>>
  selectedDate,        // string | null  (YYYY-MM-DD)
  onSelectDate,        // (dateStr) => void
  onSlotsChange,       // (dateStr, slots[]) => void
  onSaveDate,          // (dateStr) => void
  onRemoveDate,        // (dateStr) => void
  savingDate,
  dateMessage,
  dateError,
  loadingDates,
  onMonthChange,       // (year, month) => void
  upcomingAppointments,
}) {
  const { t, lang } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  // Which dates in this month have saved slots?
  const datesWithSlots = new Set(
    Object.keys(dateSlots || {}).filter((d) => {
      const slots = dateSlots[d];
      return slots && slots.length > 0;
    })
  );

  const changeMonth = (delta) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setMonth(newMonth);
    setYear(newYear);
    onMonthChange?.(newYear, newMonth);
  };

  const handleDateClick = (day) => {
    const dateStr = toDateStr(year, month, day);
    onSelectDate?.(dateStr);
  };

  /** Compute end_time = start + duration (clamped to 21:00) */
  const calcEndTime = (startTime, durationMinutes) => {
    const [h, m] = startTime.split(":").map(Number);
    const total = h * 60 + m + durationMinutes;
    if (total >= 21 * 60) return "21:00";
    const eH = Math.floor(total / 60);
    const eM = total % 60;
    return `${String(eH).padStart(2, "0")}:${String(eM).padStart(2, "0")}`;
  };

  // Current selected date's slots (normalize stale times)
  const rawSlots = selectedDate ? (dateSlots?.[selectedDate] || []) : [];
  const currentSlots = rawSlots.map((s) => {
    const st = s.start_time < "09:00" ? "09:00" : s.start_time > "20:30" ? "20:30" : s.start_time;
    let et = s.end_time > "21:00" ? "21:00" : s.end_time;
    if (et <= st) et = calcEndTime(st, s.slot_duration_minutes);
    return (st === s.start_time && et === s.end_time) ? s : { ...s, start_time: st, end_time: et };
  });

  const addSlot = () => {
    const defaultStart = "09:00";
    const defaultDuration = 30;
    const newSlot = {
      start_time: defaultStart,
      end_time: calcEndTime(defaultStart, defaultDuration),
      slot_duration_minutes: defaultDuration,
      _uid: makeUid(),
    };
    onSlotsChange?.(selectedDate, [...currentSlots, newSlot]);
  };

  const removeSlot = (uid) => {
    onSlotsChange?.(selectedDate, currentSlots.filter((s) => s._uid !== uid));
  };

  const updateSlotField = (uid, field, value) => {
    onSlotsChange?.(
      selectedDate,
      currentSlots.map((s) => {
        if (s._uid !== uid) return s;
        const updated = { ...s, [field]: value };

        // Recalculate end_time whenever start or duration changes
        if (field === "start_time") {
          updated.end_time = calcEndTime(value, s.slot_duration_minutes);
        }
        if (field === "slot_duration_minutes") {
          updated.end_time = calcEndTime(s.start_time, value);
        }
        if (field === "end_time" && value <= s.start_time) {
          return s; // reject — don't allow end <= start
        }
        return updated;
      })
    );
  };

  // Build calendar grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <section className="mx-auto grid max-w-[760px] gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
      <div className="space-y-5">
        {/* ── Calendar ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-[14px] font-medium text-slate-900">
            {t("select_date")}
          </h2>
          <p className="mt-1 text-[11px] text-gray-400">
            {t("click_date_available")}
          </p>

          {/* Month navigation */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex size-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-gray-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-[12px] font-medium text-slate-700">
              {t("month_" + month)} {year}
            </p>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex size-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-gray-100"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-gray-500 font-sans">
            {DAY_SHORT.map((d, index) => (
              <span key={d}>{t("day_" + index)}</span>
            ))}
          </div>

          {/* Day cells – clickable for specific dates */}
          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) return <span key={`e${idx}`} className="size-8" />;
              const dateStr = toDateStr(year, month, day);
              return (
                <div key={day} className="relative flex items-center justify-center">
                  <DayCell
                    value={day}
                    hasSlots={datesWithSlots.has(dateStr)}
                    isSelected={selectedDate === dateStr}
                    isToday={dateStr === todayStr}
                    isPast={dateStr < todayStr}
                    onClick={() => handleDateClick(day)}
                  />
                </div>
              );
            })}
          </div>

          {loadingDates && (
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-400 font-sans">
              <Clock className="size-3.5 animate-spin" /> {t("loading_dots") || "Loading…"}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex gap-4 border-t border-gray-100 pt-4 text-[10px] text-gray-500 font-sans">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-blue-100 ring-1 ring-blue-300" />
              {t("has_availability")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-blue-600" />
              {t("selected")}
            </span>
          </div>
        </div>

        {/* ── Date Slot Editor ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {!selectedDate ? (
            <div className="py-8 text-center">
              <p className="text-[13px] text-gray-400 font-sans">
                {t("select_date_calendar_desc")}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[14px] font-medium text-slate-900">
                    {formatDate(selectedDate, lang)}
                  </h2>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {currentSlots.length === 0
                      ? t("no_slots_set")
                      : `${currentSlots.length} ${currentSlots.length > 1 ? t("time_slots_many") : t("time_slot_one")}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addSlot()}
                  className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  <Plus className="size-3.5" />
                  {t("add_slot")}
                </button>
              </div>

              {currentSlots.length === 0 ? (
                <div className="mt-4 rounded-lg border-2 border-dashed border-gray-200 py-6 text-center">
                  <p className="text-[12px] text-gray-400 font-sans">
                    {t("click_add_slot_desc") || "Click \"Add Slot\" to set working hours for this day"}
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3 font-sans">
                  {currentSlots.map((slot) => (
                    <div
                      key={slot._uid}
                      className="flex items-end gap-2 rounded-lg border border-blue-100 bg-blue-50/40 p-3"
                    >
                      <label className="block" style={{ flex: 1.4 }}>
                        <span className="mb-1 block text-[9px] font-medium uppercase tracking-wide text-gray-500">
                          {t("start")}
                        </span>
                        <select
                          value={slot.start_time}
                          onChange={(e) =>
                            updateSlotField(slot._uid, "start_time", e.target.value)
                          }
                          className="h-7 w-full rounded-md border border-gray-200 bg-white pl-1 pr-3.5 text-[11px] text-slate-700 outline-none focus:border-blue-400"
                        >
                          {TIME_OPTIONS.filter((t) => t < "21:00").map((t) => (
                            <option key={t} value={t}>{formatTime12(t, lang)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block" style={{ flex: 1.4 }}>
                        <span className="mb-1 block text-[9px] font-medium uppercase tracking-wide text-gray-500">
                          {t("end")}
                        </span>
                        <select
                          value={slot.end_time}
                          onChange={(e) =>
                            updateSlotField(slot._uid, "end_time", e.target.value)
                          }
                          className="h-7 w-full rounded-md border border-gray-200 bg-white pl-1 pr-3.5 text-[11px] text-slate-700 outline-none focus:border-blue-400"
                        >
                          {TIME_OPTIONS.filter((t) => t > slot.start_time).map((t) => (
                            <option key={t} value={t}>{formatTime12(t, lang)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block" style={{ flex: 0.8 }}>
                        <span className="mb-1 block text-[9px] font-medium uppercase tracking-wide text-gray-500">
                          {t("slot")}
                        </span>
                        <select
                          value={slot.slot_duration_minutes}
                          onChange={(e) =>
                            updateSlotField(slot._uid, "slot_duration_minutes", Number(e.target.value))
                          }
                          className="h-7 w-full rounded-md border border-gray-200 bg-white pl-1 pr-3.5 text-[11px] text-slate-700 outline-none focus:border-blue-400"
                        >
                          {SLOT_DURATIONS.map((d) => (
                            <option key={d} value={d}>{d} {t("min") || "min"}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeSlot(slot._uid)}
                        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-red-200 text-red-500 transition-colors hover:bg-red-50"
                        title={t("remove_time_slot")}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Status messages */}
              {dateMessage && (
                <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[11px] text-green-700 font-sans">
                  {dateMessage}
                </p>
              )}
              {dateError && (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 font-sans">
                  {dateError}
                </p>
              )}

              <div className="mt-4 flex gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => onSaveDate?.(selectedDate)}
                  disabled={savingDate || currentSlots.length === 0}
                  className="h-9 flex-1 rounded-md bg-blue-600 text-[12px] font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingDate ? t("saving_dots") : t("save")}
                </button>
                {datesWithSlots.has(selectedDate) && (
                  <button
                    type="button"
                    onClick={() => onRemoveDate?.(selectedDate)}
                    disabled={savingDate}
                    className="flex h-9 items-center gap-1.5 rounded-md border border-red-200 px-4 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                    {t("remove_day")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Upcoming Appointments ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-[13px] font-medium text-slate-900">
            {t("upcoming_appointments")}
          </h3>
          {!upcomingAppointments || upcomingAppointments.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-gray-400 font-sans">
              {t("no_upcoming_appointments")}
            </p>
          ) : (
            upcomingAppointments.slice(0, 5).map((appt, i) => (
              <div
                key={appt.appointment_id || appt.id || i}
                className="mb-2 rounded-md bg-blue-50 p-3 font-sans"
              >
                <div className="flex items-start justify-between gap-3 font-sans">
                  <div>
                    <p className="text-[12px] font-medium text-slate-900">
                      {appt.ai_diagnosis || appt.diagnosis || "Consultation"}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-500">
                      {formatDateTime(appt.submitted_on, lang) || "Scheduled"}
                    </p>
                  </div>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    {appt.patient_name || "Patient"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Doctor Information (right column) ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <h2 className="text-[14px] font-medium text-slate-900">
            {t("doctor_information")}
          </h2>
          <button
            type="button"
            onClick={onOpenModal}
            className="rounded bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-600"
          >
            {t("edit")}
          </button>
        </div>
        <dl className="mt-5 space-y-4 text-[12px]">
          <div>
            <dt className="text-gray-500">{t("full_name")}</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {doctorInfo.name}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("email")}</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {doctorInfo.email}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("phone")}</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {doctorInfo.phone}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("clinic_address")}</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {doctorInfo.address}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("consultation_fee")}</dt>
            <dd className="mt-1 font-medium text-blue-600">
              ${doctorInfo.consultationFee}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
