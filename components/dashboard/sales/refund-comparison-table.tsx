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

interface RefundComparisonData {
  weekly: { count: number; amount: number };
  prevWeek: { count: number; amount: number };
  prevYear: { count: number; amount: number };
  monthlyCum: { count: number; amount: number };
  yearlyCum: { count: number; amount: number };
}

interface RefundComparisonTableProps {
  data: RefundComparisonData;
  currentMonth?: number; // 1-12
}

export function RefundComparisonTable({ data, currentMonth }: RefundComparisonTableProps) {
  // 월 이름 변환
  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];
  const monthLabel = currentMonth ? monthNames[currentMonth - 1] || "12월" : "12월";
  const formatCurrency = (amount: number) => {
    const millions = Math.floor(amount / 10000);
    return millions.toLocaleString();
  };

  const formatLargeCurrency = (amount: number) => {
    const billions = amount / 100000000;
    return billions.toFixed(2) + "억";
  };

  // 증감률 계산 (환불 감소 = 긍정)
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const countChange = calculateChange(data.weekly.count, data.prevWeek.count);
  const amountChange = calculateChange(
    data.weekly.amount,
    data.prevWeek.amount
  );

  return (
    <Card className="mb-8">
      <CardHeader className="relative">
        <CardTitle className="text-lg">환불 비교 분석</CardTitle>
        <div className="absolute top-4 right-4 text-xs text-gray-500">
          단위: 만원 (2025누적: 억)
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-red-900 hover:bg-red-900">
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
                <TableCell className="font-medium">환불확정자</TableCell>
                <TableCell className="text-right">
                  {data.weekly.count}
                </TableCell>
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
                <TableCell className="text-center">
                  {countChange !== null && (
                    <span
                      className={`font-medium ${
                        countChange < 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {countChange < 0 ? "▼" : "▲"}
                      {Math.abs(countChange).toFixed(1)}%
                    </span>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">환불확정액</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(data.weekly.amount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(data.prevWeek.amount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(data.prevYear.amount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(data.monthlyCum.amount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatLargeCurrency(data.yearlyCum.amount)}
                </TableCell>
                <TableCell className="text-center">
                  {amountChange !== null && (
                    <span
                      className={`font-medium ${
                        amountChange < 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {amountChange < 0 ? "▼" : "▲"}
                      {Math.abs(amountChange).toFixed(1)}%
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

