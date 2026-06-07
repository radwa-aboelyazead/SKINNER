import Navbar from "../layouts/navbar";
import Footer from "../layouts/footer";
import { useTranslation } from "../context/LanguageContext";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";

const PHONE_NUMBERS = [
  { display: "+20 103 096 7385", tel: "+201030967385" },
  { display: "+20 101 433 1859", tel: "+201014331859" },
  { display: "+20 122 813 5447", tel: "+201228135447" },
];

const EMAILS = [
  "mahmoudsa4567@gmail.com",
  "abdotako2@gmail.com",
  "radwaaboelyazead@gmail.com",
];

function ContactCard({ icon: Icon, title, children, gradient }) {
  return (
    <div className={`rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm transition hover:shadow-md ${gradient}`}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
        <Icon className="size-6" />
      </div>
      <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

export default function ContactUs() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <Navbar />

      <section className="flex-1 bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_50%,#FAF5FF_100%)] dark:bg-none dark:bg-zinc-950">
        <div className="mx-auto max-w-4xl px-6 py-16">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
              <MessageCircle className="size-8" />
            </div>
            <h1 className="text-[28px] font-bold text-slate-900 dark:text-white md:text-[36px]">
              {t("contact_us")}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-gray-500 dark:text-zinc-400">
              {t("contact_desc")}
            </p>
          </div>

          {/* Contact Cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Phone Numbers */}
            <ContactCard icon={Phone} title={t("phone_numbers")}>
              {PHONE_NUMBERS.map((phone) => (
                <a
                  key={phone.tel}
                  href={`tel:${phone.tel}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-slate-700 dark:text-zinc-300 transition hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Phone className="size-4 shrink-0 text-blue-500" />
                  <span className="font-medium">{phone.display}</span>
                </a>
              ))}
            </ContactCard>

            {/* Email Addresses */}
            <ContactCard icon={Mail} title={t("email_addresses")}>
              {EMAILS.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-slate-700 dark:text-zinc-300 transition hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Mail className="size-4 shrink-0 text-blue-500" />
                  <span className="font-medium break-all">{email}</span>
                </a>
              ))}
            </ContactCard>
          </div>

          {/* Additional Info */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <ContactCard icon={MapPin} title={t("our_location")}>
              <p className="px-3 text-[13px] leading-relaxed text-gray-600 dark:text-zinc-400">
                {t("egypt_cairo_alex")}
              </p>
              <p className="px-3 text-[12px] text-gray-400 dark:text-zinc-500">
                {t("serving_patients_region")}
              </p>
            </ContactCard>

            <ContactCard icon={Clock} title={t("working_hours")}>
              <div className="space-y-1 px-3 text-[13px] text-gray-600 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span className="text-slate-700 dark:text-zinc-300 font-medium">{t("sunday_thursday")}</span>
                  <span>{t("nine_to_six")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 dark:text-zinc-300 font-medium">{t("friday_saturday")}</span>
                  <span className="text-gray-400 dark:text-zinc-500">{t("closed")}</span>
                </div>
              </div>
            </ContactCard>
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-2xl border border-blue-200 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/20 p-8 text-center shadow-sm backdrop-blur-sm">
            <h2 className="text-[18px] font-semibold text-slate-900 dark:text-white">
              {t("need_immediate_assistance")}
            </h2>
            <p className="mt-2 text-[13px] text-gray-600 dark:text-zinc-400">
              {t("immediate_assistance_desc")}
            </p>
            <a
              href={`tel:${PHONE_NUMBERS[0].tel}`}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 dark:bg-gradient-to-r dark:from-blue-600 dark:to-violet-600 px-6 text-[13px] font-medium text-white transition hover:bg-blue-700 dark:hover:from-blue-700 dark:hover:to-violet-700 dark:shadow-md dark:shadow-blue-500/10"
            >
              <Phone className="size-4" />
              {t("call_us_now")}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
