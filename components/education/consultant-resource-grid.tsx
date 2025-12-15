"use client";
// @ts-nocheck

import { useState, useEffect } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase/types";

type ConsultantResource = Database["public"]["Tables"]["consultant_resources"]["Row"];

const JOB_GROUPS = [
  "기획",
  "사업PM",
  "클라이언트",
  "아트",
  "서버",
  "사운드",
  "QA",
  "기타",
] as const;

type Status = "가능" | "불가" | "조율" | "전체마감";

interface ResourceFormData {
  id?: string;
  job_group: string;
  status: Status;
  note: string;
}

export function ConsultantResourceGrid() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resources, setResources] = useState<ResourceFormData[]>([]);

  // 초기 데이터 설정
  useEffect(() => {
    if (resources.length === 0) {
      setResources(
        JOB_GROUPS.map((job) => ({
          job_group: job,
          status: "가능" as Status,
          note: "",
        }))
      );
    }
  }, []);

  // 데이터 불러오기
  useEffect(() => {
    if (!reportId) return;

    async function loadData() {
      if (!reportId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("consultant_resources")
          .select("*")
          .eq("report_id", reportId);

        if (error) throw error;

        if (data && data.length > 0) {
          // 기존 데이터로 채우기
          const resourceMap = new Map(
            (data as any[]).map((item: any) => [item.job_group, item])
          );

          setResources(
            JOB_GROUPS.map((job) => {
              const existing = resourceMap.get(job);
              return existing
                ? {
                    id: existing.id,
                    job_group: existing.job_group,
                    status: existing.status,
                    note: existing.note || "",
                  }
                : {
                    job_group: job,
                    status: "가능" as Status,
                    note: "",
                  };
            })
          );
        } else {
          // 초기 데이터
          setResources(
            JOB_GROUPS.map((job) => ({
              job_group: job,
              status: "가능" as Status,
              note: "",
            }))
          );
        }
      } catch (error) {
        console.error("Error loading consultant resources:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reportId]);

  const handleStatusChange = (index: number, status: Status) => {
    setResources((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        status,
      };
      return updated;
    });
  };

  const handleNoteChange = (index: number, note: string) => {
    setResources((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        note,
      };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!reportId) {
      toast({
        title: "오류",
        description: "주차를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // 기존 데이터 삭제
      const { error: deleteError } = await supabase
        .from("consultant_resources")
        .delete()
        .eq("report_id", reportId);

      if (deleteError) throw deleteError;

      // 새 데이터 삽입
      const insertData = resources.map((resource) => ({
        report_id: reportId,
        job_group: resource.job_group,
        status: resource.status,
        note: resource.note || null,
      }));

      const { error: insertError } = await supabase
        .from("consultant_resources")
        .insert(insertData);

      if (insertError) throw insertError;

      toast({
        title: "저장 완료",
        description: "컨설턴트 리소스 현황이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("Error saving consultant resources:", error);
      toast({
        title: "저장 실패",
        description: "데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>컨설턴트 리소스 현황</CardTitle>
        <CardDescription>
          각 직군별 컨설턴트 리소스 상태를 선택하고 비고를 입력하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {resources.map((resource, index) => (
            <div
              key={resource.job_group}
              className="flex items-center gap-4 rounded-lg border p-4"
            >
              <div className="w-24">
                <Label className="font-semibold">{resource.job_group}</Label>
              </div>
              <div className="flex-1">
                <Select
                  value={resource.status}
                  onValueChange={(value) =>
                    handleStatusChange(index, value as Status)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="가능">가능</SelectItem>
                    <SelectItem value="불가">불가</SelectItem>
                    <SelectItem value="조율">조율</SelectItem>
                    <SelectItem value="전체마감">전체마감</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="비고"
                  value={resource.note}
                  onChange={(e) => handleNoteChange(index, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}





