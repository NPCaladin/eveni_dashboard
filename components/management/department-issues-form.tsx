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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, X } from "lucide-react";
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

type Category = "인사" | "총무" | "PM" | "기타";

interface IssueItem {
  id?: string;
  content: string;
  note: string;
  is_completed: boolean;
}

export function DepartmentIssuesForm() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Category>("인사");

  const [issues, setIssues] = useState<Record<Category, IssueItem[]>>({
    인사: [],
    총무: [],
    PM: [],
    기타: [],
  });

  // 데이터 불러오기
  useEffect(() => {
    if (!reportId) return;

    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("mgmt_innovation_reports")
          .select("*")
          .eq("report_id", reportId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        const loadedIssues: Record<Category, IssueItem[]> = {
          인사: [],
          총무: [],
          PM: [],
          기타: [],
        };

        if (data) {
          data.forEach((item) => {
            const category = item.category as Category;
            if (loadedIssues[category]) {
              loadedIssues[category].push({
                id: item.id,
                content: item.content,
                note: item.note || "",
                is_completed: (item as any).is_completed || false,
              });
            }
          });
        }

        setIssues(loadedIssues);
      } catch (error) {
        console.error("Error loading issues:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reportId]);

  const handleAddIssue = (category: Category) => {
    setIssues((prev) => ({
      ...prev,
      [category]: [
        ...prev[category],
        { content: "", note: "", is_completed: false },
      ],
    }));
  };

  const handleRemoveIssue = (category: Category, index: number) => {
    setIssues((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const handleIssueChange = (
    category: Category,
    index: number,
    field: keyof IssueItem,
    value: string | boolean
  ) => {
    setIssues((prev) => {
      const updated = [...prev[category]];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return {
        ...prev,
        [category]: updated,
      };
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
        .from("mgmt_innovation_reports")
        .delete()
        .eq("report_id", reportId);

      if (deleteError) throw deleteError;

      // 새 데이터 삽입
      const insertData: Array<{
        report_id: string;
        category: Category;
        content: string;
        note: string | null;
        is_completed: boolean;
      }> = [];

      Object.entries(issues).forEach(([category, items]) => {
        items.forEach((item) => {
          if (item.content.trim()) {
            insertData.push({
              report_id: reportId,
              category: category as Category,
              content: item.content,
              note: item.note || null,
              is_completed: item.is_completed,
            });
          }
        });
      });

      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from("mgmt_innovation_reports")
          .insert(insertData);

        if (insertError) throw insertError;
      }

      toast({
        title: "저장 완료",
        description: "부서별 이슈가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("Error saving issues:", error);
      toast({
        title: "저장 실패",
        description: "데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderCategoryTab = (category: Category) => {
    const categoryIssues = issues[category];

    return (
      <div className="space-y-4">
        {categoryIssues.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-lg">
            항목이 없습니다. "항목 추가" 버튼을 눌러 이슈를 추가하세요.
          </div>
        ) : (
          categoryIssues.map((issue, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={issue.is_completed}
                    onChange={(e) =>
                      handleIssueChange(category, index, "is_completed", e.target.checked)
                    }
                  />
                  <Label className="text-sm font-medium">
                    {issue.is_completed ? "완료" : "진행중"}
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveIssue(category, index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Label htmlFor={`content-${category}-${index}`}>내용</Label>
                <Textarea
                  id={`content-${category}-${index}`}
                  value={issue.content}
                  onChange={(e) =>
                    handleIssueChange(category, index, "content", e.target.value)
                  }
                  placeholder="이슈 내용을 입력하세요..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor={`note-${category}-${index}`}>비고</Label>
                <Input
                  id={`note-${category}-${index}`}
                  value={issue.note}
                  onChange={(e) =>
                    handleIssueChange(category, index, "note", e.target.value)
                  }
                  placeholder="비고를 입력하세요..."
                  className="mt-2"
                />
              </div>
            </div>
          ))
        )}

        <Button variant="outline" onClick={() => handleAddIssue(category)}>
          <Plus className="mr-2 h-4 w-4" />
          항목 추가
        </Button>
      </div>
    );
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
        <CardTitle>부서별 이슈 리스트</CardTitle>
        <CardDescription>
          각 부서별 이슈를 입력하고 완료/진행중 상태를 관리하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Category)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="인사">인사</TabsTrigger>
            <TabsTrigger value="총무">총무</TabsTrigger>
            <TabsTrigger value="PM">PM</TabsTrigger>
            <TabsTrigger value="기타">기타</TabsTrigger>
          </TabsList>

          <TabsContent value="인사" className="mt-4">
            {renderCategoryTab("인사")}
          </TabsContent>
          <TabsContent value="총무" className="mt-4">
            {renderCategoryTab("총무")}
          </TabsContent>
          <TabsContent value="PM" className="mt-4">
            {renderCategoryTab("PM")}
          </TabsContent>
          <TabsContent value="기타" className="mt-4">
            {renderCategoryTab("기타")}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

