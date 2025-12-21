"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversionTrendData } from "@/lib/types/dashboard";
import type { PeriodType } from "./global-period-filter";
import { formatWeekLabel, getFilteredDataByPeriod, formatNumber } from "@/lib/utils/chart";

interface CostTrendChartProps {
  data: ConversionTrendData[];
  period: PeriodType;
}

export function CostTrendChart({ data, period }: CostTrendChartProps) {
  // 차트 데이터 준비 (비용 데이터 추출)
  const chartData = useMemo(() => {
    const filteredData = getFilteredDataByPeriod(data, period);
    
    return filteredData.map((item) => ({
      week: formatWeekLabel(item.startDate, item.title),
      fullTitle: item.title,
      kakaoCost: item.kakao.totalSpend || 0,
      metaCost: item.meta.totalSpend || 0,
      total: (item.kakao.totalSpend || 0) + (item.meta.totalSpend || 0),
    }));
  }, [data, period]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
        <p className="font-semibold text-slate-900 mb-2">{data.fullTitle}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#FEE500]" />
            <span className="text-slate-700">카카오:</span>
            <span className="font-semibold text-slate-900">
              {formatNumber(data.kakaoCost)}원
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#0668E1]" />
            <span className="text-slate-700">메타:</span>
            <span className="font-semibold text-slate-900">
              {formatNumber(data.metaCost)}원
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 mt-1">
            <span className="text-slate-700 font-semibold">합계:</span>
            <span className="font-bold text-slate-900">
              {formatNumber(data.total)}원
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-slate-500">데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">
          💰 주차별 비용 집행 추이
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          매체별 광고비 지출 현황 (누적 막대 그래프)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="week"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: "12px" }}
              tickFormatter={(value) => `${Math.round(value / 10000)}만`}
              label={{
                value: "비용 (만원)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: "14px", fill: "#64748b" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => {
                if (value === "kakaoCost") return "카카오";
                if (value === "metaCost") return "메타";
                return value;
              }}
            />
            <Bar
              dataKey="kakaoCost"
              stackId="cost"
              fill="#FEE500"
              name="kakaoCost"
            />
            <Bar
              dataKey="metaCost"
              stackId="cost"
              fill="#0668E1"
              name="metaCost"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

