import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Info,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Loader2,
  Layers,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { useTranslation } from "@/context/LanguageContext";

export default function AnalysisTab({ onFindDoctors, onStartAnalysis, analysis: propAnalysis, isLoading = false, errorMessage = "" }) {
  const { t } = useTranslation();
  const [analysis, setAnalysis] = useState(propAnalysis);
  const [loading, setLoading] = useState(isLoading);
  const [loadError, setLoadError] = useState(errorMessage);

  // Map DISEASE_INFO keys → translation key prefix (lowercase, no separators)
  const conditionKeyMap = {
    moles: "moles", acne: "acne", actinic_keratosis: "actinic_keratosis",
    bullous: "bullous", drugeruption: "drugeruption", eczema: "eczema",
    lichen: "lichen", lupus: "lupus", rosacea: "rosacea",
    seborrh_keratoses: "seborrh_keratoses", skincancer: "skincancer",
    tinea: "tinea", unknown_normal: "unknown_normal", vasculitis: "vasculitis",
    vitiligo: "vitiligo", warts: "warts",
  };

  const normalizeConditionKey = (condition) => {
    if (!condition) return null;
    const lower = String(condition).toLowerCase().replace(/[\s_-]+/g, "");
    for (const [key, prefix] of Object.entries(conditionKeyMap)) {
      if (lower === key.replace(/[\s_-]+/g, "") || lower.includes(key.replace(/[\s_-]+/g, ""))) {
        return prefix;
      }
    }
    return null;
  };

  const getConditionLabel = (condition) => {
    if (!condition) return t("condition_unavailable");
    const prefix = normalizeConditionKey(condition);
    if (prefix) {
      const translated = t(`${prefix}_title`);
      if (translated !== `${prefix}_title`) return translated;
    }
    return condition;
  };

  const getTranslatedDescription = (condition, fallback) => {
    const prefix = normalizeConditionKey(condition);
    if (prefix) {
      const translated = t(`${prefix}_description`);
      if (translated !== `${prefix}_description`) return translated;
    }
    return fallback || t("no_description_available");
  };

  const getTranslatedRecommendations = (condition, fallbackRecs = []) => {
    const prefix = normalizeConditionKey(condition);
    if (prefix) {
      const recs = [];
      for (let i = 1; i <= 5; i++) {
        const key = `${prefix}_rec_${i}`;
        const translated = t(key);
        if (translated !== key) recs.push(translated);
      }
      if (recs.length > 0) return recs;
    }
    return fallbackRecs;
  };

  useEffect(() => {
    setAnalysis(propAnalysis);
  }, [propAnalysis]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    setLoadError(errorMessage);
  }, [errorMessage]);

  if (loading) {
    return (
      <section className="mx-auto flex max-w-[640px] items-center justify-center rounded-xl border border-gray-200 bg-white p-16 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-[#050316]" />
          <p className="text-[14px] font-medium text-gray-600">{t("loading_analysis")}</p>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-[640px] py-10">
        <EmptyState
          title={t("unable_to_load_analysis")}
          message={loadError}
          action={{ label: t("retry"), onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mx-auto max-w-[640px] py-10">
        <EmptyState
          title={t("no_analysis_available")}
          message={t("upload_to_receive_ai")}
          action={{ label: t("start_analysis"), onClick: onStartAnalysis }}
        />
      </div>
    );
  }

  // Filter alternatives: exclude the primary detection, only confidence > 0, sorted highest first
  const primaryCondition = analysis?.condition?.toLowerCase?.() || "";
  const validAlternatives = (analysis?.alternatives || []).filter(
    (alt) => alt.label && alt.confidence != null && alt.confidence > 0
      && alt.label.toLowerCase() !== primaryCondition
  );

  return (
    <section className="mx-auto max-w-[640px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-900">
            <FileText className="size-4" />
            <h2 className="text-[15px] font-medium">{t("ai_analysis_results")}</h2>
          </div>
          <p className="mt-2 text-[12px] text-gray-500">
            {analysis?.createdAt
              ? `${t("analysis_completed_on")} ${new Date(analysis.createdAt).toLocaleString()}`
              : `${t("analysis_completed_on")} ${t("analysis_completed_unknown")}`}
          </p>
        </div>
        <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
          {t("ai_powered")}
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <p className="text-[11px] leading-relaxed text-amber-900">
            <span className="font-semibold">{t("medical_disclaimer_capital")}</span> {t("medical_disclaimer_detailed")}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_205px]">
        <div>
          <p className="mb-2 text-[11px] text-gray-500">{t("analyzed_image")}</p>
          {analysis?.localImageUrl || analysis?.imageUrl ? (
            <img
              src={analysis.localImageUrl || analysis.imageUrl}
              alt="Analyzed skin"
              className="h-[200px] w-full rounded-md object-contain bg-gray-900"
            />
          ) : (
            <PlaceholderImage className="h-[126px] w-full rounded-md" label={t("no_image_available")} />
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] text-gray-500">{t("primary_detection")}</p>
          <div className="rounded-lg border border-gray-200 p-3">
            <h3 className="text-[13px] font-medium text-slate-900">
              {getConditionLabel(analysis?.condition)}
            </h3>
            <span className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase font-medium ${
              analysis?.confidence >= 85 ? "bg-red-100 text-red-700" :
              analysis?.confidence >= 60 ? "bg-amber-100 text-amber-700" :
              "bg-green-100 text-green-700"
            }`}>
              {analysis?.confidence >= 85 ? t("high") : analysis?.confidence >= 60 ? t("medium") : t("low")} {t("confidence_suffix")}
            </span>


            <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
              <span>{t("confidence_score")}</span>
              <span>{analysis?.confidence != null ? `${analysis.confidence}%` : "N/A"}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-[#050316]"
                style={{ width: analysis?.confidence != null ? `${analysis.confidence}%` : "0%" }}
              />
            </div>
          </div>

          <div className="mt-4 text-[11px]">
            <p className="text-gray-500">{t("analysis_status")}</p>
            <p className="mt-1 flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="size-3.5" />
              {t("analysis_complete")}
            </p>
          </div>
        </div>
      </div>

      <div className="my-5 border-t border-gray-200" />

      {/* Description – always populated from DISEASE_INFO or the API */}
      <section>
        <div className="mb-2 flex items-center gap-2 text-slate-900">
          <Info className="size-4 text-blue-600" />
          <h3 className="text-[13px] font-medium">{t("description")}</h3>
        </div>
        <p className="text-[12px] leading-relaxed text-gray-600">
          {getTranslatedDescription(analysis?.condition, analysis?.description)}
        </p>
      </section>

      <div className="my-5 border-t border-gray-200" />

      {/* AI Recommendations – medical advice for the detected condition */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-slate-900">
          <TrendingUp className="size-4 text-green-600" />
          <h3 className="text-[13px] font-medium">{t("ai_recommendations")}</h3>
        </div>
        {(() => {
          const recs = getTranslatedRecommendations(analysis?.condition, analysis?.recommendations);
          return recs.length > 0 ? (
            <ul className="space-y-2">
              {recs.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-[12px] leading-snug text-gray-600"
                >
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-gray-500">
              {t("no_recommendations_available")}
            </p>
          );
        })()}
      </section>

      <div className="my-5 border-t border-gray-200" />

      {/* Alternative Detections – other possibilities from the AI model, sorted by confidence */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-slate-900">
          <Layers className="size-4 text-purple-600" />
          <h3 className="text-[13px] font-medium">{t("alternative_detections")}</h3>
        </div>
        {validAlternatives.length > 0 ? (
          <div className="space-y-2">
            {validAlternatives.map((alt, idx) => {
              const conf = alt.confidence;
              const confLabel = conf >= 60 ? t("high") : conf >= 30 ? t("medium") : t("low");
              const confColor = conf >= 60 ? "bg-red-100 text-red-700" : conf >= 30 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";

              return (
                <div key={idx} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[12px] font-medium text-slate-900">
                        {getConditionLabel(alt.label)}
                      </p>
                      <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase ${confColor}`}>
                        {confLabel} {t("confidence_suffix")}
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-gray-500">
                      <p>{t("confidence_suffix")}</p>
                      <p className="mt-1 text-slate-900">{conf}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-center text-[12px] text-gray-500">
              {t("no_alternative_detections")}
            </p>
          </div>
        )}
      </section>

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Sparkles className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-blue-900">
              {t("next_step_consult")}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-blue-700">
              {t("consult_recommendation")}
            </p>
            <button
              type="button"
              onClick={onFindDoctors}
              className="mt-3 inline-flex h-8 items-center gap-2 rounded-md bg-[#050316] px-4 text-[12px] font-medium text-white transition hover:bg-[#111026]"
            >
              <Stethoscope className="size-3.5" />
              {t("find_recommended_doctors")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

