import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// Supabase client will be created in the handler function

// 엑셀 컬럼 매핑 (한국어 헤더) - 여러 가능한 헤더명 지원
const COLUMN_MAPPING: { [key: string]: string } = {
  // 상태
  상태: "status",
  // 날짜 관련
  날짜: "payment_date",
  결제일: "payment_date",
  // 환불일
  환불일: "refund_date",
  // 판매자/구매자
  판매자: "seller",
  구매자: "buyer",
  // 판매구분
  판매구분: "sales_type",
  구분코드: "category_code",
  // 상품 관련
  상품: "product_name",
  상품명: "product_name",
  판매상품: "product_name",
  프로그램: "product_name",
  수강상품: "product_name",
  매출코드: "product_code",
  // 가격 관련
  정가: "list_price",
  상품정가: "list_price",
  주문금액: "order_amount",
  포인트: "points",
  쿠폰: "coupon",
  "쿠폰 (:할인)": "coupon",
  "쿠폰(:할인)": "coupon",
  결제금액: "payment_amount",
  결제매출: "payment_amount",
  환불금액: "refund_amount",
  환불사유: "refund_reason",
};

// 판매자 타입 분류 (세일즈본부/운영팀/퇴사자)
function getSellerType(sellerName: string): "세일즈본부" | "운영팀" | "퇴사자" {
  const name = sellerName.trim();
  // 세일즈본부: 샐, 써, 에
  if (name === "샐" || name === "써" || name === "에") {
    return "세일즈본부";
  }
  // 운영팀: 딜, 루, 리, 헤
  if (name === "딜" || name === "루" || name === "리" || name === "헤") {
    return "운영팀";
  }
  // 그 외는 퇴사자: 이, 조, 애, 제, 마, 톰, 벨, 진, 룻
  return "퇴사자";
}

// 결제건수 정제 로직 (분할/완납 처리)
// 이 함수는 모든 거래를 파싱한 후 한 번에 호출되어야 함
function refinePaymentCount(transactions: any[]): any[] {
  // 구매자별로 그룹핑
  const buyerGroups = new Map<string, any[]>();
  transactions.forEach((tx) => {
    if (tx.buyer && tx.status === "결") {
      if (!buyerGroups.has(tx.buyer)) {
        buyerGroups.set(tx.buyer, []);
      }
      buyerGroups.get(tx.buyer)!.push(tx);
    }
  });

  // 각 구매자별로 분할/완납 처리
  buyerGroups.forEach((txList, buyer) => {
    // 같은 구매자의 거래들을 결제일 순으로 정렬
    txList.sort((a, b) => a.payment_date.localeCompare(b.payment_date));

    // 분할과 완납이 쌍으로 있는지 확인
    const hasSplit = txList.some((t) => t.sales_type === "분할");
    const hasComplete = txList.some((t) => t.sales_type === "완납");

    if (hasSplit && hasComplete) {
      // 분할과 완납이 쌍으로 있으면 완납만 payment_count_refined = 1
      txList.forEach((tx) => {
        tx.payment_count_original = 1;
        tx.payment_count_refined = tx.sales_type === "완납" ? 1 : 0;
      });
    } else if (hasSplit && !hasComplete) {
      // 분할만 있고 완납이 없으면 마지막 분할이 payment_count_refined = 1
      const lastSplitIndex = txList.findLastIndex((t) => t.sales_type === "분할");
      txList.forEach((tx, index) => {
        tx.payment_count_original = 1;
        tx.payment_count_refined = index === lastSplitIndex ? 1 : 0;
      });
    } else {
      // 그 외의 경우는 모두 payment_count_refined = 1
      txList.forEach((tx) => {
        tx.payment_count_original = 1;
        tx.payment_count_refined = 1;
      });
    }

    // 재결제:변경 처리 - 마지막 건만 payment_count_refined = 1
    const changeTxs = txList.filter((t) => t.sales_type === "재결제:변경");
    if (changeTxs.length > 1) {
      const lastChangeIndex = txList.findLastIndex((t) => t.sales_type === "재결제:변경");
      changeTxs.forEach((tx, index) => {
        const originalIndex = txList.indexOf(tx);
        if (originalIndex !== lastChangeIndex) {
          tx.payment_count_refined = 0;
        }
      });
    }
  });

  return transactions;
}

// 상품 타입 분류 (확장)
function parseProductType(productName: string): {
  product_type: "일반" | "1타" | "게임톤" | "합격보장반" | "GM" | "그룹반" | "첫스터디" | "기타";
  weeks: number | null;
} {
  const name = productName.trim().toLowerCase();

  // 1타
  if (name.includes("1타")) {
    const weekMatch = name.match(/(\d+)(주|회)/);
    return {
      product_type: "1타",
      weeks: weekMatch ? parseInt(weekMatch[1], 10) : null,
    };
  }

  // 게임톤
  if (name.includes("게임톤")) {
    return { product_type: "게임톤", weeks: null };
  }

  // 합격보장반
  if (name.includes("합격보장") || name.includes("합격보장반")) {
    return { product_type: "합격보장반", weeks: null };
  }

  // GM
  if (name.includes("gm") && !name.includes("게임톤")) {
    return { product_type: "GM", weeks: null };
  }

  // 그룹반
  if (name.includes("그룹") || name.includes("그룹반")) {
    const weekMatch = name.match(/(\d+)(주|회)/);
    return {
      product_type: "그룹반",
      weeks: weekMatch ? parseInt(weekMatch[1], 10) : null,
    };
  }

  // 첫스터디
  if (name.includes("첫스터디") || name.includes("첫 스터디")) {
    return { product_type: "첫스터디", weeks: null };
  }

  // 일반
  if (name.includes("일반")) {
    const weekMatch = name.match(/(\d+)(주|회)/);
    return {
      product_type: "일반",
      weeks: weekMatch ? parseInt(weekMatch[1], 10) : null,
    };
  }

  // 기타
  return { product_type: "기타", weeks: null };
}

// 숫자 변환 헬퍼
function parseNumber(value: any): number {
  if (value === null || value === undefined || value === "" || value === "-") {
    return 0;
  }
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (cleaned === "" || cleaned === "-") return 0;
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

// 날짜 변환 헬퍼
function parseDate(value: any): string {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    const dateStr = value.trim();
    const dateMatch = dateStr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }
  if (typeof value === "number") {
    // Excel 날짜 숫자 형식 (UTC가 아닌 로컬 시간으로 변환)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      // UTC 날짜를 한국 시간(KST)으로 변환
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
  throw new Error(`Invalid date value: ${value}`);
}

// 날짜에서 년월 정보 추출
function extractYearMonth(dateStr: string): {
  ym: string;
  payment_year: number;
  payment_month: number;
  payment_yearmonth: string;
} {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const ym = `${String(year).slice(-2)}${String(month).padStart(2, "0")}`; // 2401
  const payment_yearmonth = `${year}-${String(month).padStart(2, "0")}`; // 2024-01

  return {
    ym,
    payment_year: year,
    payment_month: month,
    payment_yearmonth,
  };
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

    // 헤더 추출
    const headers = data[0] as string[];

    // 헤더 매핑
    const headerMap: { [key: number]: string } = {};
    const normalizedHeaders = headers.map((h) => String(h || "").trim());

    normalizedHeaders.forEach((header, index) => {
      if (COLUMN_MAPPING[header]) {
        headerMap[index] = COLUMN_MAPPING[header];
      } else {
        const normalizedHeader = header.replace(/\s+/g, "");
        for (const [excelHeader, dbField] of Object.entries(COLUMN_MAPPING)) {
          if (normalizedHeader === excelHeader.replace(/\s+/g, "")) {
            headerMap[index] = dbField;
            break;
          }
        }
      }
    });

    // 데이터 파싱
    const transactions: any[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.length === 0) continue;
      if (row.every((cell) => !cell || cell === "")) continue;

      try {
        const rowData: any = {};
        Object.entries(headerMap).forEach(([colIndex, fieldName]) => {
          const value = row[parseInt(colIndex)];
          rowData[fieldName] = value;
        });

        // 상태 확인 (필수)
        const statusRaw = String(rowData.status || "").trim();
        if (!statusRaw || (statusRaw !== "결" && statusRaw !== "환" && statusRaw !== "미" && statusRaw !== "프" && statusRaw !== "재")) {
          continue;
        }
        // "프" (프로모션 재결제), "재" (재결제/결제 수단 변경)는 "결"로 처리
        const status = (statusRaw === "프" || statusRaw === "재") ? "결" : statusRaw;

        // 필수 필드 확인
        const sellerName = String(rowData.seller || "").trim();
        const buyerName = String(rowData.buyer || "").trim();
        if (!sellerName || !buyerName) {
          continue;
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
            continue;
          }
          try {
            paymentDate = parseDate(paymentDateValue);
          } catch (error) {
            console.error(`Row ${i + 1} - 결제일 파싱 오류:`, error);
            continue;
          }

          salesType = String(rowData.sales_type || "").trim();
          // 판매구분에서 " : " 같은 구분자 제거
          salesType = salesType.split(" : ")[0].split(":")[0].trim();

          // 구분코드 파싱
          if (rowData.category_code) {
            const code = parseNumber(rowData.category_code);
            categoryCode = code > 0 ? code : null;
          }

          // 매출코드 파싱
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
          // 환불인 경우 (환불 또는 미개시 환불)
          const refundDateValue = rowData.refund_date;
          if (!refundDateValue || refundDateValue === "-" || refundDateValue === "") {
            continue;
          }
          try {
            refundDate = parseDate(refundDateValue);
            // 환불일을 payment_date로 사용 (환불일 기준으로 집계)
            paymentDate = refundDate;
          } catch (error) {
            console.error(`Row ${i + 1} - 환불일 파싱 오류:`, error);
            continue;
          }

          salesType = status === "미" ? "미개시환불" : "환불";
          paymentAmount = 0;
          const refundAmountValue = rowData.refund_amount;
          if (refundAmountValue && refundAmountValue !== "-" && refundAmountValue !== "") {
            refundAmount = parseNumber(refundAmountValue);
          } else {
            refundAmount = 0;
          }

          // 환불 사유 파싱
          if (rowData.refund_reason) {
            refundReason = String(rowData.refund_reason).trim() || null;
          }
        } else {
          // 그 외의 상태는 건너뜁니다
          continue;
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

        // 기본값 설정 (나중에 refinePaymentCount에서 수정됨)
        const payment_count_original = 1;
        const payment_count_refined = status === "결" ? 1 : 0;

        const final_revenue = paymentAmount - refundAmount;

        transactions.push({
          // 주차 정보
          report_id: reportId,

          // 년월 정보
          ym,
          payment_year,
          payment_month,
          payment_yearmonth,
          payment_date: paymentDate,

          // 판매자 정보
          seller: sellerName,
          seller_type: sellerType,

          // 구매자 정보
          buyer: buyerName,

          // 판매 구분
          category_code: categoryCode,
          sales_type: salesType,

          // 상품 정보
          product_code: productCode,
          product_name: productName,
          product_type,
          weeks,

          // 금액 정보
          list_price: listPrice,
          order_amount: orderAmount,
          points,
          coupon,
          payment_amount: paymentAmount,

          // 상태
          status,
          quantity: 1,

          // 결제건수
          payment_count_original,
          payment_count_refined,

          // 환불 정보
          refund_date: refundDate,
          refund_amount: refundAmount,
          refund_reason: refundReason,

          // 최종 매출
          final_revenue,

          // 메타데이터
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Row ${i + 1} 파싱 오류:`, error);
        continue;
      }
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          error: "파싱된 데이터가 없습니다.",
          debug: {
            headers: headers,
            headerMap: headerMap,
            totalRows: data.length - 1,
          },
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

    // 기존 해당 주차 데이터 삭제
    // 삭제 전략:
    // 1. report_id로 삭제 (같은 주차의 모든 거래)
    // 2. 날짜 범위 + report_id NULL (오래된 중복 데이터)
    // 3. 단, 과거 결제 + 현재 환불 케이스는 환불 정보만 업데이트
    
    // 방법 1: report_id로 삭제
    const { error: deleteError1 } = await supabase
      .from("sales_transactions")
      .delete()
      .eq("report_id", reportId);

    // 방법 2: 결제일 기준 날짜 범위 + report_id NULL (결제 거래 중복 제거)
    const { error: deleteError2 } = await supabase
      .from("sales_transactions")
      .delete()
      .gte("payment_date", weekStartDate)
      .lte("payment_date", weekEndDate)
      .is("report_id", null)
      .eq("status", "결"); // 결제 거래만

    // 방법 3: 환불일 기준 날짜 범위 + report_id NULL (환불 중복 제거)
    // 단, 결제일이 이 주차 범위 밖인 것만 (과거 결제 + 현재 환불)
    const { error: deleteError3 } = await supabase
      .from("sales_transactions")
      .delete()
      .gte("refund_date", weekStartDate)
      .lte("refund_date", weekEndDate)
      .is("report_id", null)
      .eq("status", "환")
      .or(`payment_date.lt.${weekStartDate},payment_date.gt.${weekEndDate}`); // 결제일이 주차 범위 밖

    // sales_transactions 테이블에 저장
    const { error: insertError } = await supabase.from("sales_transactions").insert(refinedTransactions);

    if (insertError) {
      return NextResponse.json(
        { error: `데이터 저장 실패: ${insertError.message}` },
        { status: 500 }
      );
    }

    // 집계 데이터 계산 (기존 로직 유지 - edu_revenue_stats, edu_product_sales 업데이트)
    // 결제(결) 거래만 필터링 - 모든 payment_amount 합산, payment_count_refined 합산
    const paymentTransactions = refinedTransactions.filter(
      (t) => t.status === "결" && t.payment_count_refined === 1
    );
    const allPaymentTransactions = refinedTransactions.filter((t) => t.status === "결");
    const refundTransactions = refinedTransactions.filter((t) => t.status === "환");

    // 실매출 집계 (모든 결제 금액 합산)
    const revenueReal = allPaymentTransactions.reduce((sum, t) => sum + t.payment_amount, 0);

    // 환불액 집계
    const totalRefundAmount = refundTransactions.reduce((sum, t) => sum + t.refund_amount, 0);
    const refundCount = refundTransactions.length;

    // 순매출 계산
    const revenueNet = revenueReal - totalRefundAmount;

    // 상품별 판매 건수 집계 (payment_count_refined = 1인 것만)
    const productSalesMap: { [key: string]: { count: number; category: string } } = {};
    paymentTransactions.forEach((t) => {
      const key = `${t.product_type}_${t.weeks || "기타"}`;
      if (!productSalesMap[key]) {
        productSalesMap[key] = { count: 0, category: t.product_type };
      }
      productSalesMap[key].count += 1;
    });

    const totalCount = paymentTransactions.length;
    const productSales = Object.entries(productSalesMap).map(([key, value]) => ({
      product_group: value.category as "1타" | "일반" | "그룹반" | "기타",
      product_variant: key.includes("_") ? (key.split("_")[1] === "기타" ? null : key.split("_")[1]) : null,
      sales_count: value.count,
      sales_share: totalCount > 0 ? Number(((value.count / totalCount) * 100).toFixed(2)) : 0,
    }));

    // 현재 주차 정보 조회
    const { data: currentReport } = await supabase.from("weekly_reports").select("start_date").eq("id", reportId).single();

    let prevWeeklyRealAmt = 0;
    let prevWeeklyNetAmt = 0;
    let yoyRealAmt = 0;
    let yoyNetAmt = 0;
    let monthlyCumRealAmt = 0;
    let monthlyCumNetAmt = 0;
    let yearlyCumRealAmt = 0;
    let yearlyCumNetAmt = 0;

    if (currentReport?.start_date) {
      const currentDate = new Date(currentReport.start_date);
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      const { data: currentReportFull } = await supabase.from("weekly_reports").select("title").eq("id", reportId).single();

      let weekOfMonth = 0;
      if (currentReportFull?.title) {
        const titleMatch = currentReportFull.title.match(/(\d+)년\s*(\d+)월\s*(\d+)주차/);
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

      // 전주 주차 찾기
      const { data: prevReport } = await supabase
        .from("weekly_reports")
        .select("id")
        .lt("start_date", currentReport.start_date)
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

      // 전년동기
      const prevYear = currentYear - 1;
      const yoyTitle = `${prevYear}년 ${currentMonth}월 ${weekOfMonth}주차`;

      const { data: yoyReport } = await supabase.from("weekly_reports").select("id").eq("title", yoyTitle).maybeSingle();

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
            monthlyCumRealAmt = monthlyStats.filter((s) => s.category === "실매출").reduce((sum, s) => sum + Number(s.weekly_amt || 0), 0);
            monthlyCumNetAmt = monthlyStats.filter((s) => s.category === "순매출").reduce((sum, s) => sum + Number(s.weekly_amt || 0), 0);
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
            yearlyCumRealAmt = yearlyStats.filter((s) => s.category === "실매출").reduce((sum, s) => sum + Number(s.weekly_amt || 0), 0);
            yearlyCumNetAmt = yearlyStats.filter((s) => s.category === "순매출").reduce((sum, s) => sum + Number(s.weekly_amt || 0), 0);
          }
        }
      }

      yearlyCumRealAmt += revenueReal;
      yearlyCumNetAmt += revenueNet;
    }

    // edu_revenue_stats 업데이트 (실매출)
    const { data: existingRevenueReal } = await supabase
      .from("edu_revenue_stats")
      .select("id")
      .eq("report_id", reportId)
      .eq("category", "실매출")
      .single();

    const revenueRealPayload = {
      report_id: reportId,
      category: "실매출" as const,
      weekly_amt: revenueReal,
      prev_weekly_amt: prevWeeklyRealAmt,
      yoy_amt: yoyRealAmt,
      monthly_cum: monthlyCumRealAmt,
      monthly_refund_amt: totalRefundAmount,
      yearly_cum: yearlyCumRealAmt,
    };

    if (existingRevenueReal) {
      await supabase.from("edu_revenue_stats").update(revenueRealPayload).eq("id", existingRevenueReal.id);
    } else {
      await supabase.from("edu_revenue_stats").insert(revenueRealPayload);
    }

    // edu_revenue_stats 업데이트 (순매출)
    const { data: existingRevenueNet } = await supabase
      .from("edu_revenue_stats")
      .select("id")
      .eq("report_id", reportId)
      .eq("category", "순매출")
      .single();

    const revenueNetPayload = {
      report_id: reportId,
      category: "순매출" as const,
      weekly_amt: revenueNet,
      prev_weekly_amt: prevWeeklyNetAmt,
      yoy_amt: yoyNetAmt,
      monthly_cum: monthlyCumNetAmt,
      monthly_refund_amt: totalRefundAmount,
      yearly_cum: yearlyCumNetAmt,
    };

    if (existingRevenueNet) {
      await supabase.from("edu_revenue_stats").update(revenueNetPayload).eq("id", existingRevenueNet.id);
    } else {
      await supabase.from("edu_revenue_stats").insert(revenueNetPayload);
    }

    // edu_product_sales 업데이트
    await supabase.from("edu_product_sales").delete().eq("report_id", reportId);

    if (productSales.length > 0) {
      const productSalesPayload = productSales.map((ps) => ({
        ...ps,
        report_id: reportId,
      }));

      await supabase.from("edu_product_sales").insert(productSalesPayload);
    }

    return NextResponse.json({
      success: true,
      message: `${refinedTransactions.length}건의 거래 내역이 저장되었습니다. (결제: ${allPaymentTransactions.length}건, 환불: ${refundCount}건)`,
      stats: {
        totalTransactions: refinedTransactions.length,
        paymentCount: paymentTransactions.length,
        refundCount: refundCount,
        revenueReal,
        totalRefundAmount,
        revenueNet,
        productSales,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: `업로드 실패: ${error.message || "알 수 없는 오류"}` },
      { status: 500 }
    );
  }
}
