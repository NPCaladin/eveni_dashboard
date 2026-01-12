"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatManwon } from "@/lib/utils/format";

interface MetricCardProps {
  title: string;
  icon: string;
  mainValue: string;
  subValue?: string;
  comparisons?: {
    label: string;
    value: number;
    type: "increase" | "decrease";
  }[];
  cardType?: "default" | "negative";
}

const MetricCard = memo(function MetricCard({
  title,
  icon,
  mainValue,
  subValue,
  comparisons,
  cardType = "default",
}: MetricCardProps) {
  const isNegative = cardType === "negative";

  return (
    <Card
      className={`${
        isNegative ? "bg-red-50 border-red-100" : "bg-white"
      } hover:shadow-lg transition-shadow`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-3xl font-bold mb-1 ${
            isNegative ? "text-red-600" : "text-gray-900"
          }`}
        >
          {mainValue}
        </div>
        {subValue && (
          <div className="text-sm text-gray-500 mb-3">{subValue}</div>
        )}
        {comparisons && comparisons.length > 0 && (
          <div className="space-y-1">
            {comparisons.map((comp, index) => (
              <div
                key={index}
                className={`flex items-center gap-1 text-sm font-medium ${
                  comp.type === "increase"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {comp.type === "increase" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {comp.type === "increase" ? "▲" : "▼"}{" "}
                  {Math.abs(comp.value).toFixed(1)}% {comp.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

interface RevenueMetricCardsProps {
  grossRevenue: number;
  grossCount: number;
  refundAmount: number;
  refundCount: number;
  netRevenue: number;
  prevWeekGross?: number;
  prevYearGross?: number;
  prevWeekNet?: number;
  prevYearNet?: number;
  prevWeekRefund?: number;
  prevYearRefund?: number;
}

export const RevenueMetricCards = memo(function RevenueMetricCards({
  grossRevenue,
  grossCount,
  refundAmount,
  refundCount,
  netRevenue,
  prevWeekGross,
  prevYearGross,
  prevWeekNet,
  prevYearNet,
  prevWeekRefund,
  prevYearRefund,
}: RevenueMetricCardsProps) {
  // 포맷 함수는 lib/utils/format.ts에서 import
  const formatCurrency = formatManwon;

  // 증감률 계산
  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: change,
      type: change >= 0 ? ("increase" as const) : ("decrease" as const),
    };
  };

  // 실매출 비교
  const grossComparisons = [];
  const grossPrevWeekChange = calculateChange(grossRevenue, prevWeekGross);
  if (grossPrevWeekChange) {
    grossComparisons.push({ label: "전주", ...grossPrevWeekChange });
  }
  const grossPrevYearChange = calculateChange(grossRevenue, prevYearGross);
  if (grossPrevYearChange) {
    grossComparisons.push({ label: "전년", ...grossPrevYearChange });
  }

  // 순매출 비교
  const netComparisons = [];
  const netPrevWeekChange = calculateChange(netRevenue, prevWeekNet);
  if (netPrevWeekChange) {
    netComparisons.push({ label: "전주", ...netPrevWeekChange });
  }
  const netPrevYearChange = calculateChange(netRevenue, prevYearNet);
  if (netPrevYearChange) {
    netComparisons.push({ label: "전년", ...netPrevYearChange });
  }

  // 환불 비교 (환불이 감소하면 긍정적이므로 반대로 표시)
  const refundComparisons = [];
  const refundPrevWeekChange = calculateChange(refundAmount, prevWeekRefund);
  if (refundPrevWeekChange) {
    // 환불이 감소했으면 긍정적 (초록색), 증가했으면 부정적 (빨강색)
    refundComparisons.push({
      label: "전주",
      value: refundPrevWeekChange.value,
      type:
        refundPrevWeekChange.type === "decrease"
          ? ("increase" as const)
          : ("decrease" as const),
    });
  }
  const refundPrevYearChange = calculateChange(refundAmount, prevYearRefund);
  if (refundPrevYearChange) {
    refundComparisons.push({
      label: "전년",
      value: refundPrevYearChange.value,
      type:
        refundPrevYearChange.type === "decrease"
          ? ("increase" as const)
          : ("decrease" as const),
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="relative">
        <div className="absolute top-2 right-2 text-xs text-gray-400">
          단위: 만원
        </div>
        <MetricCard
          title="실매출"
          icon="💰"
          mainValue={formatCurrency(grossRevenue)}
          subValue={`${grossCount}건`}
          comparisons={grossComparisons}
        />
      </div>
      <div className="relative">
        <div className="absolute top-2 right-2 text-xs text-gray-400">
          단위: 만원
        </div>
        <MetricCard
          title="환불"
          icon="💸"
          mainValue={formatCurrency(refundAmount)}
          subValue={`${refundCount}건`}
          comparisons={refundComparisons}
          cardType="negative"
        />
      </div>
      <div className="relative">
        <div className="absolute top-2 right-2 text-xs text-gray-400">
          단위: 만원
        </div>
        <MetricCard
          title="순매출"
          icon="📊"
          mainValue={formatCurrency(netRevenue)}
          comparisons={netComparisons}
        />
      </div>
    </div>
  );
});

