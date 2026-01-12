"use client";

import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";

export function RevenueBackfill() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/backfill/revenue", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "업로드 실패");

      toast({
        title: "업로드 완료",
        description: `${json.processed || 0}개의 주차 데이터가 반영되었습니다.`,
      });
      if (fileRef.current) fileRef.current.value = "";
    } catch (error: unknown) {
      console.error("backfill upload error", error);
      const errorMessage = error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다.";
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>과거 매출/환불 일괄 업로드</CardTitle>
        <CardDescription>
          2024-01부터 현재까지 주차별 실매출·환불액을 업로드해 비교 기준을 채웁니다. 이미 존재하는
          주차는 업데이트됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFileChange}
            disabled={uploading}
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            파일 선택
          </Button>
          {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="rounded-md bg-muted p-3 text-sm leading-relaxed">
          <p className="font-semibold">엑셀 헤더 예시</p>
          <p>주차명 | 시작일 | 종료일 | 실매출 | 환불액</p>
          <p className="text-xs text-muted-foreground mt-1">
            날짜는 yyyy-mm-dd 또는 Excel 날짜 형식을 지원합니다.
          </p>
          <p className="text-xs text-muted-foreground">
            순매출은 자동 계산(실매출 - 환불액)으로 저장됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}














