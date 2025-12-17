"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReportNotes() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const applyCommand = (cmd: string, value?: string) => {
    // CSS 스타일 사용 활성화 (컬러가 제대로 적용되도록)
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const load = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("edu_report_notes")
        .select("content")
        .eq("report_id", reportId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        // 테이블 미존재 등 스키마 캐시 에러를 사용자 메시지로 노출
        console.error("load report notes error", error);
        toast({
          title: "오류",
          description: "보고사항을 불러오지 못했습니다. (테이블 생성 여부를 확인하세요)",
          variant: "destructive",
        });
        return;
      }
      if (editorRef.current) {
        editorRef.current.innerHTML = data?.content || "";
      }
    } catch (error) {
      console.error("load report notes error", error);
      toast({
        title: "오류",
        description: "보고사항을 불러오지 못했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [reportId]);

  const handleSave = async () => {
    if (!reportId) {
      toast({ title: "오류", description: "주차를 선택하세요.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const content = editorRef.current?.innerHTML || "";
      const { error } = await supabase.from("edu_report_notes").upsert({
        report_id: reportId,
        content,
      });
      if (error) throw error;
      toast({ title: "저장 완료", description: "보고 사항이 저장되었습니다." });
    } catch (error: any) {
      console.error("save report notes error", error);
      toast({
        title: "저장 실패",
        description: error.message || "보고 사항 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>보고 사항</CardTitle>
        <CardDescription>
          텍스트(볼드/컬러)와 이미지 붙여넣기 지원. 마크다운 불필요, 간단 입력용.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => applyCommand("bold")}>
            굵게
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const color = colorInputRef.current?.value || "#d32f2f";
              applyCommand("foreColor", color);
            }}
          >
            글자색
          </Button>
          <Input ref={colorInputRef} type="color" className="w-16 p-1" defaultValue="#d32f2f" />
          <Button type="button" variant="outline" size="sm" onClick={() => applyCommand("insertUnorderedList")}>
            불릿
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyCommand("removeFormat")}>
            서식 제거
          </Button>
        </div>

        <div className="h-px w-full bg-border" />

        <div
          ref={editorRef}
          contentEditable
          className="min-h-[200px] rounded-md border p-3 text-sm focus:outline-none"
          suppressContentEditableWarning
          aria-busy={loading}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={load} disabled={loading || saving}>
            새로고침
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || !reportId}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

