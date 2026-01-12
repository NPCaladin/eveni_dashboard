"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatManwon } from "@/lib/utils/format";

interface RefundCardProps {
  title: string;
  count: number;
  amount: number;
  prevAmount?: number;
  prevLabel?: string;
  showRefundRate?: boolean;
  refundRate?: number;
}

const RefundCard = memo(function RefundCard({
  title,
  count,
  amount,
  prevAmount,
  prevLabel,
  showRefundRate,
  refundRate,
}: RefundCardProps) {
  // 포맷 함수는 lib/utils/format.ts에서 import
  const formatCurrency = formatManwon;

  const formatBigCurrency = (amt: number) => {
    const billions = amt / 100000000;
    return `${billions.toFixed(2)}억`;
  };

  // 증감률 계산 (환불이 감소하면 긍정적이므로 반대로 표시)
  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      // 환불 감소 = 긍정 (초록), 환불 증가 = 부정 (빨강)
      type: change < 0 ? ("increase" as const) : ("decrease" as const),
      direction: change < 0 ? "▼" : "▲",
    };
  };

  const changeData = calculateChange(amount, prevAmount);

  return (
    <Card className="bg-red-50 border-red-100 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-red-700">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-600 mb-1">
          {count}건
        </div>
        <div className="text-xl font-semibold text-red-600 mb-3">
          {amount >= 100000000 ? formatBigCurrency(amount) : formatCurrency(amount)}
        </div>
        {changeData && prevLabel && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              changeData.type === "increase"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {changeData.type === "increase" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {changeData.direction} {changeData.value.toFixed(1)}% {prevLabel}
            </span>
          </div>
        )}
        {showRefundRate && refundRate !== undefined && (
          <div className="text-sm text-red-700 mt-2">
            환불률 {refundRate.toFixed(2)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
});

interface RefundSummaryCardsProps {
  weeklyCount: number;
  weeklyAmount: number;
  monthlyCount: number;
  monthlyAmount: number;
  yearlyCount: number;
  yearlyAmount: number;
  prevWeekAmount?: number;
  prevYearAmount?: number;
  yearlyRefundRate?: number;
  currentMonth: number; // 1-12
}

export const RefundSummaryCards = memo(function RefundSummaryCards({
  weeklyCount,
  weeklyAmount,
  monthlyCount,
  monthlyAmount,
  yearlyCount,
  yearlyAmount,
  prevWeekAmount,
  prevYearAmount,
  yearlyRefundRate,
  currentMonth,
}: RefundSummaryCardsProps) {
  // 월 이름 변환
  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];
  const monthLabel = monthNames[currentMonth - 1] || "12월";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="relative">
        <div className="absolute top-2 right-2 text-xs text-gray-400 z-10">
          단위: 만원
        </div>
        <RefundCard
          title="🔴 주간 환불"
          count={weeklyCount}
          amount={weeklyAmount}
          prevAmount={prevWeekAmount}
          prevLabel="전주"
        />
      </div>
      <div className="relative">
        <div className="absolute top-2 right-2 text-xs text-gray-400 z-10">
          단위: 만원
        </div>
        <RefundCard
          title={`📅 ${monthLabel} 누적`}
          count={monthlyCount}
          amount={monthlyAmount}
        />
      </div>
      <div className="relative">
        <div className="absolute top-2 right-2 text-xs text-gray-400 z-10">
          단위: 억
        </div>
        <RefundCard
          title="📊 2025년 누적"
          count={yearlyCount}
          amount={yearlyAmount}
          prevAmount={prevYearAmount}
          prevLabel="전년"
          showRefundRate
          refundRate={yearlyRefundRate}
        />
      </div>
    </div>
  );
});
