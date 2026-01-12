"use client";

import { useState, useEffect } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { useSidebar } from "@/contexts/sidebar-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Settings, Check, Menu } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export function DashboardHeader() {
  const { reports, reportId, setReportId, loading } = useWeeklyReport();
  const [tempReportId, setTempReportId] = useState<string>("");
  const { toast } = useToast();
  const { open: openSidebar } = useSidebar();

  // 현재 선택된 reportId를 tempReportId에 동기화
  useEffect(() => {
    setTempReportId(reportId || "");
  }, [reportId]);

  const handleApply = () => {
    if (tempReportId && tempReportId !== reportId) {
      setReportId(tempReportId);
      const selectedReport = reports.find((r) => r.id === tempReportId);
      toast({
        title: "주차 변경됨",
        description: selectedReport 
          ? `${selectedReport.title} 데이터를 불러옵니다.`
          : "주차가 변경되었습니다.",
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-auto sm:h-16 items-start sm:items-center justify-between gap-4 border-b bg-background px-4 sm:px-6 py-4 sm:py-0">
      <div className="flex items-center gap-4">
        {/* 모바일 햄버거 메뉴 버튼 - lg 미만에서만 표시 */}
        <button
          onClick={openSidebar}
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">이븐아이 주간보고</h1>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">주차 선택:</span>
          <Select
            value={tempReportId}
            onValueChange={(value) => {
              setTempReportId(value);
            }}
            disabled={loading || reports.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder={loading ? "로딩 중..." : reports.length === 0 ? "주차 데이터가 없습니다" : "주차를 선택하세요"} />
            </SelectTrigger>
            <SelectContent>
              {reports.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  주차 데이터가 없습니다
                </div>
              ) : (
                reports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.title} (
                    {format(new Date(report.start_date), "yyyy-MM-dd")}{" "}
                    ~{" "}
                    {format(new Date(report.end_date), "yyyy-MM-dd")}
                    )
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={handleApply}
            disabled={loading || !tempReportId || tempReportId === reportId}
            size="sm"
            className="whitespace-nowrap"
          >
            <Check className="mr-2 h-4 w-4" />
            확인
          </Button>
        </div>
        <Link href="/admin" className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Settings className="mr-2 h-4 w-4" />
            Admin으로 이동
          </Button>
        </Link>
      </div>
    </div>
  );
}

