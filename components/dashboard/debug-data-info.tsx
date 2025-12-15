"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Calendar, TrendingUp, Users, AlertCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface DebugDataInfoProps {
  reportId: string | null;
  reportTitle: string | null;
  transactionCount: number;
  transactions2024Count: number;
  transactions2025Count: number;
  resourcesCount: number;
  mentoringCount: number;
  weeksList: string[];
  dateRange: { min: string; max: string } | null;
}

export function DebugDataInfo({
  reportId,
  reportTitle,
  transactionCount,
  transactions2024Count,
  transactions2025Count,
  resourcesCount,
  mentoringCount,
  weeksList,
  dateRange,
}: DebugDataInfoProps) {
  const hasData = transactionCount > 0;
  const has2024Data = transactions2024Count > 0;
  const has2025Data = transactions2025Count > 0;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-amber-900 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          데이터 로드 현황 (디버그)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" defaultValue="summary">
          <AccordionItem value="summary">
            <AccordionTrigger value="summary" className="text-sm font-semibold">
              📊 요약 정보
            </AccordionTrigger>
            <AccordionContent value="summary">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-slate-700">선택된 주차:</span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {reportTitle || "선택 안됨"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-600" />
                    <span className="text-slate-700">Report ID:</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {reportId || "없음"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs text-slate-600 mb-1">총 거래 건수</p>
                    <p className="text-2xl font-bold text-slate-900">{transactionCount}</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border-l-4 border-emerald-500">
                    <p className="text-xs text-slate-600 mb-1">주차 수</p>
                    <p className="text-2xl font-bold text-slate-900">{weeksList.length}</p>
                  </div>
                </div>

                {!hasData && (
                  <div className="p-4 bg-rose-100 border border-rose-300 rounded-lg">
                    <p className="text-sm font-semibold text-rose-900 mb-1">
                      ⚠️ 데이터가 없습니다!
                    </p>
                    <p className="text-xs text-rose-700">
                      현재 선택된 주차에 연결된 sales_transactions 데이터가 없습니다.
                      엑셀 업로드를 먼저 진행해주세요.
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="yearly">
            <AccordionTrigger value="yearly" className="text-sm font-semibold">
              📅 연도별 데이터
            </AccordionTrigger>
            <AccordionContent value="yearly">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">2024년 거래:</span>
                  </div>
                  <Badge variant={has2024Data ? "default" : "secondary"} className="font-mono">
                    {transactions2024Count}건
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-slate-700">2025년 거래:</span>
                  </div>
                  <Badge variant={has2025Data ? "default" : "secondary"} className="font-mono">
                    {transactions2025Count}건
                  </Badge>
                </div>

                {dateRange && (
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">거래 기간</p>
                    <p className="text-sm font-mono text-slate-900">
                      {dateRange.min} ~ {dateRange.max}
                    </p>
                  </div>
                )}

                {!has2024Data && has2025Data && (
                  <div className="p-3 bg-amber-100 border border-amber-300 rounded-lg">
                    <p className="text-xs text-amber-900">
                      ℹ️ 2024년 데이터가 없어 전년 대비 분석이 제한됩니다.
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="weeks">
            <AccordionTrigger value="weeks" className="text-sm font-semibold">
              📆 주차별 데이터
            </AccordionTrigger>
            <AccordionContent value="weeks">
              <div className="space-y-2">
                {weeksList.length === 0 ? (
                  <p className="text-sm text-slate-500 p-3 bg-white rounded-lg">
                    주차 정보가 없습니다.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {weeksList.map((week, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="bg-white hover:bg-slate-50"
                      >
                        {week}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="other">
            <AccordionTrigger value="other" className="text-sm font-semibold">
              🔧 기타 데이터
            </AccordionTrigger>
            <AccordionContent value="other">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-600" />
                    <span className="text-slate-700">컨설턴트 리소스:</span>
                  </div>
                  <Badge variant="outline">{resourcesCount}건</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-slate-700">멘토링 보고:</span>
                  </div>
                  <Badge variant="outline">{mentoringCount}건</Badge>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            💡 <strong>Tip:</strong> 데이터가 없다면{" "}
            <a href="/admin/education" className="underline font-semibold">
              교육사업본부 관리 페이지
            </a>
            에서 엑셀 파일을 업로드하세요.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


