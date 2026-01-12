"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MarketingReportNotes() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const colorSelectRef = useRef<HTMLSelectElement>(null);
  const sizeSelectRef = useRef<HTMLSelectElement>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const applyCommand = (cmd: string, value?: string) => {
    // CSS 스타일 사용 활성화 (컬러가 제대로 적용되도록)
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const applyColor = () => {
    const color = colorSelectRef.current?.value || "#000000";
    applyCommand("foreColor", color);
  };

  const applySize = () => {
    const size = sizeSelectRef.current?.value || "3";
    applyCommand("fontSize", size);
  };

  const insertTable = () => {
    // 행/열 개수 입력받기
    const rows = prompt("행 개수를 입력하세요 (기본: 3)", "3");
    const cols = prompt("열 개수를 입력하세요 (기본: 3)", "3");
    
    if (!rows || !cols) return; // 취소한 경우
    
    const numRows = Math.max(1, Math.min(20, parseInt(rows) || 3)); // 1~20 제한
    const numCols = Math.max(1, Math.min(10, parseInt(cols) || 3)); // 1~10 제한
    
    // 테이블 HTML 생성
    let tableHTML = `
      <table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0; resize: both; overflow: auto; display: inline-table;">
        <tbody>
    `;
    
    for (let i = 0; i < numRows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < numCols; j++) {
        tableHTML += '<td style="border: 1px solid #ddd; padding: 8px; min-width: 50px;">&nbsp;</td>';
      }
      tableHTML += '</tr>';
    }
    
    tableHTML += `
        </tbody>
      </table>
    `;
    
    document.execCommand('insertHTML', false, tableHTML);
    editorRef.current?.focus();
  };

  const load = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mkt_report_notes")
        .select("content")
        .eq("report_id", reportId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (데이터가 없는 경우)
        console.error("load report notes error", error);
        toast({
          title: "오류",
          description: "보고사항을 불러오지 못했습니다.",
          variant: "destructive",
        });
        return;
      }
      
      if (editorRef.current) {
        editorRef.current.innerHTML = (data as any)?.content || "";
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
      
      // upsert with onConflict (now works because unique constraint exists)
      const { error } = await supabase.from("mkt_report_notes").upsert(
        {
          report_id: reportId,
          content,
        },
        {
          onConflict: 'report_id',
          ignoreDuplicates: false
        }
      );
      
      if (error) throw error;
      toast({ title: "저장 완료", description: "보고 사항이 저장되었습니다." });
    } catch (error: unknown) {
      console.error("save report notes error", error);
      const errorMessage = error instanceof Error ? error.message : "보고 사항 저장 중 오류가 발생했습니다.";
      toast({
        title: "저장 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>기타 보고 사항</CardTitle>
        <CardDescription>
          텍스트(볼드/컬러/크기), 테이블, 이미지 붙여넣기 지원.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Button type="button" variant="outline" size="sm" onClick={() => applyCommand("bold")}>
            <strong>굵게</strong>
          </Button>

          {/* 글자색 선택 */}
          <div className="flex gap-1 items-center">
            <select
              ref={colorSelectRef}
              className="h-8 px-2 text-sm border rounded"
              defaultValue="#000000"
            >
              <option value="#000000">⚫ 검정</option>
              <option value="#d32f2f">🔴 빨강</option>
              <option value="#1976d2">🔵 파랑</option>
              <option value="#388e3c">🟢 초록</option>
              <option value="#f57c00">🟠 주황</option>
              <option value="#7b1fa2">🟣 보라</option>
            </select>
            <Button type="button" variant="outline" size="sm" onClick={applyColor}>
              글자색 적용
            </Button>
          </div>

          {/* 텍스트 크기 선택 */}
          <div className="flex gap-1 items-center">
            <select
              ref={sizeSelectRef}
              className="h-8 px-2 text-sm border rounded"
              defaultValue="3"
            >
              <option value="1">작게</option>
              <option value="3">보통</option>
              <option value="4">크게</option>
              <option value="5">더 크게</option>
              <option value="6">매우 크게</option>
            </select>
            <Button type="button" variant="outline" size="sm" onClick={applySize}>
              크기 적용
            </Button>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={() => applyCommand("insertUnorderedList")}>
            • 불릿
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={insertTable}>
            📊 테이블
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

