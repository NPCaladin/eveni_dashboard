const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Excel 날짜를 JavaScript Date로 변환
function convertExcelDate(excelDate) {
  if (typeof excelDate === 'number') {
    // Excel serial date (1900-01-01을 1로 시작)
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  } else if (typeof excelDate === 'string') {
    // 이미 문자열이면 그대로 반환
    return excelDate;
  }
  return null;
}

// 컬럼 매핑 (한글 → 영문)
function mapRowToTransaction(row) {
  return {
    ym: row['YM']?.toString() || null,
    payment_year: row['결제년도'] || null,
    payment_month: row['결제월'] || null,
    payment_yearmonth: row['결제년월'] || null,
    payment_date: convertExcelDate(row['결제일']),
    seller: row['판매자'] || null,
    seller_type: row['판매자구분'] || null,
    buyer: row['구매자'] || null,
    category_code: row['구분코드'] || null,
    sales_type: row['판매구분'] || null,
    product_code: row['매출코드'] || null,
    product_name: row['판매상품'] || null,
    product_type: row['상품타입'] || null,
    weeks: row['주차'] || null,
    list_price: row['상품정가'] || 0,
    order_amount: row['주문금액'] || 0,
    points: row['포인트'] || 0,
    coupon: row['쿠폰 (:할인)'] || 0,
    payment_amount: row['결제매출'] || 0,
    status: row['상태'] || null,
    quantity: row['결제수량'] || 1,
    payment_count_original: row['결제건수'] || 0,
    payment_count_refined: row['결제건수_정제'] || 0,
    refund_date: convertExcelDate(row['환불일']),
    refund_amount: row['환불금액'] || 0,
    refund_reason: row['환불 사유'] || null,
    final_revenue: row['마감매출'] || 0,
    created_by: row['작성'] || null,
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('📊 정제된 매출 데이터 Import');
  console.log('='.repeat(80));
  
  try {
    // 1. 엑셀 파일 읽기
    console.log('\n📖 1단계: 엑셀 파일 읽기...');
    const workbook = xlsx.readFile('2024-2025_sales_data_cleaned.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    console.log(`✓ 총 ${data.length}개 레코드 로드 완료`);
    
    // 2. 데이터 변환
    console.log('\n🔄 2단계: 데이터 변환...');
    const transactions = data.map(mapRowToTransaction);
    
    // 유효성 검사
    const validTransactions = transactions.filter(t => 
      t.payment_date && t.payment_year && t.payment_month && t.buyer
    );
    
    console.log(`✓ ${validTransactions.length}개 유효 레코드 (${transactions.length - validTransactions.length}개 제외)`);
    
    // 3. 기존 데이터 삭제 (선택)
    console.log('\n🗑️  3단계: 기존 데이터 삭제...');
    const { error: deleteError } = await supabase
      .from('sales_transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 레코드 삭제
    
    if (deleteError) {
      console.warn('⚠️  삭제 중 오류 (테이블이 비어있을 수 있음):', deleteError.message);
    } else {
      console.log('✓ 기존 데이터 삭제 완료');
    }
    
    // 4. 배치 삽입 (1000개씩)
    console.log('\n📤 4단계: 데이터 업로드...');
    const batchSize = 1000;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < validTransactions.length; i += batchSize) {
      const batch = validTransactions.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(validTransactions.length / batchSize);
      
      console.log(`  배치 ${batchNum}/${totalBatches}: ${batch.length}개 레코드 업로드 중...`);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('sales_transactions')
        .insert(batch)
        .select('id');
      
      if (insertError) {
        console.error(`  ❌ 배치 ${batchNum} 업로드 실패:`, insertError.message);
        errorCount += batch.length;
      } else {
        successCount += insertedData.length;
        console.log(`  ✓ 배치 ${batchNum} 완료 (${insertedData.length}개)`);
      }
      
      // 진행률 표시
      const progress = Math.round(((i + batch.length) / validTransactions.length) * 100);
      console.log(`  진행률: ${progress}% (${successCount + errorCount}/${validTransactions.length})\n`);
    }
    
    // 5. 결과 요약
    console.log('='.repeat(80));
    console.log('📊 Import 완료');
    console.log('='.repeat(80));
    console.log(`✓ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    console.log(`📈 성공률: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);
    
    // 6. 검증 쿼리
    console.log('\n🔍 5단계: 데이터 검증...');
    
    // 총 레코드 수
    const { count: totalCount, error: countError } = await supabase
      .from('sales_transactions')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`✓ DB에 저장된 총 레코드: ${totalCount}개`);
    }
    
    // 연도별 집계
    const { data: yearStats, error: yearError } = await supabase
      .from('sales_transactions')
      .select('payment_year, payment_count_refined, payment_amount')
      .eq('is_count_valid', true);
    
    if (!yearError && yearStats) {
      const byYear = {};
      yearStats.forEach(row => {
        const year = row.payment_year;
        if (!byYear[year]) {
          byYear[year] = { count: 0, revenue: 0 };
        }
        byYear[year].count += 1;
        byYear[year].revenue += row.payment_amount;
      });
      
      console.log('\n연도별 집계 (is_count_valid = true):');
      Object.entries(byYear).sort().forEach(([year, stats]) => {
        console.log(`  ${year}년: ${stats.count}건, ${stats.revenue.toLocaleString()}원`);
      });
    }
    
    // 12월 1주차 검증
    const { data: dec1stWeek, error: decError } = await supabase
      .from('sales_transactions')
      .select('*')
      .gte('payment_date', '2025-12-01')
      .lte('payment_date', '2025-12-07')
      .eq('is_count_valid', true);
    
    if (!decError && dec1stWeek) {
      const totalRevenue = dec1stWeek.reduce((sum, row) => sum + row.payment_amount, 0);
      console.log(`\n✓ 2025-12-01 ~ 2025-12-07 검증:`);
      console.log(`  결제건수: ${dec1stWeek.length}건`);
      console.log(`  총 매출: ${totalRevenue.toLocaleString()}원`);
      console.log(`  예상값: 20,205,730원`);
      console.log(`  일치 여부: ${totalRevenue === 20205730 ? '✅ 일치' : '❌ 불일치'}`);
    }
    
    console.log('\n='.repeat(80));
    console.log('✅ 모든 작업 완료!');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
main();

