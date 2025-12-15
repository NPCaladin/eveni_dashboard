"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { SalesTransaction } from "@/lib/types";

interface TrendTabProps {
  currentWeekTx: SalesTransaction[];
  prevWeekTx: SalesTransaction[];
  allTransactions: SalesTransaction[];
}

export function TrendTab({
  currentWeekTx,
  prevWeekTx,
  allTransactions,
}: TrendTabProps) {
  
  // 전년 대비 월별 성과
  const calculateYoYComparison = () => {
    const monthly2024 = new Map<number, number>();
    const monthly2025 = new Map<number, number>();

    allTransactions.forEach((tx) => {
      if ((tx as any).payment_date && tx.status === "결" && tx.payment_amount) {
        const dateStr = typeof (tx as any).payment_date === 'string' ? (tx as any).payment_date : String((tx as any).payment_date);
        const date = new Date(dateStr);
        
        // 유효한 날짜인지 확인
        if (isNaN(date.getTime())) return;
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        // 매출: 모든 거래 합산 (payment_count_refined 체크 제거)
        const revenue = tx.payment_amount || 0;

        if (year === 2024) {
          monthly2024.set(month, (monthly2024.get(month) || 0) + revenue);
        } else if (year === 2025) {
          monthly2025.set(month, (monthly2025.get(month) || 0) + revenue);
        }
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
      const revenue2024 = monthly2024.get(month) || 0;
      const revenue2025 = monthly2025.get(month) || 0;
      const change =
        revenue2024 > 0 ? ((revenue2025 - revenue2024) / revenue2024) * 100 : 0;

      return {
        month: name,
        revenue2024,
        revenue2025,
        change,
      };
    });
  };

  // 고객 분석
  const calculateCustomerAnalysis = () => {
    const newCustomers = currentWeekTx.filter(
      (tx) =>
        tx.sales_type === "신규" ||
        tx.sales_type === "분할" ||
        tx.sales_type === "완납"
    );
    const retentionCustomers = currentWeekTx.filter(
      (tx) => tx.sales_type?.includes("재결제") || tx.sales_type?.includes("리텐션")
    );

    const newCount = newCustomers.reduce(
      (sum, tx) => sum + (tx.payment_count_refined || 0),
      0
    );
    const retentionCount = retentionCustomers.reduce(
      (sum, tx) => sum + (tx.payment_count_refined || 0),
      0
    );
    const totalCount = newCount + retentionCount;

    const newShare = totalCount > 0 ? (newCount / totalCount) * 100 : 0;
    const retentionShare = totalCount > 0 ? (retentionCount / totalCount) * 100 : 0;

    // 상품 업그레이드 (간단 추정: 26→32, 32→40)
    const upgrades = {
      "20→26": 0,
      "26→32": currentWeekTx.filter((tx) => Number((tx as any).weeks) === 32 && (tx as any).sale_type?.includes("재결제")).length,
      "32→40": currentWeekTx.filter((tx) => Number((tx as any).weeks) === 40 && (tx as any).sale_type?.includes("재결제")).length,
    };

    return {
      newCount,
      retentionCount,
      totalCount,
      newShare,
      retentionShare,
      upgrades,
    };
  };

  const yoyData = calculateYoYComparison();
  const customerData = calculateCustomerAnalysis();

  const formatCurrency = (amount: number) => {
    const eok = amount / 100000000;
    if (eok >= 1) {
      return `${eok.toFixed(1)}억`;  // 1.8억, 2.3억 같이 표시
    }
    const man = Math.floor(amount / 10000);
    return `${man.toLocaleString()}만`;
  };

  const maxDecline = Math.min(...yoyData.filter((m) => m.change < 0).map((m) => m.change));

  return (
    <div className="space-y-6">
      {/* 전년 대비 월별 성과 */}
      <Card>
        <CardHeader className="relative">
          <CardTitle className="text-lg">📈 2025 vs 2024 전년 대비</CardTitle>
          <p className="text-sm text-gray-500">월별 매출 증감률</p>
          <div className="absolute top-4 right-4 text-xs text-gray-500">
            단위: 만원/억
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {yoyData.slice(0, 11).map((item) => (
            <div key={item.month} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 w-12">
                    {item.month}
                  </span>
                  {item.change > 0 ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      ▲ {item.change.toFixed(1)}%
                    </Badge>
                  ) : item.change < 0 ? (
                    <Badge
                      className={`${
                        item.change <= -50
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-orange-100 text-orange-800 border-orange-200"
                      }`}
                    >
                      ▼ {Math.abs(item.change).toFixed(1)}%
                      {item.change === maxDecline && " ⚠️"}
                    </Badge>
                  ) : null}
                </div>
                <div className="text-right text-sm">
                  <span className="text-gray-600">
                    {formatCurrency(item.revenue2024)}
                  </span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span
                    className={`font-semibold ${
                      item.change > 0
                        ? "text-green-600"
                        : item.change < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {formatCurrency(item.revenue2025)}
                  </span>
                </div>
              </div>
              <Progress
                value={item.change > 0 ? 100 : Math.max(0, 100 + item.change)}
                className="h-2"
                style={
                  {
                    "--progress-background": item.change > 0 ? "#10B981" : "#EF4444",
                  } as React.CSSProperties
                }
              />
            </div>
          ))}

          {/* 인사이트 */}
          {maxDecline < -40 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-blue-600 font-medium">💡 인사이트:</span>
              <span className="text-blue-800 ml-2">
                {yoyData.find((m) => m.change === maxDecline)?.month} 하락폭 가장
                큼 ({maxDecline.toFixed(1)}%) → 원인 분석 필요
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 고객 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">👤 고객 분석</CardTitle>
          <p className="text-sm text-gray-500">이번 주 기준</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 신규 vs 재결제 */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-3">
              신규 vs 재결제
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">신규</span>
                  <span className="font-semibold text-gray-900">
                    {customerData.newCount}명 ({customerData.newShare.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={customerData.newShare} className="h-3" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">재결제</span>
                  <span className="font-semibold text-gray-900">
                    {customerData.retentionCount}명 (
                    {customerData.retentionShare.toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  value={customerData.retentionShare}
                  className="h-3"
                  style={
                    {
                      "--progress-background": "#8B5CF6",
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
          </div>

          {/* 상품 업그레이드 현황 */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-3">
              상품 업그레이드 현황
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">20주 → 26주</span>
                <span className="font-semibold text-gray-900">
                  {customerData.upgrades["20→26"]}건
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">26주 → 32주</span>
                <span className="font-semibold text-gray-900">
                  {customerData.upgrades["26→32"]}건
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">32주 → 40주</span>
                <span className="font-semibold text-gray-900">
                  {customerData.upgrades["32→40"]}건
                </span>
              </div>
            </div>
          </div>

          {/* 인사이트 */}
          {customerData.retentionShare < 20 && customerData.totalCount > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-blue-600 font-medium">💡 인사이트:</span>
              <span className="text-blue-800 ml-2">
                재결제 비율 낮음 ({customerData.retentionShare.toFixed(1)}%) →
                기존 고객 리텐션 전략 필요
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

