"use client";

import { AdOverviewForm } from "@/components/marketing/ad-overview-form";
import { AdOverviewNotesForm } from "@/components/marketing/ad-overview-notes-form";
import { TrendDataForm } from "@/components/marketing/trend-data-form";
import { MarketingReportNotes } from "@/components/marketing/report-notes-form";

export default function MarketingAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">마케팅 본부</h1>
        <p className="text-muted-foreground">
          주간 광고 데이터, 비용/DB 추이, 보고사항을 입력하세요.
        </p>
      </div>

      {/* 1. 광고비 데이터 - 개요 */}
      <AdOverviewForm />

      {/* 1-1. 광고 현황 인사이트 */}
      <AdOverviewNotesForm />

      {/* 2. 비용 추이 & 3. DB개수 추이 */}
      <TrendDataForm />

      {/* 4. 기타 보고 사항 */}
      <MarketingReportNotes />
    </div>
  );
}
