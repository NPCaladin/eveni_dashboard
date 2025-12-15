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
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString();
  };

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

  return (
    <Card className="mb-8">
      <CardHeader className="relative">
        <CardTitle className="text-lg">이번 주 환불 상세</CardTitle>
        <div className="absolute top-4 right-4 text-xs text-gray-500">
          단위: 원
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
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

