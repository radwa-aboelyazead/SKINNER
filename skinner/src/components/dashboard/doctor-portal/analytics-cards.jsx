import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Users, Info, FileText } from "lucide-react";

export function AnalyticsCards({ pendingCount = 0, reviewedTodayCount = 0, totalPatients = 0 }) {
  return (
    <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4 bg-transparent">
      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black">Pending Reviews</span>
            <Info className="size-4 text-[#F54900]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal">{pendingCount}</p>
            <p className="text-sm font-normal text-[#4A5565]">
              {pendingCount === 1 ? "Case awaiting review" : "Cases awaiting review"}
            </p>
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black">Reviewed Today</span>
            <FileText className="size-4 text-[#00A63E]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal">{reviewedTodayCount}</p>
            <p className="text-sm font-normal text-[#4A5565]">
              {reviewedTodayCount === 1 ? "Case completed" : "Cases completed"}
            </p>
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black">Total Patients</span>
            <Users className="size-4 text-[#155DFC]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal">{totalPatients.toLocaleString()}</p>
            <p className="text-sm font-normal text-[#4A5565]">
              {totalPatients === 0 ? "No patients yet" : "Total patients served"}
            </p>
          </CardTitle>
        </CardContent>
      </Card>
    </div>
  );
}
