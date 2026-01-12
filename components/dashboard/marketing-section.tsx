"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MarketingMetric } from "@/lib/types/dashboard";

interface MarketingSectionProps {
  metrics: MarketingMetric[];
  loading: boolean;
}

export function MarketingSection({ metrics, loading }: MarketingSectionProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>마케팅사업본부</CardTitle>
          <CardDescription>광고 성과 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Meta와 Kakao 데이터만 필터링
  const chartData = metrics
    .filter((m) => m.channel !== "Total")
    .map((metric) => ({
      channel: metric.channel,
      cost: Number(metric.cost) || 0,
      consultation_db: (metric as any).consultation_db_count || 0,
      conversion_rate: metric.conversion_rate ? Number(metric.conversion_rate) : 0,
    }));

  const totalConversionRate = metrics.find((m) => m.channel === "Total")?.conversion_rate;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>마케팅사업본부</CardTitle>
          <CardDescription>광고 성과 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="channel" />
              <YAxis yAxisId="left" label={{ value: "집행비용 (원)", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: "상담신청 DB수", angle: 90, position: "insideRight" }} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "cost") {
                    return [new Intl.NumberFormat("ko-KR").format(value) + "원", "집행비용"];
                  }
                  return [value, name === "consultation_db" ? "상담신청 DB수" : "전환율"];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="cost" fill="#8884d8" name="집행비용" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="consultation_db"
                stroke="#82ca9d"
                strokeWidth={2}
                name="상담신청 DB수"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {totalConversionRate !== null && totalConversionRate !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle>전환율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Number(totalConversionRate).toFixed(2)}%</div>
            <p className="text-sm text-muted-foreground mt-2">총 상담 전환율</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



