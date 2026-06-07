import { useEffect, useState } from "react";
import { FileText, ChevronRight } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { analysisApi, unwrapData } from "@/services/skinnerApi";
import { adaptAnalysis, toArray, extractId } from "@/services/apiAdapters";
import { useTranslation } from "@/context/LanguageContext";

function badgeClass(confidenceLevel = "") {
	const n = String(confidenceLevel).toLowerCase();
	if (n.includes("high")) return "bg-red-100 text-red-700";
	if (n.includes("medium")) return "bg-amber-100 text-amber-700";
	return "bg-green-100 text-green-700";
}

export default function PreviousAnalysesCard({ onSelect, reloadSignal }) {
	const { t } = useTranslation();
	const [items, setItems] = useState([]);
	const [allItems, setAllItems] = useState([]);
	const [status, setStatus] = useState("");
	const [isOpen, setIsOpen] = useState(false);

	const getConditionLabel = (condition) => {
		if (!condition) return t("unknown_condition");
		const key = `${String(condition).toLowerCase().replace(/[\s_-]+/g, "")}_title`;
		// Try exact match first
		const translated = t(key);
		if (translated !== key) return translated;
		// Try includes-based match for compound names
		const lower = String(condition).toLowerCase();
		const prefixes = ["moles","acne","actinic_keratosis","bullous","drugeruption","eczema","lichen","lupus","rosacea","seborrh_keratoses","skincancer","tinea","unknown_normal","vasculitis","vitiligo","warts"];
		for (const p of prefixes) {
			if (lower.includes(p.replace(/_/g, ""))) {
				const t2 = t(`${p}_title`);
				if (t2 !== `${p}_title`) return t2;
			}
		}
		return condition;
	};

	useEffect(() => {
		let alive = true;
		async function loadHistory() {
			try {
				const response = await analysisApi.history();
				const history = toArray(unwrapData(response)).map((item) => {
					const a = adaptAnalysis(item);
					return {
						id: a.id,
						raw: a.raw,
						condition: a.condition,
						confidenceLevel: a.confidenceLevel || "Low",
						badgeClass: badgeClass(a.confidenceLevel || "Low"),
						imageUrl: a.imageUrl,
					};
				});
				if (alive) {
					setAllItems(history);
					setItems(history.slice(0, 5));
					setStatus(history.length ? t("loaded_from_api") : t("no_analyses_found"));
				}
			} catch (err) {
				if (alive) {
					setAllItems([]);
					setItems([]);
					setStatus(t("could_not_load_analyses"));
				}
			}
		}
		loadHistory();
		return () => {
			alive = false;
		};
	}, [reloadSignal, t]);

	return (
		<aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<div className="mb-5 flex items-center justify-between gap-2 text-slate-900">
				<div className="flex items-center gap-2">
					<FileText className="size-4" />
					<h3 className="text-[15px] font-medium">{t("previous_analyses")}</h3>
				</div>
				{status && <span className="text-[10px] text-gray-400">{status}</span>}
			</div>
			{items.length === 0 ? (
				<EmptyState
					title={t("no_previous_analyses")}
					message={t("no_analyses_desc")}
					action={{ label: t("refresh"), onClick: () => window.location.reload() }}
				/>
			) : (
				<div className="space-y-3">
					{items.map((item) => (
						<button
							key={`${item.condition}-${item.date}-${item.id}`}
							onClick={() => {
								const selectedId = item.id || extractId(item) || item.raw?.analysis_id || item.raw?.id || item.raw?._id || "";
								if (!selectedId) {
									return;
								}
								onSelect?.(selectedId);
							}}
							className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
						>
							{item.imageUrl ? (
								<img src={item.imageUrl} alt="Previous analysis thumbnail" className="h-[50px] w-[58px] rounded object-cover" />
							) : (
								<PlaceholderImage className="h-[50px] w-[58px] rounded" label={t("no_image")} />
							)}
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13px] font-medium text-slate-900">{getConditionLabel(item.condition)}</p>
								<span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] ${item.badgeClass || badgeClass(item.confidenceLevel)}`}>
									{t(item.confidenceLevel.toLowerCase())} {t("confidence_suffix")}
								</span>
							</div>
							<ChevronRight className="size-4 shrink-0 text-gray-400" />
						</button>
					))}

					{allItems.length > 5 && (
						<button
							onClick={() => setIsOpen(true)}
							className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-blue-200 bg-blue-50/10 py-2.5 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50/40"
						>
							{t("see_more")} ({allItems.length - 5} {t("more")})
						</button>
					)}
				</div>
			)}

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-h-[85vh] sm:max-w-md flex flex-col p-6 overflow-hidden">
					<DialogHeader className="mb-4">
						<DialogTitle className="text-lg font-semibold flex items-center gap-2 text-slate-900">
							<FileText className="size-5 text-blue-600" />
							{t("all_analyses")}
						</DialogTitle>
					</DialogHeader>
					<div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[60vh] scrollbar-thin">
						{allItems.map((item) => (
							<button
								key={`all-${item.condition}-${item.date}-${item.id}`}
								onClick={() => {
									const selectedId = item.id || extractId(item) || item.raw?.analysis_id || item.raw?.id || item.raw?._id || "";
									if (!selectedId) {
										return;
									}
									onSelect?.(selectedId);
									setIsOpen(false);
								}}
								className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
							>
								{item.imageUrl ? (
									<img src={item.imageUrl} alt="Previous analysis thumbnail" className="h-[50px] w-[58px] rounded object-cover" />
								) : (
									<PlaceholderImage className="h-[50px] w-[58px] rounded" label={t("no_image")} />
								)}
								<div className="min-w-0 flex-1">
									<p className="truncate text-[13px] font-medium text-slate-900">{getConditionLabel(item.condition)}</p>
									<span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] ${item.badgeClass || badgeClass(item.confidenceLevel)}`}>
										{t(item.confidenceLevel.toLowerCase())} {t("confidence_suffix")}
									</span>
								</div>
								<ChevronRight className="size-4 shrink-0 text-gray-400" />
							</button>
						))}
					</div>
				</DialogContent>
			</Dialog>
		</aside>
	);
}
