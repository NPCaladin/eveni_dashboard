-- 🔬 근본 원인 검증 SQL

-- 1. 12월 3주차 날짜 범위의 모든 데이터 확인 (report_id별로 그룹화)
SELECT 
  'Step 1: 날짜 범위별 데이터 현황' as check_name,
  report_id,
  COUNT(*) as 거래건수,
  SUM(CASE WHEN status = '결' THEN payment_amount ELSE 0 END) as 결제금액_합계,
  SUM(CASE WHEN status = '환' THEN refund_amount ELSE 0 END) as 환불금액_합계,
  MIN(payment_date) as 최소날짜,
  MAX(payment_date) as 최대날짜,
  MIN(created_at) as 최초입력시각,
  MAX(created_at) as 최근입력시각
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
GROUP BY report_id
ORDER BY created_at DESC;

-- 2. 중복 데이터 확인 (같은 날짜, 구매자, 상품이 여러 번 입력된 경우)
SELECT 
  'Step 2: 중복 데이터 확인' as check_name,
  payment_date,
  buyer,
  product_name,
  payment_amount,
  COUNT(*) as 중복횟수,
  STRING_AGG(CAST(id AS TEXT), ', ') as 중복ID목록
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
  AND status = '결'
GROUP BY payment_date, buyer, product_name, payment_amount
HAVING COUNT(*) > 1;

-- 3. 12월 3주차 weekly_reports 확인
SELECT 
  'Step 3: 12월 3주차 보고서 정보' as check_name,
  id as report_id,
  title,
  start_date,
  end_date,
  created_at
FROM weekly_reports
WHERE start_date = '2025-12-15'
  AND end_date = '2025-12-21';

-- 4. 대시보드가 조회할 데이터 시뮬레이션 (현재 로직)
SELECT 
  'Step 4: 대시보드 현재 조회 결과 (날짜 범위)' as check_name,
  payment_date,
  buyer,
  product_name,
  payment_amount,
  status,
  report_id,
  created_at
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
  AND status = '결'
ORDER BY payment_date, created_at;

-- 5. 대시보드가 조회해야 할 데이터 (수정 후 로직)
-- 먼저 올바른 report_id를 확인
WITH correct_report AS (
  SELECT id as report_id
  FROM weekly_reports
  WHERE start_date = '2025-12-15'
    AND end_date = '2025-12-21'
  LIMIT 1
)
SELECT 
  'Step 5: 대시보드 수정 후 조회 결과 (report_id)' as check_name,
  payment_date,
  buyer,
  product_name,
  payment_amount,
  status,
  st.report_id,
  st.created_at
FROM sales_transactions st
INNER JOIN correct_report cr ON st.report_id = cr.report_id
WHERE status = '결'
ORDER BY payment_date, created_at;

-- 6. 전체 요약
SELECT 
  'Step 6: 전체 요약' as check_name,
  COUNT(*) as 총건수,
  SUM(CASE WHEN status = '결' THEN 1 ELSE 0 END) as 결제건수,
  SUM(CASE WHEN status = '환' THEN 1 ELSE 0 END) as 환불건수,
  SUM(CASE WHEN status = '결' THEN payment_amount ELSE 0 END) as 총결제금액,
  SUM(CASE WHEN status = '환' THEN refund_amount ELSE 0 END) as 총환불금액,
  COUNT(DISTINCT report_id) as 연관된_report_id_개수
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21';






