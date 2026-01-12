"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { SalesTransaction } from "@/lib/types";
import { formatManwon } from "@/lib/utils/format";

interface SalesAnalysisTabProps {
  currentWeekTx: SalesTransaction[];
  prevWeekTx: SalesTransaction[];
  allTransactions: SalesTransaction[];
  currentWeekStart: string;
  currentWeekEnd: string;
  prevWeekStart: string;
  prevWeekEnd: string;
}

interface SellerPerformance {
  seller: string;
  count: number;
  revenue: number;
  avgOrderValue: number;
  refundRate: number;
  prevWeekChange: number;
  share: number;
}

export function SalesAnalysisTab({
  currentWeekTx,
  prevWeekTx,
  allTransactions,
  currentWeekStart,
  currentWeekEnd,
  prevWeekStart,
  prevWeekEnd,
}: SalesAnalysisTabProps) {
  // 판매자별 성과 계산
  const calculateSellerPerformance = (): SellerPerformance[] => {
    // 세일즈본부 판매자만 필터링
    const salesTeamSellers = ["샐", "써", "에"];
    
    // 현재 주 판매자별 매출
    const sellerMap = new Map<string, { count: number; revenue: number }>();
    currentWeekTx.forEach((tx) => {
      if (salesTeamSellers.includes(tx.seller || "")) {
        const existing = sellerMap.get(tx.seller!) || { count: 0, revenue: 0 };
        existing.count += tx.payment_count_refined || 0;
        existing.revenue += tx.payment_amount || 0;
        sellerMap.set(tx.seller!, existing);
      }
    });

    // 전주 판매자별 매출
    const prevSellerMap = new Map<string, { revenue: number }>();
    prevWeekTx.forEach((tx) => {
      if (salesTeamSellers.includes(tx.seller || "")) {
        const existing = prevSellerMap.get(tx.seller!) || { revenue: 0 };
        existing.revenue += tx.payment_amount || 0;
        prevSellerMap.set(tx.seller!, existing);
      }
    });

    // 판매자별 환불 계산 (해당 기간 환불일 기준)
    const sellerRefundMap = new Map<string, number>();
    allTransactions.forEach((tx) => {
      if (
        tx.refund_date &&
        tx.refund_date >= currentWeekStart &&
        tx.refund_date <= currentWeekEnd &&
        salesTeamSellers.includes(tx.seller || "")
      ) {
        const existing = sellerRefundMap.get(tx.seller!) || 0;
        sellerRefundMap.set(tx.seller!, existing + (tx.refund_amount || 0));
      }
    });

    const totalRevenue = Array.from(sellerMap.values()).reduce(
      (sum, s) => sum + s.revenue,
      0
    );

    const result: SellerPerformance[] = Array.from(sellerMap.entries()).map(
      ([seller, data]) => {
        const prevRevenue = prevSellerMap.get(seller)?.revenue || 0;
        const refundAmount = sellerRefundMap.get(seller) || 0;
        const refundRate =
          data.revenue > 0 ? (refundAmount / data.revenue) * 100 : 0;
        const prevWeekChange =
          prevRevenue > 0 ? ((data.revenue - prevRevenue) / prevRevenue) * 100 : 0;

        return {
          seller,
          count: data.count,
          revenue: data.revenue,
          avgOrderValue: data.count > 0 ? data.revenue / data.count : 0,
          refundRate,
          prevWeekChange,
          share: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        };
      }
    );

    return result.sort((a, b) => b.revenue - a.revenue);
  };

  const sellerPerformance = calculateSellerPerformance();

  // 전체 객단가 계산
  const totalCount = sellerPerformance.reduce((sum, s) => sum + s.count, 0);
  const totalRevenue = sellerPerformance.reduce((sum, s) => sum + s.revenue, 0);
  const avgOrderValue = totalCount > 0 ? totalRevenue / totalCount : 0;

  // 전주 객단가
  const prevTotalCount = prevWeekTx.reduce(
    (sum, tx) => sum + (tx.payment_count_refined || 0),
    0
  );
  const prevTotalRevenue = prevWeekTx.reduce(
    (sum, tx) => sum + (tx.payment_amount || 0),
    0
  );
  const prevAvgOrderValue =
    prevTotalCount > 0 ? prevTotalRevenue / prevTotalCount : 0;
  const avgOrderValueChange =
    prevAvgOrderValue > 0
      ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100
      : 0;

  // 포맷 함수는 lib/utils/format.ts에서 import
  const formatCurrency = formatManwon;

  const getMedalEmoji = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return "";
    }
  };

  // 최저 환불률 판매자
  const lowestRefundSeller = sellerPerformance.reduce((lowest, current) => {
    if (!lowest || current.refundRate < lowest.refundRate) {
      return current;
    }
    return lowest;
  }, sellerPerformance[0]);

  // 요일별 패턴 계산
  const calculateWeekdayPattern = () => {
    // 현재 주차 요일별 패턴
    const currentWeekdayMap = new Map<number, { count: number; revenue: number }>();
    currentWeekTx.forEach((tx) => {
      if (tx.payment_date) {
        const date = new Date(tx.payment_date);
        const dayOfWeek = date.getDay();
        const existing = currentWeekdayMap.get(dayOfWeek) || { count: 0, revenue: 0 };
        existing.count += tx.payment_count_refined || 0;
        existing.revenue += tx.payment_amount || 0;
        currentWeekdayMap.set(dayOfWeek, existing);
      }
    });

    // 전체 평균 요일별 패턴
    const allWeekdayMap = new Map<number, { count: number; revenue: number }>();
    allTransactions.forEach((tx) => {
      if (tx.payment_date && tx.status === "결") {
        const date = new Date(tx.payment_date);
        const dayOfWeek = date.getDay();
        const existing = allWeekdayMap.get(dayOfWeek) || { count: 0, revenue: 0 };
        // 건수: payment_count_refined 사용
        existing.count += tx.payment_count_refined || 0;
        // 매출: 모든 거래의 payment_amount 합산
        existing.revenue += tx.payment_amount || 0;
        allWeekdayMap.set(dayOfWeek, existing);
      }
    });

    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const currentTotal = Array.from(currentWeekdayMap.values()).reduce(
      (sum, d) => sum + d.revenue,
      0
    );
    const allTotal = Array.from(allWeekdayMap.values()).reduce(
      (sum, d) => sum + d.revenue,
      0
    );

    const result = dayNames.map((name, index) => {
      const currentData = currentWeekdayMap.get(index) || { count: 0, revenue: 0 };
      const allData = allWeekdayMap.get(index) || { count: 0, revenue: 0 };
      
      const currentPercentage = currentTotal > 0 ? (currentData.revenue / currentTotal) * 100 : 0;
      const allPercentage = allTotal > 0 ? (allData.revenue / allTotal) * 100 : 0;
      const difference = currentPercentage - allPercentage;

      return {
        day: name,
        dayIndex: index,
        count: currentData.count,
        revenue: currentData.revenue,
        percentage: currentPercentage,
        allAverage: allPercentage,
        difference,
      };
    });

    return result;
  };

  const weekdayPattern = calculateWeekdayPattern();
  const maxPercentage = Math.max(...weekdayPattern.map((d) => d.percentage));
  const goldenDays = weekdayPattern.filter((d) => d.percentage > 20);

  return (
    <div className="space-y-6">
      {/* 판매자별 종합 성과 */}
      <Card>
        <CardHeader className="relative">
          <CardTitle className="text-lg">👥 판매자별 종합 성과</CardTitle>
          <p className="text-sm text-gray-500">(세일즈본부)</p>
          <div className="absolute top-4 right-4 text-xs text-gray-500">
            단위: 만원
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sellerPerformance.length > 0 ? (
            <>
              {/* 판매자 목록 */}
              {sellerPerformance.map((seller, index) => (
                <div key={seller.seller} className="space-y-2 pb-4 border-b last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">
                        {getMedalEmoji(index)} {seller.seller}
                      </span>
                      {seller.seller === lowestRefundSeller?.seller && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          ⭐ 최저 환불률
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline">
                      {seller.count}건 • {formatCurrency(seller.revenue)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">객단가</div>
                      <div className="font-semibold">
                        {formatCurrency(seller.avgOrderValue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">환불률</div>
                      <div
                        className={`font-semibold ${
                          seller.refundRate < 10
                            ? "text-green-600"
                            : seller.refundRate < 15
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {seller.refundRate.toFixed(1)}%
                        {seller.refundRate >= 15 && " ⚠️"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">전주 대비</div>
                      <div
                        className={`font-semibold ${
                          seller.prevWeekChange > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {seller.prevWeekChange > 0 ? "▲" : "▼"}
                        {Math.abs(seller.prevWeekChange).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <Progress value={seller.share} className="h-2" />
                  <div className="text-sm text-gray-600">
                    점유율 {seller.share.toFixed(1)}%
                  </div>
                </div>
              ))}

              {/* 객단가 */}
              <div className="border-t pt-4 mt-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">📊 평균 객단가</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(avgOrderValue)}
                  </div>
                  {avgOrderValueChange !== 0 && (
                    <div
                      className={`text-sm font-medium mt-1 ${
                        avgOrderValueChange > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      전주 대비{" "}
                      {avgOrderValueChange > 0 ? "▲" : "▼"}
                      {Math.abs(avgOrderValueChange).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>

              {/* 인사이트 */}
              {lowestRefundSeller && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-blue-600 font-medium">💡 인사이트:</span>
                  <span className="text-blue-800 ml-2">
                    환불률 최저: {lowestRefundSeller.seller} (
                    {lowestRefundSeller.refundRate.toFixed(1)}%) → 영업 기법
                    벤치마킹 권장
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 py-4">
              세일즈본부 데이터 없음
            </p>
          )}
        </CardContent>
      </Card>

      {/* 요일별 결제 패턴 */}
      <Card>
        <CardHeader className="relative">
          <CardTitle className="text-lg">📅 요일별 결제 패턴</CardTitle>
          <p className="text-sm text-gray-500">이번 주 vs 전체 평균</p>
          <div className="absolute top-4 right-4 text-xs text-gray-500">
            단위: 만원
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 전체 평균 요약 테이블 */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-xs font-semibold text-slate-600 mb-3">
              📊 전체 평균
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdayPattern.map((day) => (
                <div key={day.day} className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">
                    {day.day}
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {day.allAverage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 현재 주차 상세 분석 */}
          <div className="space-y-4">
          {weekdayPattern.map((day) => (
            <div key={day.day} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 w-8 text-lg">{day.day}</span>
                  {day.percentage === maxPercentage && day.percentage > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      👑 최고
                    </Badge>
                  )}
                  {day.percentage > 20 && day.percentage !== maxPercentage && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      ⭐ 골든
                    </Badge>
                  )}
                  {Math.abs(day.difference) > 5 && (
                    <Badge
                      className={
                        day.difference > 0
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }
                    >
                      {day.difference > 0 ? "▲" : "▼"}
                      {Math.abs(day.difference).toFixed(1)}%p
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 text-lg">
                    {day.percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {day.count}건 • {formatCurrency(day.revenue)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    평균: {day.allAverage.toFixed(1)}%
                  </div>
                </div>
              </div>
              <Progress value={day.percentage} className="h-3" />
            </div>
          ))}

          {/* 인사이트 */}
          {goldenDays.length > 0 && (
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-blue-600 font-medium">💡 인사이트:</span>
              <span className="text-blue-800 ml-2">
                이번 주 {goldenDays.map((d) => d.day).join(", ")} 골든타임 (
                {goldenDays.reduce((sum, d) => sum + d.percentage, 0).toFixed(1)}
                %)
              </span>
            </div>
          )}

          {currentWeekTx.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              이번 주 데이터 없음
            </p>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

