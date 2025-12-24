const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일 수동 로드
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🚀 결제 전환율 데이터 마이그레이션 시작...\n');

// Excel 날짜를 JS Date로 변환
function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}

// 날짜를 YYYY-MM-DD 형식으로 포맷팅
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// 전환율 계산 (소수점 2자리)
function calculateConversionRate(paymentCount, dbCount) {
  if (dbCount === 0) return 0;
  return Math.round((paymentCount / dbCount) * 10000) / 100;
}

// 날짜 차이 계산 (일 단위)
function dateDiffInDays(date1Str, date2Str) {
  const date1 = new Date(date1Str);
  const date2 = new Date(date2Str);
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

async function migrate() {
  try {
    // 1. Excel 파일 읽기
    console.log('📂 Excel 파일 읽는 중...');
    const workbook = xlsx.readFile('2025_payment_data.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(worksheet);
    
    console.log(`✅ ${rawData.length}개의 주차 데이터 발견\n`);
    
    // 2. weekly_reports 데이터 가져오기 (날짜 매칭용)
    console.log('📊 weekly_reports 데이터 조회 중...');
    const { data: reports, error: reportsError } = await supabase
      .from('weekly_reports')
      .select('id, title, start_date, end_date')
      .gte('start_date', '2025-01-01')
      .order('start_date', { ascending: true });
    
    if (reportsError) {
      throw new Error(`weekly_reports 조회 실패: ${reportsError.message}`);
    }
    
    console.log(`✅ ${reports.length}개의 주차 보고서 발견\n`);
    
    // 3. 데이터 매칭 및 변환
    console.log('🔄 데이터 매칭 및 변환 중...\n');
    const paymentData = [];
    let matchedCount = 0;
    let unmatchedCount = 0;
    
    for (const row of rawData) {
      // Excel 날짜를 변환
      const startDate = formatDate(excelDateToJSDate(row['시작일']));
      const endDate = formatDate(excelDateToJSDate(row['종료일']));
      
      // 날짜로 report_id 찾기 (±1일 차이 허용)
      const matchedReport = reports.find(r => {
        const startDiff = dateDiffInDays(r.start_date, startDate);
        const endDiff = dateDiffInDays(r.end_date, endDate);
        // 시작일과 종료일 모두 1일 이내 차이면 같은 주로 인정
        return startDiff <= 1 && endDiff <= 1;
      });
      
      if (!matchedReport) {
        console.log(`⚠️  매칭 실패: ${startDate} ~ ${endDate}`);
        unmatchedCount++;
        continue;
      }
      
      // 매칭 정보 출력 (디버깅용)
      if (dateDiffInDays(matchedReport.start_date, startDate) > 0 || 
          dateDiffInDays(matchedReport.end_date, endDate) > 0) {
        console.log(`📅 날짜 보정: Excel(${startDate}~${endDate}) → DB(${matchedReport.start_date}~${matchedReport.end_date})`);
      }
      
      // 데이터 추출
      const specialDb = row['특강 DB 수'] || 0;
      const specialPayment = row['결제 고객 수'] || 0;
      const generalDb = row['일반 DB 수'] || 0;
      const generalPayment = row['결제 고객 수_1'] || 0;
      const totalDb = row['총 DB 수'] || 0;
      const totalPayment = row['총 결제 고객 수'] || 0;
      
      // 전환율 계산
      const specialRate = calculateConversionRate(specialPayment, specialDb);
      const generalRate = calculateConversionRate(generalPayment, generalDb);
      const totalRate = calculateConversionRate(totalPayment, totalDb);
      
      paymentData.push({
        report_id: matchedReport.id,
        special_db_count: specialDb,
        special_payment_count: specialPayment,
        special_conversion_rate: specialRate,
        general_db_count: generalDb,
        general_payment_count: generalPayment,
        general_conversion_rate: generalRate,
        total_db_count: totalDb,
        total_payment_count: totalPayment,
        total_conversion_rate: totalRate,
      });
      
      matchedCount++;
      console.log(`✅ ${matchedReport.title}: 특강 ${specialRate}%, 일반 ${generalRate}%, 전체 ${totalRate}%`);
    }
    
    console.log(`\n📊 매칭 결과: 성공 ${matchedCount}개, 실패 ${unmatchedCount}개\n`);
    
    if (paymentData.length === 0) {
      throw new Error('매칭된 데이터가 없습니다!');
    }
    
    // 4. Supabase에 삽입
    console.log('💾 Supabase에 데이터 삽입 중...');
    
    const { data: insertedData, error: insertError } = await supabase
      .from('mkt_payment_conversion')
      .upsert(paymentData, { onConflict: 'report_id' })
      .select();
    
    if (insertError) {
      throw new Error(`데이터 삽입 실패: ${insertError.message}`);
    }
    
    console.log(`✅ ${insertedData.length}개 레코드 삽입 완료!\n`);
    
    // 5. 검증
    console.log('🔍 데이터 검증 중...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('mkt_payment_conversion')
      .select('*')
      .order('report_id', { ascending: true });
    
    if (verifyError) {
      throw new Error(`검증 조회 실패: ${verifyError.message}`);
    }
    
    console.log(`✅ 총 ${verifyData.length}개 레코드 확인\n`);
    
    // 통계 출력
    const totalSpecialDb = verifyData.reduce((sum, r) => sum + r.special_db_count, 0);
    const totalSpecialPayment = verifyData.reduce((sum, r) => sum + r.special_payment_count, 0);
    const totalGeneralDb = verifyData.reduce((sum, r) => sum + r.general_db_count, 0);
    const totalGeneralPayment = verifyData.reduce((sum, r) => sum + r.general_payment_count, 0);
    const totalAllDb = verifyData.reduce((sum, r) => sum + r.total_db_count, 0);
    const totalAllPayment = verifyData.reduce((sum, r) => sum + r.total_payment_count, 0);
    
    console.log('📊 전체 통계:');
    console.log(`  특강: ${totalSpecialPayment}/${totalSpecialDb}명 (${calculateConversionRate(totalSpecialPayment, totalSpecialDb)}%)`);
    console.log(`  일반: ${totalGeneralPayment}/${totalGeneralDb}명 (${calculateConversionRate(totalGeneralPayment, totalGeneralDb)}%)`);
    console.log(`  전체: ${totalAllPayment}/${totalAllDb}명 (${calculateConversionRate(totalAllPayment, totalAllDb)}%)`);
    
    console.log('\n✅ 마이그레이션 완료! 🎉\n');
    
  } catch (error) {
    console.error('\n❌ 에러 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 실행
migrate();

