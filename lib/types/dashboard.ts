/**
 * 대시보드 관련 공통 타입 정의
 */

// ============================================
// 마케팅 대시보드 타입
// ============================================

export interface MediaCost {
  media: string;
  stage_1_cost?: number;
  stage_2_cost?: number;
}

export interface TotalSpend {
  media: string;
  total_spend: number;
}

export interface WeekData {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  costs: MediaCost[];
  totalSpends?: TotalSpend[];
  adData?: AdOverviewData[];
}

export interface AdOverviewData {
  media: string;
  stage_1_name: string | null;
  stage_1_count: number;
  stage_1_cost_per_lead: number;
  stage_2_name: string | null;
  stage_2_count: number;
  stage_2_conversion_rate: number | null;
  stage_2_cost_per_lead: number;
  total_spend: number;
}

export interface ConversionTrendData {
  reportId: string;
  title: string;
  startDate: string;
  endDate: string;
  kakao: {
    stage1Count: number;
    stage2Count: number;
    conversionRate: number;
    totalSpend: number;
  };
  meta: {
    stage1Count: number;
    stage2Count: number;
    conversionRate: number;
    totalSpend: number;
  };
  payment?: {
    specialDbCount: number;
    specialPaymentCount: number;
    specialConversionRate: number;
    generalDbCount: number;
    generalPaymentCount: number;
    generalConversionRate: number;
    totalDbCount: number;
    totalPaymentCount: number;
    totalConversionRate: number;
  };
}

// ============================================
// 세일즈 대시보드 타입
// ============================================

export interface ProductMatrixData {
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

export interface RefundData {
  count: number;
  amount: number;
}

export interface RevenueMetrics {
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
}

export interface ComparisonData {
  weekly: { count: number; grossRevenue: number; netRevenue: number; refund?: RefundData };
  prevWeek: { count: number; grossRevenue: number; netRevenue: number; refund?: RefundData };
  prevYear: { count: number; grossRevenue: number; netRevenue: number; refund?: RefundData };
  monthlyCum: { count: number; grossRevenue: number; netRevenue: number; refund?: RefundData };
  yearlyCum: { count: number; grossRevenue: number; netRevenue: number; refund?: RefundData };
  currentMonth: number;
}

export interface RefundSummary {
  weeklyCount: number;
  weeklyAmount: number;
  monthlyCount: number;
  monthlyAmount: number;
  yearlyCount: number;
  yearlyAmount: number;
  prevWeekAmount: number;
  prevYearAmount: number;
  yearlyRefundRate: number;
  currentMonth: number;
}

export interface RefundComparison {
  weekly: RefundData;
  prevWeek: RefundData;
  prevYear: RefundData;
  monthlyCum: RefundData;
  yearlyCum: RefundData;
}

export interface TrendDataPoint {
  label: string;
  netRevenue2025: number;
  netRevenue2024: number;
  refund: number;
}

export interface TrendData {
  weeklyData: TrendDataPoint[];
  monthlyData: TrendDataPoint[];
}

export interface ProductTypeData {
  name: string;
  value: number;
  color: string;
}

export interface ProductWeeksData {
  week: string;
  "1타": number;
  일반: number;
  기타: number;
}

export interface SalesData {
  revenueMetrics: RevenueMetrics;
  comparisonData: ComparisonData;
  productMatrix: ProductMatrixData;
  productTypeData: ProductTypeData[];
  productWeeksData: ProductWeeksData[];
  totalProductCount: number;
  refundSummary: RefundSummary;
  refundComparison: RefundComparison;
  refundDetails: RefundDetail[];
  trendData: TrendData;
}

export interface RefundDetail {
  buyer_name: string;
  refund_date: string;
  payment_date: string | null;
  refund_amount: number;
  product_type: string | null;
  refund_reason: string | null;
}

// ============================================
// 공통 타입
// ============================================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PeriodData {
  current: number;
  previous: number;
  previousYear: number;
  changeFromPrevious: number;
  changeFromPreviousYear: number;
}



