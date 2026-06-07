import { useState } from "react";
import { ArrowLeft, BookOpen, Type } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { libraryConditions } from "../data";
import { useTranslation } from "@/context/LanguageContext";

function LibraryCard({ condition, onOpen, t }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow md:grid-cols-[153px_1fr]"
    >
      {condition.image ? (
        <img
          src={condition.image}
          alt={condition.title}
          className="h-[100px] w-full rounded object-cover md:w-[153px]"
        />
      ) : (
        <PlaceholderImage className="h-[100px] w-full rounded md:w-[153px]" label={t("no_image")} />
      )}
      <div className="pt-4 md:pl-4 md:pt-0">
        <h2 className="text-[17px] font-medium text-slate-900">{condition.title || t("condition_unavailable")}</h2>
        <p className="mt-2 text-[13px] leading-snug text-gray-500">
          {t("description")}: {condition.description || t("no_description_available")}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-gray-500">
          {t("common_in")}: {condition.common || "N/A"}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-gray-500">
          {t("symptoms")}: {condition.symptoms || "N/A"}
        </p>
      </div>
    </button>
  );
}

function ConditionArticle({ article, onBack, t }) {
  return (
    <section className="mx-auto max-w-[720px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-[#111827] dark:border-zinc-800">
      {/* Header Back Button */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="size-4" />
          {t("back_to_library")}
        </button>
      </div>

      {/* Title */}
      <h1 className="text-[20px] font-bold text-slate-900 dark:text-white mb-4">{article.title}</h1>

      {/* Image Container */}
      <div className="mb-6 flex justify-center">
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            className="max-h-[340px] w-auto rounded-lg border border-gray-200 shadow-sm dark:border-zinc-800"
          />
        ) : (
          <PlaceholderImage className="h-[220px] w-full rounded-lg" label={t("no_image")} />
        )}
      </div>

      {/* Details Sections */}
      <div className="space-y-4 text-[13px] leading-relaxed text-slate-800 dark:text-zinc-300">
        {article.description && (
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <h3 className="font-semibold text-slate-950 dark:text-white text-[14px] mb-1">{t("definition")}</h3>
            <p>{article.description}</p>
          </div>
        )}
        {article.common && (
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <h3 className="font-semibold text-slate-950 dark:text-white text-[14px] mb-1">{t("common_in")}</h3>
            <p>{article.common}</p>
          </div>
        )}
        {article.symptoms && (
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <h3 className="font-semibold text-slate-950 dark:text-white text-[14px] mb-1">{t("symptoms")}</h3>
            <p>{article.symptoms}</p>
          </div>
        )}
        {article.content && (
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        )}
      </div>
    </section>
  );
}

export default function LibraryTab() {
  const { t } = useTranslation();
  const [article, setArticle] = useState(null);

  const getTranslatedCondition = (c) => {
    if (!c) return c;
    return {
      ...c,
      title: t(c.id + "_title"),
      description: t(c.id + "_desc"),
      common: t(c.id + "_common"),
      symptoms: t(c.id + "_symptoms")
    };
  };

  if (article) {
    return <ConditionArticle article={getTranslatedCondition(article)} onBack={() => setArticle(null)} t={t} />;
  }

  if (libraryConditions.length === 0) {
    return (
      <div className="mx-auto max-w-[520px]">
        <EmptyState
          title={t("no_library_content")}
          message={t("no_library_content_desc")}
          action={{ label: t("refresh"), onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[520px] space-y-4">
      <div className="flex items-center gap-2 text-slate-900">
        <BookOpen className="size-4" />
        <h1 className="text-[15px] font-medium">{t("skin_disease_library")}</h1>
      </div>
      {libraryConditions.map((condition) => (
        <LibraryCard key={condition.id} condition={getTranslatedCondition(condition)} onOpen={() => setArticle(condition)} t={t} />
      ))}
    </section>
  );
}
