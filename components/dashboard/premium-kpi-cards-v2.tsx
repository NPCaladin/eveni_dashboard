"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Target, DollarSign, Calendar, Zap, Users, Package } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface KPIDataV2 {
  // 매출 데이터
  weeklyGrossRevenue: number;
  weeklyNetRevenue: number;
  refundAmount: number;
  
  // 비교 데이터
  prevWeekNetRevenue: number;
  prevMonthWeekRevenue: number; // 전월 동기
  yoyNetRevenue: number;
  
  // 누적 데이터
  monthlyCumRevenue: number;
  monthlyTarget: number;
  yearlyCumRevenue: number;
  
  // 효율성 지표
  transactionCount: number;
  avgOrderValue: number;
  prevAvgOrderValue: number;
  profitMargin: number; // 순이익률
  
  // 상품 믹스
  tier1SharePercent: number;
  tier1Revenue: number;
  normalRevenue: number;
  
  // 재결제
  retentionRate: number;
  retentionCount: number;
  newCustomerCount: number;
  
  // 속도
  dailyAvgRevenue: number;
  prevDailyAvgRevenue: number;
}

interface PremiumKPICardsV2Props {
  data: KPIDataV2 | null;
  loading: boolean;
}

export function PremiumKPICardsV2({ data, loading }: PremiumKPICardsV2Props) {
  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[5, 6, 7, 8].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
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

  // 계산
  const netRevenue = data.weeklyNetRevenue;
  const prevWeekChange = data.prevWeekNetRevenue > 0 
    ? ((netRevenue - data.prevWeekNetRevenue) / data.prevWeekNetRevenue) * 100 
    : 0;
  const yoyChange = data.yoyNetRevenue > 0 
    ? ((netRevenue - data.yoyNetRevenue) / data.yoyNetRevenue) * 100 
    : 0;
  const momChange = data.prevMonthWeekRevenue > 0 
    ? ((netRevenue - data.prevMonthWeekRevenue) / data.prevMonthWeekRevenue) * 100 
    : 0;

  const targetProgress = data.monthlyTarget > 0 
    ? (data.monthlyCumRevenue / data.monthlyTarget) * 100 
    : 0;
  const expectedMonthEnd = data.dailyAvgRevenue * 30; // 간단 예측
  const expectedProgress = data.monthlyTarget > 0 
    ? (expectedMonthEnd / data.monthlyTarget) * 100 
    : 0;

  const avgOrderChange = data.prevAvgOrderValue > 0 
    ? ((data.avgOrderValue - data.prevAvgOrderValue) / data.prevAvgOrderValue) * 100 
    : 0;

  const velocityChange = data.prevDailyAvgRevenue > 0 
    ? ((data.dailyAvgRevenue - data.prevDailyAvgRevenue) / data.prevDailyAvgRevenue) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* 1줄: 핵심 재무 지표 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. 주간 매출 현황 */}
        <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              주간 매출 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-slate-500">실매출</p>
              <p className="text-lg font-bold text-blue-600 font-mono">
                {formatCurrency(data.weeklyGrossRevenue)}
              </p>
            </div>
            <div className="pb-2 border-b border-slate-200">
              <p className="text-xs text-slate-500">환불</p>
              <p className="text-lg font-bold text-rose-600 font-mono flex items-center gap-1">
                <span className="text-sm">−</span> {formatCurrency(data.refundAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">순매출</p>
              <p className="text-xl font-bold text-emerald-600 font-mono flex items-center gap-1">
                <span className="text-sm">=</span> {formatCurrency(netRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. 순이익률 + 전환 건강도 */}
        <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              수익성 지표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">순이익률</p>
              <p className="text-2xl font-bold text-emerald-600 font-mono">
                {formatPercent(data.profitMargin)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                = 순매출 ÷ 실매출
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-1">환불률</p>
              <Badge
                variant={data.profitMargin >= 90 ? "default" : data.profitMargin >= 80 ? "secondary" : "destructive"}
                className={`text-xs ${
                  data.profitMargin >= 90 ? "bg-emerald-500" : 
                  data.profitMargin >= 80 ? "bg-amber-500" : "bg-rose-500"
                }`}
              >
                {formatPercent(100 - data.profitMargin)}
              </Badge>
              <p className="text-xs text-slate-500 mt-1">
                {data.profitMargin >= 90 ? "✓ 우수" : data.profitMargin >= 80 ? "⚠ 주의" : "✗ 위험"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. 월간 누적 + 목표 대비 */}
        <Card className="border-slate-200 bg-gradient-to-br from-violet-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-600" />
              월간 진행률
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">12월 누적</p>
              <p className="text-xl font-bold text-violet-600 font-mono">
                {formatCurrency(data.monthlyCumRevenue)}
              </p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-slate-500">목표 달성률</p>
                <p className="text-xs font-semibold text-violet-600">
                  {formatPercent(targetProgress)}
                </p>
              </div>
              <Progress value={Math.min(targetProgress, 100)} className="h-2" />
              <p className="text-xs text-slate-500 mt-1">
                목표: {formatCurrency(data.monthlyTarget)}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500">예상 월말 도달</p>
              <p className="text-sm font-semibold text-slate-700">
                {formatPercent(expectedProgress)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. 객단가 */}
        <Card className="border-slate-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              객단가 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">평균 결제금액</p>
              <p className="text-2xl font-bold text-orange-600 font-mono">
                {formatCurrency(data.avgOrderValue)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={avgOrderChange > 0 ? "default" : "secondary"}
                className={`text-xs ${avgOrderChange > 0 ? "bg-emerald-500" : avgOrderChange < 0 ? "bg-rose-500" : "bg-slate-400"}`}
              >
                {avgOrderChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : avgOrderChange < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
                전주 대비 {formatPercent(Math.abs(avgOrderChange))}
              </Badge>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500">거래 건수</p>
              <p className="text-lg font-bold text-slate-700 font-mono">
                {data.transactionCount}건
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2줄: 전략 분석 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 5. 전주/전월/전년 비교 */}
        <Card className="border-slate-200 bg-gradient-to-br from-indigo-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              시계열 비교
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">전주 대비</span>
              <Badge variant={prevWeekChange > 0 ? "default" : "destructive"} className="text-xs">
                {prevWeekChange > 0 ? "▲" : "▼"} {formatPercent(Math.abs(prevWeekChange))}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">전월 동기</span>
              <Badge variant={momChange > 0 ? "default" : "destructive"} className="text-xs">
                {momChange > 0 ? "▲" : "▼"} {formatPercent(Math.abs(momChange))}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">전년 동기</span>
              <Badge variant={yoyChange > 0 ? "default" : "destructive"} className="text-xs">
                {yoyChange > 0 ? "▲" : "▼"} {formatPercent(Math.abs(yoyChange))}
              </Badge>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500">연간 누적</p>
              <p className="text-sm font-bold text-indigo-600 font-mono">
                {formatCurrency(data.yearlyCumRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 6. 1타 집중도 + 상품 믹스 */}
        <Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              상품 포트폴리오
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div>
              <p className="text-xs text-slate-500 mb-1">1타 집중도</p>
              <p className="text-2xl font-bold text-purple-600 font-mono">
                {formatPercent(data.tier1SharePercent)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-500">1타 매출</p>
                <p className="text-sm font-semibold text-purple-600 font-mono">
                  {Math.floor(data.tier1Revenue / 10000).toLocaleString()}만
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">일반 매출</p>
                <p className="text-sm font-semibold text-blue-600 font-mono">
                  {Math.floor(data.normalRevenue / 10000).toLocaleString()}만
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              비율: {formatPercent(data.tier1SharePercent)} : {formatPercent(100 - data.tier1SharePercent)}
            </p>
          </CardContent>
        </Card>

        {/* 7. 재결제 비중 + 효율성 */}
        <Card className="border-slate-200 bg-gradient-to-br from-teal-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              고객 리텐션
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div>
              <p className="text-xs text-slate-500 mb-1">재결제 비중</p>
              <p className="text-2xl font-bold text-teal-600 font-mono">
                {formatPercent(data.retentionRate)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-500">재결제</p>
                <p className="text-lg font-semibold text-teal-600 font-mono">
                  {data.retentionCount}명
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">신규</p>
                <p className="text-lg font-semibold text-blue-600 font-mono">
                  {data.newCustomerCount}명
                </p>
              </div>
            </div>
            <p className="text-xs text-teal-700 pt-1 font-medium">
              {data.retentionRate >= 30 ? "🔥 충성도 우수" : data.retentionRate >= 20 ? "✓ 양호" : "⚠ 개선 필요"}
            </p>
          </CardContent>
        </Card>

        {/* 8. 일평균 매출 + 속도 */}
        <Card className="border-slate-200 bg-gradient-to-br from-amber-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              판매 속도
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div>
              <p className="text-xs text-slate-500 mb-1">일평균 매출</p>
              <p className="text-2xl font-bold text-amber-600 font-mono">
                {formatCurrency(data.dailyAvgRevenue)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={velocityChange > 0 ? "default" : "secondary"}
                className={`text-xs ${velocityChange > 0 ? "bg-emerald-500" : velocityChange < 0 ? "bg-rose-500" : "bg-slate-400"}`}
              >
                {velocityChange > 0 ? "🚀" : "📉"} {formatPercent(Math.abs(velocityChange))}
              </Badge>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500">판매 추세</p>
              <p className="text-sm font-semibold text-slate-700">
                {velocityChange > 0 ? "✓ 가속 중" : velocityChange < 0 ? "⚠ 감속 중" : "→ 유지"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}







