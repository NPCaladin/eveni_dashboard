"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";
import { MentorReport } from "@/lib/types/mentor";
import { parseMentorReport } from "@/lib/utils/parse-mentor-report";
import { MentorSummaryCards } from "./mentor-summary-cards";
import { MentorDetailAccordion } from "./mentor-detail-accordion";

interface MentorSectionProps {
  reportId?: string;
}

export function MentorSection({ reportId }: MentorSectionProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<MentorReport[]>([]);

  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      return;
    }

    const loadMentorReports = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`🔍 멘토제 보고서 로드 시작`);
        console.log(`📋 report_id: ${reportId}`);

        const { data, error: fetchError } = await supabase
          .from("edu_mentoring_reports")
          .select("*")
          .eq("report_id", reportId)
          .order("mentor_name");

        if (fetchError) throw fetchError;

        console.log(`✓ 멘토제 보고서 로드: ${data?.length || 0}명`);
        if (data && data.length > 0) {
          console.log(`📊 첫 번째 멘토:`, data[0]);
        }
        setReports(data || []);
      } catch (err) {
        console.error("Error loading mentor reports:", err);
        setError(
          err instanceof Error
            ? err.message
            : "멘토제 데이터를 불러오는데 실패했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMentorReports();
  }, [reportId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (reports.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          멘토제 주간보고 데이터가 없습니다.
        </AlertDescription>
      </Alert>
    );
  }

  // 데이터 파싱
  const parsedReports = reports.map(parseMentorReport);

  console.log(`🔍 파싱된 보고서:`, parsedReports);
  if (parsedReports.length > 0) {
    console.log(`📊 첫 번째 파싱 결과:`, {
      mentorName: parsedReports[0].mentorName,
      menteeStatus: parsedReports[0].menteeStatus,
      issuesCount: parsedReports[0].issues.length,
      rawIssues: parsedReports[0].rawIssues,
      issues: parsedReports[0].issues,
    });
    console.log(`📝 원본 이슈 텍스트:`, reports[0].issues);
    console.log(`📝 파싱된 이슈 상세:`, JSON.stringify(parsedReports[0].issues, null, 2));
  }

  return (
    <div className="space-y-6">
      <MentorSummaryCards reports={parsedReports} />
      <MentorDetailAccordion reports={parsedReports} />
    </div>
  );
}

