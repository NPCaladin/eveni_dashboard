import type { PeriodType } from "@/components/dashboard/marketing/global-period-filter";

/**
 * 날짜 문자열을 "MM월 N주" 형태로 포맷
 */
export function formatWeekLabel(startDate: string, title: string): string {
  const date = new Date(startDate);
  const month = date.getMonth() + 1;
  
  // title에서 주차 정보 추출 (예: "2025년 1월 1주차" -> "1주")
  const weekMatch = title.match(/(\d+)주차/);
  const week = weekMatch ? weekMatch[1] : "";
  
  return `${month}월 ${week}주`;
}

/**
 * 기간별 필터링된 데이터 계산
 */
export function getFilteredDataByPeriod<T>(
  data: T[],
  period: PeriodType
): T[] {
  if (period === "all") return data;
  
  const weeks = period === "1month" ? 4 : 12;
  return data.slice(-weeks);
}

/**
 * 천 단위 콤마 포맷팅
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

