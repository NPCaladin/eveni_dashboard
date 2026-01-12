/**
 * 매출 엑셀 파싱 유틸리티
 */

import type {
  SellerType,
  ProductType,
  ProductTypeResult,
  YearMonthInfo,
  TransactionData,
} from "@/lib/types/revenue";

// 엑셀 컬럼 매핑 (한국어 헤더) - 여러 가능한 헤더명 지원
export const COLUMN_MAPPING: Record<string, string> = {
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

/**
 * 판매자 타입 분류 (세일즈본부/운영팀/퇴사자)
 */
export function getSellerType(sellerName: string): SellerType {
  const name = sellerName.trim();
  // 세일즈본부: 샐, 써, 에
  if (name === "샐" || name === "써" || name === "에") {
    return "세일즈본부";
  }
  // 운영팀: 딜, 루, 리, 헤
  if (name === "딜" || name === "루" || name === "리" || name === "헤") {
    return "운영팀";
  }
  // 그 외는 퇴사자
  return "퇴사자";
}

/**
 * 결제건수 정제 로직 (분할/완납 처리)
 */
export function refinePaymentCount(transactions: TransactionData[]): TransactionData[] {
  // 구매자별로 그룹핑
  const buyerGroups = new Map<string, TransactionData[]>();
  transactions.forEach((tx) => {
    if (tx.buyer && tx.status === "결") {
      if (!buyerGroups.has(tx.buyer)) {
        buyerGroups.set(tx.buyer, []);
      }
      buyerGroups.get(tx.buyer)!.push(tx);
    }
  });

  // 각 구매자별로 분할/완납 처리
  buyerGroups.forEach((txList) => {
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
      changeTxs.forEach((tx) => {
        const originalIndex = txList.indexOf(tx);
        if (originalIndex !== lastChangeIndex) {
          tx.payment_count_refined = 0;
        }
      });
    }
  });

  return transactions;
}

/**
 * 상품 타입 분류 (확장)
 */
export function parseProductType(productName: string): ProductTypeResult {
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

/**
 * 숫자 변환 헬퍼
 */
export function parseNumber(value: unknown): number {
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

/**
 * 날짜 변환 헬퍼
 */
export function parseDate(value: unknown): string {
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

/**
 * 날짜에서 년월 정보 추출
 */
export function extractYearMonth(dateStr: string): YearMonthInfo {
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

/**
 * 엑셀 헤더 매핑 생성
 */
export function createHeaderMap(headers: string[]): Record<number, string> {
  const headerMap: Record<number, string> = {};
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

  return headerMap;
}
