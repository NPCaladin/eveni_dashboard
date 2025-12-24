-- 🔬 근본 원인 검증 SQL (강화 버전)
-- 성공 확률: 95% → 98%

-- ========================================
-- Step 0: 사전 점검
-- ========================================
SELECT 
  '🏥 Step 0: 사전 점검' as check_name,
  (SELECT COUNT(*) FROM sales_transactions) as 전체거래건수,
  (SELECT COUNT(*) FROM weekly_reports) as 전체주차보고서수,
  (SELECT COUNT(*) FROM sales_transactions 
   WHERE payment_date >= '2025-12-15' AND payment_date <= '2025-12-21') as 해당기간거래건수;

-- ========================================
-- Step 1: 12월 3주차 weekly_report 확인
-- ========================================
SELECT 
  '📋 Step 1: 12월 3주차 보고서 확인' as check_name,
  id as report_id,
  title,
  start_date,
  end_date,
  status,
  created_at,
  updated_at,
  CASE 
    WHEN start_date = '2025-12-15' AND end_date = '2025-12-21' 
    THEN '✅ 정확한 주차'
    ELSE '⚠️ 날짜 불일치'
  END as 검증결과
FROM weekly_reports
WHERE (start_date = '2025-12-15' AND end_date = '2025-12-21')
   OR title LIKE '%2025%12월%3주차%'
ORDER BY created_at DESC;

-- 결과가 0건이면 문제!
-- 결과가 2건 이상이면 중복 문제!

-- ========================================
-- Step 2: report_id별 데이터 현황
-- ========================================
SELECT 
  '📊 Step 2: report_id별 데이터 현황' as check_name,
  report_id,
  COUNT(*) as 거래건수,
  SUM(CASE WHEN status = '결' THEN payment_amount ELSE 0 END) as 결제금액합계,
  SUM(CASE WHEN status = '환' THEN refund_amount ELSE 0 END) as 환불금액합계,
  MIN(payment_date) as 최소날짜,
  MAX(payment_date) as 최대날짜,
  MIN(created_at) as 최초입력시각,
  MAX(created_at) as 최근입력시각,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ 정확한 건수'
    WHEN COUNT(*) > 4 THEN '⚠️ 데이터 과다 (중복?)'
    ELSE '⚠️ 데이터 부족'
  END as 상태
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
GROUP BY report_id
ORDER BY 최근입력시각 DESC;

-- 기대: 1개의 report_id, 4건, 16,521,200원

-- ========================================
-- Step 3: 중복 데이터 상세 확인
-- ========================================
SELECT 
  '🔍 Step 3: 중복 데이터 상세' as check_name,
  payment_date,
  buyer,
  product_name,
  payment_amount,
  status,
  COUNT(*) as 중복횟수,
  STRING_AGG(CAST(id AS TEXT), ' | ' ORDER BY created_at DESC) as 중복ID목록_최신순,
  STRING_AGG(CAST(report_id AS TEXT), ' | ' ORDER BY created_at DESC) as report_id목록,
  MIN(created_at) as 최초입력,
  MAX(created_at) as 최근입력,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as 입력간격_초,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ 정상'
    WHEN COUNT(*) = 2 THEN '⚠️ 2중 중복'
    ELSE '❌ 다중 중복!'
  END as 중복상태
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
  AND status = '결'
GROUP BY payment_date, buyer, product_name, payment_amount, status
ORDER BY 중복횟수 DESC, payment_date;

-- 중복횟수 = 1이면 정상
-- 중복횟수 > 1이면 중복 데이터 존재!

-- ========================================
-- Step 4: 환불 데이터 확인
-- ========================================
SELECT 
  '💰 Step 4: 환불 데이터 확인' as check_name,
  COUNT(*) as 환불건수,
  SUM(refund_amount) as 환불금액합계,
  STRING_AGG(buyer, ', ') as 환불자목록
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
  AND status = '환';

-- 기대: 0건 (엑셀에 환불 없음)

-- ========================================
-- Step 5: 개별 거래 목록 (상세)
-- ========================================
SELECT 
  '📝 Step 5: 개별 거래 상세' as check_name,
  id,
  report_id,
  payment_date,
  buyer,
  seller,
  product_name,
  payment_amount,
  status,
  created_at,
  CASE 
    WHEN buyer = '김태형83' AND payment_amount = 7744000 THEN '✅ 1번 거래'
    WHEN buyer = '박민진91' AND payment_amount = 4772000 THEN '✅ 2번 거래'
    WHEN buyer = '이해니78' AND payment_amount = 2789000 THEN '✅ 3번 거래 (재)'
    WHEN buyer = '류은우29' AND payment_amount = 1216200 THEN '✅ 4번 거래 (프)'
    ELSE '⚠️ 미확인 거래'
  END as 거래검증
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
  AND status = '결'
ORDER BY payment_date, created_at;

-- 기대: 4건, 각각 엑셀 데이터와 일치

-- ========================================
-- Step 6: 대시보드 현재 조회 시뮬레이션
-- ========================================
-- 대시보드가 현재 사용하는 방식 (날짜 범위)
WITH dashboard_current AS (
  SELECT *
  FROM sales_transactions
  WHERE payment_date >= '2025-12-15'
    AND payment_date <= '2025-12-21'
    AND status = '결'
)
SELECT 
  '🖥️ Step 6: 대시보드 현재 조회' as check_name,
  COUNT(*) as 조회건수,
  SUM(payment_amount) as 조회금액,
  CASE 
    WHEN COUNT(*) = 4 AND SUM(payment_amount) = 16521200 THEN '✅ 정상'
    WHEN COUNT(*) > 4 THEN '❌ 데이터 과다 (중복/혼재)'
    ELSE '⚠️ 데이터 부족'
  END as 상태,
  '날짜 범위 조회' as 조회방식
FROM dashboard_current;

-- ========================================
-- Step 7: 대시보드 수정 후 조회 시뮬레이션
-- ========================================
-- 대시보드가 사용해야 할 방식 (report_id)
WITH correct_report AS (
  SELECT id as report_id
  FROM weekly_reports
  WHERE start_date = '2025-12-15'
    AND end_date = '2025-12-21'
  LIMIT 1
),
dashboard_fixed AS (
  SELECT st.*
  FROM sales_transactions st
  INNER JOIN correct_report cr ON st.report_id = cr.report_id
  WHERE st.status = '결'
)
SELECT 
  '🖥️ Step 7: 대시보드 수정 후 조회' as check_name,
  COUNT(*) as 조회건수,
  SUM(payment_amount) as 조회금액,
  CASE 
    WHEN COUNT(*) = 4 AND SUM(payment_amount) = 16521200 THEN '✅ 정상'
    ELSE '⚠️ 여전히 문제'
  END as 상태,
  'report_id 조회' as 조회방식
FROM dashboard_fixed;

-- ========================================
-- Step 8: 비교 분석
-- ========================================
WITH current_method AS (
  SELECT COUNT(*) as cnt, SUM(payment_amount) as amt
  FROM sales_transactions
  WHERE payment_date >= '2025-12-15'
    AND payment_date <= '2025-12-21'
    AND status = '결'
),
fixed_method AS (
  SELECT COUNT(*) as cnt, SUM(payment_amount) as amt
  FROM sales_transactions st
  WHERE st.report_id = (
    SELECT id FROM weekly_reports 
    WHERE start_date = '2025-12-15' AND end_date = '2025-12-21' 
    LIMIT 1
  )
  AND st.status = '결'
)
SELECT 
  '📊 Step 8: 조회 방식 비교' as check_name,
  cm.cnt as 현재방식_건수,
  cm.amt as 현재방식_금액,
  fm.cnt as 수정후방식_건수,
  fm.amt as 수정후방식_금액,
  (cm.cnt - fm.cnt) as 건수차이,
  (cm.amt - fm.amt) as 금액차이,
  CASE 
    WHEN cm.cnt = fm.cnt AND cm.amt = fm.amt THEN '✅ 동일 (중복 없음)'
    WHEN cm.cnt > fm.cnt THEN '⚠️ 현재 방식이 더 많이 조회 (중복/혼재)'
    ELSE '⚠️ 예상치 못한 상황'
  END as 진단
FROM current_method cm, fixed_method fm;

-- ========================================
-- Step 9: 최종 요약 및 권장 사항
-- ========================================
WITH summary AS (
  SELECT 
    COUNT(*) as total_count,
    COUNT(DISTINCT (payment_date || buyer || product_name || status)) as unique_count,
    COUNT(DISTINCT report_id) as report_id_count,
    SUM(CASE WHEN status = '결' THEN payment_amount ELSE 0 END) as total_payment,
    (SELECT COUNT(*) FROM weekly_reports 
     WHERE start_date = '2025-12-15' AND end_date = '2025-12-21') as weekly_report_count
  FROM sales_transactions
  WHERE payment_date >= '2025-12-15'
    AND payment_date <= '2025-12-21'
)
SELECT 
  '🎯 Step 9: 최종 요약 및 권장' as check_name,
  total_count as 총건수,
  unique_count as 유니크건수,
  (total_count - unique_count) as 중복건수,
  report_id_count as 연관된_report_id_개수,
  total_payment as 총결제금액,
  weekly_report_count as 주차보고서개수,
  CASE 
    WHEN total_count = 4 AND unique_count = 4 AND report_id_count = 1 AND weekly_report_count = 1 
    THEN '✅ 완벽! 코드 수정만 하면 됨'
    WHEN total_count > unique_count 
    THEN '⚠️ 중복 데이터 있음 → cleanup_duplicates_safe.sql 실행 필요'
    WHEN report_id_count > 1 
    THEN '⚠️ 여러 report_id 혼재 → report_id 통합 필요'
    WHEN weekly_report_count = 0 
    THEN '❌ weekly_report 없음 → 먼저 생성 필요'
    WHEN weekly_report_count > 1 
    THEN '❌ weekly_report 중복 → 정리 필요'
    ELSE '⚠️ 추가 진단 필요'
  END as 권장사항
FROM summary;

-- ========================================
-- 기대 결과 (12월 3주차 정상 상태)
-- ========================================
-- Step 1: 1개의 report, ✅ 정확한 주차
-- Step 2: 1개의 report_id, 4건, 16,521,200원, ✅ 정확한 건수
-- Step 3: 모두 중복횟수 = 1, ✅ 정상
-- Step 4: 0건 환불
-- Step 5: 4건, 모두 ✅ 거래 매칭
-- Step 6: 조회건수 = ?, 상태에 따라 다름
-- Step 7: 조회건수 = 4, ✅ 정상
-- Step 8: 건수차이/금액차이 확인
-- Step 9: 권장사항에 따라 다음 단계 결정






