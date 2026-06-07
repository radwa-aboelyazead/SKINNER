import Navbar from "../layouts/navbar";
import Footer from "../layouts/footer";
import { useTranslation } from "../context/LanguageContext";
import {
  Activity,
  Bot,
  Calendar,
  Camera,
  CreditCard,
  FileText,
  Lock,
  MapPin,
  MessageCircle,
  Shield,
  Stethoscope,
  Upload,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: Camera,
    titleKey: "feat_ai_title",
    descKey: "feat_ai_desc",
    color: "bg-blue-100 text-blue-600",
    tagKey: "tag_core",
    defaultTag: "Core Feature",
  },
  {
    icon: Stethoscope,
    titleKey: "feat_dr_title",
    descKey: "feat_dr_desc",
    color: "bg-green-100 text-green-600",
    tagKey: "tag_dr",
    defaultTag: "Doctor Network",
  },
  {
    icon: MessageCircle,
    titleKey: "feat_chat_title",
    descKey: "feat_chat_desc",
    color: "bg-purple-100 text-purple-600",
    tagKey: "tag_comm",
    defaultTag: "Communication",
  },
  {
    icon: Calendar,
    titleKey: "feat_booking_title",
    descKey: "feat_booking_desc",
    color: "bg-amber-100 text-amber-600",
    tagKey: "tag_sched",
    defaultTag: "Scheduling",
  },
  {
    icon: CreditCard,
    titleKey: "feat_payment_title",
    descKey: "feat_payment_desc",
    color: "bg-rose-100 text-rose-600",
    tagKey: "tag_pay",
    defaultTag: "Payments",
  },
  {
    icon: Bot,
    titleKey: "feat_bot_title",
    descKey: "feat_bot_desc",
    color: "bg-cyan-100 text-cyan-600",
    tagKey: "tag_ai",
    defaultTag: "AI Powered",
  },
  {
    icon: FileText,
    titleKey: "feat_report_title",
    descKey: "feat_report_desc",
    color: "bg-indigo-100 text-indigo-600",
    tagKey: "tag_doc",
    defaultTag: "Documentation",
  },
  {
    icon: Upload,
    titleKey: "feat_upload_title",
    descKey: "feat_upload_desc",
    color: "bg-teal-100 text-teal-600",
    tagKey: "tag_flow",
    defaultTag: "Workflow",
  },
  {
    icon: MapPin,
    titleKey: "feat_map_title",
    descKey: "feat_map_desc",
    color: "bg-orange-100 text-orange-600",
    tagKey: "tag_nav",
    defaultTag: "Navigation",
  },
  {
    icon: Users,
    titleKey: "feat_dash_title",
    descKey: "feat_dash_desc",
    color: "bg-pink-100 text-pink-600",
    tagKey: "tag_fordr",
    defaultTag: "For Doctors",
  },
  {
    icon: Shield,
    titleKey: "feat_privacy_title",
    descKey: "feat_privacy_desc",
    color: "bg-emerald-100 text-emerald-600",
    tagKey: "tag_sec",
    defaultTag: "Security",
  },
  {
    icon: Activity,
    titleKey: "feat_library_title",
    descKey: "feat_library_desc",
    color: "bg-violet-100 text-violet-600",
    tagKey: "tag_knowledge",
    defaultTag: "Knowledge",
  },
];

function FeatureCard({ feature, index }) {
  const Icon = feature.icon;
  const { t } = useTranslation();
  
  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-900 dark:border-zinc-800"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Tag */}
      <span className="mb-4 inline-block rounded-full bg-gray-100 dark:bg-zinc-800 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
        {t(feature.tagKey) || feature.defaultTag}
      </span>

      {/* Icon */}
      <div className={`mb-4 flex size-12 items-center justify-center rounded-xl ${feature.color}`}>
        <Icon className="size-6" />
      </div>

      {/* Content */}
      <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
        {t(feature.titleKey)}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500 dark:text-zinc-400">
        {t(feature.descKey)}
      </p>

      {/* Decorative corner gradient */}
      <div className="pointer-events-none absolute -bottom-8 -right-8 size-24 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-zinc-800 dark:to-zinc-800" />
    </article>
  );
}

export default function Features() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <Navbar />

      <section className="flex-1 bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_50%,#FAF5FF_100%)] dark:bg-none dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-6 py-16">
          {/* Header */}
          <div className="text-center">
            <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-950/40 px-4 py-1.5 text-[12px] font-semibold text-blue-700 dark:text-blue-400">
              {t("platform_features")}
            </span>
            <h1 className="mt-4 text-[28px] font-bold text-slate-900 dark:text-white md:text-[40px]">
              {t("everything_needed_title")}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> {t("skin_health")}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-500 dark:text-zinc-400">
              {t("platform_desc")}
            </p>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { value: t("stat_ai"), label: t("stat_ai_label") },
              { value: t("stat_verified"), label: t("stat_verified_label") },
              { value: t("stat_enc"), label: t("stat_enc_label") },
              { value: t("stat_247"), label: t("stat_247_label") },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center shadow-sm">
                <p className="text-[15px] font-bold text-blue-600 dark:text-blue-400">{stat.value}</p>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.titleKey} feature={feature} index={index} />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center shadow-lg md:p-12">
            <Lock className="mx-auto size-10 text-white/80" />
            <h2 className="mt-4 text-[22px] font-bold text-white md:text-[26px]">
              {t("ready_control")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-white/80">
              {t("join_skinner_desc")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <a
                href="/register"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-[13px] font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                {t("get_started_free")}
              </a>
              <a
                href="/contact-us"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/30 px-6 text-[13px] font-semibold text-white transition hover:bg-white/10"
              >
                {t("contact_us")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
