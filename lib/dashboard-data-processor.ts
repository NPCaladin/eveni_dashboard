import { Database } from "@/lib/supabase/types";

type SalesTransaction = Database["public"]["Tables"]["sales_transactions"]["Row"];

/**
 * 주간 데이터를 주차별로 집계
 */
export function aggregateWeeklyData(transactions: SalesTransaction[], year: number) {
  const weeklyMap = new Map<string, {
    week: string;
    orderAmount: number;
    netRevenue: number;
    refundAmount: number;
    validCount: number;
  }>();

  transactions
    .filter((t) => {
      const txDate = new Date(t.payment_date);
      return txDate.getFullYear() === year;
    })
    .forEach((tx) => {
      const week = tx.weeks ? String(tx.weeks) : "기타";
      const existing = weeklyMap.get(week) || {
        week,
        orderAmount: 0,
        netRevenue: 0,
        refundAmount: 0,
        validCount: 0,
      };

      existing.orderAmount += tx.order_amount;
      existing.netRevenue += tx.payment_amount;
      existing.refundAmount += tx.refund_amount;
      if (tx.is_count_valid) existing.validCount += 1;

      weeklyMap.set(week, existing);
    });

  return Array.from(weeklyMap.values()).sort((a, b) => {
    const aNum = parseInt(a.week.replace(/\D/g, "")) || 999;
    const bNum = parseInt(b.week.replace(/\D/g, "")) || 999;
    return aNum - bNum;
  });
}

/**
 * 월별 데이터를 집계
 */
export function aggregateMonthlyData(transactions: SalesTransaction[], year: number) {
  const monthlyMap = new Map<number, {
    month: number;
    revenue: number;
    refundAmount: number;
    orderAmount: number;
  }>();

  transactions
    .filter((t) => {
      const txDate = new Date(t.payment_date);
      return txDate.getFullYear() === year;
    })
    .forEach((tx) => {
      const month = new Date(tx.payment_date).getMonth() + 1;
      const existing = monthlyMap.get(month) || {
        month,
        revenue: 0,
        refundAmount: 0,
        orderAmount: 0,
      };

      existing.revenue += tx.payment_amount;
      existing.refundAmount += tx.refund_amount;
      existing.orderAmount += tx.order_amount;

      monthlyMap.set(month, existing);
    });

  // 1~12월 전체 데이터 생성 (없는 월은 0으로)
  const result = [];
  for (let month = 1; month <= 12; month++) {
    const data = monthlyMap.get(month) || {
      month,
      revenue: 0,
      refundAmount: 0,
      orderAmount: 0,
    };
    result.push(data);
  }

  return result;
}

/**
 * 상품 카테고리별 매출 집계
 */
export function aggregateProductData(transactions: SalesTransaction[]) {
  const productMap = new Map<string, { revenue: number; count: number }>();

  transactions.forEach((tx) => {
    const category = tx.product_type;
    const existing = productMap.get(category) || { revenue: 0, count: 0 };
    existing.revenue += tx.payment_amount;
    if (tx.is_count_valid) existing.count += 1;
    productMap.set(category, existing);
  });

  const totalRevenue = Array.from(productMap.values()).reduce((sum, p) => sum + p.revenue, 0);

  return Array.from(productMap.entries()).map(([category, data]) => ({
    category,
    revenue: data.revenue,
    share: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    count: data.count,
  }));
}

/**
 * 판매 유형별 집계 (신규 vs 재결제)
 */
export function aggregateSaleTypeData(transactions: SalesTransaction[]) {
  const typeMap = new Map<string, { count: number }>();

  transactions.forEach((tx) => {
    const salesType = tx.sales_type || tx.sales_type || "";
    const type = salesType.includes("재결제") || salesType.includes("리텐션") ? "재결제" : "신규";
    const existing = typeMap.get(type) || { count: 0 };
    if (tx.is_count_valid) existing.count += 1;
    typeMap.set(type, existing);
  });

  const totalCount = Array.from(typeMap.values()).reduce((sum, t) => sum + t.count, 0);

  return Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    share: totalCount > 0 ? (data.count / totalCount) * 100 : 0,
  }));
}

/**
 * 판매자별 성과 집계
 */
export function aggregateAgentSalesData(transactions: SalesTransaction[]) {
  const agentMap = new Map<string, {
    revenue: number;
    refundAmount: number;
    orderAmount: number;
    newSalesCount: number;
    retentionSalesCount: number;
  }>();

  transactions.forEach((tx) => {
    const agent = tx.seller;
    const existing = agentMap.get(agent) || {
      revenue: 0,
      refundAmount: 0,
      orderAmount: 0,
      newSalesCount: 0,
      retentionSalesCount: 0,
    };

    existing.revenue += tx.payment_amount;
    existing.refundAmount += tx.refund_amount;
    existing.orderAmount += tx.order_amount;

    if (tx.is_count_valid) {
      const isRetention = tx.sales_type?.includes("재결제") || tx.sales_type?.includes("리텐션");
      if (isRetention) {
        existing.retentionSalesCount += 1;
      } else {
        existing.newSalesCount += 1;
      }
    }

    agentMap.set(agent, existing);
  });

  return Array.from(agentMap.entries()).map(([agentName, data]) => ({
    agentName,
    revenue: data.revenue,
    refundRate: data.orderAmount > 0 ? (data.refundAmount / data.orderAmount) * 100 : 0,
    newSalesCount: data.newSalesCount,
    retentionSalesCount: data.retentionSalesCount,
  }));
}

/**
 * 코호트 환불 분석 (결제월 x 환불 발생 주차)
 */
export function generateCohortData(transactions: SalesTransaction[]) {
  // 환불이 발생한 거래만 필터
  const refundedTx = transactions.filter((t) => t.refund_amount > 0 && t.refund_date);

  const cohortMap = new Map<number, {
    week0: number;
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  }>();

  refundedTx.forEach((tx) => {
    const paymentDate = new Date(tx.payment_date);
    const refundDate = new Date(tx.refund_date!);
    const paymentMonth = paymentDate.getMonth() + 1;

    // 결제일과 환불일 사이의 주 차이 계산
    const diffTime = refundDate.getTime() - paymentDate.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

    const cohort = cohortMap.get(paymentMonth) || {
      week0: 0,
      week1: 0,
      week2: 0,
      week3: 0,
      week4: 0,
    };

    if (diffWeeks === 0) cohort.week0 += 1;
    else if (diffWeeks === 1) cohort.week1 += 1;
    else if (diffWeeks === 2) cohort.week2 += 1;
    else if (diffWeeks === 3) cohort.week3 += 1;
    else if (diffWeeks >= 4) cohort.week4 += 1;

    cohortMap.set(paymentMonth, cohort);
  });

  // 1~12월 전체 생성
  const result = [];
  for (let month = 1; month <= 12; month++) {
    const data = cohortMap.get(month) || {
      week0: 0,
      week1: 0,
      week2: 0,
      week3: 0,
      week4: 0,
    };
    result.push({
      paymentMonth: `${month}월`,
      ...data,
    });
  }

  return result;
}

/**
 * KPI 데이터 계산
 */
export function calculateKPIData(
  currentWeekTx: SalesTransaction[],
  prevWeekTx: SalesTransaction[],
  yoyWeekTx: SalesTransaction[],
  recentWeeksTx: SalesTransaction[]
) {
  const currentWeekGross = currentWeekTx.reduce((sum, t) => sum + t.order_amount, 0);
  const currentWeekNet = currentWeekTx.reduce((sum, t) => sum + t.payment_amount, 0);
  const currentWeekRefund = currentWeekTx.reduce((sum, t) => sum + t.refund_amount, 0);
  
  const prevWeekNet = prevWeekTx.reduce((sum, t) => sum + t.payment_amount, 0);
  const yoyNet = yoyWeekTx.reduce((sum, t) => sum + t.payment_amount, 0);

  // 1타 비중 계산
  const tier1Revenue = currentWeekTx
    .filter((t) => t.product_type === "1타")
    .reduce((sum, t) => sum + t.payment_amount, 0);
  const tier1Share = currentWeekNet > 0 ? (tier1Revenue / currentWeekNet) * 100 : 0;

  const prevTier1Revenue = prevWeekTx
    .filter((t) => t.product_type === "1타")
    .reduce((sum, t) => sum + t.payment_amount, 0);
  const prevTier1Net = prevWeekTx.reduce((sum, t) => sum + t.payment_amount, 0);
  const prevTier1Share = prevTier1Net > 0 ? (prevTier1Revenue / prevTier1Net) * 100 : 0;

  // 재결제율 계산
  const retentionCount = currentWeekTx.filter(
    (t) => t.is_count_valid && (t.sales_type?.includes("재결제") || t.sales_type?.includes("리텐션"))
  ).length;
  const totalCount = currentWeekTx.filter((t) => t.is_count_valid).length;
  const retentionRate = totalCount > 0 ? (retentionCount / totalCount) * 100 : 0;

  const newCustomerCount = totalCount - retentionCount;

  // 최근 주간 트렌드 (sparkline용)
  const weeklyRevenue = aggregateWeeklyData(recentWeeksTx, new Date().getFullYear());
  const recentWeeksData = weeklyRevenue.slice(-4).map((w, idx) => ({
    week: `W${idx + 1}`,
    revenue: w.netRevenue,
  }));

  return {
    weeklyNetRevenue: currentWeekNet,
    weeklyGrossRevenue: currentWeekGross,
    refundAmount: currentWeekRefund,
    orderAmount: currentWeekGross,
    prevWeekNetRevenue: prevWeekNet,
    yoyNetRevenue: yoyNet,
    tier1SharePercent: tier1Share,
    prevTier1SharePercent: prevTier1Share,
    retentionRate,
    newCustomerCount,
    recentWeeksData,
  };
}

/**
 * 자동 Alert 생성
 */
export function generateAlerts(
  currentWeekTx: SalesTransaction[],
  agentSalesData: ReturnType<typeof aggregateAgentSalesData>
): Array<{ type: "warning" | "positive" | "info"; message: string }> {
  const alerts: Array<{ type: "warning" | "positive" | "info"; message: string }> = [];

  // 환불률 체크
  const totalOrder = currentWeekTx.reduce((sum, t) => sum + t.order_amount, 0);
  const totalRefund = currentWeekTx.reduce((sum, t) => sum + t.refund_amount, 0);
  const refundRate = totalOrder > 0 ? (totalRefund / totalOrder) * 100 : 0;

  if (refundRate >= 20) {
    alerts.push({
      type: "warning",
      message: `⚠️ 주의: 금주 환불률 ${refundRate.toFixed(1)}% (20% 이상 위험 구간)`,
    });
  }

  // 판매자별 환불률 체크
  agentSalesData.forEach((agent) => {
    if (agent.refundRate >= 30) {
      alerts.push({
        type: "warning",
        message: `⚠️ 주의: ${agent.agentName} 판매 건 환불률 ${agent.refundRate.toFixed(1)}% (30% 초과)`,
      });
    }
  });

  // 재결제율 체크
  const retentionCount = currentWeekTx.filter(
    (t) => t.is_count_valid && (t.sales_type?.includes("재결제") || t.sales_type?.includes("리텐션"))
  ).length;
  const totalCount = currentWeekTx.filter((t) => t.is_count_valid).length;
  const retentionRate = totalCount > 0 ? (retentionCount / totalCount) * 100 : 0;

  if (retentionRate >= 25) {
    alerts.push({
      type: "positive",
      message: `✅ 긍정: 금주 재결제 비중 ${retentionRate.toFixed(1)}% 신고점 달성`,
    });
  }

  // 미개시 환불 체크 (환불 발생했지만 수업 시작 안한 경우 - 임시로 환불건수 체크)
  const refundCount = currentWeekTx.filter((t) => t.refund_amount > 0).length;
  if (refundCount === 0) {
    alerts.push({
      type: "info",
      message: `📊 관심: 금주 환불 발생 0건 (양호)`,
    });
  }

  return alerts;
}

