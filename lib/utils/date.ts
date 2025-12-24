/**
 * 날짜 계산 및 포맷팅 유틸리티
 */

/**
 * 이전 주 날짜 계산
 * @param date - 기준 날짜
 * @returns 7일 전 날짜
 */
export function getPreviousWeek(date: Date | string): Date {
  const baseDate = typeof date === "string" ? new Date(date) : new Date(date);
  const result = new Date(baseDate);
  result.setDate(result.getDate() - 7);
  return result;
}

/**
 * 이전 년도 같은 주 날짜 계산
 * @param date - 기준 날짜
 * @returns 52주 전 날짜
 */
export function getPreviousYear(date: Date | string): Date {
  const baseDate = typeof date === "string" ? new Date(date) : new Date(date);
  const result = new Date(baseDate);
  result.setDate(result.getDate() - 364); // 52주 = 364일
  return result;
}

/**
 * 특정 날짜가 속한 달의 시작일
 * @param date - 기준 날짜
 * @returns 해당 월의 1일
 */
export function getMonthStart(date: Date | string): Date {
  const baseDate = typeof date === "string" ? new Date(date) : new Date(date);
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
}

/**
 * 특정 날짜가 속한 연도의 시작일
 * @param date - 기준 날짜
 * @returns 해당 년도의 1월 1일
 */
export function getYearStart(date: Date | string): Date {
  const baseDate = typeof date === "string" ? new Date(date) : new Date(date);
  return new Date(baseDate.getFullYear(), 0, 1);
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅
 * @param date - 포맷팅할 날짜
 * @returns 포맷팅된 문자열 (예: "2024-12-21")
 */
export function formatDate(date: Date | string): string {
  const baseDate = typeof date === "string" ? new Date(date) : date;
  return baseDate.toISOString().split("T")[0];
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param date - 포맷팅할 날짜
 * @returns 포맷팅된 문자열 (예: "2024년 12월 21일")
 */
export function formatKoreanDate(date: Date | string): string {
  const baseDate = typeof date === "string" ? new Date(date) : date;
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;
  const day = baseDate.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 두 날짜 사이의 일수 계산
 * @param date1 - 시작 날짜
 * @param date2 - 종료 날짜
 * @returns 일수 차이
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * N일 전/후 날짜 계산
 * @param date - 기준 날짜
 * @param days - 일수 (양수: 미래, 음수: 과거)
 * @returns 계산된 날짜
 */
export function addDays(date: Date | string, days: number): Date {
  const baseDate = typeof date === "string" ? new Date(date) : new Date(date);
  const result = new Date(baseDate);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 현재 날짜가 특정 범위 내에 있는지 확인
 * @param date - 확인할 날짜
 * @param startDate - 시작 날짜
 * @param endDate - 종료 날짜
 * @returns 범위 내 여부
 */
export function isDateInRange(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  return d >= start && d <= end;
}






