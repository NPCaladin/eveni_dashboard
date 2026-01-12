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

interface ProductMatrixCell {
  count: number;
  share: number;
  amount: number;
  amountShare: number;
}

interface ProductMatrixData {
  "1타": {
    "20": ProductMatrixCell;
    "26": ProductMatrixCell;
    "32": ProductMatrixCell;
    "40": ProductMatrixCell;
    sum: ProductMatrixCell;
  };
  일반: {
    "20": ProductMatrixCell;
    "26": ProductMatrixCell;
    "32": ProductMatrixCell;
    "40": ProductMatrixCell;
    sum: ProductMatrixCell;
  };
  그룹반: ProductMatrixCell;
  합격보장반: ProductMatrixCell;
  GM: ProductMatrixCell;
  스터디: ProductMatrixCell;
  기타: ProductMatrixCell;
  totalAmount: number;
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

  // 금액 포맷 함수
  const formatAmount = (amount: number) => {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`;
    }
    return amount.toLocaleString();
  };

  // 모바일 카드 뷰 컴포넌트
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {/* 1타 상품 */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h4 className="font-semibold text-sm mb-3 text-blue-700">1타 상품</h4>
        <div className="grid grid-cols-4 gap-2 text-xs mb-2">
          {(["20", "26", "32", "40"] as const).map((week) => (
            <div key={week} className="text-center p-2 bg-white rounded">
              <div className="text-gray-500">{week}주</div>
              <div className="font-medium">{data["1타"][week].count}건</div>
              <div className="text-blue-600">{data["1타"][week].share.toFixed(1)}%</div>
              <div className="text-green-600 text-[10px]">₩{data["1타"][week].amountShare.toFixed(1)}%</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">금액비중: <span className="font-bold text-green-700">{data["1타"].sum.amountShare.toFixed(1)}%</span></span>
          <span className="font-bold text-blue-700">건수: {data["1타"].sum.count}건 ({data["1타"].sum.share.toFixed(1)}%)</span>
        </div>
      </div>

      {/* 일반 상품 */}
      <div className="border rounded-lg p-4 bg-purple-50">
        <h4 className="font-semibold text-sm mb-3 text-purple-700">일반 상품</h4>
        <div className="grid grid-cols-4 gap-2 text-xs mb-2">
          {(["20", "26", "32", "40"] as const).map((week) => (
            <div key={week} className="text-center p-2 bg-white rounded">
              <div className="text-gray-500">{week}주</div>
              <div className="font-medium">{data["일반"][week].count}건</div>
              <div className="text-purple-600">{data["일반"][week].share.toFixed(1)}%</div>
              <div className="text-green-600 text-[10px]">₩{data["일반"][week].amountShare.toFixed(1)}%</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">금액비중: <span className="font-bold text-green-700">{data["일반"].sum.amountShare.toFixed(1)}%</span></span>
          <span className="font-bold text-purple-700">건수: {data["일반"].sum.count}건 ({data["일반"].sum.share.toFixed(1)}%)</span>
        </div>
      </div>

      {/* 기타 카테고리 */}
      {(visibleCategories.length > 0 || data["기타"].count > 0) && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3 text-gray-700">기타 상품</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {visibleCategories.map((cat) => (
              <div key={cat.key} className={`p-2 rounded ${cat.bgColor}`}>
                <div className="text-gray-600 font-medium">{cat.label}</div>
                <div className="text-xs">
                  {data[cat.key].count}건 ({data[cat.key].share.toFixed(1)}%)
                </div>
                <div className="text-xs text-green-700">
                  금액 {data[cat.key].amountShare.toFixed(1)}%
                </div>
              </div>
            ))}
            {data["기타"].count > 0 && (
              <div className="p-2 rounded bg-gray-50">
                <div className="text-gray-600 font-medium">기타</div>
                <div className="text-xs">
                  {data["기타"].count}건 ({data["기타"].share.toFixed(1)}%)
                </div>
                <div className="text-xs text-green-700">
                  금액 {data["기타"].amountShare.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between text-sm text-gray-600">
        <span>총 금액: {formatAmount(data.totalAmount)}원</span>
        <span>총 {totalCount}건</span>
      </div>
    </div>
  );

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg">상품별 판매 현황</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 모바일 카드 뷰 */}
        <MobileCardView />

        {/* 데스크톱 테이블 뷰 */}
        <div className="hidden md:block overflow-x-auto">
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
              
              {/* 건수 비중 */}
              <TableRow className="bg-slate-50">
                <TableCell className="font-medium border-r bg-slate-100">
                  건수비중
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

              {/* 금액 비중 */}
              <TableRow className="bg-green-50">
                <TableCell className="font-medium border-r bg-green-100 text-green-800">
                  금액비중
                </TableCell>
                {/* 1타 */}
                <TableCell className={`text-center border-r ${data["1타"]["20"].amountShare === 0 ? "text-gray-400" : "text-green-700"}`}>
                  {data["1타"]["20"].amountShare.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["1타"]["26"].amountShare === 0 ? "text-gray-400" : "text-green-700"}`}>
                  {data["1타"]["26"].amountShare.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["1타"]["32"].amountShare === 0 ? "text-gray-400" : "text-green-700"}`}>
                  {data["1타"]["32"].amountShare.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["1타"]["40"].amountShare === 0 ? "text-gray-400" : "text-green-700"}`}>
                  {data["1타"]["40"].amountShare.toFixed(1)}%
                </TableCell>
                <TableCell className="text-center border-r bg-green-200 font-bold text-green-800">
                  {data["1타"].sum.amountShare.toFixed(1)}%
                </TableCell>
                {/* 일반 */}
                <TableCell className={`text-center border-r ${data["일반"]["20"].amountShare === 0 ? "text-gray-400" : "text-green-700"}`}>
                  {data["일반"]["20"].amountShare.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["일반"]["26"].amountShare === 0 ? "text-gray-400" : "text-green-700"}`}>
                  {data["일반"]["26"].amountShare.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["일반"]["32"].amountShare === 0 ? "text-gray-400" : "text-green-700"}`}>
                  {data["일반"]["32"].amountShare.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-center border-r ${data["일반"]["40"].amountShare === 0 ? "text-gray-400" : "text-green-700"}`}>
                  {data["일반"]["40"].amountShare.toFixed(1)}%
                </TableCell>
                <TableCell className="text-center border-r bg-green-200 font-bold text-green-800">
                  {data["일반"].sum.amountShare.toFixed(1)}%
                </TableCell>
                {/* 동적 카테고리 */}
                {visibleCategories.map((cat) => (
                  <TableCell key={cat.key} className="text-center border-r bg-green-100 font-medium text-green-700">
                    {data[cat.key].amountShare.toFixed(1)}%
                  </TableCell>
                ))}
                {/* 기타 */}
                <TableCell className={`text-center ${data["기타"].amountShare === 0 ? "text-gray-400" : "text-green-700"}`}>
                  {data["기타"].amountShare.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="hidden md:flex justify-between mt-4 text-sm text-gray-600">
          <span>총 금액: {formatAmount(data.totalAmount)}원</span>
          <span>총 {totalCount}건</span>
        </div>
      </CardContent>
    </Card>
  );
}
