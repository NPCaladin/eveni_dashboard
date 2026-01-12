"use client";

import { useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { formatChartKoreanCurrency, formatKoreanCurrency } from "@/lib/utils/format";

interface TrendData {
  label: string;
  netRevenue2025: number;
  netRevenue2024: number;
  refund: number;
}

interface RevenueTrendChartProps {
  weeklyData: TrendData[];
  monthlyData: TrendData[];
}

export const RevenueTrendChart = memo(function RevenueTrendChart({
  weeklyData,
  monthlyData,
}: RevenueTrendChartProps) {
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "yoy">(
    "weekly"
  );

  // 포맷 함수는 lib/utils/format.ts에서 import
  const formatCurrency = formatChartKoreanCurrency;
  const formatTooltip = formatKoreanCurrency;

  const getData = () => {
    switch (activeTab) {
      case "weekly":
        return weeklyData.slice(-12); // 최근 12주
      case "monthly":
        return monthlyData;
      case "yoy":
        return weeklyData.slice(-12);
      default:
        return weeklyData;
    }
  };

  const data = getData();

  return (
    <Card className="mb-8">
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">매출 추이 분석</CardTitle>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
          >
            <TabsList>
              <TabsTrigger value="weekly">주간 추이</TabsTrigger>
              <TabsTrigger value="monthly">월별 추이</TabsTrigger>
              <TabsTrigger value="yoy">전년 비교</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="absolute top-4 right-4 text-xs text-gray-500">
          단위: 만원
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          {activeTab === "yoy" ? (
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              <Bar
                dataKey="netRevenue2025"
                fill="#3B82F6"
                name="2025년 순매출"
              />
              <Line
                type="monotone"
                dataKey="netRevenue2024"
                stroke="#9CA3AF"
                strokeDasharray="5 5"
                name="2024년 순매출"
                dot={{ r: 3 }}
              />
              <Area
                type="monotone"
                dataKey="refund"
                fill="#EF4444"
                fillOpacity={0.3}
                stroke="#EF4444"
                name="환불"
              />
            </ComposedChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              <Line
                type="monotone"
                dataKey="netRevenue2025"
                stroke="#3B82F6"
                strokeWidth={2}
                name="순매출"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="refund"
                stroke="#EF4444"
                strokeWidth={2}
                name="환불"
                dot={{ r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
