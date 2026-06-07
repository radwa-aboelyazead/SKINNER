import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Users, Info, FileText } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function AnalyticsCards({ pendingCount = 0, reviewedTodayCount = 0, totalPatients = 0 }) {
  const { t } = useTranslation();

  return (
    <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4 bg-transparent">
      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black dark:text-zinc-200">{t("pending_reviews")}</span>
            <Info className="size-4 text-[#F54900]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal dark:text-white">{pendingCount}</p>
            <p className="text-sm font-normal text-[#4A5565] dark:text-zinc-400">
              {t("cases_awaiting_review")}
            </p>
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black dark:text-zinc-200">{t("finished_cases")}</span>
            <FileText className="size-4 text-[#00A63E]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal dark:text-white">{reviewedTodayCount}</p>
            <p className="text-sm font-normal text-[#4A5565] dark:text-zinc-400">
              {t("cases_completed")}
            </p>
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black dark:text-zinc-200">{t("total_patients")}</span>
            <Users className="size-4 text-[#155DFC]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal dark:text-white">{totalPatients.toLocaleString()}</p>
            <p className="text-sm font-normal text-[#4A5565] dark:text-zinc-400">
              {totalPatients === 0 ? t("no_patients_yet") : t("total_patients_served")}
            </p>
          </CardTitle>
        </CardContent>
      </Card>
    </div>
  );
}
