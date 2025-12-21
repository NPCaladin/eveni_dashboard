-- 🧹 중복 데이터 정리 SQL
-- 실행 전 반드시 verify_root_cause.sql로 중복 데이터 확인!

-- ========================================
-- Step 1: 중복 데이터 확인 (실행 필수!)
-- ========================================
SELECT 
  '🔍 중복 데이터 확인' as status,
  payment_date,
  buyer,
  product_name,
  status,
  COUNT(*) as 중복횟수,
  STRING_AGG(CAST(id AS TEXT), ', ' ORDER BY created_at DESC) as id_목록_최신순,
  MIN(created_at) as 최초입력,
  MAX(created_at) as 최근입력
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
GROUP BY payment_date, buyer, product_name, status
HAVING COUNT(*) > 1
ORDER BY payment_date, buyer;

-- ========================================
-- Step 2: 삭제할 ID 미리보기 (안전 확인!)
-- ========================================
-- 최신 것(created_at이 가장 늦은 것)만 남기고 나머지 삭제 예정
WITH ranked_transactions AS (
  SELECT 
    id,
    payment_date,
    buyer,
    product_name,
    status,
    payment_amount,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY payment_date, buyer, product_name, status
      ORDER BY created_at DESC
    ) as rn
  FROM sales_transactions
  WHERE payment_date >= '2025-12-15'
    AND payment_date <= '2025-12-21'
)
SELECT 
  '⚠️ 삭제 예정 목록' as status,
  id,
  payment_date,
  buyer,
  product_name,
  status,
  payment_amount,
  created_at
FROM ranked_transactions
WHERE rn > 1
ORDER BY payment_date, buyer;

-- ========================================
-- Step 3: 실제 삭제 (신중하게!)
-- ========================================
-- 위 Step 2 결과를 확인한 후에만 실행!
-- 최신 것만 남기고 오래된 중복 데이터 삭제

WITH ranked_transactions AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY payment_date, buyer, product_name, status
      ORDER BY created_at DESC
    ) as rn
  FROM sales_transactions
  WHERE payment_date >= '2025-12-15'
    AND payment_date <= '2025-12-21'
)
DELETE FROM sales_transactions
WHERE id IN (
  SELECT id 
  FROM ranked_transactions 
  WHERE rn > 1
);

-- 실행 후 결과 확인: "DELETE X" (X는 삭제된 행 수)

-- ========================================
-- Step 4: 정리 후 검증
-- ========================================
SELECT 
  '✅ 정리 완료 - 최종 확인' as status,
  COUNT(*) as 총거래건수,
  SUM(CASE WHEN status = '결' THEN 1 ELSE 0 END) as 결제건수,
  SUM(CASE WHEN status = '환' THEN 1 ELSE 0 END) as 환불건수,
  SUM(CASE WHEN status = '결' THEN payment_amount ELSE 0 END) as 총결제금액,
  COUNT(DISTINCT (payment_date || buyer || product_name || status)) as 유니크거래,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT (payment_date || buyer || product_name || status))
    THEN '✅ 중복 없음'
    ELSE '❌ 중복 여전히 존재!'
  END as 중복여부
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21';

-- ========================================
-- Step 5: 개별 거래 확인
-- ========================================
SELECT 
  '✅ 개별 거래 목록' as status,
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
ORDER BY payment_date, buyer;

-- ========================================
-- (선택) 전체 DB에서 중복 제거
-- ========================================
-- 12월 3주차뿐만 아니라 전체 DB의 중복도 제거하려면:

/*
WITH ranked_all AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY payment_date, buyer, product_name, status
      ORDER BY created_at DESC
    ) as rn
  FROM sales_transactions
)
DELETE FROM sales_transactions
WHERE id IN (
  SELECT id 
  FROM ranked_all 
  WHERE rn > 1
);
*/

-- ========================================
-- 기대 결과 (12월 3주차)
-- ========================================
-- 총거래건수: 4건
-- 결제건수: 4건
-- 총결제금액: 16,521,200원
-- 중복여부: ✅ 중복 없음



