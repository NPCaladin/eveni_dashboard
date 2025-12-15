"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface KPIData {
  weeklyNetRevenue: number;
  weeklyGrossRevenue: number;
  refundAmount: number;
  orderAmount: number;
  prevWeekNetRevenue: number;
  yoyNetRevenue: number;
  tier1SharePercent: number;
  prevTier1SharePercent: number;
  retentionRate: number;
  newCustomerCount: number;
  recentWeeksData: Array<{ week: string; revenue: number }>;
}

interface PremiumKPICardsProps {
  data: KPIData | null;
  loading: boolean;
}

export function PremiumKPICards({ data, loading }: PremiumKPICardsProps) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-slate-200">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-40 mb-3" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    const billion = Math.floor(value / 100000000);
    const million = Math.floor((value % 100000000) / 10000);
    if (billion > 0) {
      return `${billion.toLocaleString()}억 ${million.toLocaleString()}만원`;
    }
    return `${million.toLocaleString()}만원`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // 1. Weekly Net Revenue
  const netRevenue = data.weeklyNetRevenue;
  const prevChange =
    data.prevWeekNetRevenue > 0
      ? ((netRevenue - data.prevWeekNetRevenue) / data.prevWeekNetRevenue) * 100
      : 0;
  const yoyChange =
    data.yoyNetRevenue > 0
      ? ((netRevenue - data.yoyNetRevenue) / data.yoyNetRevenue) * 100
      : 0;

  // 2. Conversion Health Score
  const healthScore = data.orderAmount > 0 
    ? (data.weeklyNetRevenue / data.orderAmount) * 100 
    : 0;
  const refundRate = data.orderAmount > 0 
    ? (data.refundAmount / data.orderAmount) * 100 
    : 0;
  
  let healthColor = "bg-emerald-500";
  let healthBadge = "우수";
  if (refundRate >= 20) {
    healthColor = "bg-rose-500";
    healthBadge = "위험";
  } else if (refundRate >= 10) {
    healthColor = "bg-amber-500";
    healthBadge = "경고";
  }

  // 3. Product Mix (1타 집중도)
  const tier1Change = data.tier1SharePercent - data.prevTier1SharePercent;
  const tier1Trend = tier1Change > 0 ? "증가 중" : tier1Change < 0 ? "감소 중" : "유지";

  // 4. Retention Rate
  const retentionTrend = data.retentionRate >= 20 ? "excellent" : data.retentionRate >= 10 ? "good" : "needs-attention";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Weekly Net Revenue */}
      <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            주간 매출 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 실매출 */}
          <div className="mb-2">
            <p className="text-xs text-slate-500 mb-1">실매출</p>
            <div className="text-xl font-bold text-blue-600 font-mono">
              {formatCurrency(data.weeklyGrossRevenue)}
            </div>
          </div>
          
          {/* 환불 (빼기) */}
          <div className="mb-2 pb-2 border-b border-slate-200">
            <p className="text-xs text-slate-500 mb-1">환불</p>
            <div className="text-xl font-bold text-rose-600 font-mono flex items-center gap-1">
              <span className="text-sm">−</span> {formatCurrency(data.refundAmount)}
            </div>
          </div>
          
          {/* 순매출 (결과) */}
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-1">순매출</p>
            <div className="text-2xl font-bold text-emerald-600 font-mono flex items-center gap-1">
              <span className="text-sm">=</span> {formatCurrency(netRevenue)}
            </div>
          </div>
          
          {/* 전주 대비 */}
          <div className="flex items-center gap-2 mb-2">
            {prevChange !== 0 && (
              <Badge
                variant={prevChange > 0 ? "default" : "destructive"}
                className={`text-xs ${prevChange > 0 ? "bg-emerald-500" : "bg-rose-500"}`}
              >
                {prevChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                전주 대비 {formatPercent(Math.abs(prevChange))}
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-slate-500">
            전년 동기 대비 <span className={yoyChange > 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
              {yoyChange > 0 ? "▲" : "▼"} {formatPercent(Math.abs(yoyChange))}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* 2. Conversion Health Score */}
      <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${healthColor}`}></div>
            전환 건강도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 mb-3 font-mono">
            {healthScore.toFixed(1)}점
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant={refundRate < 10 ? "default" : refundRate < 20 ? "secondary" : "destructive"}
              className={`text-xs ${refundRate < 10 ? "bg-emerald-500" : refundRate < 20 ? "bg-amber-500" : "bg-rose-500"}`}
            >
              {refundRate < 10 ? "✓" : refundRate < 20 ? "⚠" : "✗"} 환불률 {formatPercent(refundRate)}
            </Badge>
          </div>
          
          <p className="text-xs text-slate-500">
            {refundRate < 10 ? "✓ 10% 이하 우수" : refundRate < 20 ? "⚠ 10-20% 주의" : "✗ 20% 이상 위험"}
          </p>
        </CardContent>
      </Card>

      {/* 3. Product Mix (1타 집중도) */}
      <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-violet-500"></div>
            1타 집중도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 mb-3 font-mono">
            {formatPercent(data.tier1SharePercent)}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={`text-xs border-violet-300 ${
                tier1Change > 0 ? "bg-violet-50 text-violet-700" : "bg-slate-50 text-slate-600"
              }`}
            >
              {tier1Change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : tier1Change < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
              전주 대비 {formatPercent(Math.abs(tier1Change))}
            </Badge>
          </div>
          
          <p className="text-xs text-slate-500">
            인사이트: <span className="font-medium text-violet-600">1타 {tier1Trend}</span>
          </p>
        </CardContent>
      </Card>

      {/* 4. Retention Rate */}
      <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
            재결제 비중
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 mb-3 font-mono">
            {formatPercent(data.retentionRate)}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs border-indigo-300 bg-indigo-50 text-indigo-700">
              <RefreshCw className="h-3 w-3 mr-1" />
              신규 고객 {data.newCustomerCount.toLocaleString()}명
            </Badge>
          </div>
          
          {/* Mini Sparkline */}
          <div className="h-8 -mx-2 -mb-2">
            {data.recentWeeksData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.recentWeeksData}>
                  <defs>
                    <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#sparkGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

