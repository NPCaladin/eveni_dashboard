"use client";
// @ts-nocheck

import { useEffect, useState } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { PremiumKPICardsV2 } from "@/components/dashboard/premium-kpi-cards-v2";
import { RevenueIntelligenceChart } from "@/components/dashboard/revenue-intelligence-chart";
import { MonthlyWaterfallChart } from "@/components/dashboard/monthly-waterfall-chart";
import { ProductAnalyticsGrid } from "@/components/dashboard/product-analytics-grid";
import { ResourceHeatmap } from "@/components/dashboard/resource-heatmap";
import { OperationalLogs } from "@/components/dashboard/operational-logs";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import {
  aggregateWeeklyData,
  aggregateMonthlyData,
  aggregateProductData,
  aggregateSaleTypeData,
  aggregateAgentSalesData,
  generateCohortData,
  calculateKPIData,
  generateAlerts,
} from "@/lib/dashboard-data-processor";
import { parseMentorReport } from "@/lib/utils/parse-mentor-report";
import type { Database } from "@/lib/supabase/types";

type SalesTransaction = Database["public"]["Tables"]["sales_transactions"]["Row"];
type ConsultantResource = Database["public"]["Tables"]["consultant_resources"]["Row"];
type MentoringReport = Database["public"]["Tables"]["edu_mentoring_reports"]["Row"];

export default function PremiumDashboardPage() {
  const { reportId, currentReport } = useWeeklyReport();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [currentWeekTransactions, setCurrentWeekTransactions] = useState<SalesTransaction[]>([]);
  const [revenueStats, setRevenueStats] = useState<any[]>([]);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [prevProductSales, setPrevProductSales] = useState<any[]>([]);
  const [resources, setResources] = useState<ConsultantResource[]>([]);
  const [mentoringReports, setMentoringReports] = useState<MentoringReport[]>([]);

  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);

      try {
        // reportId가 없으면 데이터를 불러오지 않음
        if (!reportId) {
          setLoading(false);
          return;
        }
        
        // 0. 현재 선택된 주차 정보 가져오기
        const { data: reportData, error: reportError } = await supabase
          .from("weekly_reports")
          .select("*")
          .eq("id", reportId)
          .single();

        if (reportError) {
          console.error("Report fetch error:", reportError);
        }

        const currentWeekStart = (reportData as any)?.start_date;
        const currentWeekEnd = (reportData as any)?.end_date;

        console.log(`📅 Selected Week: ${(reportData as any)?.title}`);
        console.log(`📅 Date Range: ${currentWeekStart} ~ ${currentWeekEnd}`);

        // 1. 집계된 매출 데이터 가져오기 (Admin과 동일한 방식)
        const { data: revenueStatsData, error: revenueError } = await supabase
          .from("edu_revenue_stats")
          .select("*")
          .eq("report_id", reportId);

        if (revenueError) {
          console.error("Revenue stats fetch error:", revenueError);
        }

        // 2. 현재 주차 거래 데이터 가져오기 (재결제율 계산용)
        const { data: currentWeekTxData, error: currentTxError } = await supabase
          .from("sales_transactions")
          .select("*")
          .gte("payment_date" as any, currentWeekStart)
          .lte("payment_date" as any, currentWeekEnd)
          .eq("status", "결");

        if (currentTxError) {
          console.error("Current week tx fetch error:", currentTxError);
        }

        console.log(`🎯 Current Week Transactions: ${currentWeekTxData?.length || 0} transactions`);

        // 3. 전체 거래 데이터 가져오기 (차트용)
        const { data: txData, error: txError } = await supabase
          .from("sales_transactions")
          .select("*")
          .eq("status", "결")
          .order("payment_date" as any, { ascending: false }); // 최신 데이터부터 가져오기

        if (txError) {
          console.error("Transaction fetch error:", txError);
        }
        
        console.log(`📊 Revenue Stats: ${revenueStatsData?.length || 0} records`);
        if (revenueStatsData && revenueStatsData.length > 0) {
          const realStat = (revenueStatsData as any).find((s: any) => s.category === "실매출");
          const netStat = (revenueStatsData as any).find((s: any) => s.category === "순매출");
          console.log(`💰 실매출: ${realStat?.weekly_amt?.toLocaleString() || 0}원`);
          console.log(`💵 순매출: ${netStat?.weekly_amt?.toLocaleString() || 0}원`);
          console.log(`💸 환불: ${realStat?.monthly_refund_amt?.toLocaleString() || 0}원`);
        }
        
        console.log(`📊 Total Loaded: ${txData?.length || 0} transactions (status='결')`);
        console.log(`📅 2024: ${txData?.filter((t: any) => new Date((t as any).payment_date).getFullYear() === 2024).length || 0} transactions`);
        console.log(`📅 2025: ${txData?.filter((t: any) => new Date((t as any).payment_date).getFullYear() === 2025).length || 0} transactions`);
        
        // 현재 선택된 주차의 데이터만 필터링
        if (currentWeekStart && currentWeekEnd) {
          const currentWeekTxData = txData?.filter((t: any) => 
            (t as any).payment_date >= currentWeekStart && (t as any).payment_date <= currentWeekEnd
          ) || [];
          console.log(`🎯 Current Week (${currentWeekStart}~${currentWeekEnd}): ${currentWeekTxData.length} transactions`);
          console.log(`💰 Current Week Gross Revenue: ${currentWeekTxData.reduce((sum: number, t: any) => sum + (t.payment_amount || 0), 0).toLocaleString()}원`);
          console.log(`💵 Current Week Net Revenue: ${currentWeekTxData.reduce((sum: number, t: any) => sum + (t.payment_amount || 0) - (t.refund_amount || 0), 0).toLocaleString()}원`);
        }

        // 2. 상품 판매 데이터 (현재 주차)
        const { data: productSalesData, error: productError } = await supabase
          .from("edu_product_sales")
          .select("*")
          .eq("report_id", reportId);

        if (productError) {
          console.error("Product sales fetch error:", productError);
        }

        // 2-1. 전주 상품 판매 데이터
        // 전주 날짜 계산
        const prevWeekStart = new Date(currentWeekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevWeekEnd = new Date(currentWeekEnd);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

        const prevWeekStartStr = prevWeekStart.toISOString().split('T')[0];
        const prevWeekEndStr = prevWeekEnd.toISOString().split('T')[0];

        // 전주 report_id 찾기
        const { data: prevReportData } = await supabase
          .from("weekly_reports")
          .select("id")
          .eq("start_date", prevWeekStartStr)
          .eq("end_date", prevWeekEndStr)
          .single();

        let prevProductSalesData: any[] = [];
        if (prevReportData) {
          const { data: prevProdData } = await supabase
            .from("edu_product_sales")
            .select("*")
            .eq("report_id", (prevReportData as any).id);
          prevProductSalesData = prevProdData || [];
          console.log(`📊 전주 상품 데이터: ${prevProductSalesData.length}건`);
        }

        // 3. 리소스 데이터
        const { data: resourceData, error: resourceError } = await supabase
          .from("consultant_resources")
          .select("*")
          .eq("report_id", reportId);

        if (resourceError) {
          console.error("Resource fetch error:", resourceError);
        }

        // 4. 멘토링 보고
        const { data: mentoringData, error: mentoringError } = await supabase
          .from("edu_mentoring_reports")
          .select("*")
          .eq("report_id", reportId);

        if (mentoringError) {
          console.error("Mentoring fetch error:", mentoringError);
        }

        setRevenueStats(revenueStatsData || []);
        setProductSales(productSalesData || []);
        setPrevProductSales(prevProductSalesData || []);
        setCurrentWeekTransactions(currentWeekTxData || []);
        setTransactions(txData || []);
        setResources(resourceData || []);
        setMentoringReports(mentoringData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [reportId]);

  // 데이터 처리
  const processedData = (() => {
    if (transactions.length === 0) {
      console.warn("⚠️ No transactions loaded");
      return null;
    }
    
    if (!currentReport) {
      console.warn("⚠️ No current report selected");
      return null;
    }

    const currentYear = 2025;
    const prevYear = 2024;

    // 현재 선택된 주차의 날짜 범위
    const weekStart = currentReport.start_date;
    const weekEnd = currentReport.end_date;

    if (!weekStart || !weekEnd) {
      console.error("⚠️ Week dates are missing:", { weekStart, weekEnd });
      return null;
    }

    console.log(`📅 Processing data for: ${weekStart} ~ ${weekEnd}`);

    // 현재 주차 데이터 필터링 (날짜 범위 기준)
    const currentWeekTx = transactions.filter(
      (t) => (t as any).payment_date >= weekStart && (t as any).payment_date <= weekEnd
    );

    console.log(`🎯 Filtered to current week: ${currentWeekTx.length} transactions`);

    // 전주 계산 (7일 전)
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekEnd);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

    const prevWeekTx = transactions.filter(
      (t) => (t as any).payment_date >= prevWeekStart.toISOString().split('T')[0] && 
             (t as any).payment_date <= prevWeekEnd.toISOString().split('T')[0]
    );

    // 전년 동기 (작년 같은 주)
    const yoyWeekStart = new Date(weekStart);
    yoyWeekStart.setFullYear(yoyWeekStart.getFullYear() - 1);
    const yoyWeekEnd = new Date(weekEnd);
    yoyWeekEnd.setFullYear(yoyWeekEnd.getFullYear() - 1);

    const yoyWeekTx = transactions.filter(
      (t) => (t as any).payment_date >= yoyWeekStart.toISOString().split('T')[0] && 
             (t as any).payment_date <= yoyWeekEnd.toISOString().split('T')[0]
    );

    // 주간 데이터 (전체 데이터에서 - 차트용)
    const weekly2025 = aggregateWeeklyData(transactions, currentYear);
    const weekly2024 = aggregateWeeklyData(transactions, prevYear);

    // 월별 데이터 (전체 데이터에서 - 차트용)
    const monthly2025 = aggregateMonthlyData(transactions, currentYear);

    // KPI 데이터 (edu_revenue_stats에서 가져오기)
    const realStat = revenueStats.find(s => s.category === "실매출");
    const netStat = revenueStats.find(s => s.category === "순매출");
    
    // 1타 집중도 계산 (edu_product_sales에서)
    const tier1Products = productSales.filter(p => p.product_group === "1타");
    const totalSalesCount = productSales.reduce((sum, p) => sum + (p.sales_count || 0), 0);
    const tier1Count = tier1Products.reduce((sum, p) => sum + (p.sales_count || 0), 0);
    const tier1SharePercent = totalSalesCount > 0 ? (tier1Count / totalSalesCount) * 100 : 0;
    
    console.log(`🎯 1타 집중도: ${tier1SharePercent.toFixed(1)}% (${tier1Count}/${totalSalesCount})`);
    
    // 전주 1타 집중도 계산
    const prevTier1Products = prevProductSales.filter(p => p.product_group === "1타");
    const prevTotalSalesCount = prevProductSales.reduce((sum, p) => sum + (p.sales_count || 0), 0);
    const prevTier1Count = prevTier1Products.reduce((sum, p) => sum + (p.sales_count || 0), 0);
    const prevTier1SharePercent = prevTotalSalesCount > 0 ? (prevTier1Count / prevTotalSalesCount) * 100 : 0;
    
    console.log(`📊 전주 1타 집중도: ${prevTier1SharePercent.toFixed(1)}% (${prevTier1Count}/${prevTotalSalesCount})`);
    
    // 재결제 비중 계산
    const currentWeekValidTx = currentWeekTransactions; // 이미 status='결'로 필터링됨
    const retentionTx = currentWeekValidTx.filter(t =>
      t.sales_type?.includes('재결제') || t.sales_type?.includes('리텐션')
    );
    
    // 건수는 payment_count_refined 합산
    const totalCount = currentWeekValidTx.reduce((sum, t) => sum + ((t as any).payment_count_refined || 0), 0);
    const retentionCount = retentionTx.reduce((sum, t) => sum + ((t as any).payment_count_refined || 0), 0);
    const retentionRate = totalCount > 0 ? (retentionCount / totalCount) * 100 : 0;
    const newCustomerCount = totalCount - retentionCount;
    
    console.log(`🔄 재결제 비중: ${retentionRate.toFixed(1)}% (${retentionTx.length}/${currentWeekValidTx.length})`);
    
    // V2 KPI 데이터 계산
    const weeklyGrossRevenue = Number(realStat?.weekly_amt || 0);
    const weeklyNetRevenue = Number(netStat?.weekly_amt || realStat?.weekly_amt || 0);
    const refundAmount = weeklyGrossRevenue - weeklyNetRevenue; // 실매출 - 순매출 = 환불
    const prevWeekNetRevenue = Number(netStat?.prev_weekly_amt || realStat?.prev_weekly_amt || 0);
    const yoyNetRevenue = Number(netStat?.yoy_amt || realStat?.yoy_amt || 0);
    
    // 전월 동기 계산 (예: 11월 1주차 vs 12월 1주차)
    const currentMonth = new Date(weekStart).getMonth() + 1;
    const prevMonth = currentMonth - 1 > 0 ? currentMonth - 1 : 12;
    const prevMonthYear = currentMonth - 1 > 0 ? new Date(weekStart).getFullYear() : new Date(weekStart).getFullYear() - 1;
    
    const prevMonthWeekStart = new Date(weekStart);
    prevMonthWeekStart.setMonth(prevMonthWeekStart.getMonth() - 1);
    const prevMonthWeekEnd = new Date(weekEnd);
    prevMonthWeekEnd.setMonth(prevMonthWeekEnd.getMonth() - 1);
    
    const prevMonthWeekTx = transactions.filter(
      (t) => t.payment_date >= prevMonthWeekStart.toISOString().split('T')[0] &&
             t.payment_date <= prevMonthWeekEnd.toISOString().split('T')[0]
    );
    const prevMonthWeekRevenue = prevMonthWeekTx.reduce((sum, t) => 
      sum + (t.payment_amount || 0) - (t.refund_amount || 0), 0
    );
    
    // 월간 누적 (현재 월의 모든 거래)
    const currentMonthStart = new Date(weekStart);
    currentMonthStart.setDate(1);
    const monthlyTx = transactions.filter(t => {
      const txDate = new Date(t.payment_date);
      return txDate.getFullYear() === new Date(weekStart).getFullYear() &&
             txDate.getMonth() === new Date(weekStart).getMonth();
    });
    const monthlyCumRevenue = monthlyTx.reduce((sum, t) => 
      sum + (t.payment_amount || 0) - (t.refund_amount || 0), 0
    );
    
    // 연간 누적 (현재 연도의 모든 거래)
    const yearlyTx = transactions.filter(t => 
      new Date(t.payment_date).getFullYear() === new Date(weekStart).getFullYear()
    );
    const yearlyCumRevenue = yearlyTx.reduce((sum, t) => 
      sum + (t.payment_amount || 0) - (t.refund_amount || 0), 0
    );
    
    // 월간 목표 (하드코딩 - 추후 설정에서 가져오기)
    const monthlyTarget = 50000000; // 5천만원
    
    // 거래 건수 및 객단가
    const transactionCount = currentWeekValidTx.length;
    const avgOrderValue = transactionCount > 0 ? weeklyGrossRevenue / transactionCount : 0;
    
    const prevWeekValidTx = prevWeekTx.filter(t => t.is_count_valid);
    const prevTransactionCount = prevWeekValidTx.length;
    const prevWeekGrossRevenue = prevWeekValidTx.reduce((sum, t) => sum + (t.payment_amount || 0), 0);
    const prevAvgOrderValue = prevTransactionCount > 0 ? prevWeekGrossRevenue / prevTransactionCount : 0;
    
    // 순이익률
    const profitMargin = weeklyGrossRevenue > 0 ? (weeklyNetRevenue / weeklyGrossRevenue) * 100 : 0;
    
    // 상품 믹스 매출
    const tier1Revenue = tier1Products.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const normalProducts = productSales.filter(p => p.product_group === "일반");
    const normalRevenue = normalProducts.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    
    // 일평균 매출
    const daysInWeek = 7;
    const dailyAvgRevenue = weeklyNetRevenue / daysInWeek;
    const prevDailyAvgRevenue = prevWeekNetRevenue / daysInWeek;
    
    const kpiData = revenueStats.length > 0 && (realStat || netStat)
      ? {
          // 매출 데이터
          weeklyGrossRevenue,
          weeklyNetRevenue,
          refundAmount,
          
          // 비교 데이터
          prevWeekNetRevenue,
          prevMonthWeekRevenue,
          yoyNetRevenue,
          
          // 누적 데이터
          monthlyCumRevenue,
          monthlyTarget,
          yearlyCumRevenue,
          
          // 효율성 지표
          transactionCount,
          avgOrderValue,
          prevAvgOrderValue,
          profitMargin,
          
          // 상품 믹스
          tier1SharePercent,
          tier1Revenue,
          normalRevenue,
          
          // 재결제
          retentionRate,
          retentionCount: retentionTx.length,
          newCustomerCount,
          
          // 속도
          dailyAvgRevenue,
          prevDailyAvgRevenue,
        }
      : {
          weeklyGrossRevenue: 0,
          weeklyNetRevenue: 0,
          refundAmount: 0,
          prevWeekNetRevenue: 0,
          prevMonthWeekRevenue: 0,
          yoyNetRevenue: 0,
          monthlyCumRevenue: 0,
          monthlyTarget: 50000000,
          yearlyCumRevenue: 0,
          transactionCount: 0,
          avgOrderValue: 0,
          prevAvgOrderValue: 0,
          profitMargin: 0,
          tier1SharePercent: 0,
          tier1Revenue: 0,
          normalRevenue: 0,
          retentionRate: 0,
          retentionCount: 0,
          newCustomerCount: 0,
          dailyAvgRevenue: 0,
          prevDailyAvgRevenue: 0,
        };

    // Revenue Intelligence 차트 데이터
    const revenueChartData = weekly2025.map((w2025, idx) => {
      const w2024 = weekly2024.find((w) => w.week === w2025.week) || {
        netRevenue: 0,
        refundAmount: 0,
        orderAmount: 0,
      };

      return {
        week: w2025.week,
        weekLabel: w2025.week,
        orderAmount2025: w2025.orderAmount,
        netRevenue2025: w2025.netRevenue,
        netRevenue2024: w2024.netRevenue,
        refundAmount: w2025.refundAmount,
        refundRate: w2025.orderAmount > 0 ? (w2025.refundAmount / w2025.orderAmount) * 100 : 0,
      };
    });

    // Waterfall 차트 데이터
    const waterfallData = monthly2025.map((m, idx) => {
      const prevRevenue = idx > 0 ? monthly2025[idx - 1].revenue : 0;
      const change = m.revenue - prevRevenue;
      const refundRate = m.orderAmount > 0 ? (m.refundAmount / m.orderAmount) * 100 : 0;

      return {
        month: m.month,
        monthLabel: `${m.month}월`,
        revenue: m.revenue,
        change,
        isCurrentMonth: m.month === new Date().getMonth() + 1,
        refundRate,
      };
    });

    // Product Analytics
    const productData = aggregateProductData(currentWeekTx);
    const saleTypeData = aggregateSaleTypeData(currentWeekTx);
    const agentSalesData = aggregateAgentSalesData(currentWeekTx);
    const cohortData = generateCohortData(transactions);
    const alerts = generateAlerts(currentWeekTx, agentSalesData);

    // Resource 데이터 변환
    const resourcesGrouped = resources
      .filter((r) => ["가능", "조율", "불가"].includes(r.status))
      .reduce((acc, r) => {
        const existing = acc.find(
          (item) => item.jobGroup === r.job_group && item.status === r.status
        );
        const consultantName = r.note || r.job_group;
        if (existing) {
          existing.consultantNames.push(consultantName);
        } else {
          acc.push({
            jobGroup: r.job_group,
            status: r.status as "가능" | "조율" | "불가",
            consultantNames: [consultantName],
          });
        }
        return acc;
      }, [] as Array<{ jobGroup: string; status: "가능" | "조율" | "불가"; consultantNames: string[] }>);

    // Capacity 데이터 (샘플)
    const capacityData = weekly2025.slice(-8).map((w, idx) => ({
      week: w.week,
      totalCapacity: 15 + Math.floor(Math.random() * 5),
      allocatedCapacity: 10 + Math.floor(Math.random() * 8),
      gap: 0,
    }));
    capacityData.forEach((c) => {
      c.gap = c.allocatedCapacity - c.totalCapacity;
    });

    // Mentoring 데이터
    const mentoringMetrics = {
      totalMentees: 78,
      totalMenteesChange: 5,
      newMentees: 1,
      totalManaged: 222,
    };

    // 멘토링 보고서 파싱하여 이슈 추출
    console.log(`🔍 [프리미엄 대시보드] 멘토링 보고서 파싱 시작`);
    console.log(`📋 원본 멘토링 보고서:`, mentoringReports);
    
    const parsedMentorReports = mentoringReports.map(parseMentorReport);
    console.log(`📊 파싱된 멘토링 보고서:`, parsedMentorReports);
    
    const mentoringIssues: Array<{
      id: string;
      title: string;
      summary: string;
      consultant: string;
      jobGroup: string;
      priority: "high" | "medium" | "low";
      date: string;
    }> = [];

    // 각 멘토의 파싱된 이슈들을 전체 이슈 목록에 추가
    mentoringReports.forEach((originalReport, mentorIdx) => {
      const parsedReport = parsedMentorReports[mentorIdx];
      console.log(`👤 [멘토 ${mentorIdx}] ${parsedReport.mentorName} - 이슈 ${parsedReport.issues.length}건`);
      console.log(`📝 원본 이슈 텍스트:`, originalReport.issues);
      console.log(`📝 파싱된 이슈:`, parsedReport.issues);
      
      parsedReport.issues.forEach((issue, issueIdx) => {
        console.log(`  ➤ 이슈 ${issueIdx + 1}: ${issue.header}`);
        mentoringIssues.push({
          id: `${parsedReport.mentorName}-${issueIdx}`,
          title: issue.header || `이슈 ${issue.number}`,
          summary: issue.content || "",
          consultant: parsedReport.mentorName,
          jobGroup: "기획", // 실제로는 mentor 정보에서 가져오기
          priority: (issueIdx % 3 === 0 ? "high" : issueIdx % 3 === 1 ? "medium" : "low") as "high" | "medium" | "low",
          date: new Date(originalReport.created_at).toLocaleDateString("ko-KR"),
        });
      });
    });
    
    console.log(`✅ 총 ${mentoringIssues.length}개 이슈 생성됨`);
    console.log(`📋 최종 mentoringIssues:`, mentoringIssues);

    // 미개시 환불 (샘플)
    const unstartedRefunds = [
      {
        refundDate: "2024-02-05",
        refunderName: "고객A",
        amount: 5117750,
        unstartedCount: 1,
        note: "금전 사유 (개인 경제생활 악화로 금전 필요)",
      },
    ];

    // Tasks (샘플)
    const tasks = [
      {
        title: "컨설턴트 신규 계약",
        status: "완료" as const,
        progress: 100,
        assignee: "HR팀",
      },
      {
        title: "OJT 진행",
        status: "진행중" as const,
        progress: 60,
        assignee: "교육팀",
        dueDate: "2025-12-15",
      },
      {
        title: "수강생 만족도 조사",
        status: "예정" as const,
        progress: 0,
        assignee: "운영팀",
        dueDate: "2025-12-20",
      },
    ];

    return {
      kpiData,
      revenueChartData,
      waterfallData,
      productData,
      saleTypeData,
      agentSalesData,
      cohortData,
      alerts,
      resourcesGrouped,
      capacityData,
      mentoringMetrics,
      mentoringIssues,
      unstartedRefunds,
      tasks,
    };
  })();

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
      
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-8 text-white shadow-2xl">
          <h1 className="text-4xl font-bold mb-2">교육사업본부 프리미엄 대시보드</h1>
          <p className="text-slate-300 text-lg">
            데이터 기반 인사이트 • 실시간 모니터링 • 전략적 의사결정
          </p>
        </div>

        {!reportId ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-lg">📅 주차를 선택해주세요.</p>
          </div>
        ) : (
          <>

            {/* Row 1: Executive Summary */}
            <section>
              <PremiumKPICardsV2 data={processedData?.kpiData || null} loading={loading} />
            </section>

            {/* Row 2: Revenue Intelligence */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <RevenueIntelligenceChart
                  weeklyData={processedData?.revenueChartData || []}
                  loading={loading}
                />
              </div>
              <div className="lg:col-span-2">
                <MonthlyWaterfallChart
                  monthlyData={processedData?.waterfallData || []}
                  targetRevenue={50000000}
                  loading={loading}
                />
              </div>
            </section>

            {/* Row 3: Product & Customer Analytics */}
            <section>
              <ProductAnalyticsGrid
                productData={processedData?.productData || []}
                saleTypeData={processedData?.saleTypeData || []}
                agentSalesData={processedData?.agentSalesData || []}
                cohortData={processedData?.cohortData || []}
                alerts={processedData?.alerts || []}
                loading={loading}
              />
            </section>

            {/* Row 4: Resource & Capacity */}
            <section>
              <ResourceHeatmap
                resources={processedData?.resourcesGrouped || []}
                capacityData={processedData?.capacityData || []}
                loading={loading}
              />
            </section>

            {/* Row 5: Operational Logs */}
            <section>
              <OperationalLogs
                mentoringMetrics={processedData?.mentoringMetrics || null}
                mentoringIssues={processedData?.mentoringIssues || []}
                unstartedRefunds={processedData?.unstartedRefunds || []}
                tasks={processedData?.tasks || []}
                loading={loading}
              />
            </section>
          </>
        )}
      </div>
    </div>
    <Toaster />
  </>
  );
}

