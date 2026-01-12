"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { SalesTransaction } from "@/lib/types";
import { formatChartCurrency, formatKoreanCurrency } from "@/lib/utils/format";

interface RefundAnalysisTabProps {
  allTransactions: SalesTransaction[];
  currentWeekStart: string;
  currentWeekEnd: string;
}

interface RefundReasonData {
  reason: string;
  count: number;
  amount: number;
  percentage: number;
  isPositive?: boolean;
  needsAttention?: boolean;
}

export function RefundAnalysisTab({
  allTransactions,
  currentWeekStart,
  currentWeekEnd,
}: RefundAnalysisTabProps) {
  // 환불 사유 정규화
  const normalizeReason = (reason: string | null): string => {
    if (!reason || reason.trim() === "") return "기타";
    const r = reason.trim();
    if (r.includes("금전")) return "금전 사유";
    if (r.includes("개인") && !r.includes("미개시")) return "개인 사유";
    if (r.includes("타") && r.includes("취업")) return "타 업계 취업";
    if (r.includes("현업")) return "현업 지속";
    if (r.includes("미개시")) return "미개시 환불";
    if (r.includes("흥미")) return "흥미 없음";
    if (r.includes("변심")) return "단순 변심";
    if (r.includes("합격") || r.includes("취업성공")) return "취업 성공";
    if (r.includes("진로변경")) return "진로 변경";
    if (r.includes("건강")) return "건강 사유";
    return "기타";
  };

  // 환불 사유 TOP5 계산
  const calculateRefundReasons = (): RefundReasonData[] => {
    const reasonMap = new Map<string, { count: number; amount: number }>();

    allTransactions.forEach((tx) => {
      if (tx.refund_amount && tx.refund_amount > 0) {
        const normalizedReason = normalizeReason(tx.refund_reason);
        const existing = reasonMap.get(normalizedReason) || {
          count: 0,
          amount: 0,
        };
        existing.count += 1;
        existing.amount += tx.refund_amount;
        reasonMap.set(normalizedReason, existing);
      }
    });

    const totalAmount = Array.from(reasonMap.values()).reduce(
      (sum, r) => sum + r.amount,
      0
    );

    const result: RefundReasonData[] = Array.from(reasonMap.entries())
      .map(([reason, data]) => ({
        reason,
        count: data.count,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        isPositive:
          reason === "타 업계 취업" ||
          reason === "취업 성공" ||
          reason === "현업 지속",
        needsAttention: reason === "미개시 환불",
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return result;
  };

  const refundReasons = calculateRefundReasons();

  // 포맷 함수는 lib/utils/format.ts에서 import
  const formatCurrency = formatChartCurrency;
  const formatCurrencyDetailed = formatKoreanCurrency;

  // 인사이트 생성
  const generateInsights = (): string[] => {
    const insights: string[] = [];

    // 금전+개인 사유 합산
    const financialAndPersonal = refundReasons.filter(
      (r) => r.reason === "금전 사유" || r.reason === "개인 사유"
    );
    const combinedPercentage = financialAndPersonal.reduce(
      (sum, r) => sum + r.percentage,
      0
    );
    if (combinedPercentage > 40) {
      insights.push(
        `금전+개인 사유 ${combinedPercentage.toFixed(1)}% → 상담 시 경제 상황 파악 중요`
      );
    }

    // 미개시 환불
    const unopenedRefund = refundReasons.find(
      (r) => r.reason === "미개시 환불"
    );
    if (unopenedRefund && unopenedRefund.percentage > 3) {
      insights.push(
        `미개시 환불 ${unopenedRefund.percentage.toFixed(1)}% → 온보딩 프로세스 개선 필요`
      );
    }

    // 긍정적 환불
    const positiveRefunds = refundReasons.filter((r) => r.isPositive);
    if (positiveRefunds.length > 0) {
      const positivePercentage = positiveRefunds.reduce(
        (sum, r) => sum + r.percentage,
        0
      );
      insights.push(
        `긍정적 환불(취업 성공 등) ${positivePercentage.toFixed(1)}% → 교육 효과 입증`
      );
    }

    return insights;
  };

  const insights = generateInsights();

  // 환불 타이밍 분석
  const calculateRefundTiming = () => {
    const timingMap = new Map<string, number>();

    allTransactions.forEach((tx) => {
      if (
        tx.refund_date &&
        tx.payment_date &&
        tx.refund_amount &&
        tx.refund_amount > 0
      ) {
        const paymentDate = new Date(tx.payment_date);
        const refundDate = new Date(tx.refund_date);
        const daysDiff = Math.floor(
          (refundDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff >= 0) {
          let category: string;
          if (daysDiff <= 30) category = "1개월 내";
          else if (daysDiff <= 60) category = "1-2개월";
          else if (daysDiff <= 90) category = "2-3개월";
          else if (daysDiff <= 180) category = "3-6개월";
          else category = "6개월+";

          timingMap.set(category, (timingMap.get(category) || 0) + 1);
        }
      }
    });

    const categories = ["1개월 내", "1-2개월", "2-3개월", "3-6개월", "6개월+"];
    const totalCount = Array.from(timingMap.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    const result = categories.map((category) => ({
      category,
      count: timingMap.get(category) || 0,
      percentage:
        totalCount > 0 ? ((timingMap.get(category) || 0) / totalCount) * 100 : 0,
    }));

    return { data: result, totalCount };
  };

  const refundTiming = calculateRefundTiming();

  return (
    <div className="space-y-6">
      {/* 환불 사유 TOP5 */}
      <Card>
        <CardHeader className="relative">
          <CardTitle className="text-lg">📊 환불 사유 TOP 5</CardTitle>
          <p className="text-sm text-gray-500">전체 기간 기준</p>
          <div className="absolute top-4 right-4 text-xs text-gray-500">
            단위: 만원/억
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {refundReasons.length > 0 ? (
            <>
              {refundReasons.map((item, index) => (
                <div key={item.reason} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {index + 1}. {item.reason}
                      </span>
                      {item.isPositive && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          ✅ 긍정적
                        </Badge>
                      )}
                      {item.needsAttention && (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          ⚠️ 주의
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrencyDetailed(item.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.count}건
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={item.percentage}
                    className="h-3"
                    style={
                      {
                        "--progress-background": item.isPositive
                          ? "#10B981"
                          : item.needsAttention
                          ? "#F59E0B"
                          : "#EF4444",
                      } as React.CSSProperties
                    }
                  />
                  <div className="text-sm text-gray-600">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}

              {/* 인사이트 */}
              {insights.length > 0 && (
                <div className="mt-6 space-y-2">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <span className="text-blue-600 font-medium">
                        💡 인사이트:
                      </span>
                      <span className="text-blue-800 ml-2">{insight}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 py-4">환불 데이터 없음</p>
          )}
        </CardContent>
      </Card>

      {/* 환불 타이밍 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⏱️ 환불까지 소요 기간</CardTitle>
          <p className="text-sm text-gray-500">
            결제일 ~ 환불일 기준 (총 {refundTiming.totalCount}건)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {refundTiming.data.map((item, index) => (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {item.category}
                  </span>
                  {item.category === "1개월 내" && item.percentage > 25 && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      ⚠️ 집중 관리
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {item.percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">{item.count}건</div>
                </div>
              </div>
              <Progress
                value={item.percentage}
                className="h-3"
                style={
                  {
                    "--progress-background":
                      item.category === "1개월 내" ? "#F59E0B" : "#EF4444",
                  } as React.CSSProperties
                }
              />
            </div>
          ))}

          {/* 인사이트 */}
          {refundTiming.data[0]?.percentage > 25 && (
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-blue-600 font-medium">💡 인사이트:</span>
              <span className="text-blue-800 ml-2">
                첫 30일이 환불 방어 골든타임 ({refundTiming.data[0].percentage.toFixed(1)}%) → 초기 집중 케어 필요
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

