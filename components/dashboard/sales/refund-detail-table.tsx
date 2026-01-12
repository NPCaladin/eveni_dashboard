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
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils/format";

interface RefundDetail {
  refund_date: string;
  buyer: string;
  refund_amount: number;
  refund_reason?: string;
  seller?: string;
  product_name?: string;
  weeks?: number;
}

interface RefundDetailTableProps {
  refunds: RefundDetail[];
}

export function RefundDetailTable({ refunds }: RefundDetailTableProps) {
  // 포맷 함수는 lib/utils/format.ts에서 import
  const formatCurrency = formatNumber;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  if (refunds.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">이번 주 환불 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            이번 주 환불 건이 없습니다. 👏
          </div>
        </CardContent>
      </Card>
    );
  }

  // 모바일 카드 뷰 컴포넌트
  const MobileCardView = () => (
    <div className="space-y-3 md:hidden">
      {refunds.map((refund, index) => (
        <div key={index} className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-500">{formatDate(refund.refund_date)}</span>
            <span className="font-bold text-red-600">{formatCurrency(refund.refund_amount)}원</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">환불자</span>
              <span className="font-medium">{refund.buyer || "-"}</span>
            </div>
            {refund.seller && (
              <div className="flex justify-between">
                <span className="text-gray-600">담당</span>
                <Badge variant="outline" className="text-xs">{refund.seller}</Badge>
              </div>
            )}
            {refund.refund_reason && (
              <div className="mt-2 pt-2 border-t">
                <span className="text-gray-600 text-xs">사유: </span>
                <span className="text-xs">{refund.refund_reason}</span>
              </div>
            )}
            {refund.product_name && (
              <div className="text-xs text-gray-500 mt-1">
                {refund.product_name}{refund.weeks && ` (${refund.weeks}주)`}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="mb-8">
      <CardHeader className="relative">
        <CardTitle className="text-lg">이번 주 환불 상세</CardTitle>
        <div className="absolute top-4 right-4 text-xs text-gray-500 hidden md:block">
          단위: 원
        </div>
      </CardHeader>
      <CardContent>
        {/* 모바일 카드 뷰 */}
        <MobileCardView />

        {/* 데스크톱 테이블 뷰 */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">환불일</TableHead>
                <TableHead>환불자</TableHead>
                <TableHead className="text-right">환불금액</TableHead>
                <TableHead>환불사유</TableHead>
                <TableHead>담당</TableHead>
                <TableHead>진행상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((refund, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {formatDate(refund.refund_date)}
                  </TableCell>
                  <TableCell>{refund.buyer || "-"}</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {formatCurrency(refund.refund_amount)}
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    {refund.refund_reason || "-"}
                  </TableCell>
                  <TableCell>
                    {refund.seller ? (
                      <Badge variant="outline">{refund.seller}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {refund.product_name || "-"}
                    {refund.weeks && ` (${refund.weeks}주)`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

