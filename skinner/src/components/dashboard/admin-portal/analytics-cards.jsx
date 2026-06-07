import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Clock, UserCheck, Users, Activity } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function AnalyticsCards({ totalUsers = 0, activeDoctors = 0, pendingApprovals = 0, totalAnalyses = 0 }) {
  const { t } = useTranslation();

  return (
    <div className="grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4 bg-transparent font-sans">
      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black">{t("total_users")}</span>
            <Users className="size-4 text-[#155DFC]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal">{totalUsers.toLocaleString()}</p>
            <p className="text-sm font-normal text-[#4A5565] dark:text-zinc-400">
              {totalUsers === 0 ? t("no_users_yet") : t("registered_users")}
            </p>
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black">{t("active_doctors")}</span>
            <UserCheck className="size-4 text-[#00A63E]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal">{activeDoctors.toLocaleString()}</p>
            <p className="text-sm font-normal text-[#4A5565] dark:text-zinc-400">
              {activeDoctors === 0 ? t("no_active_doctors") : t("verified_professionals")}
            </p>
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black">{t("pending_approvals")}</span>
            <Clock className="size-4 text-[#F54900]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal">{pendingApprovals.toLocaleString()}</p>
            <p className="text-sm font-normal text-[#4A5565] dark:text-zinc-400">
              {pendingApprovals === 0 ? t("none_pending") : t("require_verification")}
            </p>
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black">{t("ai_analyses")}</span>
            <Activity className="size-4 text-[#9810FA]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal">{totalAnalyses.toLocaleString()}</p>
            <p className="text-sm font-normal text-[#4A5565] dark:text-zinc-400">
              {totalAnalyses === 0 ? t("no_analyses_recorded") : t("total_analyses_performed")}
            </p>
          </CardTitle>
        </CardContent>
      </Card>
    </div>
  );
}
