"use client";

import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { useMarketingData } from "@/hooks/use-marketing-data";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdOverviewSection } from "@/components/dashboard/marketing/ad-overview-section";
import { CostTrendSection } from "@/components/dashboard/marketing/cost-trend-section";
import { DbCountTrendSection } from "@/components/dashboard/marketing/db-count-trend-section";
import { MarketingNotesSection } from "@/components/dashboard/marketing/notes-section";

export default function MarketingDashboardPage() {
  const { reportId, currentReport } = useWeeklyReport();
  const {
    loading,
    error,
    adOverviewData,
    adOverviewNotes,
    costTrendData,
    dbCountTrendData,
    reportNotes,
  } = useMarketingData(reportId, currentReport);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-slate-900">마케팅 본부</h1>
                  <p className="text-slate-600">광고 성과 및 비용 추이 분석</p>
                </div>

                {/* 1. 광고비 데이터 - 개요 */}
                <section>
                  <h2 className="text-2xl font-bold mb-6 text-slate-800">
                    📊 광고비 데이터 - 개요
                  </h2>
                  <AdOverviewSection data={adOverviewData} notes={adOverviewNotes} />
                </section>

                {/* 2. 비용 추이 */}
                <section>
                  <h2 className="text-2xl font-bold mb-6 text-slate-800">
                    💰 비용 추이
                  </h2>
                  <CostTrendSection data={costTrendData} />
                </section>

                {/* 3. DB개수 추이 */}
                <section>
                  <h2 className="text-2xl font-bold mb-6 text-slate-800">
                    📈 DB개수 추이
                  </h2>
                  <DbCountTrendSection data={dbCountTrendData} />
                </section>

                {/* 4. 기타 보고 사항 */}
                <section>
                  <h2 className="text-2xl font-bold mb-6 text-slate-800">
                    📝 기타 보고 사항
                  </h2>
                  <MarketingNotesSection content={reportNotes} />
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

