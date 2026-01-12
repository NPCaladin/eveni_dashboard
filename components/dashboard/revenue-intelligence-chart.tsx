"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatChartCurrency, formatPercent } from "@/lib/utils/format";

interface WeeklyData {
  week: string;
  weekLabel: string; // "1주차", "2주차" 등
  orderAmount2025: number;
  netRevenue2025: number;
  netRevenue2024: number;
  refundAmount: number;
  refundRate: number; // %
}

interface RevenueIntelligenceProps {
  weeklyData: WeeklyData[];
  loading: boolean;
}

export function RevenueIntelligenceChart({ weeklyData, loading }: RevenueIntelligenceProps) {
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

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-slate-900 mb-2">{label}</p>
          
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-6">
              <span className="text-slate-600">2025 주문액:</span>
              <span className="font-mono font-semibold text-blue-600">
                {formatCurrency(data.orderAmount2025)}
              </span>
            </div>
            
            <div className="flex justify-between gap-6">
              <span className="text-slate-600">2025 실매출:</span>
              <span className="font-mono font-semibold text-indigo-600">
                {formatCurrency(data.netRevenue2025)}
              </span>
            </div>
            
            <div className="flex justify-between gap-6">
              <span className="text-slate-600">2024 실매출:</span>
              <span className="font-mono font-semibold text-slate-400">
                {formatCurrency(data.netRevenue2024)}
              </span>
            </div>
            
            <div className="flex justify-between gap-6 pt-2 border-t border-slate-200">
              <span className="text-slate-600">환불 발생액:</span>
              <span className="font-mono font-semibold text-rose-600">
                {formatCurrency(data.refundAmount)}
              </span>
            </div>
            
            <div className="flex justify-between gap-6">
              <span className="text-slate-600">환불률:</span>
              <span className={`font-mono font-semibold ${
                data.refundRate >= 20 ? "text-rose-600" : data.refundRate >= 10 ? "text-amber-600" : "text-emerald-600"
              }`}>
                {formatPercent(data.refundRate)}
              </span>
            </div>
          </div>
          
          {data.refundRate >= 20 && (
            <p className="text-xs text-rose-600 mt-2 pt-2 border-t border-rose-100">
              ⚠️ 환불률 급등 주의
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // 최근 12주 데이터만 표시 (없으면 전체)
  const displayData = weeklyData.length > 12 ? weeklyData.slice(-12) : weeklyData;

  return (
    <Card className="border-slate-200 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
          주간 매출 트렌드 분석
        </CardTitle>
        <CardDescription className="text-slate-600">
          최근 12주간 매출 흐름 • 전년 대비 • 환불 발생 현황
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-slate-400">
            <p>데이터가 없습니다.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={displayData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="refundGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              
              <XAxis
                dataKey="weekLabel"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                tickFormatter={formatCurrency}
              />
              
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 'auto']}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "13px",
                }}
                iconType="circle"
              />

              {/* Area: 2025 주문액 (배경) */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="orderAmount2025"
                fill="url(#orderGradient)"
                stroke="#3b82f6"
                strokeWidth={1}
                name="2025 주문액"
                fillOpacity={1}
              />

              {/* Bar: 2025 실매출 */}
              <Bar
                yAxisId="left"
                dataKey="netRevenue2025"
                fill="#6366f1"
                name="2025 실매출"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />

              {/* Line: 2024 실매출 (전년 대비) */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="netRevenue2024"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#94a3b8", r: 4 }}
                name="2024 동기 실매출"
              />

              {/* Area: 환불 발생액 */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="refundAmount"
                fill="url(#refundGradient)"
                stroke="#ef4444"
                strokeWidth={2}
                name="환불 발생액"
                fillOpacity={1}
              />

              {/* Line: 환불률 (우측 축) */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="refundRate"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ fill: "#f59e0b", r: 5 }}
                name="환불률 (%)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        
        {/* Insights Summary */}
        {displayData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">평균 주간 실매출</p>
              <p className="text-lg font-bold text-slate-900 font-mono">
                {formatCurrency(
                  displayData.reduce((sum, d) => sum + d.netRevenue2025, 0) / displayData.length
                )}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">평균 환불률</p>
              <p className={`text-lg font-bold font-mono ${
                displayData.reduce((sum, d) => sum + d.refundRate, 0) / displayData.length >= 15
                  ? "text-rose-600"
                  : "text-emerald-600"
              }`}>
                {formatPercent(
                  displayData.reduce((sum, d) => sum + d.refundRate, 0) / displayData.length
                )}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">전년 대비 성장률</p>
              <p className="text-lg font-bold text-indigo-600 font-mono">
                {(() => {
                  const total2025 = displayData.reduce((sum, d) => sum + d.netRevenue2025, 0);
                  const total2024 = displayData.reduce((sum, d) => sum + d.netRevenue2024, 0);
                  const growth = total2024 > 0 ? ((total2025 - total2024) / total2024) * 100 : 0;
                  return `${growth > 0 ? "▲" : "▼"} ${Math.abs(growth).toFixed(1)}%`;
                })()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}














