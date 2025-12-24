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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversionTrendData } from "@/lib/types/dashboard";
import type { PeriodType } from "./global-period-filter";
import { formatWeekLabel, getFilteredDataByPeriod } from "@/lib/utils/chart";

interface PaymentConversionTrendChartProps {
  data: ConversionTrendData[];
  period: PeriodType;
}

export function PaymentConversionTrendChart({ data, period }: PaymentConversionTrendChartProps) {
  // 차트 데이터 준비 (결제 전환율 계산)
  const chartData = useMemo(() => {
    const filteredData = getFilteredDataByPeriod(data, period);
    
    // payment 데이터가 있는 항목만 필터링
    return filteredData
      .filter(item => item.payment)
      .map((item) => {
        const payment = item.payment!;
        
        return {
          week: formatWeekLabel(item.startDate, item.title),
          fullTitle: item.title,
          // 전환율 (%)
          specialRate: payment.specialConversionRate,
          generalRate: payment.generalConversionRate,
          totalRate: payment.totalConversionRate,
          // 원본 데이터 (툴팁용)
          specialPayment: payment.specialPaymentCount,
          specialDb: payment.specialDbCount,
          generalPayment: payment.generalPaymentCount,
          generalDb: payment.generalDbCount,
          totalPayment: payment.totalPaymentCount,
          totalDb: payment.totalDbCount,
        };
      });
  }, [data, period]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
        <p className="font-semibold text-slate-900 mb-3">{data.fullTitle}</p>
        <div className="space-y-2 text-sm">
          {/* 특강 */}
          <div className="flex items-center gap-2 pt-2 pb-2 border-b border-slate-200">
            <div className="w-3 h-0.5 bg-[#E11D48]" />
            <span className="text-slate-700 font-semibold">특강:</span>
            <span className="font-bold text-[#E11D48]">
              {data.specialRate.toFixed(2)}%
            </span>
            <span className="text-slate-500 text-xs">
              ({data.specialPayment}/{data.specialDb}명)
            </span>
          </div>
          
          {/* 일반 */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-3 h-0.5 bg-[#9CA3AF] border-dashed" />
            <span className="text-slate-700">일반:</span>
            <span className="font-semibold text-slate-900">
              {data.generalRate.toFixed(2)}%
            </span>
            <span className="text-slate-500 text-xs">
              ({data.generalPayment}/{data.generalDb}명)
            </span>
          </div>
          
          {/* 전체 */}
          <div className="flex items-center gap-2 pt-1">
            <div className="w-3 h-0.5 bg-[#10B981]" />
            <span className="text-slate-700">전체:</span>
            <span className="font-semibold text-slate-900">
              {data.totalRate.toFixed(2)}%
            </span>
            <span className="text-slate-500 text-xs">
              ({data.totalPayment}/{data.totalDb}명)
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-slate-500">결제 전환율 데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">
          💳 DB 유형별 결제 전환율 추이
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          특강 DB vs 일반 DB의 구매 파워 비교 (1차 DB → 결제 전환)
        </p>
      </CardHeader>
      <CardContent className="overflow-hidden">
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
              domain={['auto', 'auto']}
              tickFormatter={(value) => `${value}%`}
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
                if (value === "specialRate") return "특강 (Hero)";
                if (value === "generalRate") return "일반 (Base)";
                if (value === "totalRate") return "전체 평균";
                return value;
              }}
            />
            
            {/* 특강 전환율 (Hero) - 가장 돋보여야 함 */}
            <Line
              type="monotone"
              dataKey="specialRate"
              stroke="#E11D48"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, stroke: "#E11D48", strokeWidth: 2, fill: "#fff" }}
              name="specialRate"
            />
            
            {/* 일반 전환율 (Base) - 비교군, 점선 */}
            <Line
              type="monotone"
              dataKey="generalRate"
              stroke="#9CA3AF"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 6, stroke: "#9CA3AF", strokeWidth: 2, fill: "#fff" }}
              name="generalRate"
            />
            
            {/* 전체 전환율 (Total) */}
            <Line
              type="monotone"
              dataKey="totalRate"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2, fill: "#fff" }}
              name="totalRate"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


