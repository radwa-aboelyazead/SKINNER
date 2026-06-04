import { useState } from "react";
import { ArrowLeft, BookOpen, Type } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { libraryConditions } from "../data";

function LibraryCard({ condition, onOpen }) {
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
        <PlaceholderImage className="h-[100px] w-full rounded md:w-[153px]" label="No image available" />
      )}
      <div className="pt-4 md:pl-4 md:pt-0">
        <h2 className="text-[17px] font-medium text-slate-900">{condition.title || "Condition details"}</h2>
        <p className="mt-2 text-[13px] leading-snug text-gray-500">
          Description: {condition.description || "No description available."}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-gray-500">
          Common in: {condition.common || "N/A"}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-gray-500">
          Symptoms: {condition.symptoms || "N/A"}
        </p>
      </div>
    </button>
  );
}

function ConditionArticle({ article, onBack }) {
  return (
    <section className="mx-auto max-w-[720px] rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="mx-4 mt-4 inline-flex items-center gap-2 text-[12px] text-slate-900"
      >
        <ArrowLeft className="size-3.5" />
        Back to Library
      </button>

      <div className="p-6 pt-4">
        {article.image ? (
          <img src={article.image} alt={article.title} className="h-[220px] w-full rounded-sm object-cover" />
        ) : (
          <PlaceholderImage className="h-[220px] w-full rounded-sm" label="No image available" />
        )}

        <div className="relative -mt-[60px] mx-auto max-w-[680px] rounded-md bg-white p-6 shadow-md border border-gray-100">
          <h1 className="text-[22px] font-semibold text-slate-900">{article.title}</h1>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-blue-500 text-white">
              <Type className="size-4" />
            </span>
            <span className="text-[15px] font-semibold text-slate-900">View</span>
          </div>

          <div className="mt-4 rounded-md border-2 border-blue-500 p-4 text-[13px] leading-relaxed text-slate-900 space-y-3">
            {article.description && (
              <>
                <p className="font-semibold">Definition</p>
                <p>{article.description}</p>
              </>
            )}
            {article.common && (
              <>
                <p className="font-semibold">Common in</p>
                <p>{article.common}</p>
              </>
            )}
            {article.symptoms && (
              <>
                <p className="font-semibold">Symptoms</p>
                <p>{article.symptoms}</p>
              </>
            )}
            {article.content && <div dangerouslySetInnerHTML={{ __html: article.content }} />}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LibraryTab() {
  const [article, setArticle] = useState(null);

  if (article) {
    return <ConditionArticle article={article} onBack={() => setArticle(null)} />;
  }

  if (libraryConditions.length === 0) {
    return (
      <div className="mx-auto max-w-[520px]">
        <EmptyState
          title="No library content available"
          message="The skin disease library is currently empty because no backend data is available."
          action={{ label: "Refresh", onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[520px] space-y-4">
      <div className="flex items-center gap-2 text-slate-900">
        <BookOpen className="size-4" />
        <h1 className="text-[15px] font-medium">Skin Disease Library</h1>
      </div>
      {libraryConditions.map((condition) => (
        <LibraryCard key={condition.id} condition={condition} onOpen={() => setArticle(condition)} />
      ))}
    </section>
  );
}
