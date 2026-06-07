import { useEffect, useState, useCallback } from "react";
import AdminTabsSection from "./adminTabsSection";
import { AnalyticsCards } from "./analytics-cards";
import { adminApi, unwrapData } from "@/services/skinnerApi";

export default function AdminDashboardSection({ adminRole = "admin" }) {
  const [stats, setStats] = useState({
    totalUsers:      0,
    activeDoctors:   0,
    pendingApprovals: 0,
    totalAnalyses:   0,
  });

  const loadStats = useCallback(async () => {
    try {
      const response = await adminApi.stats();
      const data = unwrapData(response);
      if (data) {
        setStats({
          totalUsers:       data.totalUsers ?? 0,
          activeDoctors:    data.activeDoctors ?? 0,
          pendingApprovals: data.pendingApprovals ?? 0,
          totalAnalyses:    data.totalAnalyses ?? 0,
        });
      }
    } catch {
      // keep defaults on failure
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <section className="w-full py-16">
      <div className="mx-auto grid max-w-4xl gap-10 px-6 items-start grid-cols-1">
        <div className="space-y-4">
          <AnalyticsCards
            totalUsers={stats.totalUsers}
            activeDoctors={stats.activeDoctors}
            pendingApprovals={stats.pendingApprovals}
            totalAnalyses={stats.totalAnalyses}
          />
        </div>
        <div>
          <AdminTabsSection onRefreshStats={loadStats} adminRole={adminRole} />
        </div>
      </div>
    </section>
  );
}
