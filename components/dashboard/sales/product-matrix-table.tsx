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

interface ProductMatrixData {
  "1타": {
    "20": { count: number; share: number };
    "26": { count: number; share: number };
    "32": { count: number; share: number };
    "40": { count: number; share: number };
    sum: { count: number; share: number };
  };
  일반: {
    "20": { count: number; share: number };
    "26": { count: number; share: number };
    "32": { count: number; share: number };
    "40": { count: number; share: number };
    sum: { count: number; share: number };
  };
  그룹반: { count: number; share: number };
  합격보장반: { count: number; share: number };
  GM: { count: number; share: number };
  스터디: { count: number; share: number };
  기타: { count: number; share: number };
}

interface ProductMatrixTableProps {
  data: ProductMatrixData;
  totalCount: number;
}

export function ProductMatrixTable({
  data,
  totalCount,
}: ProductMatrixTableProps) {
  // 0건이 아닌 카테고리만 표시
  const visibleCategories = [
    { key: "그룹반" as const, label: "그룹반", color: "bg-green-600", bgColor: "bg-green-50", show: data["그룹반"].count > 0 },
    { key: "합격보장반" as const, label: "합격보장반", color: "bg-orange-600", bgColor: "bg-orange-50", show: data["합격보장반"].count > 0 },
    { key: "GM" as const, label: "GM", color: "bg-red-600", bgColor: "bg-red-50", show: data["GM"].count > 0 },
    { key: "스터디" as const, label: "스터디", color: "bg-pink-600", bgColor: "bg-pink-50", show: data["스터디"].count > 0 },
  ].filter(cat => cat.show);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg">상품별 판매 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="border-r bg-slate-50">
                  구분
                </TableHead>
                <TableHead
                  colSpan={5}
                  className="text-center bg-blue-600 text-white border-r"
                >
                  1타 상품
                </TableHead>
                <TableHead
                  colSpan={5}
                  className="text-center bg-purple-600 text-white border-r"
                >
                  일반 상품
                </TableHead>
                {visibleCategories.map((cat) => (
                  <TableHead
                    key={cat.key}
                    rowSpan={2}
                    className={`text-center ${cat.color} text-white border-r`}
                  >
                    {cat.label}
                  </TableHead>
                ))}
                <TableHead
                  rowSpan={2}
                  className="text-center bg-slate-600 text-white"
                >
                  기타
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="text-center bg-blue-50 border-r">
                  20
                </TableHead>
                <TableHead className="text-center bg-blue-50 border-r">
                  26
                </TableHead>
                <TableHead className="text-center bg-blue-50 border-r">
                  32
                </TableHead>
                <TableHead className="text-center bg-blue-50 border-r">
                  40
                </TableHead>
                <TableHead className="text-center bg-blue-100 border-r font-bold">
                  SUM
                </TableHead>
                <TableHead className="text-center bg-purple-50 border-r">
                  20
                </TableHead>
                <TableHead className="text-center bg-purple-50 border-r">
                  26
                </TableHead>
                <TableHead className="text-center bg-purple-50 border-r">
                  32
                </TableHead>
                <TableHead className="text-center bg-purple-50 border-r">
                  40
                </TableHead>
                <TableHead className="text-center bg-purple-100 border-r font-bold">
                  SUM
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 결제건 */}
              <TableRow>
                <TableCell className="font-medium border-r bg-slate-50">
                  결제건
                </TableCell>
                {/* 1타 */}
                <TableCell className={`text-center border-r ${data["1타"]["20"].count === 0 ? "text-gray-400" : ""}`}>
                  {data["1타"]["20"].count}
                </TableCell>
                <TableCell className={`text-center border-r ${data["1타"]["26"].count === 0 ? "text-gray-400" : ""}`}>
                  {data["1타"]["26"].count}
                </TableCell>
                <TableCell className={`text-center border-r ${data["1타"]["32"].count === 0 ? "text-gray-400" : ""}`}>
                  {data["1타"]["32"].count}
                </TableCell>
                <TableCell className={`text-center border-r ${data["1타"]["40"].count === 0 ? "text-gray-400" : ""}`}>
                  {data["1타"]["40"].count}
                </TableCell>
                <TableCell className="text-center border-r bg-blue-50 font-bold">
                  {data["1타"].sum.count}
                </TableCell>
                {/* 일반 */}
                <TableCell className={`text-center border-r ${data["일반"]["20"].count === 0 ? "text-gray-400" : ""}`}>
                  {data["일반"]["20"].count}
                </TableCell>
                <TableCell className={`text-center border-r ${data["일반"]["26"].count === 0 ? "text-gray-400" : ""}`}>
                  {data["일반"]["26"].count}
                </TableCell>
                <TableCell className={`text-center border-r ${data["일반"]["32"].count === 0 ? "text-gray-400" : ""}`}>
                  {data["일반"]["32"].count}
                </TableCell>
                <TableCell className={`text-center border-r ${data["일반"]["40"].count === 0 ? "text-gray-400" : ""}`}>
                  {data["일반"]["40"].count}
                </TableCell>
                <TableCell className="text-center border-r bg-purple-50 font-bold">
                  {data["일반"].sum.count}
                </TableCell>
                {/* 동적 카테고리 */}
                {visibleCategories.map((cat) => (
                  <TableCell key={cat.key} className={`text-center border-r`}>
                    {data[cat.key].count}
                  </TableCell>
                ))}
                {/* 기타 */}
                <TableCell className={`text-center ${data["기타"].count === 0 ? "text-gray-400" : ""}`}>
                  {data["기타"].count}
                </TableCell>
              </TableRow>
              
              {/* 비중 */}
              <TableRow className="bg-slate-50">
                <TableCell className="font-medium border-r bg-slate-100">
                  비중
                </TableCell>
                {/* 1타 */}
                <TableCell className={`text-center border-r ${data["1타"]["20"].share === 0 ? "text-gray-400" : ""}`}>
                  {data["1타"]["20"].share.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["1타"]["26"].share === 0 ? "text-gray-400" : ""}`}>
                  {data["1타"]["26"].share.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["1타"]["32"].share === 0 ? "text-gray-400" : ""}`}>
                  {data["1타"]["32"].share.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["1타"]["40"].share === 0 ? "text-gray-400" : ""}`}>
                  {data["1타"]["40"].share.toFixed(1)}%
                </TableCell>
                <TableCell className="text-center border-r bg-blue-100 font-bold">
                  {data["1타"].sum.share.toFixed(1)}%
                </TableCell>
                {/* 일반 */}
                <TableCell className={`text-center border-r ${data["일반"]["20"].share === 0 ? "text-gray-400" : ""}`}>
                  {data["일반"]["20"].share.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["일반"]["26"].share === 0 ? "text-gray-400" : ""}`}>
                  {data["일반"]["26"].share.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["일반"]["32"].share === 0 ? "text-gray-400" : ""}`}>
                  {data["일반"]["32"].share.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["일반"]["40"].share === 0 ? "text-gray-400" : ""}`}>
                  {data["일반"]["40"].share.toFixed(1)}%
                </TableCell>
                <TableCell className="text-center border-r bg-purple-100 font-bold">
                  {data["일반"].sum.share.toFixed(1)}%
                </TableCell>
                {/* 동적 카테고리 */}
                {visibleCategories.map((cat) => (
                  <TableCell key={cat.key} className={`text-center border-r ${cat.bgColor} font-medium`}>
                    {data[cat.key].share.toFixed(1)}%
                  </TableCell>
                ))}
                {/* 기타 */}
                <TableCell className={`text-center ${data["기타"].share === 0 ? "text-gray-400" : ""}`}>
                  {data["기타"].share.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-right text-sm text-gray-600">
          총 {totalCount}건
        </div>
      </CardContent>
    </Card>
  );
}
