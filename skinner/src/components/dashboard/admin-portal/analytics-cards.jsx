import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Clock, UserCheck, Users, Activity } from "lucide-react";

export function AnalyticsCards({ totalUsers = 0, activeDoctors = 0, pendingApprovals = 0, totalAnalyses = 0 }) {
  return (
    <div className="grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4 bg-transparent">
      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black">Total Users</span>
            <Users className="size-4 text-[#155DFC]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal">{totalUsers.toLocaleString()}</p>
            <p className="text-sm font-normal text-[#4A5565]">
              {totalUsers === 0 ? "No users yet" : "Registered users"}
            </p>
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black">Active Doctors</span>
            <UserCheck className="size-4 text-[#00A63E]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal">{activeDoctors.toLocaleString()}</p>
            <p className="text-sm font-normal text-[#4A5565]">
              {activeDoctors === 0 ? "No active doctors" : "Verified professionals"}
            </p>
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black">Pending Approvals</span>
            <Clock className="size-4 text-[#F54900]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal">{pendingApprovals.toLocaleString()}</p>
            <p className="text-sm font-normal text-[#4A5565]">
              {pendingApprovals === 0 ? "None pending" : "Require verification"}
            </p>
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardContent className="flex flex-col items-start justify-between gap-4 w-full h-full">
          <CardDescription className="flex justify-between items-center gap-2 w-full">
            <span className="text-black">AI Analyses</span>
            <Activity className="size-4 text-[#9810FA]" />
          </CardDescription>
          <CardTitle>
            <p className="text-2xl font-normal">{totalAnalyses.toLocaleString()}</p>
            <p className="text-sm font-normal text-[#4A5565]">
              {totalAnalyses === 0 ? "No analyses yet" : "Total analyses performed"}
            </p>
          </CardTitle>
        </CardContent>
      </Card>
    </div>
  );
}
