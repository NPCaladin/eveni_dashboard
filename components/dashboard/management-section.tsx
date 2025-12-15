"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type MgmtReport = {
  id: string;
  report_id: string;
  category: string;
  content: string;
  note: string | null;
  is_completed: boolean;
  created_at: string;
};

interface ManagementSectionProps {
  mgmtReports: MgmtReport[];
  loading: boolean;
}

export function ManagementSection({
  mgmtReports,
  loading,
}: ManagementSectionProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // 부서별로 그룹화
  const reportsByCategory = mgmtReports.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category].push(report);
    return acc;
  }, {} as Record<string, MgmtReport[]>);

  // 주요 공지사항 (예: 지하철 파업 등) - note에 특정 키워드가 있으면 Alert로 표시
  const importantNotices = mgmtReports.filter(
    (r) => r.note && (r.note.includes("파업") || r.note.includes("공지") || r.note.includes("중요"))
  );

  return (
    <div className="space-y-4">
      {importantNotices.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>중요 공지</AlertTitle>
          <AlertDescription>
            {importantNotices.map((notice, idx) => (
              <div key={idx} className="mt-2">
                <strong>{notice.category}:</strong> {notice.note}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>경영혁신실 보고</CardTitle>
          <CardDescription>부서별 이슈 및 보고 사항</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={Object.keys(reportsByCategory)}>
            {Object.entries(reportsByCategory).map(([category, reports]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger value={category}>
                  {category} ({reports.length}건)
                </AccordionTrigger>
                <AccordionContent value={category}>
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="space-y-2 rounded-lg border p-4">
                        <div className="flex items-center gap-2">
                          {(report as any).is_completed && (
                            <span className="text-xs text-green-600">✓ 완료</span>
                          )}
                        </div>
                        <p className="text-sm">{report.content}</p>
                        {report.note && (
                          <p className="text-xs text-muted-foreground">비고: {report.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {mgmtReports.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">보고 사항이 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



