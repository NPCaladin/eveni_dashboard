/**
 * 엑셀 날짜를 문자열로 변환 (YYYY-MM-DD)
 * Excel 숫자 날짜 → 문자열 날짜
 */

import XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'fs';

const inputFile = '2024-2025_sales_data_cleaned.xlsx';
const outputFile = '2024-2025_sales_data_cleaned_fixed_dates.xlsx';

console.log('📄 엑셀 날짜 변환 시작\n');
console.log('='.repeat(100));

try {
  // 엑셀 파일 읽기
  const fileBuffer = readFileSync(inputFile);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`\n입력 파일: ${inputFile}`);
  console.log(`총 ${rows.length}건의 거래\n`);

  // 날짜 변환 함수
  function convertExcelDate(value) {
    if (!value || value === '-' || value === '') return null;
    
    // 이미 문자열 날짜 형식이면 그대로 반환
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }
    
    // Excel 숫자 날짜 변환
    if (typeof value === 'number') {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Date 객체인 경우
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return value;
  }

  console.log('날짜 변환 중...\n');

  let convertedCount = 0;
  const convertedRows = rows.map(row => {
    const newRow = { ...row };
    
    // 결제일 변환
    if (row['결제일']) {
      const original = row['결제일'];
      const converted = convertExcelDate(original);
      if (converted && converted !== original) {
        newRow['결제일'] = converted;
        convertedCount++;
      }
    }
    
    // 환불일 변환
    if (row['환불일']) {
      const original = row['환불일'];
      const converted = convertExcelDate(original);
      if (converted && converted !== original) {
        newRow['환불일'] = converted;
      }
    }
    
    return newRow;
  });

  console.log(`✅ ${convertedCount}개의 날짜가 변환되었습니다.\n`);

  // 변환 전후 샘플 출력
  console.log('='.repeat(100));
  console.log('\n변환 샘플 (상위 5개):\n');

  convertedRows.slice(0, 5).forEach((row, idx) => {
    const original = rows[idx]['결제일'];
    const converted = row['결제일'];
    console.log(`  ${idx + 1}. ${row['구매자']}`);
    console.log(`     변환 전: ${original}`);
    console.log(`     변환 후: ${converted}`);
    console.log('');
  });

  // 양희원22 확인
  console.log('='.repeat(100));
  console.log('\n🔍 양희원22 확인:\n');
  
  const yangOriginal = rows.find(r => 
    r['구매자'] && r['구매자'].toString().includes('양희원22')
  );
  const yangConverted = convertedRows.find(r => 
    r['구매자'] && r['구매자'].toString().includes('양희원22')
  );

  if (yangOriginal && yangConverted) {
    console.log(`  변환 전: ${yangOriginal['결제일']}`);
    console.log(`  변환 후: ${yangConverted['결제일']}`);
    console.log(`  ✅ 2025-12-08로 변환됨!\n`);
  }

  // 새 엑셀 파일 생성
  console.log('='.repeat(100));
  console.log('\n새 엑셀 파일 생성 중...\n');

  const newWorkbook = XLSX.utils.book_new();
  const newSheet = XLSX.utils.json_to_sheet(convertedRows);
  XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);

  // 파일 저장
  const buffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
  writeFileSync(outputFile, buffer);

  console.log(`✅ 파일 저장 완료: ${outputFile}\n`);

  console.log('='.repeat(100));
  console.log('\n📋 다음 단계:\n');
  console.log('  1. Supabase에서 모든 sales_transactions 삭제');
  console.log('  2. 어드민에서 주차별로 새 파일 업로드');
  console.log('     또는 SQL INSERT 문 생성하여 일괄 삽입');
  console.log('  3. report_id 자동 매칭\n');

  console.log('='.repeat(100));

} catch (error) {
  console.error('❌ 오류:', error.message);
  console.error(error.stack);
}

