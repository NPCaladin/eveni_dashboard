import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

// Supabase client will be created in the handler function

type Tier = "일반" | "1타";
type ProductCategory = "1타" | "일반";

// 공통 파싱 유틸
function parseNumber(value: any): number {
  if (value === null || value === undefined || value === "" || value === "-") return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (cleaned === "" || cleaned === "-") return 0;
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function parseDate(value: any): string {
  // 이미 YYYY-MM-DD 형식의 문자열이면 그대로 반환
  if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return value;
  }
  
  if (value instanceof Date) return value.toISOString().split("T")[0];
  
  if (typeof value === "number") {
    // Excel 날짜 숫자 형식 (UTC 기준으로 변환)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  
  if (typeof value === "string") {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  
  throw new Error(`Invalid date: ${value}`);
}

function getMonday(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // move to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

function getSundayFromMonday(mondayStr: string): string {
  const d = new Date(`${mondayStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().split("T")[0];
}

function getSellerTeam(sellerName: string): "Sales" | "Operations" {
  const name = sellerName.trim();
  if (name.startsWith("샐") || name.startsWith("써") || name.startsWith("에")) return "Sales";
  return "Operations";
}

function getIsCountValid(saleType: string): boolean {
  const t = saleType.trim();
  return t === "신규" || t === "재결제" || t === "완납";
}

function parseProductInfo(productName: string): { category: ProductCategory; week: number | null } {
  const name = productName.trim();
  const category: ProductCategory = name.includes("1타") ? "1타" : "일반";
  const m = name.match(/(\d+)(주|회)/);
  const week = m ? parseInt(m[1], 10) : null;  // 숫자만 추출!
  return { category, week };
}

// 데이터 타입
type TransactionRow = {
  payment_date: string;  // transaction_date → payment_date
  buyer: string;
  seller: string;
  sales_type: string;
  product_name: string;
  list_price: number;
  order_amount: number;
  points: number;  // point → points
  coupon: number;
  payment_amount: number;
  status: "결" | "환";
  refund_date: string | null;
  refund_amount: number;
};

// 헤더 매핑
const COLUMN_MAPPING: Record<string, keyof TransactionRow> = {
  상태: "status",
  날짜: "payment_date",  // transaction_date → payment_date
  결제일: "payment_date",  // transaction_date → payment_date
  환불일: "refund_date",
  판매자: "seller",
  구매자: "buyer",
  판매구분: "sales_type",
  구분코드: "sales_type",
  상품: "product_name",
  상품명: "product_name",
  판매상품: "product_name",
  프로그램: "product_name",
  수강상품: "product_name",
  정가: "list_price",
  상품정가: "list_price",
  주문금액: "order_amount",
  포인트: "points",  // point → points
  쿠폰: "coupon",
  "쿠폰 (:할인)": "coupon",
  "쿠폰(:할인)": "coupon",
  결제금액: "payment_amount",
  결제매출: "payment_amount",
  환불금액: "refund_amount",
};

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

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
    if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    if (data.length < 2) {
      return NextResponse.json({ error: "엑셀 데이터가 없습니다." }, { status: 400 });
    }

    // 헤더 (첫 번째 또는 두 번째 줄 자동 감지)
    let headerRowIndex = 0;
    let headers = data[0] as string[];
    
    // 첫 줄이 빈 줄이거나 헤더가 아니면 두 번째 줄 사용
    if (!headers || headers.length === 0 || headers.every((h) => !h || h === "")) {
      headerRowIndex = 1;
      headers = data[1] as string[];
    }
    
    const headerMap: Record<number, keyof TransactionRow> = {};
    headers.forEach((h, idx) => {
      const key = COLUMN_MAPPING[String(h).trim()];
      if (key) headerMap[idx] = key;
    });

    const transactions: TransactionRow[] = [];

    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.every((c) => c === "")) continue;

      const rowData: Partial<TransactionRow> = {};
      Object.entries(headerMap).forEach(([colIdx, field]) => {
        (rowData as any)[field] = row[Number(colIdx)];
      });

      // 필수: 날짜, 상태
      const statusRaw = String(rowData.status || "").trim();
      if (statusRaw !== "결" && statusRaw !== "환" && statusRaw !== "미" && statusRaw !== "프") continue;
      // "프" (프로모션 재결제)는 "결"로 처리
      const status = (statusRaw === "프" ? "결" : statusRaw) as "결" | "환" | "미";

      // 날짜
      let paymentDate: string;
      try {
        const baseDate = status === "결" ? rowData.payment_date : rowData.refund_date || rowData.payment_date;
        paymentDate = parseDate(baseDate);
      } catch (err) {
        continue;
      }

      const sellerName = String(rowData.seller || "").trim();
      const buyerName = String(rowData.buyer || "").trim();
      const salesType = status === "미" ? "미개시환불" : (status === "환" ? "환불" : String(rowData.sales_type || "").trim().split(" : ")[0]);
      const productName = String(rowData.product_name || "").trim();

      const listPrice = parseNumber(rowData.list_price);
      const orderAmount = parseNumber(rowData.order_amount);
      const points = parseNumber(rowData.points);
      const coupon = parseNumber(rowData.coupon);
      const discount = points + coupon;
      const paymentAmount =
        status === "결"
          ? parseNumber(rowData.payment_amount) || orderAmount - discount
          : 0;
      const refundAmount = (status === "환" || status === "미") ? parseNumber(rowData.refund_amount) : 0;

      transactions.push({
        payment_date: paymentDate,
        buyer: buyerName,
        seller: sellerName,
        sales_type: salesType,
        product_name: productName,
        list_price: listPrice,
        order_amount: orderAmount,
        points,
        coupon,
        payment_amount: paymentAmount,
        status: status === "미" ? "환" : status,  // "미" → "환"으로 변환
        refund_date: (status === "환" || status === "미") ? paymentDate : null,
        refund_amount: refundAmount,
      });
    }

    if (transactions.length === 0) {
      return NextResponse.json({ error: "파싱된 데이터가 없습니다." }, { status: 400 });
    }

    // 주차별 그룹핑
    const grouped = new Map<
      string,
      { monday: string; sunday: string; rows: TransactionRow[] }
    >();
    for (const t of transactions) {
      const monday = getMonday(t.payment_date);  // transaction_date → payment_date
      const sunday = getSundayFromMonday(monday);
      const key = monday;
      if (!grouped.has(key)) grouped.set(key, { monday, sunday, rows: [] });
      grouped.get(key)!.rows.push(t);
    }

    const results: { monday: string; count: number }[] = [];

    // 주차별 처리 (순차)
    for (const [, group] of grouped) {
      const { monday, sunday, rows } = group;

      // weekly_report 찾기/생성
      const { data: existing } = await supabase
        .from("weekly_reports")
        .select("id, title")
        .eq("start_date", monday)
        .eq("end_date", sunday)
        .maybeSingle();

      let reportId = existing?.id as string | undefined;
      if (!reportId) {
        // week-of-month title
        const d = new Date(`${monday}T00:00:00Z`);
        const year = d.getUTCFullYear();
        const month = d.getUTCMonth() + 1;
        const date = d.getUTCDate();
        const weekOfMonth = Math.floor((date - 1) / 7) + 1;
        const title = `${year}년 ${month}월 ${weekOfMonth}주차`;

        const { data: created, error: createError } = await supabase
          .from("weekly_reports")
          .insert({
            title,
            start_date: monday,
            end_date: sunday,
            status: "draft",
          })
          .select("id")
          .single();
        if (createError || !created) continue;
        reportId = created.id;
      }

      // transactions insert: 기존 삭제 후 batch insert
      await supabase.from("sales_transactions").delete().eq("report_id", reportId);

      const txPayload = rows.map((r) => {
        const { category, week } = parseProductInfo(r.product_name);
        const sellerTeam = getSellerTeam(r.seller);
        const isCountValid = r.status === "결" ? getIsCountValid(r.sales_type) : false;
        
        // payment_date에서 년월 정보 추출
        const date = new Date(r.payment_date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const ym = `${String(year).slice(-2)}${String(month).padStart(2, "0")}`;
        const payment_yearmonth = `${year}-${String(month).padStart(2, "0")}`;
        
        return {
          report_id: reportId,
          ym,  // 추가
          payment_year: year,  // 추가
          payment_month: month,  // 추가
          payment_yearmonth,  // 추가
          payment_date: r.payment_date,  // transaction_date → payment_date
          seller: r.seller,
          seller_type: sellerTeam,
          buyer: r.buyer,
          category_code: null,  // 추가 (migration에서는 null)
          sales_type: r.sales_type,
          product_code: null,  // 추가 (migration에서는 null)
          product_name: r.product_name,
          product_type: category,
          weeks: week,
          list_price: r.list_price,
          order_amount: r.order_amount,
          points: r.points,  // point → points
          coupon: r.coupon,
          payment_amount: r.payment_amount,
          status: r.status,
          quantity: 1,  // 추가
          payment_count_original: 1,
          payment_count_refined: isCountValid ? 1 : 0,
          refund_date: r.refund_date,
          refund_amount: r.refund_amount,
          refund_reason: null,  // 추가 (migration에서는 null)
          final_revenue: r.payment_amount - r.refund_amount,
          is_count_valid: isCountValid,  // 추가
          created_at: new Date().toISOString(),  // 추가
        };
      });

      for (const batch of chunk(txPayload, 300)) {
        const { error: insertError } = await supabase.from("sales_transactions").insert(batch);
        if (insertError) {
          console.error("insert tx error", insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }

      // 집계
      const payments = txPayload.filter((t) => t.status === "결");
      const refunds = txPayload.filter((t) => t.status === "환");

      const revenueReal = payments.reduce((s, t) => s + t.payment_amount, 0);
      const refundSum = refunds.reduce((s, t) => s + t.refund_amount, 0);
      const revenueNet = revenueReal - refundSum;

      // 현재 주차 정보 기반 계산
      const currentDate = new Date(`${monday}T00:00:00Z`);
      const currentYear = currentDate.getUTCFullYear();
      const currentMonth = currentDate.getUTCMonth() + 1; // 1-12
      
      // title에서 주차 정보 파싱 (예: "2025년 1월 2주차")
      let weekOfMonth = 0;
      if (existing?.title) {
        const titleMatch = existing.title.match(/(\d+)년\s*(\d+)월\s*(\d+)주차/);
        if (titleMatch) {
          weekOfMonth = parseInt(titleMatch[3], 10);
        }
      }
      
      // title 파싱 실패 시 날짜 기반 계산 (fallback)
      if (weekOfMonth === 0) {
        const date = currentDate.getUTCDate();
        weekOfMonth = Math.floor((date - 1) / 7) + 1;
      }

      // 전주 데이터 조회
      let prevWeeklyRealAmt = 0;
      let prevWeeklyNetAmt = 0;
      let yoyRealAmt = 0;
      let yoyNetAmt = 0;
      let monthlyCumRealAmt = 0;
      let monthlyCumNetAmt = 0;
      let yearlyCumRealAmt = 0;
      let yearlyCumNetAmt = 0;

      const { data: prevReport } = await supabase
        .from("weekly_reports")
        .select("id")
        .lt("start_date", monday)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prevReport?.id) {
        const { data: prevRealStat } = await supabase
          .from("edu_revenue_stats")
          .select("weekly_amt")
          .eq("report_id", prevReport.id)
          .eq("category", "실매출")
          .maybeSingle();
        prevWeeklyRealAmt = prevRealStat?.weekly_amt || 0;

        const { data: prevNetStat } = await supabase
          .from("edu_revenue_stats")
          .select("weekly_amt")
          .eq("report_id", prevReport.id)
          .eq("category", "순매출")
          .maybeSingle();
        prevWeeklyNetAmt = prevNetStat?.weekly_amt || 0;
      }

      // 전년동기: 같은 월의 같은 주차 찾기 (title 기반)
      const prevYear = currentYear - 1;
      const yoyTitle = `${prevYear}년 ${currentMonth}월 ${weekOfMonth}주차`;
      
      const { data: yoyReport } = await supabase
        .from("weekly_reports")
        .select("id")
        .eq("title", yoyTitle)
        .maybeSingle();

      if (yoyReport?.id) {
        const { data: yoyRealStat } = await supabase
          .from("edu_revenue_stats")
          .select("weekly_amt")
          .eq("report_id", yoyReport.id)
          .eq("category", "실매출")
          .maybeSingle();
        yoyRealAmt = yoyRealStat?.weekly_amt || 0;

        const { data: yoyNetStat } = await supabase
          .from("edu_revenue_stats")
          .select("weekly_amt")
          .eq("report_id", yoyReport.id)
          .eq("category", "순매출")
          .maybeSingle();
        yoyNetAmt = yoyNetStat?.weekly_amt || 0;
      }

      // 해당월 누적: 같은 월의 모든 주차 합산 (현재 주차 포함)
      const monthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
      const monthEnd = new Date(Date.UTC(currentYear, currentMonth, 0));

      const { data: monthlyReports } = await supabase
        .from("weekly_reports")
        .select("id")
        .gte("start_date", monthStart.toISOString().split("T")[0])
        .lte("start_date", monthEnd.toISOString().split("T")[0]);

      if (monthlyReports && monthlyReports.length > 0) {
        // 현재 주차를 제외한 다른 주차들의 합산
        const otherMonthlyReportIds = monthlyReports
          .filter((r) => r.id !== reportId)
          .map((r) => r.id);
        
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
      
      // 현재 주차의 값 추가
      monthlyCumRealAmt += revenueReal;
      monthlyCumNetAmt += revenueNet;

      // 해당연도 누적: 같은 연도의 모든 주차 합산 (현재 주차 포함)
      const yearStart = new Date(Date.UTC(currentYear, 0, 1));
      const yearEnd = new Date(Date.UTC(currentYear, 11, 31));

      const { data: yearlyReports } = await supabase
        .from("weekly_reports")
        .select("id")
        .gte("start_date", yearStart.toISOString().split("T")[0])
        .lte("start_date", yearEnd.toISOString().split("T")[0]);

      if (yearlyReports && yearlyReports.length > 0) {
        // 현재 주차를 제외한 다른 주차들의 합산
        const otherYearlyReportIds = yearlyReports
          .filter((r) => r.id !== reportId)
          .map((r) => r.id);
        
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
      
      // 현재 주차의 값 추가
      yearlyCumRealAmt += revenueReal;
      yearlyCumNetAmt += revenueNet;

      // revenue stats upsert (실매출, 순매출)
      const statsPayload = [
        {
          category: "실매출" as const,
          weekly_amt: revenueReal,
          monthly_refund_amt: refundSum,
          prev_weekly_amt: prevWeeklyRealAmt,
          yoy_amt: yoyRealAmt,
          monthly_cum_amt: monthlyCumRealAmt,
          yearly_cum_amt: yearlyCumRealAmt,
        },
        {
          category: "순매출" as const,
          weekly_amt: revenueNet,
          monthly_refund_amt: refundSum,
          prev_weekly_amt: prevWeeklyNetAmt,
          yoy_amt: yoyNetAmt,
          monthly_cum_amt: monthlyCumNetAmt,
          yearly_cum_amt: yearlyCumNetAmt,
        },
      ];

      for (const sp of statsPayload) {
        const { data: existingStat } = await supabase
          .from("edu_revenue_stats")
          .select("id")
          .eq("report_id", reportId)
          .eq("category", sp.category)
          .maybeSingle();

        const payload = {
          report_id: reportId,
          category: sp.category,
          weekly_amt: sp.weekly_amt,
          prev_weekly_amt: sp.prev_weekly_amt,
          yoy_amt: sp.yoy_amt,
          monthly_cum_amt: sp.monthly_cum_amt,
          monthly_refund_amt: sp.monthly_refund_amt,
          yearly_cum_amt: sp.yearly_cum_amt,
        };

        if (existingStat) {
          await supabase.from("edu_revenue_stats").update(payload).eq("id", existingStat.id);
        } else {
          await supabase.from("edu_revenue_stats").insert(payload);
        }
      }

      // product sales 집계 (결제 + is_count_valid)
      const valid = payments.filter((t) => t.is_count_valid);
      const totalCount = valid.length;
      const map: Record<string, { count: number; category: ProductCategory }> = {};
      valid.forEach((t) => {
        const key = `${t.product_type}_${t.weeks || "기타"}`;
        if (!map[key]) map[key] = { count: 0, category: t.product_type as ProductCategory };
        map[key].count += 1;
      });
      const productRows = Object.entries(map).map(([key, v]) => ({
        report_id: reportId,
        product_group: v.category,
        product_variant: key.includes("_") ? key.split("_")[1] : null,
        sales_count: v.count,
        sales_share: totalCount > 0 ? Number(((v.count / totalCount) * 100).toFixed(2)) : 0,
      }));

      await supabase.from("edu_product_sales").delete().eq("report_id", reportId);
      if (productRows.length > 0) {
        for (const batch of chunk(productRows, 300)) {
          const { error: psErr } = await supabase.from("edu_product_sales").insert(batch);
          if (psErr) {
            console.error("product insert error", psErr);
            return NextResponse.json({ error: psErr.message }, { status: 500 });
          }
        }
      }

      results.push({ monday, count: rows.length });
    }

    return NextResponse.json({
      success: true,
      weeksProcessed: results.length,
      detail: results,
    });
  } catch (error: any) {
    console.error("Migration upload error", error);
    return NextResponse.json(
      { error: error.message || "마이그레이션 업로드 실패" },
      { status: 500 }
    );
  }
}

