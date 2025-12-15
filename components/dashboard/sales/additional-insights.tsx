"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SellerPerformance {
  seller: string;
  count: number;
  revenue: number;
  share: number;
  prevWeekChange: number;
}

interface ProfitabilityMetrics {
  avgOrderValue: number;
  avgOrderValueChange: number;
  netProfitRate: number;
  refundRate: number;
  promoRate: number;
}

interface CustomerAnalysis {
  newCount: number;
  retentionCount: number;
  newShare: number;
  retentionShare: number;
  retentionRateChange: number;
}

interface AdditionalInsightsProps {
  sellerPerformance: SellerPerformance[];
  profitability: ProfitabilityMetrics;
  customerAnalysis: CustomerAnalysis;
}

export function AdditionalInsights({
  sellerPerformance,
  profitability,
  customerAnalysis,
}: AdditionalInsightsProps) {
  const formatCurrency = (amount: number) => {
    const millions = Math.floor(amount / 10000);
    return `${millions.toLocaleString()}만원`;
  };

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* 판매자별 실적 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">👥 판매자별 실적</CardTitle>
          <p className="text-sm text-gray-500">(세일즈본부)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {sellerPerformance.length > 0 ? (
            <>
              {sellerPerformance.map((seller, index) => (
                <div key={seller.seller} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {getMedalEmoji(index)} {seller.seller}
                    </span>
                    <Badge variant="outline">
                      {seller.count}건 • {formatCurrency(seller.revenue)}
                    </Badge>
                  </div>
                  <Progress value={seller.share} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {seller.share.toFixed(1)}%
                    </span>
                    {seller.prevWeekChange !== 0 && (
                      <span
                        className={`font-medium ${
                          seller.prevWeekChange > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        전주 대비{" "}
                        {seller.prevWeekChange > 0 ? "▲" : "▼"}
                        {Math.abs(seller.prevWeekChange).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* 객단가 */}
              <div className="border-t pt-4 mt-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">📊 객단가</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(profitability.avgOrderValue)}
                  </div>
                  {profitability.avgOrderValueChange !== 0 && (
                    <div
                      className={`text-sm font-medium mt-1 ${
                        profitability.avgOrderValueChange > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      전주 대비{" "}
                      {profitability.avgOrderValueChange > 0 ? "▲" : "▼"}
                      {Math.abs(profitability.avgOrderValueChange).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-4">
              세일즈본부 데이터 없음
            </p>
          )}
        </CardContent>
      </Card>

      {/* 고객 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">👤 고객 분석</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-3">신규 vs 재결제</div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">신규</span>
                  <span className="text-sm text-gray-600">
                    {customerAnalysis.newShare.toFixed(1)}% •{" "}
                    {customerAnalysis.newCount}명
                  </span>
                </div>
                <Progress
                  value={customerAnalysis.newShare}
                  className="h-2 bg-blue-100"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">재결제</span>
                  <span className="text-sm text-gray-600">
                    {customerAnalysis.retentionShare.toFixed(1)}% •{" "}
                    {customerAnalysis.retentionCount}명
                  </span>
                </div>
                <Progress
                  value={customerAnalysis.retentionShare}
                  className="h-2 bg-purple-100"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            {customerAnalysis.retentionRateChange !== 0 && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <div
                  className={`text-sm font-medium ${
                    customerAnalysis.retentionRateChange > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  재결제율 전월 대비{" "}
                  {customerAnalysis.retentionRateChange > 0 ? "▲" : "▼"}
                  {Math.abs(customerAnalysis.retentionRateChange).toFixed(1)}
                  %p
                </div>
                {customerAnalysis.retentionRateChange > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    → 고객 충성도 우수 🔥
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="text-sm text-gray-600 mb-2">
              상품 업그레이드 현황
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              <div>20주 → 26주: 0건</div>
              <div>26주 → 32주: 1건</div>
              <div>32주 → 40주: 0건</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

