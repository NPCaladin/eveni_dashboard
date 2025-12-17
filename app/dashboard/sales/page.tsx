"use client";

import { useEffect, useState } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueMetricCards } from "@/components/dashboard/sales/revenue-metric-cards";
import { RevenueComparisonTable } from "@/components/dashboard/sales/revenue-comparison-table";
import { ProductMatrixTable } from "@/components/dashboard/sales/product-matrix-table";
import { ProductCharts } from "@/components/dashboard/sales/product-charts";
import { RefundSummaryCards } from "@/components/dashboard/sales/refund-summary-cards";
import { RefundComparisonTable } from "@/components/dashboard/sales/refund-comparison-table";
import { RefundDetailTable } from "@/components/dashboard/sales/refund-detail-table";
import { RevenueTrendChart } from "@/components/dashboard/sales/revenue-trend-chart";
import { InsightsSection } from "@/components/dashboard/sales/insights/InsightsSection";
import { ConsultantResourceSection } from "@/components/dashboard/resources/consultant-resource-section";
import { MentorSection } from "@/components/dashboard/mentor/mentor-section";
import { ReportNotesSection } from "@/components/dashboard/reports/report-notes-section";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

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

interface SalesData {
  revenueMetrics: {
    grossRevenue: number;
    grossCount: number;
    refundAmount: number;
    refundCount: number;
    netRevenue: number;
    prevWeekGross: number;
    prevYearGross: number;
    prevWeekNet: number;
    prevYearNet: number;
    prevWeekRefund: number;
    prevYearRefund: number;
  };
  comparisonData: {
    weekly: { count: number; grossRevenue: number; netRevenue: number; refund?: { count: number; amount: number } };
    prevWeek: { count: number; grossRevenue: number; netRevenue: number; refund?: { count: number; amount: number } };
    prevYear: { count: number; grossRevenue: number; netRevenue: number; refund?: { count: number; amount: number } };
    monthlyCum: { count: number; grossRevenue: number; netRevenue: number; refund?: { count: number; amount: number } };
    yearlyCum: { count: number; grossRevenue: number; netRevenue: number; refund?: { count: number; amount: number } };
    currentMonth: number; // 1-12
  };
  productMatrix: ProductMatrixData;
  productTypeData: { name: string; value: number; color: string }[];
  productWeeksData: { week: string; "1타": number; 일반: number; 기타: number }[];
  totalProductCount: number;
  refundSummary: {
    weeklyCount: number;
    weeklyAmount: number;
    monthlyCount: number;
    monthlyAmount: number;
    yearlyCount: number;
    yearlyAmount: number;
    prevWeekAmount: number;
    prevYearAmount: number;
    yearlyRefundRate: number;
    currentMonth: number; // 1-12
  };
  refundComparison: {
    weekly: { count: number; amount: number };
    prevWeek: { count: number; amount: number };
    prevYear: { count: number; amount: number };
    monthlyCum: { count: number; amount: number };
    yearlyCum: { count: number; amount: number };
  };
  refundDetails: any[];
  trendData: {
    weeklyData: {
      label: string;
      netRevenue2025: number;
      netRevenue2024: number;
      refund: number;
    }[];
    monthlyData: {
      label: string;
      netRevenue2025: number;
      netRevenue2024: number;
      refund: number;
    }[];
  };
  insights: {
    sellerPerformance: {
      seller: string;
      count: number;
      revenue: number;
      share: number;
      prevWeekChange: number;
    }[];
    profitability: {
      avgOrderValue: number;
      avgOrderValueChange: number;
      netProfitRate: number;
      refundRate: number;
      promoRate: number;
    };
    customerAnalysis: {
      newCount: number;
      retentionCount: number;
      newShare: number;
      retentionShare: number;
      retentionRateChange: number;
    };
  };
  productSales: any[];
  transactions: any[];
  refunds: any[];
}

export default function SalesDashboardPage() {
  const { reportId, currentReport } = useWeeklyReport();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SalesData | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentWeekTx, setCurrentWeekTx] = useState<any[]>([]);
  const [prevWeekTx, setPrevWeekTx] = useState<any[]>([]);
  const [yoyWeekTx, setYoyWeekTx] = useState<any[]>([]);
  const [prevWeekStart, setPrevWeekStart] = useState("");
  const [prevWeekEnd, setPrevWeekEnd] = useState("");

  useEffect(() => {
    if (!reportId || !currentReport) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);

      try {
        if (!currentReport) {
          setLoading(false);
          return;
        }
        
        const weekStart = currentReport.start_date;
        const weekEnd = currentReport.end_date;

        console.log(`📅 선택된 주차: ${currentReport.title}`);
        console.log(`📅 기간: ${weekStart} ~ ${weekEnd}`);

        // 날짜 계산 (전주, 전년)
        // Format dates for SQL (정의를 먼저 해야 함!)
        const formatDate = (d: Date | string) => {
          if (typeof d === 'string') return d;
          return d.toISOString().split("T")[0];
        };

        const weekStartDate = new Date(weekStart);
        const prevWeekStartDate = new Date(weekStartDate);
        prevWeekStartDate.setDate(prevWeekStartDate.getDate() - 7);
        const prevWeekEndDate = new Date(prevWeekStartDate);
        prevWeekEndDate.setDate(prevWeekEndDate.getDate() + 6);
        
        setPrevWeekStart(formatDate(prevWeekStartDate));
        setPrevWeekEnd(formatDate(prevWeekEndDate));

        const prevYearStart = new Date(weekStartDate);
        prevYearStart.setFullYear(prevYearStart.getFullYear() - 1);
        const prevYearEnd = new Date(prevYearStart);
        prevYearEnd.setDate(prevYearEnd.getDate() + 6);

        const monthStart = new Date(
          weekStartDate.getFullYear(),
          weekStartDate.getMonth(),
          1
        );
        const yearStart = new Date(weekStartDate.getFullYear(), 0, 1);

        // 0. 전체 거래 데이터 (환불 분석용 + 인사이트 분석용)
        // 페이지네이션으로 2024년 전체 데이터 가져오기
        const tx2024_page1 = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("payment_date", "2024-01-01")
          .lt("payment_date", "2025-01-01")
          .order("payment_date", { ascending: true })  // 오래된 것부터 (1월부터)
          .range(0, 999);
        
        const tx2024_page2 = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("payment_date", "2024-01-01")
          .lt("payment_date", "2025-01-01")
          .order("payment_date", { ascending: true })
          .range(1000, 1999);
        
        // 2025년 데이터 (1000건 이내일 것으로 예상)
        const tx2025 = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("payment_date", "2025-01-01")
          .order("payment_date", { ascending: true });
        
        // 모두 합치기
        const allTx = [
          ...(tx2024_page1.data || []),
          ...(tx2024_page2.data || []),
          ...(tx2025.data || []),
        ];
        
        setTransactions(allTx);

        // 1. 현재 주간 데이터
        const { data: currentWeekTxData } = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("payment_date", weekStart)
          .lte("payment_date", weekEnd)
          .eq("status", "결");
        
        setCurrentWeekTx(currentWeekTxData || []);

        // 2. 전주 데이터
        const { data: prevWeekTxData } = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("payment_date", formatDate(prevWeekStartDate))
          .lte("payment_date", formatDate(prevWeekEndDate))
          .eq("status", "결");
        
        setPrevWeekTx(prevWeekTxData || []);

        // 3. 전년 동기 데이터
        const { data: prevYearTx } = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("payment_date", formatDate(prevYearStart))
          .lte("payment_date", formatDate(prevYearEnd))
          .eq("status", "결");
        
        setYoyWeekTx(prevYearTx || []);

        // 4. 해당 월 누적 데이터 (선택한 주차의 월)
        const { data: monthlyCumTx } = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("payment_date", formatDate(monthStart))
          .lte("payment_date", weekEnd)
          .eq("status", "결");

        // 5. 2025년 누적 데이터
        const { data: yearlyCumTx } = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("payment_date", formatDate(yearStart))
          .lte("payment_date", weekEnd)
          .eq("status", "결");

        // 6. 현재 주간 환불 데이터 (환불일 기준)
        const { data: currentWeekRefunds } = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("refund_date", weekStart)
          .lte("refund_date", weekEnd)
          .gt("refund_amount", 0);

        // 7. 전주 환불 데이터
        const { data: prevWeekRefunds } = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("refund_date", formatDate(prevWeekStartDate))
          .lte("refund_date", formatDate(prevWeekEndDate))
          .gt("refund_amount", 0);

        // 8. 전년 환불 데이터
        const { data: prevYearRefunds } = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("refund_date", formatDate(prevYearStart))
          .lte("refund_date", formatDate(prevYearEnd))
          .gt("refund_amount", 0);

        // 9. 상품 판매 데이터
        const { data: productSales } = reportId ? await supabase
          .from("edu_product_sales")
          .select("*")
          .eq("report_id", reportId) : { data: null };

        console.log(`✓ 현재 주차: ${currentWeekTxData?.length || 0}건`);
        console.log(`✓ 전주: ${prevWeekTxData?.length || 0}건`);
        console.log(`✓ 전년: ${prevYearTx?.length || 0}건`);
        console.log(`✓ 환불: ${currentWeekRefunds?.length || 0}건`);

        // 집계 함수
        const aggregateRevenue = (transactions: any[]) => {
          let count = 0;
          let revenue = 0;
          
          transactions.forEach((tx) => {
            // 매출: 모든 거래 합산
            revenue += tx.payment_amount || 0;
            
            // 건수: payment_count_refined 합산
            count += tx.payment_count_refined || 0;
          });
          
          return { count, revenue };
        };

        const aggregateRefund = (refunds: any[]) => {
          const count = refunds.length;
          const amount = refunds.reduce(
            (sum, r) => sum + (r.refund_amount || 0),
            0
          );
          return { count, amount };
        };

        // 매출 집계
        const current = aggregateRevenue(currentWeekTxData || []);
        const prevWeek = aggregateRevenue(prevWeekTxData || []);
        const prevYear = aggregateRevenue(prevYearTx || []);
        const monthlyCum = aggregateRevenue(monthlyCumTx || []);
        const yearlyCum = aggregateRevenue(yearlyCumTx || []);

        // 환불 집계
        const currentRefund = aggregateRefund(currentWeekRefunds || []);
        const prevWeekRefund = aggregateRefund(prevWeekRefunds || []);
        const prevYearRefund = aggregateRefund(prevYearRefunds || []);

        // 순매출 계산
        const currentNet = current.revenue - currentRefund.amount;
        const prevWeekNet = prevWeek.revenue - prevWeekRefund.amount;
        const prevYearNet = prevYear.revenue - prevYearRefund.amount;

        // 상품 매트릭스 계산
        const calculateProductMatrix = (
          transactions: any[]
        ): {
          matrix: ProductMatrixData;
          typeData: { name: string; value: number; color: string }[];
          weeksData: { week: string; "1타": number; 일반: number; 기타: number }[];
          totalCount: number;
        } => {
          const matrix: ProductMatrixData = {
            "1타": {
              "20": { count: 0, share: 0 },
              "26": { count: 0, share: 0 },
              "32": { count: 0, share: 0 },
              "40": { count: 0, share: 0 },
              sum: { count: 0, share: 0 },
            },
            일반: {
              "20": { count: 0, share: 0 },
              "26": { count: 0, share: 0 },
              "32": { count: 0, share: 0 },
              "40": { count: 0, share: 0 },
              sum: { count: 0, share: 0 },
            },
            그룹반: { count: 0, share: 0 },
            합격보장반: { count: 0, share: 0 },
            GM: { count: 0, share: 0 },
            스터디: { count: 0, share: 0 },
            기타: { count: 0, share: 0 },
          };

          let totalCount = 0;

          transactions.forEach((tx) => {
            const count = tx.payment_count_refined || 0;
            totalCount += count;

            const productType = tx.product_type || "";
            const weeks = tx.weeks;

            // 상품 타입 결정
            let type: "1타" | "일반" | "그룹반" | "합격보장반" | "GM" | "스터디" | "기타" = "기타";
            
            if (productType.includes("1타")) {
              type = "1타";
            } else if (productType.includes("일반")) {
              type = "일반";
            } else if (productType.includes("그룹반")) {
              type = "그룹반";
            } else if (productType.includes("합격보장반")) {
              type = "합격보장반";
            } else if (productType === "GM") {
              type = "GM";
            } else if (productType.includes("스터디")) {
              type = "스터디";
            }

            // 주차 결정 (1타, 일반만 주차별 분류)
            if ((type === "1타" || type === "일반") && weeks && [20, 26, 32, 40].includes(weeks)) {
              const weekKey = weeks.toString() as "20" | "26" | "32" | "40";
              matrix[type][weekKey].count += count;
              matrix[type].sum.count += count;
            } else if (type === "1타" || type === "일반") {
              // 1타/일반이지만 주차가 없거나 표준 주차가 아닌 경우 → 기타
              matrix["기타"].count += count;
            } else {
              // 그룹반, 합격보장반, GM, 스터디, 기타
              matrix[type].count += count;
            }
          });

          // 비중 계산
          Object.keys(matrix).forEach((typeKey) => {
            const type = typeKey as keyof ProductMatrixData;
            
            if (type === "1타" || type === "일반") {
              // 1타, 일반: 주차별 비중 계산
              ["20", "26", "32", "40"].forEach((weekKey) => {
                const week = weekKey as "20" | "26" | "32" | "40";
                matrix[type][week].share =
                  totalCount > 0
                    ? (matrix[type][week].count / totalCount) * 100
                    : 0;
              });
              matrix[type].sum.share =
                totalCount > 0 ? (matrix[type].sum.count / totalCount) * 100 : 0;
            } else {
              // 그룹반, 합격보장반, GM, 스터디, 기타: 단순 비중 계산
              matrix[type].share =
                totalCount > 0 ? (matrix[type].count / totalCount) * 100 : 0;
            }
          });

          // 도넛 차트 데이터
          const typeData = [
            {
              name: "1타",
              value: matrix["1타"].sum.count,
              color: "#3B82F6", // 파란색
            },
            {
              name: "일반",
              value: matrix["일반"].sum.count,
              color: "#8B5CF6", // 보라색
            },
            {
              name: "그룹반",
              value: matrix["그룹반"].count,
              color: "#10B981", // 초록색
            },
            {
              name: "합격보장반",
              value: matrix["합격보장반"].count,
              color: "#F59E0B", // 주황색
            },
            {
              name: "GM",
              value: matrix["GM"].count,
              color: "#EF4444", // 빨간색
            },
            {
              name: "스터디",
              value: matrix["스터디"].count,
              color: "#EC4899", // 핑크색
            },
            {
              name: "기타",
              value: matrix["기타"].count,
              color: "#9CA3AF", // 회색
            },
          ];

          // 주차별 분포 데이터
          const weeksData = [
            {
              week: "40주",
              "1타": matrix["1타"]["40"].count,
              일반: matrix["일반"]["40"].count,
              기타: 0,
            },
            {
              week: "32주",
              "1타": matrix["1타"]["32"].count,
              일반: matrix["일반"]["32"].count,
              기타: 0,
            },
            {
              week: "26주",
              "1타": matrix["1타"]["26"].count,
              일반: matrix["일반"]["26"].count,
              기타: 0,
            },
            {
              week: "20주",
              "1타": matrix["1타"]["20"].count,
              일반: matrix["일반"]["20"].count,
              기타: 0,
            },
            {
              week: "단회/기타",
              "1타": 0,
              일반: 0,
              기타: matrix["그룹반"].count + matrix["합격보장반"].count + 
                    matrix["GM"].count + matrix["스터디"].count + matrix["기타"].count,
            },
          ];

          return { matrix, typeData, weeksData, totalCount };
        };

        console.log(`🎯 상품 매트릭스 계산 시작`);
        console.log(`📦 거래 데이터: ${currentWeekTx?.length || 0}건`);
        if (currentWeekTx && currentWeekTx.length > 0) {
          console.log(`샘플 거래 상품 타입:`, currentWeekTx[0].product_type);
          console.log(`샘플 거래 주차:`, currentWeekTx[0].weeks);
          console.log(`샘플 거래 결제건수 (refined):`, currentWeekTx[0].payment_count_refined);
          console.log(`전체 거래 상품 타입 목록:`, currentWeekTx.map(tx => tx.product_type));
          console.log(`전체 거래 주차 목록:`, currentWeekTx.map(tx => tx.weeks));
          console.log(`전체 거래 건수 목록:`, currentWeekTx.map(tx => tx.payment_count_refined));
        }

        const productMatrixResult = calculateProductMatrix(
          currentWeekTxData || []
        );

        console.log(`📊 매트릭스 1타 합계:`, productMatrixResult.matrix["1타"].sum.count);
        console.log(`📊 매트릭스 일반 합계:`, productMatrixResult.matrix["일반"].sum.count);
        console.log(`📊 매트릭스 기타:`, productMatrixResult.matrix["기타"].count);
        console.log(`📊 총 건수:`, productMatrixResult.totalCount);

        // 트렌드 데이터 생성 (최근 12주)
        const generateTrendData = async () => {
          const weeklyData: any[] = [];
          const monthlyMap = new Map<string, any>();

          try {
            // 최근 12주의 weekly_reports 가져오기
            const { data: recentReports, error: reportsError } = await supabase
              .from("weekly_reports")
              .select("id, title, start_date, end_date")
              .lte("start_date", formatDate(weekStartDate))
              .order("start_date", { ascending: false })
              .limit(12);

            if (reportsError) {
              console.error("Error fetching recent reports:", reportsError);
              throw reportsError;
            }

            if (!recentReports || recentReports.length === 0) {
              console.warn("No recent reports found");
              return { weeklyData: [], monthlyData: [] };
            }

            // 역순으로 정렬 (오래된 것부터)
            const sortedReports = [...recentReports].reverse();

            // 각 주차의 데이터 가져오기
            for (let i = 0; i < sortedReports.length; i++) {
              const report = sortedReports[i];
              
              // edu_revenue_stats에서 순매출, 실매출 데이터 가져오기
              const { data: revenueStats } = await supabase
                .from("edu_revenue_stats")
                .select("*")
                .eq("report_id", report.id)
                .in("category", ["실매출", "순매출"]);

              const netRevenueRow = revenueStats?.find(r => r.category === "순매출");
              const grossRevenueRow = revenueStats?.find(r => r.category === "실매출");

              const netRevenue = netRevenueRow?.weekly_amt || 0;
              const grossRevenue = grossRevenueRow?.weekly_amt || 0;
              const refundAmount = grossRevenue - netRevenue;

              // 전년 동기 데이터 (yoy_amt 사용)
              const netRevenue2024 = netRevenueRow?.yoy_amt || 0;

              const weekLabel = report.title || `W${i + 1}`;
              weeklyData.push({
                label: weekLabel,
                netRevenue2025: netRevenue,
                netRevenue2024: netRevenue2024,
                refund: refundAmount,
              });

              // 월별 집계
              const reportDate = new Date(report.start_date);
              const monthKey = `${reportDate.getFullYear()}-${String(
                reportDate.getMonth() + 1
              ).padStart(2, "0")}`;
              if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, {
                  label: `${reportDate.getMonth() + 1}월`,
                  netRevenue2025: 0,
                  netRevenue2024: 0,
                  refund: 0,
                });
              }
              const monthData = monthlyMap.get(monthKey);
              monthData.netRevenue2025 += netRevenue;
              monthData.netRevenue2024 += netRevenue2024;
              monthData.refund += refundAmount;
            }

            return {
              weeklyData,
              monthlyData: Array.from(monthlyMap.values()),
            };
          } catch (error) {
            console.error("Error generating trend data:", error);
            return { weeklyData: [], monthlyData: [] };
          }
        };

        const trendData = await generateTrendData();

        // 환불 데이터 집계
        const monthlyCumRefunds = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("refund_date", formatDate(monthStart))
          .lte("refund_date", weekEnd)
          .gt("refund_amount", 0);

        const yearlyCumRefunds = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("refund_date", formatDate(yearStart))
          .lte("refund_date", weekEnd)
          .gt("refund_amount", 0);

        const prevYearRefundsYear = await supabase
          .from("sales_transactions")
          .select("*")
          .gte(
            "refund_date",
            formatDate(
              new Date(yearStart.getFullYear() - 1, 0, 1)
            )
          )
          .lte(
            "refund_date",
            formatDate(
              new Date(
                prevYearEnd.getFullYear(),
                prevYearEnd.getMonth(),
                prevYearEnd.getDate()
              )
            )
          )
          .gt("refund_amount", 0);

        const monthlyCumRefundData = aggregateRefund(
          monthlyCumRefunds.data || []
        );
        const yearlyCumRefundData = aggregateRefund(
          yearlyCumRefunds.data || []
        );
        const prevYearRefundDataYear = aggregateRefund(
          prevYearRefundsYear.data || []
        );

        // 환불률 계산 (2025년 누적)
        const yearlyRefundRate =
          yearlyCum.revenue > 0
            ? (yearlyCumRefundData.amount / yearlyCum.revenue) * 100
            : 0;

        // 판매자별 실적 (세일즈본부만)
        const sellerMap = new Map<string, any>();
        (currentWeekTxData || []).forEach((tx: any) => {
          if (tx.seller_type === "세일즈본부") {
            const seller = tx.seller;
            if (!sellerMap.has(seller)) {
              sellerMap.set(seller, { count: 0, revenue: 0 });
            }
            const data = sellerMap.get(seller);
            // 건수: payment_count_refined 사용
            data.count += tx.payment_count_refined || 0;
            // 매출: 모든 거래의 payment_amount 합산
            data.revenue += tx.payment_amount || 0;
          }
        });

        const prevSellerMap = new Map<string, any>();
        (prevWeekTx || []).forEach((tx: any) => {
          if (tx.seller_type === "세일즈본부") {
            const seller = tx.seller;
            if (!prevSellerMap.has(seller)) {
              prevSellerMap.set(seller, { count: 0, revenue: 0 });
            }
            const data = prevSellerMap.get(seller);
            // 건수: payment_count_refined 사용
            data.count += tx.payment_count_refined || 0;
            // 매출: 모든 거래의 payment_amount 합산
            data.revenue += tx.payment_amount || 0;
          }
        });

        const totalSellerRevenue = Array.from(sellerMap.values()).reduce(
          (sum, s) => sum + s.revenue,
          0
        );

        const sellerPerformance = Array.from(sellerMap.entries())
          .map(([seller, data]) => {
            const prevData = prevSellerMap.get(seller) || {
              count: 0,
              revenue: 0,
            };
            const prevWeekChange =
              prevData.revenue > 0
                ? ((data.revenue - prevData.revenue) / prevData.revenue) * 100
                : 0;

            return {
              seller,
              count: data.count,
              revenue: data.revenue,
              share:
                totalSellerRevenue > 0
                  ? (data.revenue / totalSellerRevenue) * 100
                  : 0,
              prevWeekChange,
            };
          })
          .sort((a, b) => b.revenue - a.revenue);

        // 수익성 지표
        const avgOrderValue =
          current.count > 0 ? current.revenue / current.count : 0;
        const prevAvgOrderValue =
          prevWeek.count > 0 ? prevWeek.revenue / prevWeek.count : 0;
        const avgOrderValueChange =
          prevAvgOrderValue > 0
            ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100
            : 0;

        const netProfitRate =
          current.revenue > 0 ? (currentNet / current.revenue) * 100 : 0;
        const refundRate =
          current.revenue > 0
            ? (currentRefund.amount / current.revenue) * 100
            : 0;

        const totalPromo = (currentWeekTxData || []).reduce(
          (sum: number, tx: any) =>
            sum + (tx.points || 0) + (tx.coupon || 0),
          0
        );
        const totalOrderAmount = (currentWeekTxData || []).reduce(
          (sum: number, tx: any) => sum + (tx.order_amount || 0),
          0
        );
        const promoRate =
          totalOrderAmount > 0 ? (totalPromo / totalOrderAmount) * 100 : 0;

        // 고객 분석
        const newCustomers = (currentWeekTxData || []).filter(
          (tx: any) =>
            tx.sales_type === "신규" ||
            tx.sales_type === "분할" ||
            tx.sales_type === "완납"
        );
        const retentionCustomers = (currentWeekTxData || []).filter(
          (tx: any) =>
            tx.sales_type?.includes("재결제") || tx.sales_type?.includes("리텐션")
        );

        const newCount = newCustomers.reduce(
          (sum: number, tx: any) => sum + (tx.payment_count_refined || 0),
          0
        );
        const retentionCount = retentionCustomers.reduce(
          (sum: number, tx: any) => sum + (tx.payment_count_refined || 0),
          0
        );
        const totalCustomerCount = newCount + retentionCount;

        const newShare =
          totalCustomerCount > 0 ? (newCount / totalCustomerCount) * 100 : 0;
        const retentionShare =
          totalCustomerCount > 0
            ? (retentionCount / totalCustomerCount) * 100
            : 0;

        setData({
          revenueMetrics: {
            grossRevenue: current.revenue,
            grossCount: current.count,
            refundAmount: currentRefund.amount,
            refundCount: currentRefund.count,
            netRevenue: currentNet,
            prevWeekGross: prevWeek.revenue,
            prevYearGross: prevYear.revenue,
            prevWeekNet: prevWeekNet,
            prevYearNet: prevYearNet,
            prevWeekRefund: prevWeekRefund.amount,
            prevYearRefund: prevYearRefund.amount,
          },
          comparisonData: {
            weekly: {
              count: current.count,
              grossRevenue: current.revenue,
              netRevenue: currentNet,
              refund: {
                count: currentRefund.count,
                amount: currentRefund.amount,
              },
            },
            prevWeek: {
              count: prevWeek.count,
              grossRevenue: prevWeek.revenue,
              netRevenue: prevWeekNet,
              refund: {
                count: prevWeekRefund.count,
                amount: prevWeekRefund.amount,
              },
            },
            prevYear: {
              count: prevYear.count,
              grossRevenue: prevYear.revenue,
              netRevenue: prevYearNet,
              refund: {
                count: prevYearRefund.count,
                amount: prevYearRefund.amount,
              },
            },
            monthlyCum: {
              count: monthlyCum.count,
              grossRevenue: monthlyCum.revenue,
              netRevenue:
                monthlyCum.revenue -
                (monthlyCumRefundData?.amount || 0),
              refund: {
                count: monthlyCumRefundData.count,
                amount: monthlyCumRefundData.amount,
              },
            },
            yearlyCum: {
              count: yearlyCum.count,
              grossRevenue: yearlyCum.revenue,
              netRevenue:
                yearlyCum.revenue -
                (yearlyCumRefundData?.amount || 0),
              refund: {
                count: yearlyCumRefundData.count,
                amount: yearlyCumRefundData.amount,
              },
            },
            currentMonth: weekStartDate.getMonth() + 1, // 1-12
          },
          productMatrix: productMatrixResult.matrix,
          productTypeData: productMatrixResult.typeData,
          productWeeksData: productMatrixResult.weeksData,
          totalProductCount: productMatrixResult.totalCount,
          refundSummary: {
            weeklyCount: currentRefund.count,
            weeklyAmount: currentRefund.amount,
            monthlyCount: monthlyCumRefundData.count,
            monthlyAmount: monthlyCumRefundData.amount,
            yearlyCount: yearlyCumRefundData.count,
            yearlyAmount: yearlyCumRefundData.amount,
            prevWeekAmount: prevWeekRefund.amount,
            prevYearAmount: prevYearRefundDataYear.amount,
            yearlyRefundRate: yearlyRefundRate,
            currentMonth: weekStartDate.getMonth() + 1, // 1-12
          },
          refundComparison: {
            weekly: {
              count: currentRefund.count,
              amount: currentRefund.amount,
            },
            prevWeek: {
              count: prevWeekRefund.count,
              amount: prevWeekRefund.amount,
            },
            prevYear: {
              count: prevYearRefund.count,
              amount: prevYearRefund.amount,
            },
            monthlyCum: {
              count: monthlyCumRefundData.count,
              amount: monthlyCumRefundData.amount,
            },
            yearlyCum: {
              count: yearlyCumRefundData.count,
              amount: yearlyCumRefundData.amount,
            },
          },
          refundDetails: currentWeekRefunds || [],
          trendData,
          insights: {
            sellerPerformance,
            profitability: {
              avgOrderValue,
              avgOrderValueChange,
              netProfitRate,
              refundRate,
              promoRate,
            },
            customerAnalysis: {
              newCount,
              retentionCount,
              newShare,
              retentionShare,
              retentionRateChange: 0, // 전월 데이터 필요 (추후 구현)
            },
          },
          productSales: productSales || [],
          transactions: currentWeekTxData || [],
          refunds: currentWeekRefunds || [],
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [reportId, currentReport]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-8 text-white shadow-2xl">
          <h1 className="text-4xl font-bold mb-2">매출/상품/환불 대시보드</h1>
          <p className="text-slate-300 text-lg">
            PPT 보고서 기반 • 데이터 정확성 100% • 실시간 인사이트
          </p>
        </div>

        {!reportId ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-lg">📅 주차를 선택해주세요.</p>
          </div>
        ) : loading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : (
          <>
            {/* Section 1: 매출 현황 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                📊 매출 현황
              </h2>
              {data && (
                <>
                  <RevenueMetricCards {...data.revenueMetrics} />
                  <RevenueComparisonTable 
                    data={data.comparisonData} 
                    currentMonth={data.comparisonData.currentMonth}
                  />
                </>
              )}
            </section>

            {/* Section 2: 상품별 현황 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                📦 상품별 현황
              </h2>
              {data && (
                <>
                  <ProductMatrixTable
                    data={data.productMatrix}
                    totalCount={data.totalProductCount}
                  />
                  <ProductCharts
                    typeData={data.productTypeData}
                    weeksData={data.productWeeksData}
                    totalCount={data.totalProductCount}
                  />
                </>
              )}
            </section>

            {/* Section 3: 환불 현황 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                🔴 환불 현황
              </h2>
              {data && (
                <>
                  <RefundSummaryCards {...data.refundSummary} />
                  <RefundComparisonTable 
                    data={data.refundComparison} 
                    currentMonth={data.refundSummary.currentMonth}
                  />
                  <RefundDetailTable refunds={data.refundDetails} />
                </>
              )}
            </section>

            {/* 트렌드 차트 */}
            {data && (
              <RevenueTrendChart
                weeklyData={data.trendData.weeklyData}
                monthlyData={data.trendData.monthlyData}
              />
            )}

            {/* Section 4: 추가 인사이트 */}
            {currentWeekTx &&
              prevWeekTx &&
              yoyWeekTx &&
              transactions &&
              currentReport && (
                <InsightsSection
                  currentWeekTx={currentWeekTx}
                  prevWeekTx={prevWeekTx}
                  yoyWeekTx={yoyWeekTx}
                  allTransactions={transactions}
                  currentWeekStart={currentReport.start_date}
                  currentWeekEnd={currentReport.end_date}
                  prevWeekStart={prevWeekStart}
                  prevWeekEnd={prevWeekEnd}
                />
              )}

            {/* Section 5: 멘토제 주간보고 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                🎓 멘토제 주간보고
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                멘토별 멘티 현황 및 이슈
              </p>
              <MentorSection reportId={reportId} />
            </section>

            {/* Section 6: 컨설턴트 리소스 현황 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                👥 컨설턴트 리소스 현황
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                직군별 배정 가능 컨설턴트 및 수용 인원
              </p>
              <ConsultantResourceSection reportId={reportId} />
            </section>

            {/* Section 7: 보고 사항 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                📝 보고 사항
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                주차별 입력된 보고 내용
              </p>
              <ReportNotesSection reportId={reportId} />
            </section>
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

