const XLSX = require('xlsx');

console.log('🔍 12월 3주차 상세 분석\n');

const wb = XLSX.readFile('2025_12_3week_cleaned_org.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, {defval: ''});

console.log(`총 ${data.length}개 행\n`);

// 모든 행 출력
console.log('=== 전체 데이터 상세 ===\n');
data.forEach((row, i) => {
  console.log(`\n[행 ${i + 1}]`);
  console.log(`상태: ${row['상태']}`);
  console.log(`결제일: ${row['결제일']}`);
  console.log(`판매자: ${row['판매자']}`);
  console.log(`구매자: ${row['구매자']}`);
  console.log(`판매구분: ${row['판매구분']}`);
  console.log(`판매상품: ${row['판매상품']}`);
  console.log(`결제매출: ${row['결제매출']}`);
  console.log(`환불금액: ${row['환불금액']}`);
  console.log(`결제건수: ${row['결제건수']}`);
});

// 상태별 계산
console.log('\n\n=== 상태별 집계 ===\n');

let totalPayments = 0;
let totalRefunds = 0;
let paymentCount = 0;
let refundCount = 0;

data.forEach(row => {
  const status = row['상태'];
  const paymentAmount = parseFloat(String(row['결제매출'] || 0).replace(/,/g, '')) || 0;
  const refundAmount = parseFloat(String(row['환불금액'] || 0).replace(/,/g, '').replace('-', '0')) || 0;
  
  console.log(`${status}: 결제매출=${paymentAmount.toLocaleString()}원, 환불=${refundAmount.toLocaleString()}원`);
  
  if (status === '결' || status === '프' || status === '재') {
    totalPayments += paymentAmount;
    paymentCount++;
  } else if (status === '환') {
    totalRefunds += refundAmount;
    refundCount++;
  }
});

console.log('\n=== 최종 집계 ===');
console.log(`실매출 총액: ${totalPayments.toLocaleString()}원 (${paymentCount}건)`);
console.log(`환불 총액: ${totalRefunds.toLocaleString()}원 (${refundCount}건)`);
console.log(`순매출: ${(totalPayments - totalRefunds).toLocaleString()}원`);

// 대시보드 표시 수치
console.log('\n=== 대시보드 표시 ===');
console.log('실매출: 3,520만원');
console.log('환불: 0만원');

console.log('\n=== 차이 분석 ===');
const dashboardAmount = 3520 * 10000; // 만원 단위
console.log(`엑셀 실매출: ${totalPayments.toLocaleString()}원`);
console.log(`대시보드 실매출: ${dashboardAmount.toLocaleString()}원`);
console.log(`차이: ${(totalPayments - dashboardAmount).toLocaleString()}원`);

