"use client";

import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";

interface MigrationResult {
  success: boolean;
  weeksProcessed: number;
  detail?: { monday: string; count: number }[];
  error?: string;
}

export function MigrationUpload() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgressMsg("파일 전송 중...");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/migration", {
        method: "POST",
        body: formData,
      });
      const json: MigrationResult = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "업로드 실패");
      }

      setProgressMsg(
        `${json.weeksProcessed}개 주차 처리 완료` +
          (json.detail ? ` (예: ${json.detail.slice(0, 3).map((d) => d.monday).join(", ")}...)` : "")
      );
      toast({
        title: "업로드 완료",
        description: `${json.weeksProcessed}개 주차로 분배되었습니다.`,
      });
      if (fileRef.current) fileRef.current.value = "";
    } catch (error: unknown) {
      console.error("migration upload error", error);
      const errorMessage = error instanceof Error ? error.message : "마이그레이션 업로드 실패";
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
      setProgressMsg("업로드 실패");
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
        <CardTitle>과거 데이터 일괄 업로드 (Migration)</CardTitle>
        <CardDescription>
          2024년 이후 전체 데이터를 올리면 날짜별로 주차를 생성하고 자동 분배합니다. 처리에 다소 시간이
          걸릴 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
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
          <p className="font-semibold">엑셀 헤더(2행 기준) 예시</p>
          <p className="text-xs text-muted-foreground">
            상태, 날짜/결제일, 환불일, 판매자, 구매자, 판매구분, 상품, 정가, 주문금액, 포인트, 쿠폰, 결제금액,
            환불금액
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            날짜는 숫자(엑셀 날짜) 또는 yyyy-mm-dd 문자열을 모두 지원합니다.
          </p>
          <p className="text-xs text-muted-foreground">
            업로드 시 자동으로 주차(월~일)를 계산해 주간 보고서를 생성/연결합니다.
          </p>
        </div>
        {progressMsg && (
          <div className="text-sm text-muted-foreground">
            {progressMsg}
          </div>
        )}
      </CardContent>
    </Card>
  );
}














