/**
 * 12월 1주차 (2025-12-01 ~ 2025-12-07) 실매출 계산
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function calculateWeek1Revenue() {
  console.log('💰 12월 1주차 실매출 계산\n');
  console.log('='.repeat(100));

  // 12월 1주차 보고서 조회
  const { data: report } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('start_date', '2025-12-01')
    .single();

  if (!report) {
    console.log('\n❌ 12월 1주차 보고서를 찾을 수 없습니다.\n');
    return;
  }

  console.log(`\n📅 주차: ${report.title}`);
  console.log(`   기간: ${report.start_date} ~ ${report.end_date}`);
  console.log(`   report_id: ${report.id}\n`);

  console.log('='.repeat(100));

  // 해당 주차의 모든 거래 조회
  const { data: transactions } = await supabase
    .from('sales_transactions')
    .select('*')
    .eq('report_id', report.id)
    .order('payment_date', { ascending: true });

  if (!transactions || transactions.length === 0) {
    console.log('\n❌ 해당 주차에 거래 데이터가 없습니다.\n');
    return;
  }

  console.log(`\n📊 총 거래: ${transactions.length}건\n`);

  // 결제 거래만 필터링
  const payments = transactions.filter(tx => tx.status === '결');
  const refunds = transactions.filter(tx => tx.status === '환' || tx.status === '미');

  console.log(`  결제(결): ${payments.length}건`);
  console.log(`  환불(환/미): ${refunds.length}건\n`);

  console.log('='.repeat(100));

  // 실매출 계산 (모든 결제 거래의 payment_amount 합산)
  let totalRevenue = 0;
  let countRevenue = 0; // payment_count_refined로 카운트

  payments.forEach(tx => {
    const amount = tx.payment_amount || 0;
    const count = tx.payment_count_refined || 0;
    
    totalRevenue += amount;
    countRevenue += count;
  });

  console.log('\n💰 실매출 계산:\n');
  console.log(`  결제 건수 (payment_count_refined): ${countRevenue}건`);
  console.log(`  실매출 (payment_amount 합계): ${totalRevenue.toLocaleString()}원`);
  console.log(`  실매출 (억 단위): ${(totalRevenue / 100000000).toFixed(2)}억`);
  console.log(`  실매출 (만원 단위): ${(totalRevenue / 10000).toLocaleString()}만원\n`);

  // 환불 계산
  let totalRefund = 0;
  refunds.forEach(tx => {
    const amount = tx.refund_amount || 0;
    totalRefund += amount;
  });

  console.log('💸 환불 계산:\n');
  console.log(`  환불 건수: ${refunds.length}건`);
  console.log(`  환불 금액 (refund_amount 합계): ${totalRefund.toLocaleString()}원`);
  console.log(`  환불 금액 (만원 단위): ${(totalRefund / 10000).toLocaleString()}만원\n`);

  // 순매출 계산
  const netRevenue = totalRevenue - totalRefund;
  console.log('📈 순매출 계산:\n');
  console.log(`  순매출: ${netRevenue.toLocaleString()}원`);
  console.log(`  순매출 (만원 단위): ${(netRevenue / 10000).toLocaleString()}만원\n`);

  console.log('='.repeat(100));

  // 상위 거래 내역 출력 (결제)
  console.log('\n📝 결제 거래 상위 10건:\n');
  const topPayments = [...payments]
    .sort((a, b) => (b.payment_amount || 0) - (a.payment_amount || 0))
    .slice(0, 10);

  topPayments.forEach((tx, idx) => {
    console.log(`  ${idx + 1}. ${tx.buyer || '(구매자 없음)'}`);
    console.log(`     결제일: ${tx.payment_date}`);
    console.log(`     금액: ${(tx.payment_amount || 0).toLocaleString()}원`);
    console.log(`     상품: ${tx.product_type || '미분류'}`);
    console.log('');
  });

  if (refunds.length > 0) {
    console.log('='.repeat(100));
    console.log('\n💸 환불 거래 내역:\n');
    
    refunds.forEach((tx, idx) => {
      console.log(`  ${idx + 1}. ${tx.buyer || '(구매자 없음)'}`);
      console.log(`     환불일: ${tx.refund_date || tx.payment_date}`);
      console.log(`     금액: ${(tx.refund_amount || 0).toLocaleString()}원`);
      console.log(`     사유: ${tx.refund_reason || '-'}`);
      console.log('');
    });
  }

  console.log('='.repeat(100));
}

calculateWeek1Revenue().catch(console.error);

