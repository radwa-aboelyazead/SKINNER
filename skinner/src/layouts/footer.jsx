import { useTranslation } from "../context/LanguageContext";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#0f172a] py-7">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-[14px] leading-6 text-gray-600">
          <span className="font-semibold text-gray-700">{t("medical_disclaimer_title")}</span>{" "}
          {t("medical_disclaimer_desc")}
        </p>

        <p className="mt-3 text-[14px] leading-6 text-gray-600">
          {t("medical_disclaimer_advice")}
        </p>

        <p className="mt-3 text-[12px] text-gray-400">
          {t("footer_copyright")}
        </p>
      </div>
    </footer>
  );
}