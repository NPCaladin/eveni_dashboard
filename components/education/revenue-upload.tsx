"use client";

import { useState, useRef } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileX, CheckCircle2, Loader2 } from "lucide-react";

interface ParsedRow {
  상태: string;
  날짜: string;
  환불일: string;
  판매자: string;
  구매자: string;
  판매구분: string;
  상품: string;
  정가: number;
  주문금액: number;
  포인트: number;
  쿠폰: number;
  결제금액: number;
  환불금액: number;
}

export function RevenueUploadForm() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;

    // 파일 확장자 확인
    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast({
        title: "오류",
        description: "엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    try {
      // 동적 import로 xlsx 로드
      const XLSX = await import("xlsx");
      
      // 엑셀 파일 읽기
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      if (data.length < 2) {
        toast({
          title: "오류",
          description: "엑셀 파일에 데이터가 없습니다.",
          variant: "destructive",
        });
        return;
      }

      // 헤더 추출
      const headers = data[0] as string[];
      // 실제 사용 가능한 헤더들 (여러 형식 지원)
      const possibleHeaders = {
        상태: ["상태"],
        날짜: ["날짜", "결제일"],
        환불일: ["환불일"],
        판매자: ["판매자"],
        구매자: ["구매자"],
        판매구분: ["판매구분", "구분코드"],
        상품: ["상품", "판매상품"],
        정가: ["정가", "상품정가"],
        주문금액: ["주문금액"],
        포인트: ["포인트"],
        쿠폰: ["쿠폰", "쿠폰 (:할인)", "쿠폰(:할인)"],
        결제금액: ["결제금액", "결제매출"],
        환불금액: ["환불금액"],
      };

      // 필수 헤더 확인
      const hasStatus = possibleHeaders.상태.some((h) => headers.includes(h));
      const hasDate = possibleHeaders.날짜.some((h) => headers.includes(h));
      const hasSeller = possibleHeaders.판매자.some((h) => headers.includes(h));
      const hasBuyer = possibleHeaders.구매자.some((h) => headers.includes(h));

      if (!hasStatus || !hasDate || !hasSeller || !hasBuyer) {
        toast({
          title: "경고",
          description: "엑셀 파일의 필수 헤더(상태, 날짜/결제일, 판매자, 구매자)가 없습니다. 계속 진행합니다.",
        });
      }

      // 데이터 파싱 (최대 10개 행만 미리보기)
      const parsedData: ParsedRow[] = [];
      for (let i = 1; i < Math.min(data.length, 11); i++) {
        const row = data[i] as any[];
        if (!row || row.length === 0) continue;
        if (row.every((cell) => !cell || cell === "")) continue;

        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index];
        });

        // 숫자 변환
        const parseNum = (val: any): number => {
          if (typeof val === "number") return val;
          if (typeof val === "string") {
            const cleaned = val.replace(/,/g, "").trim();
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          }
          return 0;
        };

        // 헤더 매핑 (여러 가능한 헤더명 지원)
        const getValue = (keys: string[]) => {
          for (const key of keys) {
            const idx = headers.indexOf(key);
            if (idx >= 0 && row[idx] !== undefined && row[idx] !== "") {
              return row[idx];
            }
          }
          return "";
        };

        parsedData.push({
          상태: String(getValue(possibleHeaders.상태) || ""),
          날짜: String(getValue(possibleHeaders.날짜) || ""),
          환불일: String(getValue(possibleHeaders.환불일) || ""),
          판매자: String(getValue(possibleHeaders.판매자) || ""),
          구매자: String(getValue(possibleHeaders.구매자) || ""),
          판매구분: String(getValue(possibleHeaders.판매구분) || ""),
          상품: String(getValue(possibleHeaders.상품) || ""),
          정가: parseNum(getValue(possibleHeaders.정가)),
          주문금액: parseNum(getValue(possibleHeaders.주문금액)),
          포인트: parseNum(getValue(possibleHeaders.포인트) || 0),
          쿠폰: parseNum(getValue(possibleHeaders.쿠폰) || 0),
          결제금액: parseNum(getValue(possibleHeaders.결제금액) || 0),
          환불금액: parseNum(getValue(possibleHeaders.환불금액) || 0),
        });
      }

      setPreviewData(parsedData);
    } catch (error) {
      console.error("File parsing error:", error);
      toast({
        title: "오류",
        description: "엑셀 파일을 읽는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      setFile(null);
      setPreviewData([]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!file || !reportId) {
      toast({
        title: "오류",
        description: "파일과 주간 보고서를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("reportId", reportId);

      const response = await fetch("/api/upload/revenue", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "업로드 실패");
      }

      toast({
        title: "성공",
        description: result.message || "데이터가 성공적으로 업로드되었습니다.",
      });

      // 초기화
      setFile(null);
      setPreviewData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(num);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>매출 데이터 엑셀 업로드</CardTitle>
        <CardDescription>
          결제 시스템에서 다운로드한 엑셀 파일을 업로드하여 자동으로 매출 데이터를 저장합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 파일 업로드 영역 */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInputChange}
            className="hidden"
            id="revenue-file-input"
          />
          <label htmlFor="revenue-file-input" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-2">
              {file ? file.name : "엑셀 파일을 드래그하거나 클릭하여 선택하세요"}
            </p>
            <p className="text-xs text-muted-foreground">
              지원 형식: .xlsx, .xls
            </p>
          </label>
        </div>

        {/* 미리보기 테이블 */}
        {previewData.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">미리보기 (최대 10개 행)</h3>
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>
            <div className="border rounded-md overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상태</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>환불일</TableHead>
                    <TableHead>판매자</TableHead>
                    <TableHead>구매자</TableHead>
                    <TableHead>판매구분</TableHead>
                    <TableHead>상품</TableHead>
                    <TableHead className="text-right">정가</TableHead>
                    <TableHead className="text-right">주문금액</TableHead>
                    <TableHead className="text-right">포인트</TableHead>
                    <TableHead className="text-right">쿠폰</TableHead>
                    <TableHead className="text-right">결제금액</TableHead>
                    <TableHead className="text-right">환불금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          row.상태 === "결" 
                            ? "bg-green-100 text-green-800" 
                            : row.상태 === "환"
                            ? "bg-red-100 text-red-800"
                            : ""
                        }`}>
                          {row.상태}
                        </span>
                      </TableCell>
                      <TableCell>{row.날짜}</TableCell>
                      <TableCell>{row.환불일 || "-"}</TableCell>
                      <TableCell>{row.판매자}</TableCell>
                      <TableCell>{row.구매자}</TableCell>
                      <TableCell>{row.판매구분}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{row.상품}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.정가)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.주문금액)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.포인트)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.쿠폰)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(row.결제금액)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {row.환불금액 > 0 ? formatNumber(row.환불금액) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* 업로드 버튼 */}
        {file && previewData.length > 0 && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setPreviewData([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={uploading}
            >
              취소
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !reportId}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                "저장하기"
              )}
            </Button>
          </div>
        )}

        {!reportId && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileX className="h-4 w-4" />
            <span>주간 보고서를 선택해주세요.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

