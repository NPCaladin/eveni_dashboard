"use client";

import { useState, useEffect } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

export function DeleteWeekData() {
  const { reportId, currentReport } = useWeeklyReport();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [dataCount, setDataCount] = useState<number | null>(null);

  // reportId가 변경될 때마다 데이터 개수 조회
  useEffect(() => {
    const checkDataCount = async () => {
      if (!reportId) {
        setDataCount(null);
        return;
      }

      try {
        const { count } = await supabase
          .from("sales_transactions")
          .select("*", { count: "exact", head: true })
          .eq("report_id", reportId);

        setDataCount(count || 0);
      } catch (error) {
        console.error("데이터 개수 조회 실패:", error);
        setDataCount(0);
      }
    };

    checkDataCount();
  }, [reportId]);

  const handleDelete = async () => {
    if (!reportId) {
      toast({
        title: "주차 미선택",
        description: "삭제할 주차를 먼저 선택하세요.",
        variant: "destructive",
      });
      return;
    }

    // 데이터가 없으면 알림
    if (dataCount === 0) {
      toast({
        title: "삭제할 데이터 없음",
        description: "입력된 데이터가 없습니다.",
      });
      return;
    }

    setDeleting(true);

    try {
      let totalDeleted = 0;

      // sales_transactions 삭제
      const { count: salesCount, error: salesError } = await supabase
        .from("sales_transactions")
        .delete({ count: "exact" })
        .eq("report_id", reportId);

      if (salesError) throw salesError;
      totalDeleted += salesCount || 0;

      // edu_revenue_stats 삭제
      const { error: revenueError } = await supabase
        .from("edu_revenue_stats")
        .delete()
        .eq("report_id", reportId);

      if (revenueError) throw revenueError;

      // edu_product_sales 삭제
      const { error: productError } = await supabase
        .from("edu_product_sales")
        .delete()
        .eq("report_id", reportId);

      if (productError) throw productError;

      // edu_refund_summary 삭제
      const { error: refundError } = await supabase
        .from("edu_refund_summary")
        .delete()
        .eq("report_id", reportId);

      if (refundError) throw refundError;

      // edu_mentoring_reports 삭제
      const { error: mentoringError } = await supabase
        .from("edu_mentoring_reports")
        .delete()
        .eq("report_id", reportId);

      if (mentoringError) throw mentoringError;

      // consultant_resources 삭제
      const { error: consultantError } = await supabase
        .from("consultant_resources")
        .delete()
        .eq("report_id", reportId);

      if (consultantError) throw consultantError;

      // edu_report_notes 삭제
      const { error: notesError } = await supabase
        .from("edu_report_notes")
        .delete()
        .eq("report_id", reportId);

      if (notesError) throw notesError;

      toast({
        title: "삭제 완료",
        description: `${currentReport?.title || "선택한 주차"}의 모든 데이터가 삭제되었습니다. (총 ${totalDeleted}건)`,
      });

      // 데이터 개수 초기화
      setDataCount(0);

      // 페이지 새로고침하여 변경사항 반영
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error("삭제 에러:", error);
      toast({
        title: "삭제 실패",
        description: error.message || "데이터 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-red-200 bg-red-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          주차 데이터 삭제
        </CardTitle>
        <CardDescription>
          선택한 주차의 모든 데이터를 삭제합니다. 
          <br />
          <strong className="text-red-600">이 작업은 되돌릴 수 없습니다!</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentReport && (
            <div className="p-3 bg-white rounded border">
              <p className="text-sm font-medium">선택된 주차</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {currentReport.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentReport.start_date} ~ {currentReport.end_date}
              </p>
              {dataCount !== null && (
                <p className="text-sm mt-2">
                  {dataCount > 0 ? (
                    <span className="text-red-600 font-semibold">
                      ⚠️ {dataCount}건의 데이터가 삭제됩니다
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      ℹ️ 입력된 데이터가 없습니다
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!reportId || deleting || dataCount === 0}
                className="w-full"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    주차 데이터 삭제
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>다음 데이터가 영구적으로 삭제됩니다:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>매출 거래 데이터 (sales_transactions)</li>
                    <li>매출 통계 (edu_revenue_stats)</li>
                    <li>상품별 판매 현황 (edu_product_sales)</li>
                    <li>환불 요약 (edu_refund_summary)</li>
                    <li>멘토링 보고 (edu_mentoring_reports)</li>
                    <li>컨설턴트 리소스 (consultant_resources)</li>
                    <li>보고 노트 (edu_report_notes)</li>
                  </ul>
                  <p className="font-semibold text-red-600 mt-3">
                    이 작업은 되돌릴 수 없습니다!
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {!reportId && (
            <p className="text-sm text-amber-600 text-center">
              ⚠️ 주차를 먼저 선택하세요.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

