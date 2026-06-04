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
import { analysisApi } from "@/services/skinnerApi";
import { adaptAnalysis } from "@/services/apiAdapters";

export default function AnalysisTab({ onFindDoctors, analysis: propAnalysis, isLoading = false, errorMessage = "" }) {
  const [analysis, setAnalysis] = useState(propAnalysis);
  const [loading, setLoading] = useState(isLoading);
  const [loadError, setLoadError] = useState(errorMessage);

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
          <p className="text-[14px] font-medium text-gray-600">Loading analysis...</p>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-[640px] py-10">
        <EmptyState
          title="Unable to load analysis"
          message={loadError}
          action={{ label: "Retry", onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mx-auto max-w-[640px] py-10">
        <EmptyState
          title="No analysis available"
          message="Upload an image to generate a skin analysis or return after the backend has provided analysis data."
          action={{ label: "Retry", onClick: () => window.location.reload() }}
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
            <h2 className="text-[15px] font-medium">AI Analysis Results</h2>
          </div>
          <p className="mt-2 text-[12px] text-gray-500">
            Analysis completed {analysis?.createdAt ? `on ${new Date(analysis.createdAt).toLocaleString()}` : "on an unknown date"}
          </p>
        </div>
        <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
          AI-Powered
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <p className="text-[11px] leading-relaxed text-amber-900">
            <span className="font-semibold">Medical Disclaimer:</span> This AI
            analysis is for informational purposes only and should not replace
            professional medical advice. Please consult with a qualified
            healthcare provider for proper diagnosis and treatment.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_205px]">
        <div>
          <p className="mb-2 text-[11px] text-gray-500">Analyzed Image</p>
          {analysis?.localImageUrl || analysis?.imageUrl ? (
            <img
              src={analysis.localImageUrl || analysis.imageUrl}
              alt="Analyzed skin"
              className="h-[200px] w-full rounded-md object-contain bg-gray-900"
            />
          ) : (
            <PlaceholderImage className="h-[126px] w-full rounded-md" label="No image available" />
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] text-gray-500">Primary Detection</p>
          <div className="rounded-lg border border-gray-200 p-3">
            <h3 className="text-[13px] font-medium text-slate-900">
              {analysis?.condition || "Condition unavailable"}
            </h3>
            <span className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase font-medium ${
              analysis?.confidence >= 85 ? "bg-red-100 text-red-700" :
              analysis?.confidence >= 60 ? "bg-amber-100 text-amber-700" :
              "bg-green-100 text-green-700"
            }`}>
              {analysis?.confidence >= 85 ? "High" : analysis?.confidence >= 60 ? "Medium" : "Low"} Confidence
            </span>


            <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
              <span>Confidence Level</span>
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
            <p className="text-gray-500">Analysis Status</p>
            <p className="mt-1 flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="size-3.5" />
              Analysis Complete
            </p>
          </div>
        </div>
      </div>

      <div className="my-5 border-t border-gray-200" />

      {/* Description – always populated from DISEASE_INFO or the API */}
      <section>
        <div className="mb-2 flex items-center gap-2 text-slate-900">
          <Info className="size-4 text-blue-600" />
          <h3 className="text-[13px] font-medium">Description</h3>
        </div>
        <p className="text-[12px] leading-relaxed text-gray-600">
          {analysis?.description || "No description is available for this analysis."}
        </p>
      </section>

      <div className="my-5 border-t border-gray-200" />

      {/* AI Recommendations – medical advice for the detected condition */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-slate-900">
          <TrendingUp className="size-4 text-green-600" />
          <h3 className="text-[13px] font-medium">AI Recommendations</h3>
        </div>
        {analysis?.recommendations?.length > 0 ? (
          <ul className="space-y-2">
            {analysis.recommendations.map((item, idx) => (
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
            No specific recommendations available for this analysis. Please consult a dermatologist for personalized advice.
          </p>
        )}
      </section>

      <div className="my-5 border-t border-gray-200" />

      {/* Alternative Detections – other possibilities from the AI model, sorted by confidence */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-slate-900">
          <Layers className="size-4 text-purple-600" />
          <h3 className="text-[13px] font-medium">Alternative Detections</h3>
        </div>
        {validAlternatives.length > 0 ? (
          <div className="space-y-2">
            {validAlternatives.map((alt, idx) => {
              const conf = alt.confidence;
              const confLabel = conf >= 60 ? "High" : conf >= 30 ? "Medium" : "Low";
              const confColor = conf >= 60 ? "bg-red-100 text-red-700" : conf >= 30 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";

              return (
                <div key={idx} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[12px] font-medium text-slate-900">
                        {alt.label}
                      </p>
                      <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase ${confColor}`}>
                        {confLabel} Confidence
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-gray-500">
                      <p>Confidence</p>
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
              No significant alternative detections found.
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
              Next Step: Consult a Specialist
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-blue-700">
              Based on your analysis results, we recommend consulting with a
              dermatology specialist for a comprehensive evaluation and
              personalized treatment plan.
            </p>
            <button
              type="button"
              onClick={onFindDoctors}
              className="mt-3 inline-flex h-8 items-center gap-2 rounded-md bg-[#050316] px-4 text-[12px] font-medium text-white transition hover:bg-[#111026]"
            >
              <Stethoscope className="size-3.5" />
              Find Recommended Doctors
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

