/**
 * 매출 데이터 관련 타입 정의
 */

// 상태 타입
export type TransactionStatus = "결" | "환" | "미";

// 판매자 타입
export type SellerType = "세일즈본부" | "운영팀" | "퇴사자";

// 상품 타입
export type ProductType = "일반" | "1타" | "게임톤" | "합격보장반" | "GM" | "그룹반" | "첫스터디" | "기타";

// 상품 타입 파싱 결과
export interface ProductTypeResult {
  product_type: ProductType;
  weeks: number | null;
}

// 년월 정보
export interface YearMonthInfo {
  ym: string;
  payment_year: number;
  payment_month: number;
  payment_yearmonth: string;
}

// 거래 데이터 (sales_transactions 테이블 Row)
export interface TransactionData {
  report_id: string;
  ym: string;
  payment_year: number;
  payment_month: number;
  payment_yearmonth: string;
  payment_date: string;
  seller: string;
  seller_type: SellerType;
  buyer: string;
  category_code: number | null;
  sales_type: string;
  product_code: number | null;
  product_name: string;
  product_type: ProductType;
  weeks: number | null;
  list_price: number;
  order_amount: number;
  points: number;
  coupon: number;
  payment_amount: number;
  status: TransactionStatus;
  quantity: number;
  payment_count_original: number;
  payment_count_refined: number;
  refund_date: string | null;
  refund_amount: number;
  refund_reason: string | null;
  final_revenue: number;
  created_at: string;
}

// 파싱된 Row 데이터 (중간 상태)
export interface ParsedRowData {
  status?: string;
  payment_date?: unknown;
  refund_date?: unknown;
  seller?: string;
  buyer?: string;
  sales_type?: string;
  category_code?: unknown;
  product_code?: unknown;
  product_name?: string;
  list_price?: unknown;
  order_amount?: unknown;
  points?: unknown;
  coupon?: unknown;
  payment_amount?: unknown;
  refund_amount?: unknown;
  refund_reason?: string;
}

// 상품별 판매 집계
export interface ProductSalesAggregate {
  product_group: "1타" | "일반" | "그룹반" | "기타";
  product_variant: string | null;
  sales_count: number;
  sales_share: number;
}

// 업로드 결과 통계
export interface UploadStats {
  totalTransactions: number;
  paymentCount: number;
  refundCount: number;
  revenueReal: number;
  totalRefundAmount: number;
  revenueNet: number;
  productSales: ProductSalesAggregate[];
}
