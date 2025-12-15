"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type RevenueStat = Database["public"]["Tables"]["edu_revenue_stats"]["Row"];
type MarketingMetric = {
  id: string;
  report_id: string;
  channel: string;
  cost: number;
  db_count: number;
  consultation_db_count: number;
  conversion_rate: number | null;
  type: string;
  created_at: string;
};
type RefundSummary = {
  id: string;
  report_id: string;
  category: string;
  weekly_val: number;
  prev_weekly_val: number;
  yoy_val: number;
  monthly_cum_val: number;
  yearly_cum_val: number;
  note: string | null;
  created_at: string;
};

interface KPICardsProps {
  revenueStats: RevenueStat[];
  marketingMetrics: MarketingMetric[];
  refundSummary: RefundSummary[];
  loading: boolean;
}

export function KPICards({ revenueStats, marketingMetrics, refundSummary, loading }: KPICardsProps) {
  // 이번주 총 실매출
  const totalRevenue = revenueStats.find((r) => r.category === "실매출")?.weekly_amt || 0;
  
  // 전주 대비 증감율
  const prevRevenue = revenueStats.find((r) => r.category === "실매출")?.prev_weekly_amt || 0;
  const revenueChange = prevRevenue > 0 
    ? ((Number(totalRevenue) - Number(prevRevenue)) / Number(prevRevenue)) * 100 
    : 0;
  
  // 총 환불액 - edu_revenue_stats의 monthly_refund_amt에서 가져오기 (엑셀 업로드 시 업데이트됨)
  // 또는 edu_refund_summary에서 가져오기 (수동 입력 시)
  const refundFromStats = revenueStats.find((r) => r.category === "실매출")?.monthly_refund_amt || 0;
  const refundFromSummary = refundSummary.find((r) => r.category === "환불확정액")?.weekly_val || 0;
  // 두 값 중 0이 아닌 값을 우선 사용 (엑셀 업로드가 있으면 stats, 수동 입력이면 summary)
  const totalRefund = refundFromStats > 0 ? refundFromStats : refundFromSummary;
  
  // 마케팅 총 DB수
  const totalDB = marketingMetrics.reduce((sum, m) => sum + (m.db_count || 0), 0);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">이번주 총 실매출</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">주간 실매출 합계</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전주 대비 증감율</CardTitle>
          {revenueChange !== 0 && (
            revenueChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${revenueChange > 0 ? "text-green-500" : revenueChange < 0 ? "text-red-500" : ""}`}>
            {revenueChange > 0 ? "▲" : revenueChange < 0 ? "▼" : ""} {Math.abs(revenueChange).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">전주 대비 변화율</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 환불액</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRefund)}</div>
          <p className="text-xs text-muted-foreground">주간 환불 확정액</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">마케팅 총 DB수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDB.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">총 데이터베이스 수</p>
        </CardContent>
      </Card>
    </div>
  );
}


