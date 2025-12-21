/**
 * 통화 및 숫자 포맷팅 유틸리티
 */

/**
 * 숫자를 한국 원화 형식으로 포맷팅
 * @param amount - 포맷팅할 금액
 * @returns 포맷팅된 문자열 (예: "1,000원")
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()}원`;
}

/**
 * 숫자를 한국식 억/만 단위로 포맷팅
 * @param amount - 포맷팅할 금액
 * @returns 포맷팅된 문자열 (예: "1억 2,000만원")
 */
export function formatKoreanCurrency(amount: number): string {
  const eok = Math.floor(amount / 100000000);
  const man = Math.floor((amount % 100000000) / 10000);
  
  if (eok > 0 && man > 0) {
    return `${eok}억 ${man.toLocaleString()}만원`;
  } else if (eok > 0) {
    return `${eok}억원`;
  } else if (man > 0) {
    return `${man.toLocaleString()}만원`;
  } else {
    return `${amount.toLocaleString()}원`;
  }
}

/**
 * 차트용 간단한 통화 포맷 (만 단위)
 * @param value - 포맷팅할 금액
 * @returns 포맷팅된 문자열 (예: "1,234만")
 */
export function formatChartCurrency(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만`;
  }
  return value.toLocaleString();
}

/**
 * 백분율 포맷팅
 * @param value - 포맷팅할 숫자 (0-100)
 * @param decimals - 소수점 자릿수 (기본값: 1)
 * @returns 포맷팅된 문자열 (예: "12.5%")
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 숫자를 천 단위 구분자와 함께 포맷팅
 * @param value - 포맷팅할 숫자
 * @returns 포맷팅된 문자열 (예: "1,234")
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * 툴팁용 통화 포맷팅
 * @param value - 포맷팅할 금액
 * @returns 포맷팅된 문자열 (예: "1,234,567원")
 */
export function formatTooltipCurrency(value: number): string {
  return `${value.toLocaleString()}원`;
}



