import { useState } from "react";
import { AnalyticsCards } from "./analytics-cards";
import DoctorTabsSection from "./doctorTabsSection";

export default function DoctorDashboardSection() {
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    pendingCount: 0,
    reviewedTodayCount: 0,
    totalPatients: 0,
  });

  return (
    <section className="w-full py-8 md:py-10">
      <div className="mx-auto grid max-w-[980px] gap-6 px-4 md:px-6">
        {showAnalytics && (
          <AnalyticsCards
            pendingCount={analyticsData.pendingCount}
            reviewedTodayCount={analyticsData.reviewedTodayCount}
            totalPatients={analyticsData.totalPatients}
          />
        )}
        <DoctorTabsSection
          onAnalyticsChange={setShowAnalytics}
          onAnalyticsData={setAnalyticsData}
        />
      </div>
    </section>
  );
}
