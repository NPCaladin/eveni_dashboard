"use client";

import { useState } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

const STATUS_MAPPING: Record<string, string> = {
  "가능": "가능",
  "불가": "불가",
  "조율": "조율",
  "가능 ": "가능",
  "불가 ": "불가",
  "조율 ": "조율",
};

const GRADE_MAPPING: Record<string, string> = {
  "베테랑": "베테랑",
  "베테랑 컨설턴트": "베테랑",
  "숙련": "숙련",
  "숙련 컨설턴트": "숙련",
  "일반": "일반",
  "일반 컨설턴트": "일반",
};

interface ResourceRow {
  job_group: string;
  consultant_name: string;
  grade: string;
  status: string;
  capacity: number;
  note: string | null;
}

export function ConsultantResourceUpload() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "파일 없음",
        description: "업로드할 엑셀 파일을 선택하세요.",
        variant: "destructive",
      });
      return;
    }

    if (!reportId) {
      toast({
        title: "주차 미선택",
        description: "먼저 주차를 선택하세요.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // 헤더 행 찾기 (첫 번째 행 또는 "직군"이 있는 행)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(5, jsonData.length); i++) {
        if (jsonData[i].some((cell: any) => String(cell).includes("직군"))) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = jsonData[headerRowIndex].map((h: any) => String(h).trim());
      const jobGroupIndex = headers.findIndex((h) => h.includes("직군") || h.includes("직무"));
      const nameIndex = headers.findIndex((h) => h.includes("컨설턴트명") || h.includes("이름"));
      const gradeIndex = headers.findIndex((h) => h.includes("직급") || h.includes("등급"));
      const statusIndex = headers.findIndex((h) => h.includes("상태") || h.includes("현황") || h.includes("배정 가능 여부"));
      const capacityIndex = headers.findIndex((h) => h.includes("수용") || h.includes("인원"));
      const noteIndex = headers.findIndex((h) => h.includes("비고"));

      if (jobGroupIndex === -1) {
        throw new Error("엑셀 파일에서 '직군' 또는 '직무' 열을 찾을 수 없습니다.");
      }
      if (nameIndex === -1) {
        throw new Error("엑셀 파일에서 '컨설턴트명' 열을 찾을 수 없습니다.");
      }
      if (gradeIndex === -1) {
        throw new Error("엑셀 파일에서 '직급' 또는 '등급' 열을 찾을 수 없습니다.");
      }

      const resources: ResourceRow[] = [];

      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const jobGroup = row[jobGroupIndex] ? String(row[jobGroupIndex]).trim() : "";
        const consultantName = row[nameIndex] ? String(row[nameIndex]).trim() : "";
        if (!jobGroup || !consultantName) continue;

        const rawGrade = row[gradeIndex] ? String(row[gradeIndex]).trim() : "";
        const grade = GRADE_MAPPING[rawGrade] || "일반";

        const rawStatus = statusIndex >= 0 && row[statusIndex] ? String(row[statusIndex]).trim() : "가능";
        const status = STATUS_MAPPING[rawStatus] || "가능";

        const capacity = capacityIndex >= 0 && row[capacityIndex] ? Number(row[capacityIndex]) : 0;
        
        const note = noteIndex >= 0 && row[noteIndex] ? String(row[noteIndex]).trim() : null;

        resources.push({
          job_group: jobGroup,
          consultant_name: consultantName,
          grade,
          status,
          capacity: isNaN(capacity) ? 0 : capacity,
          note,
        });
      }

      if (resources.length === 0) {
        throw new Error("업로드할 데이터가 없습니다.");
      }

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
        consultant_name: resource.consultant_name,
        grade: resource.grade,
        status: resource.status,
        capacity: resource.capacity,
        note: resource.note,
      }));

      const { error: insertError } = await supabase
        .from("consultant_resources")
        .insert(insertData);

      if (insertError) throw insertError;

      toast({
        title: "업로드 완료",
        description: `${resources.length}개의 컨설턴트 리소스가 업로드되었습니다.`,
      });

      setSelectedFile(null);
      if (event && event.target) {
        (event.target as HTMLInputElement).value = "";
      }
    } catch (error: unknown) {
      console.error("컨설턴트 리소스 업로드 에러:", error);
      const errorMessage = error instanceof Error ? error.message : "파일 처리 중 오류가 발생했습니다.";
      toast({
        title: "업로드 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          컨설턴트 리소스 엑셀 업로드
        </CardTitle>
        <CardDescription>
          엑셀 파일로 컨설턴트 리소스 현황을 일괄 업로드합니다.
          <br />
          엑셀 형식: 직무(직군), 컨설턴트 직급(등급), 컨설턴트명, 배정 가능 여부(상태), 수용 가능 인원, 비고
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={uploading || !reportId}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !reportId}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  업로드
                </>
              )}
            </Button>
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              선택된 파일: {selectedFile.name}
            </p>
          )}
          {!reportId && (
            <p className="text-sm text-amber-600">
              ⚠️ 주차를 먼저 선택하세요.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

