"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SalesTransaction } from "@/lib/types";

interface ProductAnalysisTabProps {
  currentWeekTx: SalesTransaction[];
  allTransactions: SalesTransaction[];
}

export function ProductAnalysisTab({
  currentWeekTx,
  allTransactions,
}: ProductAnalysisTabProps) {
  
  // 1타 vs 일반 비율 추이 (2025년 월별)
  const calculate1taRatio = () => {
    const monthlyMap = new Map<
      number,
      { total: number; oneTa: number; general: number }
    >();

    allTransactions.forEach((tx) => {
      if (tx.payment_date && tx.status === "결") {
        const date = new Date(tx.payment_date);
        const year = date.getFullYear();
        if (year !== 2025) return;
        
        const month = date.getMonth() + 1;
        // 건수: payment_count_refined 사용
        const count = tx.payment_count_refined || 0;

        const existing = monthlyMap.get(month) || {
          total: 0,
          oneTa: 0,
          general: 0,
        };
        existing.total += count;

        if (tx.product_type === "1타") {
          existing.oneTa += count;
        } else if (tx.product_type === "일반") {
          existing.general += count;
        }

        monthlyMap.set(month, existing);
      }
    });

    const monthNames = [
      "1월",
      "2월",
      "3월",
      "4월",
      "5월",
      "6월",
      "7월",
      "8월",
      "9월",
      "10월",
      "11월",
      "12월",
    ];

    return monthNames.map((name, index) => {
      const month = index + 1;
      const data = monthlyMap.get(month) || { total: 0, oneTa: 0, general: 0 };
      const oneTaRatio =
        data.total > 0 ? (data.oneTa / (data.oneTa + data.general)) * 100 : 0;

      return {
        month: name,
        oneTaCount: data.oneTa,
        generalCount: data.general,
        ratio: oneTaRatio,
      };
    });
  };

  // 주차별 판매 현황
  const calculateWeeksPerformance = () => {
    const weeksData = new Map<
      string,
      { currentCount: number; currentRevenue: number; prevYearCount: number }
    >();

    // 현재 주차 데이터
    currentWeekTx.forEach((tx) => {
      const weeksNum = tx.weeks ? Number(tx.weeks) : null;
      if (weeksNum && [20, 26, 32, 40].includes(weeksNum)) {
        const existing = weeksData.get(String(weeksNum)) || {
          currentCount: 0,
          currentRevenue: 0,
          prevYearCount: 0,
        };
        // 건수: payment_count_refined 사용
        existing.currentCount += tx.payment_count_refined || 0;
        // 매출: 모든 거래의 payment_amount 합산
        existing.currentRevenue += tx.payment_amount || 0;
        weeksData.set(String(weeksNum), existing);
      }
    });

    // 전년 동기 데이터 (간단히 전체 2024년 데이터로 추정)
    allTransactions.forEach((tx) => {
      const weeksNum3 = tx.weeks ? Number(tx.weeks) : null;
      if (tx.payment_date && tx.status === "결" && weeksNum3 && [20, 26, 32, 40].includes(weeksNum3)) {
        const date = new Date(tx.payment_date);
        const year = date.getFullYear();
        if (year !== 2024) return;
        const existing = weeksData.get(String(weeksNum3)) || {
          currentCount: 0,
          currentRevenue: 0,
          prevYearCount: 0,
        };
        // 건수: payment_count_refined 사용
        existing.prevYearCount += (tx as any).payment_count_refined || 0;
        weeksData.set(String(weeksNum3), existing);
      }
    });

    return [20, 26, 32, 40].map((weeks) => {
      const data = weeksData.get(String(weeks)) || {
        currentCount: 0,
        currentRevenue: 0,
        prevYearCount: 0,
      };
      const avgPrice =
        data.currentCount > 0 ? data.currentRevenue / data.currentCount : 0;
      const change =
        data.prevYearCount > 0
          ? ((data.currentCount - data.prevYearCount) / data.prevYearCount) *
            100
          : 0;

      return {
        weeks,
        currentCount: data.currentCount,
        prevYearCount: data.prevYearCount,
        avgPrice,
        change,
      };
    });
  };

  const oneTaRatio = calculate1taRatio();
  const weeksPerformance = calculateWeeksPerformance();

  const formatCurrency = (amount: number) => {
    const millions = Math.floor(amount / 10000);
    return `${millions.toLocaleString()}만`;
  };

  const minRatio = Math.min(...oneTaRatio.filter((m) => m.ratio > 0).map((m) => m.ratio));
  const maxRatio = Math.max(...oneTaRatio.map((m) => m.ratio));

  return (
    <div className="space-y-6">
      {/* 1타 비율 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 1타 비율 추이 (2025년)</CardTitle>
          <p className="text-sm text-gray-500">월별 1타 상품 비중</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-6 gap-3">
            {oneTaRatio.slice(0, 6).map((item) => (
              <div
                key={item.month}
                className={`text-center p-3 rounded-lg border ${
                  item.ratio === 0
                    ? "bg-gray-50 border-gray-200"
                    : item.ratio === minRatio && item.ratio > 0
                    ? "bg-red-50 border-red-200"
                    : item.ratio === maxRatio
                    ? "bg-blue-50 border-blue-300"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="text-xs text-gray-600 mb-1">{item.month}</div>
                <div
                  className={`text-xl font-bold ${
                    item.ratio === 0
                      ? "text-gray-400"
                      : item.ratio === minRatio && item.ratio > 0
                      ? "text-red-600"
                      : item.ratio === maxRatio
                      ? "text-blue-600"
                      : "text-gray-900"
                  }`}
                >
                  {item.ratio > 0 ? `${item.ratio.toFixed(0)}%` : "-"}
                </div>
                {item.ratio === minRatio && item.ratio > 0 && (
                  <Badge className="mt-1 text-xs bg-red-100 text-red-800 border-red-200">
                    최저
                  </Badge>
                )}
                {item.ratio === maxRatio && item.ratio > 0 && (
                  <Badge className="mt-1 text-xs bg-blue-100 text-blue-800 border-blue-200">
                    최고
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-6 gap-3">
            {oneTaRatio.slice(6, 12).map((item) => (
              <div
                key={item.month}
                className={`text-center p-3 rounded-lg border ${
                  item.ratio === 0
                    ? "bg-gray-50 border-gray-200"
                    : item.ratio === minRatio && item.ratio > 0
                    ? "bg-red-50 border-red-200"
                    : item.ratio === maxRatio
                    ? "bg-blue-50 border-blue-300"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="text-xs text-gray-600 mb-1">{item.month}</div>
                <div
                  className={`text-xl font-bold ${
                    item.ratio === 0
                      ? "text-gray-400"
                      : item.ratio === minRatio && item.ratio > 0
                      ? "text-red-600"
                      : item.ratio === maxRatio
                      ? "text-blue-600"
                      : "text-gray-900"
                  }`}
                >
                  {item.ratio > 0 ? `${item.ratio.toFixed(0)}%` : "-"}
                </div>
                {item.ratio === minRatio && item.ratio > 0 && (
                  <Badge className="mt-1 text-xs bg-red-100 text-red-800 border-red-200">
                    최저
                  </Badge>
                )}
                {item.ratio === maxRatio && item.ratio > 0 && (
                  <Badge className="mt-1 text-xs bg-blue-100 text-blue-800 border-blue-200">
                    최고
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* 인사이트 */}
          {minRatio < 35 && minRatio > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-blue-600 font-medium">💡 인사이트:</span>
              <span className="text-blue-800 ml-2">
                {oneTaRatio.find((m) => m.ratio === minRatio)?.month} 1타 비율
                급감 ({minRatio.toFixed(0)}%) → 시즌 영향 분석 필요
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 주차별 판매 현황 */}
      <Card>
        <CardHeader className="relative">
          <CardTitle className="text-lg">📦 주차별 판매 현황</CardTitle>
          <p className="text-sm text-gray-500">이번 주 vs 전년 동기</p>
          <div className="absolute top-4 right-4 text-xs text-gray-500">
            단위: 만원
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">주차</TableHead>
                <TableHead className="text-center">주간</TableHead>
                <TableHead className="text-center">전년동기</TableHead>
                <TableHead className="text-center">변화</TableHead>
                <TableHead className="text-center">객단가</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeksPerformance.map((item) => {
                const isMain = item.currentCount >= 2;
                return (
                  <TableRow
                    key={item.weeks}
                    className={isMain ? "bg-blue-50" : ""}
                  >
                    <TableCell className="text-center font-semibold">
                      {item.weeks}주
                      {isMain && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                          ⭐ 주력
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {item.currentCount}건
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {item.prevYearCount}건
                    </TableCell>
                    <TableCell className="text-center">
                      {item.change !== 0 ? (
                        <span
                          className={
                            item.change > 0 ? "text-red-600" : "text-blue-600"
                          }
                        >
                          {item.change > 0 ? "▼" : "▲"}
                          {Math.abs(item.change).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-gray-700">
                      {item.avgPrice > 0 ? formatCurrency(item.avgPrice) : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* 인사이트 */}
          {weeksPerformance.filter((w) => w.currentCount >= 2).length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-blue-600 font-medium">💡 인사이트:</span>
              <span className="text-blue-800 ml-2">
                {weeksPerformance
                  .filter((w) => w.currentCount >= 2)
                  .map((w) => `${w.weeks}주`)
                  .join("+")}
                가 주력 (
                {weeksPerformance
                  .filter((w) => w.currentCount >= 2)
                  .reduce((sum, w) => sum + w.currentCount, 0)}
                건,{" "}
                {(
                  (weeksPerformance
                    .filter((w) => w.currentCount >= 2)
                    .reduce((sum, w) => sum + w.currentCount, 0) /
                    weeksPerformance.reduce(
                      (sum, w) => sum + w.currentCount,
                      0
                    )) *
                  100
                ).toFixed(0)}
                %)
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

