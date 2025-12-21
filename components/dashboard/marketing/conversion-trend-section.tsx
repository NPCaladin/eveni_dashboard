"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversionTrendData } from "@/lib/types/dashboard";
import type { PeriodType } from "./global-period-filter";
import { formatWeekLabel, getFilteredDataByPeriod } from "@/lib/utils/chart";

interface ConversionTrendSectionProps {
  data: ConversionTrendData[];
  period: PeriodType;
}

export function ConversionTrendSection({ data, period }: ConversionTrendSectionProps) {

  // 차트 데이터 준비
  const chartData = useMemo(() => {
    const filteredData = getFilteredDataByPeriod(data, period);
    
    return filteredData.map((item) => ({
      week: formatWeekLabel(item.startDate, item.title),
      fullTitle: item.title,
      kakaoRate: item.kakao.conversionRate,
      metaRate: item.meta.conversionRate,
      kakaoStage1: item.kakao.stage1Count,
      kakaoStage2: item.kakao.stage2Count,
      metaStage1: item.meta.stage1Count,
      metaStage2: item.meta.stage2Count,
    }));
  }, [data, period]);

  // Y축 최대값 계산 (동적 조정)
  const maxRate = useMemo(() => {
    const rates = chartData.flatMap((d) => [d.kakaoRate, d.metaRate]);
    const max = Math.max(...rates, 0);
    return Math.ceil(max / 10) * 10 + 5; // 10 단위로 올림 + 5 여유
  }, [chartData]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
        <p className="font-semibold text-slate-900 mb-2">{data.fullTitle}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FEE500]" />
            <span className="text-slate-700">카카오:</span>
            <span className="font-semibold text-slate-900">
              {data.kakaoRate}%
            </span>
            <span className="text-slate-500 text-xs">
              ({data.kakaoStage2}/{data.kakaoStage1})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0668E1]" />
            <span className="text-slate-700">메타:</span>
            <span className="font-semibold text-slate-900">
              {data.metaRate}%
            </span>
            <span className="text-slate-500 text-xs">
              ({data.metaStage2}/{data.metaStage1})
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
          📈 매체별 전환율 추이 (Trend)
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          주차별 상담 DB 전환율 변화 추이 (카카오 vs 메타)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={450}>
          <LineChart
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
              domain={[0, maxRate]}
              label={{
                value: "전환율 (%)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: "14px", fill: "#64748b" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="line"
              formatter={(value) => {
                if (value === "kakaoRate") return "카카오";
                if (value === "metaRate") return "메타";
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="kakaoRate"
              stroke="#FEE500"
              strokeWidth={2}
              dot={{ fill: "#FEE500", r: 4 }}
              activeDot={{ r: 6 }}
              name="kakaoRate"
            />
            <Line
              type="monotone"
              dataKey="metaRate"
              stroke="#0668E1"
              strokeWidth={2}
              dot={{ fill: "#0668E1", r: 4 }}
              activeDot={{ r: 6 }}
              name="metaRate"
            />
            {/* Brush: 전체 기간 스크롤/줌인 기능 */}
            {chartData.length > 12 && (
              <Brush
                dataKey="week"
                height={30}
                stroke="#94a3b8"
                fill="#f1f5f9"
                startIndex={Math.max(0, chartData.length - 12)}
                endIndex={chartData.length - 1}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

