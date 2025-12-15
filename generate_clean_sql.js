/**
 * 깨끗한 SQL만 추출
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateCleanSQL() {
  console.log('Generating clean SQL...\n');

  // 1. 모든 주차 조회
  const { data: allWeeks } = await supabase
    .from('weekly_reports')
    .select('*')
    .order('start_date', { ascending: true });

  // 2. report_id가 NULL인 거래 조회
  const { data: nullTx } = await supabase
    .from('sales_transactions')
    .select('*')
    .is('report_id', null);

  console.log(`Matching ${nullTx.length} transactions...\n`);

  // 3. 매칭
  const updates = [];
  for (const tx of nullTx) {
    const paymentDate = tx.payment_date;
    if (!paymentDate) continue;

    const matchedWeek = allWeeks.find(week => 
      paymentDate >= week.start_date && paymentDate <= week.end_date
    );

    if (matchedWeek) {
      updates.push({
        id: tx.id,
        report_id: matchedWeek.id,
        week_title: matchedWeek.title
      });
    }
  }

  console.log(`Matched: ${updates.length} transactions\n`);

  // 4. SQL 생성
  let sql = `-- ========================================
-- report_id Auto-Matching Update
-- Total: ${updates.length} transactions
-- ========================================

`;

  // 주차별로 그룹핑
  const byWeek = new Map();
  updates.forEach(u => {
    if (!byWeek.has(u.report_id)) {
      byWeek.set(u.report_id, []);
    }
    byWeek.get(u.report_id).push(u);
  });

  // 주차별 UPDATE 쿼리
  for (const [reportId, txList] of byWeek.entries()) {
    const weekTitle = txList[0].week_title;
    
    sql += `\n-- ${weekTitle} (${txList.length} transactions)\n`;
    sql += `UPDATE sales_transactions\n`;
    sql += `SET report_id = '${reportId}'\n`;
    sql += `WHERE id IN (\n`;
    
    txList.forEach((tx, idx) => {
      sql += `  '${tx.id}'`;
      if (idx < txList.length - 1) sql += ',';
      sql += '\n';
    });
    
    sql += `);\n`;
  }

  sql += `\n-- ========================================
-- Verification Query
-- ========================================
-- SELECT COUNT(*) FROM sales_transactions WHERE report_id IS NULL;
`;

  // 5. 파일 저장
  fs.writeFileSync('report_id_update.sql', sql, 'utf-8');
  console.log('✅ Generated: report_id_update.sql');
  console.log(`   ${updates.length} transactions matched`);
  console.log(`   ${byWeek.size} weeks\n`);
}

generateCleanSQL().catch(console.error);

