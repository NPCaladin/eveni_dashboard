"use client";

import { useState, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ConversionTrendData } from "@/lib/types/dashboard";
import type { PeriodType } from "./global-period-filter";
import { formatWeekLabel, getFilteredDataByPeriod } from "@/lib/utils/chart";

interface CpaTrendChartProps {
  data: ConversionTrendData[];
  period: PeriodType;
}

type CpaMode = "first" | "consulting";

/**
 * 금액을 ₩ + 콤마 형식으로 포맷팅
 */
function formatCurrency(value: number): string {
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

export function CpaTrendChart({ data, period }: CpaTrendChartProps) {
  // 토글 상태 관리
  const [cpaMode, setCpaMode] = useState<CpaMode>("first");

  // 차트 데이터 준비 (CPA 계산 - 모드에 따라 분기)
  const chartData = useMemo(() => {
    const filteredData = getFilteredDataByPeriod(data, period);
    
    return filteredData.map((item) => {
      if (cpaMode === "first") {
        // [1차 CPA 모드]: 비용 / 1차 DB수
      const kakaoCpa = item.kakao.stage1Count > 0
        ? item.kakao.totalSpend / item.kakao.stage1Count
        : 0;

      const metaCpa = item.meta.stage1Count > 0
        ? item.meta.totalSpend / item.meta.stage1Count
        : 0;

      const totalSpend = item.kakao.totalSpend + item.meta.totalSpend;
      const totalDb = item.kakao.stage1Count + item.meta.stage1Count;
      const totalCpa = totalDb > 0 ? totalSpend / totalDb : 0;

      return {
        week: formatWeekLabel(item.startDate, item.title),
        fullTitle: item.title,
        kakaoCpa,
        metaCpa,
        totalCpa,
        // 추가 정보 (Tooltip용)
        kakaoSpend: item.kakao.totalSpend,
        kakaoDb: item.kakao.stage1Count,
        metaSpend: item.meta.totalSpend,
        metaDb: item.meta.stage1Count,
      };
      } else {
        // [상담 CPA 모드]: 비용 / 상담 DB수
        const kakaoCpa = item.kakao.stage2Count > 0
          ? item.kakao.totalSpend / item.kakao.stage2Count
          : 0;

        const metaCpa = item.meta.stage2Count > 0
          ? item.meta.totalSpend / item.meta.stage2Count
          : 0;

        const totalSpend = item.kakao.totalSpend + item.meta.totalSpend;
        const totalConsultingDb = item.kakao.stage2Count + item.meta.stage2Count;
        const totalCpa = totalConsultingDb > 0 ? totalSpend / totalConsultingDb : 0;

        return {
          week: formatWeekLabel(item.startDate, item.title),
          fullTitle: item.title,
          kakaoCpa,
          metaCpa,
          totalCpa,
          // 추가 정보 (Tooltip용)
          kakaoSpend: item.kakao.totalSpend,
          kakaoDb: item.kakao.stage2Count,
          metaSpend: item.meta.totalSpend,
          metaDb: item.meta.stage2Count,
        };
      }
    });
  }, [data, period, cpaMode]);

  // Y축 도메인 동적 설정
  const yDomain = cpaMode === "first" ? [0, 40000] : ['auto' as const, 'auto' as const];
  
  // 전체 막대 색상 동적 설정
  const totalBarColor = cpaMode === "first" ? "#D1FAE5" : "#DDD6FE";

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    const tooltipBarColor = cpaMode === "first" ? "#D1FAE5" : "#DDD6FE";

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
        <p className="font-semibold text-slate-900 mb-2">{data.fullTitle}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 pt-1 pb-1 border-b border-slate-200">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: tooltipBarColor }} />
            <span className="text-slate-700 font-semibold">전체 평균:</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(data.totalCpa)}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="w-3 h-0.5 bg-[#FEE500]" />
            <span className="text-slate-700">카카오:</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(data.kakaoCpa)}
            </span>
            <span className="text-slate-500 text-xs">
              ({formatCurrency(data.kakaoSpend)} / {data.kakaoDb}건)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[#0668E1]" />
            <span className="text-slate-700">메타:</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(data.metaCpa)}
            </span>
            <span className="text-slate-500 text-xs">
              ({formatCurrency(data.metaSpend)} / {data.metaDb}건)
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
          💰 주차별 CPA(DB 단가) 추이
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
              {cpaMode === "first" 
                ? "매체별 1차 DB 1건당 소진된 비용 흐름" 
                : "매체별 상담 DB 1건당 소진된 비용 흐름"}
        </p>
          </div>
          {/* 토글 버튼 */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <Button
              variant={cpaMode === "first" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCpaMode("first")}
              className="h-8 px-3 text-xs"
            >
              1차 CPA
            </Button>
            <Button
              variant={cpaMode === "consulting" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCpaMode("consulting")}
              className="h-8 px-3 text-xs"
            >
              상담 CPA
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart
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
              domain={yDomain}
              allowDataOverflow={cpaMode === "first"}
              tickFormatter={(value) => `₩${Math.round(value / 1000)}k`}
              label={{
                value: "CPA (₩)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: "14px", fill: "#64748b" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => {
                if (value === "totalCpa") return "전체 평균";
                if (value === "kakaoCpa") return "카카오";
                if (value === "metaCpa") return "메타";
                return value;
              }}
            />
            {/* 배경: 전체 평균 CPA (막대) */}
            <Bar
              dataKey="totalCpa"
              fill={totalBarColor}
              barSize={20}
              name="totalCpa"
              radius={[4, 4, 0, 0]}
            />
            {/* 전경: 카카오 CPA (선) */}
            <Line
              type="monotone"
              dataKey="kakaoCpa"
              stroke="#FEE500"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, stroke: "#FEE500", strokeWidth: 2, fill: "#fff" }}
              name="kakaoCpa"
            />
            {/* 전경: 메타 CPA (선) */}
            <Line
              type="monotone"
              dataKey="metaCpa"
              stroke="#0668E1"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, stroke: "#0668E1", strokeWidth: 2, fill: "#fff" }}
              name="metaCpa"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

