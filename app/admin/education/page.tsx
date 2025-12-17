"use client";

import { RevenueUploadForm } from "@/components/education/revenue-upload";
import { ReportNotes } from "@/components/education/report-notes";
import { MentoringLogForm } from "@/components/education/mentoring-log-form";
import { ConsultantResourceUpload } from "@/components/education/consultant-resource-upload";
import { ConsultantResourceManager } from "@/components/education/consultant-resource-manager";
import { RevenueBackfill } from "@/components/education/revenue-backfill";
import { RevenueHistory } from "@/components/education/revenue-history";
import { MigrationUpload } from "@/components/education/migration-upload";
import { DeleteWeekData } from "@/components/education/delete-week-data";

export default function EducationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">교육사업본부</h1>
        <p className="text-muted-foreground">
          주간 매출, 멘토링 이슈, 컨설턴트 리소스 현황을 입력하세요.
        </p>
      </div>

      <RevenueUploadForm />

      <DeleteWeekData />

      <RevenueBackfill />

      <MigrationUpload />

      <RevenueHistory />

      <MentoringLogForm />

      <ReportNotes />

      <ConsultantResourceUpload />
      
      <ConsultantResourceManager />
    </div>
  );
}



