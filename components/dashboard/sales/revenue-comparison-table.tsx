"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatChartCurrency } from "@/lib/utils/format";

interface ComparisonData {
  weekly: {
    count: number;
    grossRevenue: number;
    netRevenue: number;
    refund?: { count: number; amount: number };
  };
  prevWeek: {
    count: number;
    grossRevenue: number;
    netRevenue: number;
    refund?: { count: number; amount: number };
  };
  prevYear: {
    count: number;
    grossRevenue: number;
    netRevenue: number;
    refund?: { count: number; amount: number };
  };
  monthlyCum: {
    count: number;
    grossRevenue: number;
    netRevenue: number;
    refund?: { count: number; amount: number };
  };
  yearlyCum: {
    count: number;
    grossRevenue: number;
    netRevenue: number;
    refund?: { count: number; amount: number };
  };
}

interface RevenueComparisonTableProps {
  data: ComparisonData;
  currentMonth: number; // 1-12
}

export function RevenueComparisonTable({
  data,
  currentMonth,
}: RevenueComparisonTableProps) {
  // 월 이름 변환
  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];
  const monthLabel = monthNames[currentMonth - 1] || "12월";
  // 포맷 함수는 lib/utils/format.ts에서 import
  const formatCurrency = (amount: number) => formatChartCurrency(amount).replace("만", "");

  const formatLargeCurrency = (amount: number) => {
    const billions = amount / 100000000;
    return billions.toFixed(1) + "억";
  };

  // 증감률 계산
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const netRevenueChange = calculateChange(
    data.weekly.netRevenue,
    data.prevWeek.netRevenue
  );

  return (
    <Card className="mb-8">
      <CardHeader className="relative">
        <CardTitle className="text-lg">매출 비교 분석</CardTitle>
        <div className="absolute top-4 right-4 text-xs text-gray-500">
          단위: 만원 (2025누적: 억)
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-red-600 hover:bg-red-600">
                <TableHead className="text-white font-bold">분류</TableHead>
                <TableHead className="text-white font-bold text-right">
                  주간
                </TableHead>
                <TableHead className="text-white font-bold text-right">
                  전주
                </TableHead>
                <TableHead className="text-white font-bold text-right">
                  전년동기
                </TableHead>
                <TableHead className="text-white font-bold text-right">
                  {monthLabel}누적
                </TableHead>
                <TableHead className="text-white font-bold text-right">
                  2025누적
                </TableHead>
                <TableHead className="text-white font-bold text-center">
                  비고
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">건수</TableCell>
                <TableCell className="text-right">{data.weekly.count}</TableCell>
                <TableCell className="text-right">
                  {data.prevWeek.count}
                </TableCell>
                <TableCell className="text-right">
                  {data.prevYear.count}
                </TableCell>
                <TableCell className="text-right">
                  {data.monthlyCum.count}
                </TableCell>
                <TableCell className="text-right">
                  {data.yearlyCum.count}
                </TableCell>
                <TableCell className="text-center text-gray-500">-</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">실매출</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(data.weekly.grossRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(data.prevWeek.grossRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(data.prevYear.grossRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(data.monthlyCum.grossRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatLargeCurrency(data.yearlyCum.grossRevenue)}
                </TableCell>
                <TableCell className="text-center">
                  {netRevenueChange !== null && (
                    <span
                      className={`font-medium ${
                        netRevenueChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {netRevenueChange >= 0 ? "▲" : "▼"}
                      {Math.abs(netRevenueChange).toFixed(1)}%
                    </span>
                  )}
                </TableCell>
              </TableRow>
              <TableRow className="bg-red-50">
                <TableCell className="font-medium">환불</TableCell>
                <TableCell className="text-right">
                  {data.weekly.refund ? (
                    <>
                      <div>{data.weekly.refund.count}건</div>
                      <div className="text-red-600">
                        {formatCurrency(data.weekly.refund.amount)}
                      </div>
                    </>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {data.prevWeek.refund ? (
                    <>
                      <div>{data.prevWeek.refund.count}건</div>
                      <div className="text-red-600">
                        {formatCurrency(data.prevWeek.refund.amount)}
                      </div>
                    </>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {data.prevYear.refund ? (
                    <>
                      <div>{data.prevYear.refund.count}건</div>
                      <div className="text-red-600">
                        {formatCurrency(data.prevYear.refund.amount)}
                      </div>
                    </>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {data.monthlyCum.refund ? (
                    <>
                      <div>{data.monthlyCum.refund.count}건</div>
                      <div className="text-red-600">
                        {formatCurrency(data.monthlyCum.refund.amount)}
                      </div>
                    </>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {data.yearlyCum.refund ? (
                    <>
                      <div>{data.yearlyCum.refund.count}건</div>
                      <div className="text-red-600">
                        {formatLargeCurrency(data.yearlyCum.refund.amount)}
                      </div>
                    </>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-center text-gray-500">-</TableCell>
              </TableRow>
              <TableRow className="bg-yellow-50">
                <TableCell className="font-bold">순매출</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(data.weekly.netRevenue)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(data.prevWeek.netRevenue)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(data.prevYear.netRevenue)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(data.monthlyCum.netRevenue)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatLargeCurrency(data.yearlyCum.netRevenue)}
                </TableCell>
                <TableCell className="text-center">
                  {netRevenueChange !== null && (
                    <span
                      className={`font-bold ${
                        netRevenueChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {netRevenueChange >= 0 ? "▲" : "▼"}
                      {Math.abs(netRevenueChange).toFixed(1)}%
                    </span>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

