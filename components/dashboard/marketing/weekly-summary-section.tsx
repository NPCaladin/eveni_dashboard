"use client";

import { KpiSummaryCards } from "./kpi-summary-cards";
import { AdOverviewSection } from "./ad-overview-section";
import type { AdOverviewData } from "@/lib/types/dashboard";

interface WeeklySummarySectionProps {
  kpiData: {
    totalSpend: number;
    totalDb: number;
    avgCpa: number;
    conversionRate: number;
    prevWeek: {
      totalSpend: number;
      totalDb: number;
      avgCpa: number;
      conversionRate: number;
    };
  };
  adOverviewData: AdOverviewData[];
  adOverviewNotes: string;
}

export function WeeklySummarySection({
  kpiData,
  adOverviewData,
  adOverviewNotes,
}: WeeklySummarySectionProps) {
  return (
    <section className="bg-slate-50 -mx-6 px-6 py-8 rounded-lg border border-slate-200">
      <div className="space-y-6">
        {/* 섹션 제목 */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">
            📊 주간 마케팅 핵심 요약
          </h2>
          <p className="text-sm text-slate-600">
            이번 주의 핵심 성과를 한눈에 파악하세요
          </p>
        </div>

        {/* KPI 카드 */}
        <KpiSummaryCards data={kpiData} />

        {/* 상세 테이블 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-800">
            매체별 상세 데이터
          </h3>
          <AdOverviewSection data={adOverviewData} notes={adOverviewNotes} />
        </div>
      </div>
    </section>
  );
}

