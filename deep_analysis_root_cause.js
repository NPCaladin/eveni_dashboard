const XLSX = require('xlsx');

console.log('='.repeat(80));
console.log('🔬 근본 원인 분석: 12월 3주차 데이터');
console.log('='.repeat(80));

// 1. 원본 파일 읽기
const wb = XLSX.readFile('2025_12_3week_cleaned_org.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('\n[1단계] 원본 파일 구조 분석');
console.log('-'.repeat(80));

// 헤더 확인 (1행 또는 2행)
const headers1 = rawData[0];
const headers2 = rawData[1];

console.log('\n1행 (헤더 후보):');
console.log(headers1.filter(h => h).join(' | '));

console.log('\n2행 (헤더 후보):');
console.log(headers2.filter(h => h).join(' | '));

// 실제 헤더 결정 (백엔드 로직과 동일)
let headerRow = 0;
const possibleHeaders = ["상태", "날짜", "결제일", "판매자", "구매자", "상품", "결제금액"];
const row0Match = possibleHeaders.filter(h => headers1.includes(h)).length;
const row1Match = possibleHeaders.filter(h => headers2.includes(h)).length;

if (row1Match > row0Match) {
  headerRow = 1;
}

const headers = rawData[headerRow];
console.log(`\n✅ 헤더 행 결정: ${headerRow + 1}행`);
console.log('헤더:', headers.filter(h => h).join(', '));

// 데이터 행 파싱
const dataRows = rawData.slice(headerRow + 1).filter(row => row.some(cell => cell !== "" && cell !== null));

console.log(`\n✅ 데이터 행 수: ${dataRows.length}개`);

// 백엔드 COLUMN_MAPPING 재현
const COLUMN_MAPPING = {
  '상태': 'status',
  '날짜': 'payment_date',
  '결제일': 'payment_date',
  '환불일': 'refund_date',
  '판매자': 'seller',
  '구매자': 'buyer',
  '판매구분': 'sales_type',
  '구분코드': 'sales_type',
  '상품': 'product_name',
  '상품명': 'product_name',
  '판매상품': 'product_name',
  '프로그램': 'product_name',
  '수강상품': 'product_name',
  '정가': 'list_price',
  '상품정가': 'list_price',
  '주문금액': 'order_amount',
  '포인트': 'points',
  '쿠폰': 'coupon',
  '쿠폰 (:할인)': 'coupon',
  '쿠폰(:할인)': 'coupon',
  '결제금액': 'payment_amount',
  '결제매출': 'payment_amount',
  '환불금액': 'refund_amount',
};

// 헤더 매핑
const colIndexMap = {};
headers.forEach((h, idx) => {
  const trimmed = String(h || "").trim();
  if (COLUMN_MAPPING[trimmed]) {
    colIndexMap[COLUMN_MAPPING[trimmed]] = idx;
  }
});

console.log('\n[2단계] 컬럼 매핑 확인');
console.log('-'.repeat(80));
console.log('매핑된 컬럼:');
Object.entries(colIndexMap).forEach(([field, idx]) => {
  console.log(`  ${field.padEnd(20)} <- ${headers[idx]} (컬럼 ${idx})`);
});

// 필수 필드 체크
const required = ['status', 'payment_date', 'seller', 'buyer', 'product_name', 'payment_amount'];
const missing = required.filter(f => !colIndexMap[f]);
if (missing.length > 0) {
  console.log('\n❌ 누락된 필수 필드:', missing.join(', '));
} else {
  console.log('\n✅ 모든 필수 필드 매핑 완료');
}

// 데이터 파싱 시뮬레이션
console.log('\n[3단계] 데이터 파싱 시뮬레이션 (백엔드 로직 재현)');
console.log('-'.repeat(80));

let parsedCount = 0;
let skippedCount = 0;
const skippedReasons = {};

dataRows.forEach((row, idx) => {
  const rowData = {};
  Object.entries(colIndexMap).forEach(([field, colIdx]) => {
    rowData[field] = row[colIdx];
  });

  // 상태 체크
  const statusRaw = String(rowData.status || "").trim();
  
  console.log(`\n행 ${idx + headerRow + 2}:`);
  console.log(`  상태: "${statusRaw}"`);
  console.log(`  구매자: ${rowData.buyer}`);
  console.log(`  상품: ${rowData.product_name}`);
  console.log(`  금액: ${rowData.payment_amount}`);
  
  // 백엔드 필터 로직
  if (statusRaw !== "결" && statusRaw !== "환" && statusRaw !== "미" && statusRaw !== "프" && statusRaw !== "재") {
    console.log(`  ❌ 건너뜀: 상태 불일치 (${statusRaw})`);
    skippedCount++;
    skippedReasons[`상태_${statusRaw}`] = (skippedReasons[`상태_${statusRaw}`] || 0) + 1;
    return;
  }
  
  // 날짜 체크
  const paymentDateRaw = rowData.payment_date;
  if (!paymentDateRaw) {
    console.log(`  ❌ 건너뜀: 날짜 없음`);
    skippedCount++;
    skippedReasons['날짜_없음'] = (skippedReasons['날짜_없음'] || 0) + 1;
    return;
  }
  
  console.log(`  ✅ 파싱 성공`);
  parsedCount++;
});

console.log('\n[4단계] 파싱 결과 요약');
console.log('-'.repeat(80));
console.log(`✅ 파싱 성공: ${parsedCount}건`);
console.log(`❌ 건너뜀: ${skippedCount}건`);

if (skippedCount > 0) {
  console.log('\n건너뛴 이유:');
  Object.entries(skippedReasons).forEach(([reason, count]) => {
    console.log(`  - ${reason}: ${count}건`);
  });
}

console.log('\n[5단계] 기대값 vs 실제값');
console.log('-'.repeat(80));
console.log(`엑셀 원본 데이터: ${dataRows.length}건`);
console.log(`파싱 성공 예상: ${parsedCount}건`);
console.log(`DB 저장 예상: ${parsedCount}건`);

// 금액 계산
let totalAmount = 0;
dataRows.forEach(row => {
  const rowData = {};
  Object.entries(colIndexMap).forEach(([field, colIdx]) => {
    rowData[field] = row[colIdx];
  });
  
  const statusRaw = String(rowData.status || "").trim();
  if (statusRaw === "결" || statusRaw === "프" || statusRaw === "재") {
    const amount = parseFloat(String(rowData.payment_amount || 0).replace(/,/g, '')) || 0;
    totalAmount += amount;
  }
});

console.log(`예상 실매출: ${totalAmount.toLocaleString()}원`);
console.log('\n' + '='.repeat(80));



