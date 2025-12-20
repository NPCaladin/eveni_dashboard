// 환경변수 로드
require('dotenv').config({ path: '.env.local' });

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 없습니다!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '있음' : '없음');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '있음' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('='.repeat(80));
console.log('📊 마케팅 데이터 삽입: 2025년');
console.log('='.repeat(80));

async function importMarketingData() {
  try {
    // 1. 엑셀 파일 읽기
    console.log('\n[1] 엑셀 파일 읽기...');
    const wb = XLSX.readFile('2025_weekly_meta_kakao_v2.xlsx');
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // 2. 데이터 파싱
    console.log('[2] 데이터 파싱...');
    const weeklyData = [];
    
    for (let i = 2; i < data.length; i++) { // 3행부터 데이터 시작
      const row = data[i];
      if (!row[0]) continue; // 주차 정보가 없으면 건너뛰기

      // 주차 정보 파싱 (예: "01월 1주차 (2025-01-06 ~ 2025-01-12)")
      const weekStr = String(row[0]).trim();
      const match = weekStr.match(/(\d+)월\s*(\d+)주차\s*\((\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})\)/);
      
      if (!match) {
        console.warn(`⚠️ 주차 정보 파싱 실패: ${weekStr}`);
        continue;
      }

      const [, month, week, startDate, endDate] = match;
      const title = `2025년 ${month}월 ${week}주차`;

      weeklyData.push({
        title,
        start_date: startDate,
        end_date: endDate,
        kakao: {
          stage_1_count: parseInt(row[1]) || 0,
          stage_2_count: parseInt(row[2]) || 0,
          stage_1_cost: parseInt(row[3]) || 0,
          stage_2_cost: parseInt(row[4]) || 0,
          total_spend: parseInt(row[5]) || 0,
        },
        meta: {
          stage_1_count: parseInt(row[6]) || 0,
          stage_2_count: parseInt(row[7]) || 0,
          stage_1_cost: parseInt(row[8]) || 0,
          stage_2_cost: parseInt(row[9]) || 0,
          total_spend: parseInt(row[10]) || 0,
        }
      });
    }

    console.log(`✅ ${weeklyData.length}개 주차 데이터 파싱 완료`);

    // 3. 데이터 삽입
    console.log('\n[3] 데이터베이스 삽입...');
    let successCount = 0;
    let errorCount = 0;

    for (const week of weeklyData) {
      try {
        console.log(`\n처리 중: ${week.title} (${week.start_date} ~ ${week.end_date})`);

        // 3-1. weekly_reports 생성 또는 조회
        let { data: existingReport, error: selectError } = await supabase
          .from('weekly_reports')
          .select('id')
          .eq('start_date', week.start_date)
          .eq('end_date', week.end_date)
          .maybeSingle();

        if (selectError) throw selectError;

        let reportId;
        if (existingReport) {
          reportId = existingReport.id;
          console.log(`  ✓ 기존 주차 사용: ${reportId}`);
        } else {
          const { data: newReport, error: insertError } = await supabase
            .from('weekly_reports')
            .insert({
              title: week.title,
              start_date: week.start_date,
              end_date: week.end_date,
              status: 'draft'
            })
            .select('id')
            .single();

          if (insertError) throw insertError;
          reportId = newReport.id;
          console.log(`  ✓ 새 주차 생성: ${reportId}`);
        }

        // 3-2. 기존 마케팅 데이터 삭제
        await supabase.from('mkt_ad_overview').delete().eq('report_id', reportId);
        await supabase.from('mkt_cost_trend').delete().eq('report_id', reportId);
        await supabase.from('mkt_db_count_trend').delete().eq('report_id', reportId);

        // 3-3. 카카오, 메타 데이터 삽입
        for (const media of ['kakao', 'meta']) {
          const mediaData = week[media];
          const mediaName = media === 'kakao' ? '카카오' : '메타';

          // CPL은 엑셀에 이미 계산되어 있음 (1차 전환값, 상담 전환값)
          const stage_1_cpl = mediaData.stage_1_cost; // 이미 CPL
          const stage_2_cpl = mediaData.stage_2_cost; // 이미 CPL

          // 전환율 계산
          const conversion_rate = mediaData.stage_1_count > 0
            ? parseFloat(((mediaData.stage_2_count / mediaData.stage_1_count) * 100).toFixed(2))
            : 0;

          // mkt_ad_overview
          const { error: overviewError } = await supabase
            .from('mkt_ad_overview')
            .insert({
              report_id: reportId,
              media: mediaName,
              stage_1_name: '1차 (특강/비법서 신청)',
              stage_1_count: mediaData.stage_1_count,
              stage_1_cost_per_lead: stage_1_cpl,
              stage_2_name: '상담 신청',
              stage_2_count: mediaData.stage_2_count,
              stage_2_conversion_rate: conversion_rate,
              stage_2_cost_per_lead: stage_2_cpl,
              total_spend: mediaData.total_spend,
            });

          if (overviewError) throw overviewError;

          // mkt_cost_trend
          const { error: costError } = await supabase
            .from('mkt_cost_trend')
            .insert({
              report_id: reportId,
              media: mediaName,
              stage_1_cost: mediaData.stage_1_cost,
              stage_2_cost: mediaData.stage_2_cost,
            });

          if (costError) throw costError;

          // mkt_db_count_trend
          const { error: countError } = await supabase
            .from('mkt_db_count_trend')
            .insert({
              report_id: reportId,
              media: mediaName,
              stage_1_count: mediaData.stage_1_count,
              stage_2_count: mediaData.stage_2_count,
            });

          if (countError) throw countError;
        }

        console.log(`  ✅ ${week.title} 완료`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ ${week.title} 실패:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ 성공: ${successCount}개 주차`);
    console.log(`❌ 실패: ${errorCount}개 주차`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

importMarketingData();

