"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { formatChartCurrency, formatTooltipCurrency } from "@/lib/utils/format";

interface MediaCost {
  media: string;
  stage_1_cost?: number;
  stage_2_cost?: number;
}

interface TotalSpend {
  media: string;
  total_spend: number;
}

interface WeekData {
  title: string;
  costs: MediaCost[];
  totalSpends?: TotalSpend[];
}

interface CostTrendSectionProps {
  data: WeekData[];
}

export function CostTrendSection({ data }: CostTrendSectionProps) {
  if (data.length === 0) {
    return (
      <Alert>
        <AlertDescription>비용 추이 데이터가 없습니다.</AlertDescription>
      </Alert>
    );
  }

  // 차트 데이터 준비 (오래된 주차부터 → 최근 주차가 오른쪽에 표시)
  const chartData = [...data].reverse().map((week) => {
    const meta = week.costs.find((c) => c.media === "메타");
    const kakao = week.costs.find((c) => c.media === "카카오");

    return {
      label: week.title,
      메타_1차: meta?.stage_1_cost || 0,
      메타_상담: meta?.stage_2_cost || 0,
      카카오_1차: kakao?.stage_1_cost || 0,
      카카오_상담: kakao?.stage_2_cost || 0,
    };
  });

  // 테이블 데이터 준비 (최근 주차부터)
  const tableData = [...data].reverse();

  return (
    <div className="space-y-6">
      {/* 차트 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 1차 DB 비용 */}
            <div>
              <h4 className="text-center font-semibold mb-4">1차 DB 비용</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={formatChartCurrency} />
                  <Tooltip formatter={formatTooltipCurrency} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="메타_1차"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="메타"
                    dot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="카카오_1차"
                    stroke="#F97316"
                    strokeWidth={2}
                    name="카카오"
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 상담 DB 비용 */}
            <div>
              <h4 className="text-center font-semibold mb-4">상담 DB 비용</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={formatChartCurrency} />
                  <Tooltip formatter={formatTooltipCurrency} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="메타_상담"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="메타"
                    dot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="카카오_상담"
                    stroke="#F97316"
                    strokeWidth={2}
                    name="카카오"
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>주차별 비용 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-center">구분</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">메타</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">카카오</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">총합</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((week, index) => {
                  const metaSpend = week.totalSpends?.find((t) => t.media === "메타");
                  const kakaoSpend = week.totalSpends?.find((t) => t.media === "카카오");
                  
                  const metaCost = metaSpend?.total_spend || 0;
                  const kakaoCost = kakaoSpend?.total_spend || 0;
                  const total = metaCost + kakaoCost;

                  return (
                    <tr key={index} className={index % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                      <td className="border border-gray-300 px-4 py-3">
                        {week.title}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right">
                        {metaCost.toLocaleString()}원
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right">
                        {kakaoCost.toLocaleString()}원
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                        {total.toLocaleString()}원
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

