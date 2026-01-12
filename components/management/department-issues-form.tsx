"use client";

import { useState, useEffect, useRef } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<Category>("인사");
  const colorInputRef = useRef<HTMLInputElement>(null);
  const editorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [issues, setIssues] = useState<Record<Category, IssueItem[]>>({
    인사: [],
    총무: [],
    PM: [],
    기타: [],
  });

  // 텍스트 포맷 적용
  const applyCommand = (editorKey: string, cmd: string, value?: string) => {
    const editor = editorRefs.current[editorKey];
    if (!editor) return;
    
    editor.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(cmd, false, value);
  };

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

  // 데이터가 로드된 후 에디터에 내용 채우기 (최초 1회만)
  useEffect(() => {
    if (loading) return; // 로딩 중이면 스킵
    
    Object.entries(issues).forEach(([category, items]) => {
      items.forEach((item, index) => {
        const editorKey = `content-${category}-${index}`;
        const editor = editorRefs.current[editorKey];
        if (editor && item.content && editor.innerHTML !== item.content) {
          editor.innerHTML = item.content;
        }
      });
    });
  }, [issues, loading]);

  // 에디터 내용을 state에 동기화
  const handleContentChange = (category: Category, index: number) => {
    const editorKey = `content-${category}-${index}`;
    const editor = editorRefs.current[editorKey];
    if (editor) {
      const htmlContent = editor.innerHTML;
      handleIssueChange(category, index, "content", htmlContent);
    }
  };

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

  // 이미지 붙여넣기 핸들러
  const handlePaste = async (
    e: React.ClipboardEvent<HTMLDivElement>,
    category: Category,
    index: number
  ) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        setUploading(true);
        try {
          const timestamp = Date.now();
          const fileExt = file.type.split('/')[1];
          const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `management/${fileName}`;

          const { data, error } = await supabase.storage
            .from('reports')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('reports')
            .getPublicUrl(filePath);

          // 에디터에 이미지 삽입
          const editorKey = `content-${category}-${index}`;
          const editor = editorRefs.current[editorKey];
          if (editor) {
            editor.focus();
            document.execCommand('insertHTML', false, 
              `<img src="${publicUrl}" style="max-width: 100%; max-height: 400px; height: auto; margin: 8px 0; border-radius: 4px;" />`
            );
          }

          toast({
            title: "이미지 삽입 완료",
            description: "이미지가 성공적으로 삽입되었습니다.",
          });
        } catch (error: any) {
          console.error("Image upload error:", error);
          toast({
            title: "이미지 삽입 실패",
            description: error.message || "이미지 업로드 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        } finally {
          setUploading(false);
        }
        break;
      }
    }
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

      // 새 데이터 삽입 (에디터에서 직접 최신 내용 읽기)
      const insertData: Array<{
        report_id: string;
        category: Category;
        content: string;
        note: string | null;
        is_completed: boolean;
      }> = [];

      Object.entries(issues).forEach(([category, items]) => {
        items.forEach((item, index) => {
          // 에디터가 존재하면 에디터의 최신 내용을, 없으면 state의 값을 사용
          const editorKey = `content-${category}-${index}`;
          const editor = editorRefs.current[editorKey];
          const htmlContent = editor ? editor.innerHTML : (item.content || "");

          if (htmlContent.trim() && htmlContent !== "<br>" && htmlContent !== "") {
            insertData.push({
              report_id: reportId,
              category: category as Category,
              content: htmlContent,
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
          categoryIssues.map((issue, index) => {
            const editorKey = `content-${category}-${index}`;
            
            return (
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
                  <Label>내용</Label>
                  <div className="mt-2 space-y-2">
                    {/* 포맷팅 툴바 */}
                    <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-md">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyCommand(editorKey, "bold")}
                      >
                        굵게
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const color = colorInputRef.current?.value || "#d32f2f";
                          applyCommand(editorKey, "foreColor", color);
                        }}
                      >
                        글자색
                      </Button>
                      <Input
                        ref={colorInputRef}
                        type="color"
                        className="w-16 h-9 p-1"
                        defaultValue="#d32f2f"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyCommand(editorKey, "insertUnorderedList")}
                      >
                        불릿
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyCommand(editorKey, "removeFormat")}
                      >
                        서식 제거
                      </Button>
                    </div>

                    {/* ContentEditable 에디터 */}
                    <div
                      ref={(el) => {
                        if (el) {
                          editorRefs.current[editorKey] = el;
                          // 최초 렌더링 시 content 채우기
                          if (issue.content && el.innerHTML !== issue.content) {
                            el.innerHTML = issue.content;
                          }
                        }
                      }}
                      contentEditable
                      onInput={() => handleContentChange(category, index)}
                      onBlur={() => handleContentChange(category, index)}
                      onPaste={(e) => handlePaste(e, category, index)}
                      className="min-h-[120px] rounded-md border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      suppressContentEditableWarning
                      data-placeholder="이슈 내용을 입력하세요... (이미지는 Ctrl+V로 붙여넣기)"
                      style={{
                        whiteSpace: 'pre-wrap',
                      }}
                    />
                  </div>
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
            );
          })
        )}

        <Button variant="outline" onClick={() => handleAddIssue(category)} disabled={uploading}>
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

