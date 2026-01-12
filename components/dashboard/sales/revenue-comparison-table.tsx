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

  // 모바일 카드 뷰 컴포넌트
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {/* 주간 데이터 */}
      <div className="border rounded-lg p-4 bg-white">
        <h4 className="font-semibold text-sm mb-3 text-red-600">주간</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">건수</span>
            <p className="font-medium">{data.weekly.count}건</p>
          </div>
          <div>
            <span className="text-gray-500">실매출</span>
            <p className="font-medium">{formatCurrency(data.weekly.grossRevenue)}만</p>
          </div>
          <div>
            <span className="text-gray-500">순매출</span>
            <p className="font-bold text-blue-600">{formatCurrency(data.weekly.netRevenue)}만</p>
          </div>
          <div>
            <span className="text-gray-500">환불</span>
            {data.weekly.refund ? (
              <p className="font-medium text-red-600">
                {data.weekly.refund.count}건 / {formatCurrency(data.weekly.refund.amount)}만
              </p>
            ) : (
              <p className="text-gray-400">-</p>
            )}
          </div>
        </div>
        {netRevenueChange !== null && (
          <div className="mt-3 pt-3 border-t text-sm">
            <span className="text-gray-500">전주대비 </span>
            <span className={`font-bold ${netRevenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {netRevenueChange >= 0 ? "▲" : "▼"} {Math.abs(netRevenueChange).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* 비교 데이터 (전주/전년동기) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-lg p-3 bg-gray-50">
          <h5 className="font-medium text-xs text-gray-600 mb-2">전주</h5>
          <p className="text-sm">{data.prevWeek.count}건</p>
          <p className="text-sm font-semibold">{formatCurrency(data.prevWeek.netRevenue)}만</p>
        </div>
        <div className="border rounded-lg p-3 bg-gray-50">
          <h5 className="font-medium text-xs text-gray-600 mb-2">전년동기</h5>
          <p className="text-sm">{data.prevYear.count}건</p>
          <p className="text-sm font-semibold">{formatCurrency(data.prevYear.netRevenue)}만</p>
        </div>
      </div>

      {/* 누적 데이터 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-lg p-3 bg-blue-50">
          <h5 className="font-medium text-xs text-blue-600 mb-2">{monthLabel} 누적</h5>
          <p className="text-sm">{data.monthlyCum.count}건</p>
          <p className="text-sm font-semibold">{formatCurrency(data.monthlyCum.netRevenue)}만</p>
        </div>
        <div className="border rounded-lg p-3 bg-yellow-50">
          <h5 className="font-medium text-xs text-yellow-700 mb-2">2025 누적</h5>
          <p className="text-sm">{data.yearlyCum.count}건</p>
          <p className="text-sm font-bold">{formatLargeCurrency(data.yearlyCum.netRevenue)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="mb-8">
      <CardHeader className="relative">
        <CardTitle className="text-lg">매출 비교 분석</CardTitle>
        <div className="absolute top-4 right-4 text-xs text-gray-500 hidden md:block">
          단위: 만원 (2025누적: 억)
        </div>
      </CardHeader>
      <CardContent>
        {/* 모바일 카드 뷰 */}
        <MobileCardView />

        {/* 데스크톱 테이블 뷰 */}
        <div className="hidden md:block overflow-x-auto">
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

