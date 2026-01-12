"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

interface ReportNotesSectionProps {
  reportId?: string;
}

export function ReportNotesSection({ reportId }: ReportNotesSectionProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      return;
    }

    const loadReportNotes = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("edu_report_notes")
          .select("content")
          .eq("report_id", reportId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        setContent((data as any)?.content || "");
      } catch (err) {
        console.error("Error loading report notes:", err);
        setError(
          err instanceof Error
            ? err.message
            : "보고 사항을 불러오는데 실패했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReportNotes();
  }, [reportId]);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!content || content.trim() === "") {
    return (
      <Alert>
        <AlertDescription>
          보고 사항이 없습니다. 어드민에서 입력해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">주간 보고 내용</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="prose prose-sm max-w-none
            prose-headings:text-gray-900 
            prose-p:text-gray-700 
            prose-ul:text-gray-700
            prose-strong:text-gray-900
            prose-li:marker:text-blue-600"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </CardContent>
    </Card>
  );
}



