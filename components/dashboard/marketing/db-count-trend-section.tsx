"use client";

import React from "react";
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

interface DbCountTrendSectionProps {
  data: any[];
}

export function DbCountTrendSection({ data }: DbCountTrendSectionProps) {
  if (data.length === 0) {
    return (
      <Alert>
        <AlertDescription>DB개수 추이 데이터가 없습니다.</AlertDescription>
      </Alert>
    );
  }

  // 날짜 포맷팅 함수 (YYYY-MM-DD → MM.DD)
  const formatDateRange = (startDate: string, endDate: string) => {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}.${day.toString().padStart(2, '0')}`;
    };
    return `${formatDate(startDate)}~${formatDate(endDate)}`;
  };

  // 차트 데이터 준비 (오래된 주차부터 → 최근 주차가 오른쪽에 표시)
  const chartData = [...data].reverse().map((week) => {
    const meta = week.adData?.find((c: any) => c.media === "메타");
    const kakao = week.adData?.find((c: any) => c.media === "카카오");

    return {
      label: week.title,
      메타_1차: meta?.stage_1_count || 0,
      메타_상담: meta?.stage_2_count || 0,
      카카오_1차: kakao?.stage_1_count || 0,
      카카오_상담: kakao?.stage_2_count || 0,
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
            {/* 1차 DB 개수 */}
            <div>
              <h4 className="text-center font-semibold mb-4">1차 DB 개수 추이</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
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

            {/* 상담 DB 개수 */}
            <div>
              <h4 className="text-center font-semibold mb-4">상담 DB 개수 추이</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
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
          <CardTitle>총 DB 수 및 상담 전환율</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-center" rowSpan={2}>구분</th>
                  {tableData.map((week, idx) => (
                    <th key={`header-${week.id || idx}`} className="border border-gray-300 px-4 py-3 text-center" colSpan={3}>
                      {formatDateRange(week.start_date, week.end_date)}
                    </th>
                  ))}
                  <th className="border border-gray-300 px-4 py-3 text-center">평균</th>
                </tr>
                <tr className="bg-blue-500 text-white">
                  {tableData.map((week, idx) => (
                    <React.Fragment key={`subheader-${week.id || idx}`}>
                      <th className="border border-gray-300 px-2 py-2 text-center text-sm">메타</th>
                      <th className="border border-gray-300 px-2 py-2 text-center text-sm">카카오</th>
                      <th className="border border-gray-300 px-2 py-2 text-center text-sm">총합</th>
                    </React.Fragment>
                  ))}
                  <th className="border border-gray-300 px-2 py-2 text-center text-sm">전환율</th>
                </tr>
              </thead>
              <tbody>
                {/* 1차 DB */}
                <tr className="bg-blue-100">
                  <td className="border border-gray-300 px-4 py-3 font-medium">1차 DB</td>
                  {tableData.map((week, idx) => {
                    const meta = week.adData?.find((c: any) => c.media === "메타");
                    const kakao = week.adData?.find((c: any) => c.media === "카카오");
                    const metaCount = meta?.stage_1_count || 0;
                    const kakaoCount = kakao?.stage_1_count || 0;
                    const total = metaCount + kakaoCount;
                    return (
                      <React.Fragment key={week.id || idx}>
                        <td className="border border-gray-300 px-2 py-3 text-center">{metaCount}개</td>
                        <td className="border border-gray-300 px-2 py-3 text-center">{kakaoCount}개</td>
                        <td className="border border-gray-300 px-2 py-3 text-center font-semibold">{total}개</td>
                      </React.Fragment>
                    );
                  })}
                  <td className="border border-gray-300 px-2 py-3 text-center font-semibold">
                    {Math.round(
                      tableData.reduce((sum, week) => {
                        const meta = week.adData?.find((c: any) => c.media === "메타");
                        const kakao = week.adData?.find((c: any) => c.media === "카카오");
                        return sum + (meta?.stage_1_count || 0) + (kakao?.stage_1_count || 0);
                      }, 0) / tableData.length
                    )}개
                  </td>
                </tr>

                {/* 상담 DB */}
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium">상담 DB</td>
                  {tableData.map((week, idx) => {
                    const meta = week.adData?.find((c: any) => c.media === "메타");
                    const kakao = week.adData?.find((c: any) => c.media === "카카오");
                    const metaCount = meta?.stage_2_count || 0;
                    const kakaoCount = kakao?.stage_2_count || 0;
                    const total = metaCount + kakaoCount;
                    return (
                      <React.Fragment key={`stage2-${week.id || idx}`}>
                        <td className="border border-gray-300 px-2 py-3 text-center">{metaCount}개</td>
                        <td className="border border-gray-300 px-2 py-3 text-center">{kakaoCount}개</td>
                        <td className="border border-gray-300 px-2 py-3 text-center font-semibold">{total}개</td>
                      </React.Fragment>
                    );
                  })}
                  <td className="border border-gray-300 px-2 py-3 text-center font-semibold">
                    {Math.round(
                      tableData.reduce((sum, week) => {
                        const meta = week.adData?.find((c: any) => c.media === "메타");
                        const kakao = week.adData?.find((c: any) => c.media === "카카오");
                        return sum + (meta?.stage_2_count || 0) + (kakao?.stage_2_count || 0);
                      }, 0) / tableData.length
                    )}개
                  </td>
                </tr>

                {/* 상담 전환율 */}
                <tr className="bg-white">
                  <td className="border border-gray-300 px-4 py-3 font-medium">상담 전환율</td>
                  {tableData.map((week, idx) => {
                    const meta = week.adData?.find((c: any) => c.media === "메타");
                    const kakao = week.adData?.find((c: any) => c.media === "카카오");
                    
                    const metaStage1 = meta?.stage_1_count || 0;
                    const metaStage2 = meta?.stage_2_count || 0;
                    const metaRate = metaStage1 > 0 ? ((metaStage2 / metaStage1) * 100).toFixed(1) : "0.0";
                    
                    const kakaoStage1 = kakao?.stage_1_count || 0;
                    const kakaoStage2 = kakao?.stage_2_count || 0;
                    const kakaoRate = kakaoStage1 > 0 ? ((kakaoStage2 / kakaoStage1) * 100).toFixed(1) : "0.0";
                    
                    const totalStage1 = metaStage1 + kakaoStage1;
                    const totalStage2 = metaStage2 + kakaoStage2;
                    const totalRate = totalStage1 > 0 ? ((totalStage2 / totalStage1) * 100).toFixed(1) : "0.0";
                    
                    return (
                      <React.Fragment key={`rate-${week.id || idx}`}>
                        <td className="border border-gray-300 px-2 py-3 text-center">{metaRate}%</td>
                        <td className="border border-gray-300 px-2 py-3 text-center">{kakaoRate}%</td>
                        <td className="border border-gray-300 px-2 py-3 text-center font-semibold">{totalRate}%</td>
                      </React.Fragment>
                    );
                  })}
                  <td className="border border-gray-300 px-2 py-3 text-center font-semibold">
                    {(() => {
                      const avgStage1 = tableData.reduce((sum, week) => {
                        const meta = week.adData?.find((c: any) => c.media === "메타");
                        const kakao = week.adData?.find((c: any) => c.media === "카카오");
                        return sum + (meta?.stage_1_count || 0) + (kakao?.stage_1_count || 0);
                      }, 0);
                      const avgStage2 = tableData.reduce((sum, week) => {
                        const meta = week.adData?.find((c: any) => c.media === "메타");
                        const kakao = week.adData?.find((c: any) => c.media === "카카오");
                        return sum + (meta?.stage_2_count || 0) + (kakao?.stage_2_count || 0);
                      }, 0);
                      return avgStage1 > 0 ? ((avgStage2 / avgStage1) * 100).toFixed(1) : "0.0";
                    })()}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

