"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

interface KpiData {
  totalSpend: number;
  totalDb: number;
  avgCpa: number;
  conversionRate: number;
  prevWeek: {
    totalSpend: number;
    totalDb: number;
    avgCpa: number;
    conversionRate: number;
  };
}

interface KpiSummaryCardsProps {
  data: KpiData;
}

interface KpiCardProps {
  title: string;
  value: string;
  changeRate: number;
  isPositiveGood?: boolean;
}

function KpiCard({ title, value, changeRate, isPositiveGood = true }: KpiCardProps) {
  const isIncrease = changeRate > 0;
  const isGood = isPositiveGood ? isIncrease : !isIncrease;
  
  const changeColor = isGood ? "text-blue-600" : "text-red-600";
  const bgColor = isGood ? "bg-blue-50" : "bg-red-50";
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <div className={`flex items-center gap-1 text-sm font-semibold ${changeColor}`}>
            {isIncrease ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {isIncrease ? "▲" : "▼"} {Math.abs(changeRate).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 ml-1">(전주 대비)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiSummaryCards({ data }: KpiSummaryCardsProps) {
  // 전주 대비 증감율 계산
  const spendChange = data.prevWeek.totalSpend
    ? ((data.totalSpend - data.prevWeek.totalSpend) / data.prevWeek.totalSpend) * 100
    : 0;

  const dbChange = data.prevWeek.totalDb
    ? ((data.totalDb - data.prevWeek.totalDb) / data.prevWeek.totalDb) * 100
    : 0;

  const cpaChange = data.prevWeek.avgCpa
    ? ((data.avgCpa - data.prevWeek.avgCpa) / data.prevWeek.avgCpa) * 100
    : 0;

  const conversionChange = data.prevWeek.conversionRate
    ? ((data.conversionRate - data.prevWeek.conversionRate) / data.prevWeek.conversionRate) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="총 광고비"
        value={formatCurrency(data.totalSpend)}
        changeRate={spendChange}
        isPositiveGood={false} // 광고비는 낮은 게 좋음
      />
      <KpiCard
        title="총 DB 수"
        value={`${data.totalDb.toLocaleString("ko-KR")}건`}
        changeRate={dbChange}
        isPositiveGood={true} // DB 수는 높은 게 좋음
      />
      <KpiCard
        title="평균 CPA"
        value={formatCurrency(data.avgCpa)}
        changeRate={cpaChange}
        isPositiveGood={false} // CPA는 낮은 게 좋음
      />
      <KpiCard
        title="상담 전환율"
        value={formatPercent(data.conversionRate)}
        changeRate={conversionChange}
        isPositiveGood={true} // 전환율은 높은 게 좋음
      />
    </div>
  );
}




