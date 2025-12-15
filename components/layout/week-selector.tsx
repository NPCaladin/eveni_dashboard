"use client";

import { useState } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";

export function WeekSelector() {
  const { reports, reportId, setReportId, loading } = useWeeklyReport();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
  });

  const handleCreateWeek = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("weekly_reports")
        .insert({
          title: formData.title,
          start_date: formData.startDate,
          end_date: formData.endDate,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "주차 생성 완료",
        description: "새로운 주차가 생성되었습니다.",
      });

      setFormData({ title: "", startDate: "", endDate: "" });
      setIsDialogOpen(false);
      
      // 페이지 새로고침하여 데이터 다시 로드
      window.location.reload();
    } catch (error: any) {
      console.error("Error creating week:", error);
      toast({
        title: "생성 실패",
        description: error.message || "주차 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={reportId || ""}
        onValueChange={(value) => {
          if (value) {
            setReportId(value);
          }
        }}
        disabled={loading}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder={loading ? "로딩 중..." : reports.length === 0 ? "주차 데이터가 없습니다" : "주차를 선택하세요"} />
        </SelectTrigger>
        <SelectContent className="max-h-72 overflow-auto">
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            주차 생성
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 주차 생성</DialogTitle>
            <DialogDescription>
              주간 보고서를 위한 새로운 주차를 생성하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">주차 제목</Label>
              <Input
                id="title"
                placeholder="예: 2024년 1주차"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={creating}
            >
              취소
            </Button>
            <Button onClick={handleCreateWeek} disabled={creating}>
              {creating ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


