"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatChartCurrency } from "@/lib/utils/format";

interface MonthlyData {
  month: number;
  monthLabel: string; // "1월", "2월" 등
  revenue: number;
  change: number; // 전월 대비 증감액
  isCurrentMonth: boolean;
  refundRate: number; // %
}

interface MonthlyWaterfallProps {
  monthlyData: MonthlyData[];
  targetRevenue: number; // 목표 매출
  loading: boolean;
}

export function MonthlyWaterfallChart({ monthlyData, targetRevenue, loading }: MonthlyWaterfallProps) {
  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // 포맷 함수는 lib/utils/format.ts에서 import
  const formatCurrency = formatChartCurrency;

  // Waterfall 데이터 생성 (누적 방식)
  let cumulativeRevenue = 0;
  const waterfallData = monthlyData.map((month, index) => {
    const start = cumulativeRevenue;
    cumulativeRevenue = month.revenue;
    
    return {
      ...month,
      cumulative: month.revenue,
      start: start,
      displayValue: month.change,
      barHeight: Math.abs(month.change),
    };
  });

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-slate-900 mb-2">{data.monthLabel}</p>
          
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-6">
              <span className="text-slate-600">월 매출:</span>
              <span className="font-mono font-semibold text-indigo-600">
                {formatCurrency(data.revenue)}
              </span>
            </div>
            
            <div className="flex justify-between gap-6">
              <span className="text-slate-600">전월 대비:</span>
              <span className={`font-mono font-semibold ${
                data.change > 0 ? "text-emerald-600" : data.change < 0 ? "text-rose-600" : "text-slate-600"
              }`}>
                {data.change > 0 ? "▲" : data.change < 0 ? "▼" : ""} {formatCurrency(Math.abs(data.change))}
              </span>
            </div>
            
            <div className="flex justify-between gap-6">
              <span className="text-slate-600">환불률:</span>
              <span className={`font-mono font-semibold ${
                data.refundRate >= 20 ? "text-rose-600" : data.refundRate >= 10 ? "text-amber-600" : "text-emerald-600"
              }`}>
                {data.refundRate.toFixed(1)}%
              </span>
            </div>
          </div>
          
          {data.isCurrentMonth && (
            <p className="text-xs text-amber-600 mt-2 pt-2 border-t border-amber-100">
              📊 현재 진행 중
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // 색상 결정 함수
  const getBarColor = (data: MonthlyData) => {
    if (data.isCurrentMonth) return "#f59e0b"; // 현재 월: 노란색
    if (data.change > 0) return "#10b981"; // 증가: 초록색
    if (data.change < 0) return "#ef4444"; // 감소: 빨간색
    return "#64748b"; // 변화 없음: 회색
  };

  return (
    <Card className="border-slate-200 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <div className="h-1 w-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
          2025년 월별 매출 흐름
        </CardTitle>
        <CardDescription className="text-slate-600">
          Waterfall 차트 • 전월 대비 증감 • 월별 환불률
        </CardDescription>
      </CardHeader>
      <CardContent>
        {waterfallData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-slate-400">
            <p>데이터가 없습니다.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={waterfallData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                
                <XAxis
                  dataKey="monthLabel"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickFormatter={formatCurrency}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                {/* 목표 매출선 */}
                {targetRevenue > 0 && (
                  <ReferenceLine
                    y={targetRevenue}
                    stroke="#8b5cf6"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `목표: ${formatCurrency(targetRevenue)}`,
                      position: "right",
                      fill: "#8b5cf6",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                )}

                <Bar
                  dataKey="revenue"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                >
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* 월별 환불률 히트맵 테이블 */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-700 mb-3">월별 환불률 현황</p>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                {monthlyData.map((month) => {
                  let bgColor = "bg-emerald-100 text-emerald-700";
                  if (month.refundRate >= 20) bgColor = "bg-rose-100 text-rose-700";
                  else if (month.refundRate >= 10) bgColor = "bg-amber-100 text-amber-700";

                  return (
                    <div
                      key={month.month}
                      className={`${bgColor} rounded-lg p-2 text-center transition-all hover:scale-105 cursor-pointer`}
                      title={`${month.monthLabel}: ${month.refundRate.toFixed(1)}%`}
                    >
                      <p className="text-xs font-medium">{month.month}월</p>
                      <p className="text-sm font-bold font-mono">{month.refundRate.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

