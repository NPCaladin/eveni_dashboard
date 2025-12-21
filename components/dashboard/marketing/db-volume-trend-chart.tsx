"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ConversionTrendData } from "@/lib/types/dashboard";
import type { PeriodType } from "./global-period-filter";
import { formatWeekLabel, getFilteredDataByPeriod, formatNumber } from "@/lib/utils/chart";

interface DbVolumeTrendChartProps {
  data: ConversionTrendData[];
  period: PeriodType;
}

type ViewMode = "first" | "consulting";

export function DbVolumeTrendChart({ data, period }: DbVolumeTrendChartProps) {
  // 토글 상태 관리
  const [viewMode, setViewMode] = useState<ViewMode>("first");
  // 차트 데이터 준비 (viewMode에 따라 다른 데이터 사용)
  const chartData = useMemo(() => {
    const filteredData = getFilteredDataByPeriod(data, period);
    
    return filteredData.map((item) => {
      if (viewMode === "first") {
        // 1차 DB
        return {
          week: formatWeekLabel(item.startDate, item.title),
          fullTitle: item.title,
          kakaoDb: item.kakao.stage1Count,
          metaDb: item.meta.stage1Count,
          totalDb: item.kakao.stage1Count + item.meta.stage1Count,
        };
      } else {
        // 상담 DB
        return {
          week: formatWeekLabel(item.startDate, item.title),
          fullTitle: item.title,
          kakaoDb: item.kakao.stage2Count,
          metaDb: item.meta.stage2Count,
          totalDb: item.kakao.stage2Count + item.meta.stage2Count,
        };
      }
    });
  }, [data, period, viewMode]);

  // 총합 색상 (viewMode에 따라 변경)
  const totalColor = viewMode === "first" ? "#10B981" : "#8B5CF6";
  
  // Y축 레이블
  const yAxisLabel = viewMode === "first" ? "1차 DB 수 (건)" : "상담 DB 수 (건)";

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
              {formatNumber(data.kakaoDb)}건
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0668E1]" />
            <span className="text-slate-700">메타:</span>
            <span className="font-semibold text-slate-900">
              {formatNumber(data.metaDb)}건
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 mt-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: totalColor }}
            />
            <span className="text-slate-700 font-semibold">총합:</span>
            <span className="font-bold text-slate-900">
              {formatNumber(data.totalDb)}건
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">
              📊 주차별 DB 유입 추이
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {viewMode === "first" 
                ? "매체별 1차 DB 유입 현황" 
                : "매체별 상담 DB 전환 현황"}
            </p>
          </div>
          {/* 토글 버튼 */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <Button
              variant={viewMode === "first" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("first")}
              className="h-8 px-3 text-xs"
            >
              1차 DB
            </Button>
            <Button
              variant={viewMode === "consulting" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("consulting")}
              className="h-8 px-3 text-xs"
            >
              상담 DB
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
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
              label={{
                value: yAxisLabel,
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
                if (value === "kakaoDb") return "카카오";
                if (value === "metaDb") return "메타";
                if (value === "totalDb") return "총합";
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="kakaoDb"
              stroke="#FEE500"
              strokeWidth={2}
              dot={{ fill: "#FEE500", r: 4 }}
              activeDot={{ r: 6 }}
              name="kakaoDb"
              isAnimationActive={true}
              animationDuration={500}
            />
            <Line
              type="monotone"
              dataKey="metaDb"
              stroke="#0668E1"
              strokeWidth={2}
              dot={{ fill: "#0668E1", r: 4 }}
              activeDot={{ r: 6 }}
              name="metaDb"
              isAnimationActive={true}
              animationDuration={500}
            />
            <Line
              type="monotone"
              dataKey="totalDb"
              stroke={totalColor}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, stroke: totalColor, strokeWidth: 2, fill: "#fff" }}
              name="totalDb"
              isAnimationActive={true}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

