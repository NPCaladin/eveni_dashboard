"use client";

import { useState, useEffect } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type MentoringReport = Database["public"]["Tables"]["edu_mentoring_reports"]["Row"];

interface MentoringFormData {
  id?: string;
  mentor_name: string;
  mentee_status: string;
  issues: string;
  note: string;
}

export function MentoringLogForm() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mentors, setMentors] = useState<MentoringFormData[]>([
    { mentor_name: "", mentee_status: "", issues: "", note: "" },
  ]);

  // 데이터 불러오기
  useEffect(() => {
    if (!reportId) return;

    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("edu_mentoring_reports")
          .select("*")
          .eq("report_id", reportId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setMentors(
            data.map((item) => ({
              id: item.id,
              mentor_name: item.mentor_name,
              mentee_status: item.mentee_status || "",
              issues: item.issues || "",
              note: item.note || "",
            }))
          );
        } else {
          setMentors([
            { mentor_name: "", mentee_status: "", issues: "", note: "" },
          ]);
        }
      } catch (error) {
        console.error("Error loading mentoring data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reportId]);

  const handleMentorChange = (
    index: number,
    field: keyof MentoringFormData,
    value: string
  ) => {
    setMentors((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleAddMentor = () => {
    setMentors((prev) => [
      ...prev,
      { mentor_name: "", mentee_status: "", issues: "", note: "" },
    ]);
  };

  const handleRemoveMentor = (index: number) => {
    if (mentors.length === 1) {
      toast({
        title: "알림",
        description: "최소 하나의 멘토 항목이 필요합니다.",
      });
      return;
    }
    setMentors((prev) => prev.filter((_, i) => i !== index));
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
      // 기존 데이터 삭제 후 새로 삽입
      const { error: deleteError } = await supabase
        .from("edu_mentoring_reports")
        .delete()
        .eq("report_id", reportId);

      if (deleteError) throw deleteError;

      // 유효한 멘토 데이터만 필터링 (멘토 이름이 있는 것만)
      const validMentors = mentors.filter((m) => m.mentor_name.trim() !== "");

      if (validMentors.length > 0) {
        const insertData = validMentors.map((mentor) => ({
          report_id: reportId,
          mentor_name: mentor.mentor_name,
          mentee_status: mentor.mentee_status || null,
          issues: mentor.issues || null,
          note: mentor.note || null,
        }));

        const { error: insertError } = await supabase
          .from("edu_mentoring_reports")
          .insert(insertData);

        if (insertError) throw insertError;
      }

      toast({
        title: "저장 완료",
        description: "멘토링 이슈가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("Error saving mentoring data:", error);
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
        <CardTitle>멘토제 주간보고</CardTitle>
        <CardDescription>
          각 멘토의 멘티 현황, 주요 이슈, 비고를 입력하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {mentors.map((mentor, index) => (
          <div key={index} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">멘토 {index + 1}</h4>
              {mentors.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMentor(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div>
              <Label htmlFor={`mentor-name-${index}`}>멘토명</Label>
              <Input
                id={`mentor-name-${index}`}
                value={mentor.mentor_name}
                onChange={(e) =>
                  handleMentorChange(index, "mentor_name", e.target.value)
                }
                placeholder="멘토 이름을 입력하세요"
              />
            </div>

            <div>
              <Label htmlFor={`mentee-status-${index}`}>멘티 현황</Label>
              <Textarea
                id={`mentee-status-${index}`}
                value={mentor.mentee_status}
                onChange={(e) =>
                  handleMentorChange(index, "mentee_status", e.target.value)
                }
                placeholder="멘티 현황을 입력하세요"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor={`issues-${index}`}>주요 이슈</Label>
              <Textarea
                id={`issues-${index}`}
                value={mentor.issues}
                onChange={(e) =>
                  handleMentorChange(index, "issues", e.target.value)
                }
                placeholder="주요 이슈를 입력하세요"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor={`note-${index}`}>비고</Label>
              <Textarea
                id={`note-${index}`}
                value={mentor.note}
                onChange={(e) =>
                  handleMentorChange(index, "note", e.target.value)
                }
                placeholder="비고를 입력하세요"
                rows={2}
              />
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleAddMentor}>
            <Plus className="mr-2 h-4 w-4" />
            멘토 추가
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}












