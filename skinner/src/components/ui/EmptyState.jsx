import { Info } from "lucide-react";

export default function EmptyState({ icon = null, title = "Nothing to show", message = "No data is available right now.", action = null }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        {icon || <Info className="size-6" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {message && <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>}
      {action?.onClick && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-[#050316] px-4 text-sm font-medium text-white transition hover:bg-[#111026]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
