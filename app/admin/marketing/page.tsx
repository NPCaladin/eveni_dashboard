"use client";

import { MetricForm } from "@/components/marketing/metric-form";
import { MiscReportForm } from "@/components/marketing/misc-report-form";

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">마케팅사업본부</h1>
        <p className="text-muted-foreground">
          광고 성과 및 기타 보고 사항을 입력하세요.
        </p>
      </div>

      <MetricForm />

      <MiscReportForm />
    </div>
  );
}


