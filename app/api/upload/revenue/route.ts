import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { TransactionData, ParsedRowData, ProductSalesAggregate } from "@/lib/types/revenue";
import {
  getSellerType,
  refinePaymentCount,
  parseProductType,
  parseNumber,
  parseDate,
  extractYearMonth,
  createHeaderMap,
} from "@/lib/utils/revenue-parser";

// Supabase client type alias
type SupabaseClientType = SupabaseClient;

export async function POST(request: NextRequest) {
  try {
    // Supabase client 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const reportId = formData.get("reportId") as string;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    if (!reportId) {
      return NextResponse.json({ error: "reportId가 필요합니다." }, { status: 400 });
    }

    // 엑셀 파일 읽기
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    if (data.length < 2) {
      return NextResponse.json({ error: "엑셀 파일에 데이터가 없습니다." }, { status: 400 });
    }

    // 헤더 매핑
    const headers = data[0] as string[];
    const headerMap = createHeaderMap(headers);

    // 데이터 파싱
    const transactions = parseTransactions(data as unknown[][], headerMap, reportId);

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          error: "파싱된 데이터가 없습니다.",
          debug: { headers, headerMap, totalRows: data.length - 1 },
        },
        { status: 400 }
      );
    }

    // payment_count_refined 정제 (분할/완납 처리)
    const refinedTransactions = refinePaymentCount(transactions);

    // 주차 날짜 정보 조회
    const { data: weekInfo } = await supabase
      .from("weekly_reports")
      .select("start_date, end_date")
      .eq("id", reportId)
      .single();

    const weekStartDate = weekInfo?.start_date || "2025-01-01";
    const weekEndDate = weekInfo?.end_date || "2025-12-31";

    // 기존 데이터 삭제
    await deleteExistingData(supabase, reportId, weekStartDate, weekEndDate);

    // sales_transactions 테이블에 저장
    const { error: insertError } = await supabase.from("sales_transactions").insert(refinedTransactions);

    if (insertError) {
      return NextResponse.json(
        { error: `데이터 저장 실패: ${insertError.message}` },
        { status: 500 }
      );
    }

    // 집계 데이터 계산 및 저장
    const stats = await calculateAndSaveAggregates(supabase, refinedTransactions, reportId);

    return NextResponse.json({
      success: true,
      message: `${refinedTransactions.length}건의 거래 내역이 저장되었습니다. (결제: ${stats.paymentCount}건, 환불: ${stats.refundCount}건)`,
      stats,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `업로드 실패: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * 엑셀 데이터를 거래 객체 배열로 파싱
 */
function parseTransactions(
  data: unknown[][],
  headerMap: Record<number, string>,
  reportId: string
): TransactionData[] {
  const transactions: TransactionData[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!row || row.length === 0) continue;
    if (row.every((cell) => !cell || cell === "")) continue;

    try {
      const rowData: ParsedRowData = {};
      Object.entries(headerMap).forEach(([colIndex, fieldName]) => {
        const value = row[parseInt(colIndex)];
        (rowData as Record<string, unknown>)[fieldName] = value;
      });

      const transaction = parseRowToTransaction(rowData, reportId);
      if (transaction) {
        transactions.push(transaction);
      }
    } catch {
      continue;
    }
  }

  return transactions;
}

/**
 * 단일 Row를 거래 객체로 변환
 */
function parseRowToTransaction(rowData: ParsedRowData, reportId: string): TransactionData | null {
  // 상태 확인 (필수)
  const statusRaw = String(rowData.status || "").trim();
  if (!statusRaw || !["결", "환", "미", "프", "재"].includes(statusRaw)) {
    return null;
  }
  // "프" (프로모션 재결제), "재" (재결제/결제 수단 변경)는 "결"로 처리
  const status = (statusRaw === "프" || statusRaw === "재") ? "결" : statusRaw;

  // 필수 필드 확인
  const sellerName = String(rowData.seller || "").trim();
  const buyerName = String(rowData.buyer || "").trim();
  if (!sellerName || !buyerName) {
    return null;
  }

  // 상태별 처리 로직
  let paymentDate: string;
  let paymentAmount: number;
  let refundAmount: number;
  let refundDate: string | null = null;
  let salesType: string;
  let categoryCode: number | null = null;
  let productCode: number | null = null;
  let refundReason: string | null = null;

  if (status === "결") {
    // 결제인 경우
    const paymentDateValue = rowData.payment_date;
    if (!paymentDateValue || paymentDateValue === "-" || paymentDateValue === "") {
      return null;
    }
    try {
      paymentDate = parseDate(paymentDateValue);
    } catch {
      return null;
    }

    salesType = String(rowData.sales_type || "").trim();
    salesType = salesType.split(" : ")[0].split(":")[0].trim();

    if (rowData.category_code) {
      const code = parseNumber(rowData.category_code);
      categoryCode = code > 0 ? code : null;
    }

    if (rowData.product_code) {
      const code = parseNumber(rowData.product_code);
      productCode = code > 0 ? code : null;
    }

    const orderAmount = parseNumber(rowData.order_amount);
    const points = parseNumber(rowData.points || 0);
    const coupon = parseNumber(rowData.coupon || 0);
    const paymentAmountValue = rowData.payment_amount;

    if (paymentAmountValue && paymentAmountValue !== "-" && paymentAmountValue !== "") {
      paymentAmount = parseNumber(paymentAmountValue);
    } else {
      paymentAmount = orderAmount - points - coupon;
    }
    refundAmount = 0;
  } else if (status === "환" || status === "미") {
    // 환불인 경우
    const refundDateValue = rowData.refund_date;
    if (!refundDateValue || refundDateValue === "-" || refundDateValue === "") {
      return null;
    }
    try {
      refundDate = parseDate(refundDateValue);
      paymentDate = refundDate;
    } catch {
      return null;
    }

    salesType = status === "미" ? "미개시환불" : "환불";
    paymentAmount = 0;
    const refundAmountValue = rowData.refund_amount;
    if (refundAmountValue && refundAmountValue !== "-" && refundAmountValue !== "") {
      refundAmount = parseNumber(refundAmountValue);
    } else {
      refundAmount = 0;
    }

    if (rowData.refund_reason) {
      refundReason = String(rowData.refund_reason).trim() || null;
    }
  } else {
    return null;
  }

  // 공통 필드 파싱
  const productName = String(rowData.product_name || "").trim();
  const listPrice = parseNumber(rowData.list_price);
  const orderAmount = parseNumber(rowData.order_amount);
  const points = parseNumber(rowData.points || 0);
  const coupon = parseNumber(rowData.coupon || 0);

  const sellerType = getSellerType(sellerName);
  const { product_type, weeks } = parseProductType(productName);
  const { ym, payment_year, payment_month, payment_yearmonth } = extractYearMonth(paymentDate);

  const payment_count_original = 1;
  const payment_count_refined = status === "결" ? 1 : 0;
  const final_revenue = paymentAmount - refundAmount;

  return {
    report_id: reportId,
    ym,
    payment_year,
    payment_month,
    payment_yearmonth,
    payment_date: paymentDate,
    seller: sellerName,
    seller_type: sellerType,
    buyer: buyerName,
    category_code: categoryCode,
    sales_type: salesType,
    product_code: productCode,
    product_name: productName,
    product_type,
    weeks,
    list_price: listPrice,
    order_amount: orderAmount,
    points,
    coupon,
    payment_amount: paymentAmount,
    status: status as "결" | "환" | "미",
    quantity: 1,
    payment_count_original,
    payment_count_refined,
    refund_date: refundDate,
    refund_amount: refundAmount,
    refund_reason: refundReason,
    final_revenue,
    created_at: new Date().toISOString(),
  };
}

/**
 * 기존 데이터 삭제
 */
async function deleteExistingData(
  supabase: SupabaseClientType,
  reportId: string,
  weekStartDate: string,
  weekEndDate: string
) {
  // report_id로 삭제
  await supabase.from("sales_transactions").delete().eq("report_id", reportId);

  // 결제일 기준 날짜 범위 + report_id NULL (결제 거래 중복 제거)
  await supabase
    .from("sales_transactions")
    .delete()
    .gte("payment_date", weekStartDate)
    .lte("payment_date", weekEndDate)
    .is("report_id", null)
    .eq("status", "결");

  // 환불일 기준 날짜 범위 + report_id NULL (환불 중복 제거)
  await supabase
    .from("sales_transactions")
    .delete()
    .gte("refund_date", weekStartDate)
    .lte("refund_date", weekEndDate)
    .is("report_id", null)
    .eq("status", "환")
    .or(`payment_date.lt.${weekStartDate},payment_date.gt.${weekEndDate}`);
}

/**
 * 집계 데이터 계산 및 저장
 */
async function calculateAndSaveAggregates(
  supabase: SupabaseClientType,
  transactions: TransactionData[],
  reportId: string
) {
  // 결제(결) 거래만 필터링
  const paymentTransactions = transactions.filter(
    (t) => t.status === "결" && t.payment_count_refined === 1
  );
  const allPaymentTransactions = transactions.filter((t) => t.status === "결");
  const refundTransactions = transactions.filter((t) => t.status === "환");

  // 실매출 집계
  const revenueReal = allPaymentTransactions.reduce((sum, t) => sum + t.payment_amount, 0);

  // 환불액 집계
  const totalRefundAmount = refundTransactions.reduce((sum, t) => sum + t.refund_amount, 0);
  const refundCount = refundTransactions.length;

  // 순매출 계산
  const revenueNet = revenueReal - totalRefundAmount;

  // 상품별 판매 건수 집계
  const productSalesMap: Record<string, { count: number; category: string }> = {};
  paymentTransactions.forEach((t) => {
    const key = `${t.product_type}_${t.weeks || "기타"}`;
    if (!productSalesMap[key]) {
      productSalesMap[key] = { count: 0, category: t.product_type };
    }
    productSalesMap[key].count += 1;
  });

  const totalCount = paymentTransactions.length;
  const productSales: ProductSalesAggregate[] = Object.entries(productSalesMap).map(([key, value]) => ({
    product_group: value.category as "1타" | "일반" | "그룹반" | "기타",
    product_variant: key.includes("_") ? (key.split("_")[1] === "기타" ? null : key.split("_")[1]) : null,
    sales_count: value.count,
    sales_share: totalCount > 0 ? Number(((value.count / totalCount) * 100).toFixed(2)) : 0,
  }));

  // 비교 데이터 계산
  const comparisonData = await calculateComparisonData(supabase, reportId, revenueReal, revenueNet);

  // edu_revenue_stats 업데이트 (실매출)
  await upsertRevenueStat(supabase, reportId, "실매출", {
    weekly_amt: revenueReal,
    prev_weekly_amt: comparisonData.prevWeeklyRealAmt,
    yoy_amt: comparisonData.yoyRealAmt,
    monthly_cum: comparisonData.monthlyCumRealAmt,
    monthly_refund_amt: totalRefundAmount,
    yearly_cum: comparisonData.yearlyCumRealAmt,
  });

  // edu_revenue_stats 업데이트 (순매출)
  await upsertRevenueStat(supabase, reportId, "순매출", {
    weekly_amt: revenueNet,
    prev_weekly_amt: comparisonData.prevWeeklyNetAmt,
    yoy_amt: comparisonData.yoyNetAmt,
    monthly_cum: comparisonData.monthlyCumNetAmt,
    monthly_refund_amt: totalRefundAmount,
    yearly_cum: comparisonData.yearlyCumNetAmt,
  });

  // edu_product_sales 업데이트
  await supabase.from("edu_product_sales").delete().eq("report_id", reportId);

  if (productSales.length > 0) {
    const productSalesPayload = productSales.map((ps) => ({
      ...ps,
      report_id: reportId,
    }));
    await supabase.from("edu_product_sales").insert(productSalesPayload);
  }

  return {
    totalTransactions: transactions.length,
    paymentCount: paymentTransactions.length,
    refundCount,
    revenueReal,
    totalRefundAmount,
    revenueNet,
    productSales,
  };
}

/**
 * 비교 데이터 (전주, 전년동기, 월누적, 연누적) 계산
 */
async function calculateComparisonData(
  supabase: SupabaseClientType,
  reportId: string,
  revenueReal: number,
  revenueNet: number
) {
  let prevWeeklyRealAmt = 0;
  let prevWeeklyNetAmt = 0;
  let yoyRealAmt = 0;
  let yoyNetAmt = 0;
  let monthlyCumRealAmt = 0;
  let monthlyCumNetAmt = 0;
  let yearlyCumRealAmt = 0;
  let yearlyCumNetAmt = 0;

  const { data: currentReport } = await supabase
    .from("weekly_reports")
    .select("start_date, title")
    .eq("id", reportId)
    .single();

  if (!currentReport?.start_date) {
    return {
      prevWeeklyRealAmt,
      prevWeeklyNetAmt,
      yoyRealAmt,
      yoyNetAmt,
      monthlyCumRealAmt: revenueReal,
      monthlyCumNetAmt: revenueNet,
      yearlyCumRealAmt: revenueReal,
      yearlyCumNetAmt: revenueNet,
    };
  }

  const currentDate = new Date(currentReport.start_date);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 주차 번호 추출
  let weekOfMonth = 0;
  if (currentReport.title) {
    const titleMatch = currentReport.title.match(/(\d+)년\s*(\d+)월\s*(\d+)주차/);
    if (titleMatch) {
      weekOfMonth = parseInt(titleMatch[3], 10);
    }
  }

  if (weekOfMonth === 0) {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
    const firstMonday = new Date(firstDayOfMonth);
    firstMonday.setDate(1 + daysToAdd - 1);
    weekOfMonth = Math.floor((currentDate.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  }

  // 전주 데이터
  const { data: prevReport } = await supabase
    .from("weekly_reports")
    .select("id")
    .lt("start_date", currentReport.start_date)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (prevReport?.id) {
    const { data: prevStats } = await supabase
      .from("edu_revenue_stats")
      .select("category, weekly_amt")
      .eq("report_id", prevReport.id);

    if (prevStats) {
      prevWeeklyRealAmt = prevStats.find((s) => s.category === "실매출")?.weekly_amt || 0;
      prevWeeklyNetAmt = prevStats.find((s) => s.category === "순매출")?.weekly_amt || 0;
    }
  }

  // 전년동기
  const prevYear = currentYear - 1;
  const yoyTitle = `${prevYear}년 ${currentMonth}월 ${weekOfMonth}주차`;

  const { data: yoyReport } = await supabase
    .from("weekly_reports")
    .select("id")
    .eq("title", yoyTitle)
    .maybeSingle();

  if (yoyReport?.id) {
    const { data: yoyStats } = await supabase
      .from("edu_revenue_stats")
      .select("category, weekly_amt")
      .eq("report_id", yoyReport.id);

    if (yoyStats) {
      yoyRealAmt = yoyStats.find((s) => s.category === "실매출")?.weekly_amt || 0;
      yoyNetAmt = yoyStats.find((s) => s.category === "순매출")?.weekly_amt || 0;
    }
  }

  // 해당월 누적
  const monthStart = new Date(currentYear, currentMonth - 1, 1);
  const monthEnd = new Date(currentYear, currentMonth, 0);

  const { data: monthlyReports } = await supabase
    .from("weekly_reports")
    .select("id")
    .gte("start_date", monthStart.toISOString().split("T")[0])
    .lte("start_date", monthEnd.toISOString().split("T")[0]);

  if (monthlyReports && monthlyReports.length > 0) {
    const otherMonthlyReportIds = monthlyReports.filter((r) => r.id !== reportId).map((r) => r.id);

    if (otherMonthlyReportIds.length > 0) {
      const { data: monthlyStats } = await supabase
        .from("edu_revenue_stats")
        .select("category, weekly_amt")
        .in("report_id", otherMonthlyReportIds);

      if (monthlyStats) {
        monthlyCumRealAmt = monthlyStats
          .filter((s) => s.category === "실매출")
          .reduce((sum, s) => sum + Number(s.weekly_amt || 0), 0);
        monthlyCumNetAmt = monthlyStats
          .filter((s) => s.category === "순매출")
          .reduce((sum, s) => sum + Number(s.weekly_amt || 0), 0);
      }
    }
  }

  monthlyCumRealAmt += revenueReal;
  monthlyCumNetAmt += revenueNet;

  // 해당연도 누적
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);

  const { data: yearlyReports } = await supabase
    .from("weekly_reports")
    .select("id")
    .gte("start_date", yearStart.toISOString().split("T")[0])
    .lte("start_date", yearEnd.toISOString().split("T")[0]);

  if (yearlyReports && yearlyReports.length > 0) {
    const otherYearlyReportIds = yearlyReports.filter((r) => r.id !== reportId).map((r) => r.id);

    if (otherYearlyReportIds.length > 0) {
      const { data: yearlyStats } = await supabase
        .from("edu_revenue_stats")
        .select("category, weekly_amt")
        .in("report_id", otherYearlyReportIds);

      if (yearlyStats) {
        yearlyCumRealAmt = yearlyStats
          .filter((s) => s.category === "실매출")
          .reduce((sum, s) => sum + Number(s.weekly_amt || 0), 0);
        yearlyCumNetAmt = yearlyStats
          .filter((s) => s.category === "순매출")
          .reduce((sum, s) => sum + Number(s.weekly_amt || 0), 0);
      }
    }
  }

  yearlyCumRealAmt += revenueReal;
  yearlyCumNetAmt += revenueNet;

  return {
    prevWeeklyRealAmt,
    prevWeeklyNetAmt,
    yoyRealAmt,
    yoyNetAmt,
    monthlyCumRealAmt,
    monthlyCumNetAmt,
    yearlyCumRealAmt,
    yearlyCumNetAmt,
  };
}

/**
 * edu_revenue_stats 업서트
 */
async function upsertRevenueStat(
  supabase: SupabaseClientType,
  reportId: string,
  category: "실매출" | "순매출",
  data: {
    weekly_amt: number;
    prev_weekly_amt: number;
    yoy_amt: number;
    monthly_cum: number;
    monthly_refund_amt: number;
    yearly_cum: number;
  }
) {
  const { data: existing } = await supabase
    .from("edu_revenue_stats")
    .select("id")
    .eq("report_id", reportId)
    .eq("category", category)
    .single();

  const payload = {
    report_id: reportId,
    category,
    ...data,
  };

  if (existing) {
    await supabase.from("edu_revenue_stats").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("edu_revenue_stats").insert(payload);
  }
}
