"use client";

import { useState } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { useMarketingData } from "@/hooks/use-marketing-data";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GlobalPeriodFilter, type PeriodType } from "@/components/dashboard/marketing/global-period-filter";
import { WeeklySummarySection } from "@/components/dashboard/marketing/weekly-summary-section";
import { CostTrendSection } from "@/components/dashboard/marketing/cost-trend-section";
import { DbCountTrendSection } from "@/components/dashboard/marketing/db-count-trend-section";
import { ConversionTrendSection } from "@/components/dashboard/marketing/conversion-trend-section";
import { CpaTrendChart } from "@/components/dashboard/marketing/cpa-trend-chart";
import { CostTrendChart } from "@/components/dashboard/marketing/cost-trend-chart";
import { DbVolumeTrendChart } from "@/components/dashboard/marketing/db-volume-trend-chart";
import { PaymentConversionTrendChart } from "@/components/dashboard/marketing/payment-conversion-trend-chart";
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
    conversionTrendData,
    kpiData,
  } = useMarketingData(reportId, currentReport);

  // 전역 기간 필터 상태
  const [period, setPeriod] = useState<PeriodType>("3months");

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
                {/* 페이지 헤더 */}
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-slate-900">마케팅 본부</h1>
                  <p className="text-slate-600">주간 마케팅 성과 리포트</p>
                </div>

                {/* ========================================= */}
                {/* Section A: 상단 - 주간 성과 상세 보고    */}
                {/* ========================================= */}
                <section className="space-y-8">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-900">
                      📊 주간 성과 상세 보고
                    </h2>
                    <p className="text-sm text-slate-600">
                      최근 3주간 데이터 비교 분석
                    </p>
                  </div>

                  {/* KPI Summary Cards */}
                  <WeeklySummarySection
                    kpiData={kpiData}
                    adOverviewData={adOverviewData}
                    adOverviewNotes={adOverviewNotes}
                  />

                  {/* 비용 추이 (최근 3주) */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-slate-800">
                      💰 비용 추이
                    </h3>
                    <CostTrendSection data={costTrendData} />
                  </div>

                  {/* DB개수 추이 (최근 3주) */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-slate-800">
                      📈 DB개수 추이
                    </h3>
                    <DbCountTrendSection data={dbCountTrendData} />
                  </div>
                </section>

                {/* ========================================= */}
                {/* 굵은 구분선                              */}
                {/* ========================================= */}
                <hr className="border-t-4 border-slate-400" />

                {/* ========================================= */}
                {/* Section B: 하단 - 장기 추세 심층 분석    */}
                {/* ========================================= */}
                <section className="space-y-10">
                  {/* 섹션 제목 + 기간 필터 */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-slate-900">
                        📈 장기 추세 심층 분석
                      </h2>
                      <p className="text-sm text-slate-600">
                        기간별 성과 변화 추이를 확인하세요 (2025년 전체 데이터)
                      </p>
                    </div>
                    <GlobalPeriodFilter period={period} onPeriodChange={setPeriod} />
                  </div>

                  {/* 1번째 줄 (Full Width): 매체별 전환율 추이 */}
                  <div>
                    <ConversionTrendSection data={conversionTrendData} period={period} />
                  </div>

                  {/* 2번째 줄 (Full Width): 주차별 CPA 추이 */}
                  <div>
                    <CpaTrendChart data={conversionTrendData} period={period} />
                  </div>

                  {/* 3번째 줄 (Half & Half): 비용 집행 추이 (좌) + DB 유입 추이 (우) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CostTrendChart data={conversionTrendData} period={period} />
                    <DbVolumeTrendChart data={conversionTrendData} period={period} />
                  </div>

                  {/* 4번째 줄 (Full Width): DB 유형별 결제 전환율 추이 */}
                  <div>
                    <PaymentConversionTrendChart data={conversionTrendData} period={period} />
                  </div>
                </section>

                {/* 구분선 */}
                <div className="border-t-2 border-slate-300"></div>

                {/* 기타 보고 사항 */}
                <section className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-900">
                      📝 기타 보고 사항
                    </h2>
                    <p className="text-sm text-slate-600">
                      주요 이슈 및 액션 아이템을 기록하세요
                    </p>
                  </div>
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

