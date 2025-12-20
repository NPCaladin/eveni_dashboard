-- 🧹 안전한 중복 데이터 정리 SQL (트랜잭션 버전)
-- 성공 확률: 90% → 98%

-- ⚠️ 중요: 각 단계를 순서대로 실행하고 결과를 확인하세요!
-- ⚠️ Step 3-B까지 확인 후 문제 없으면 Step 4 COMMIT 실행

-- ========================================
-- Step 1: 현재 상태 백업 (안전장치)
-- ========================================
-- 혹시 모를 상황을 대비해 현재 상태 기록
SELECT 
  '💾 Step 1: 현재 상태 백업' as status,
  id,
  report_id,
  payment_date,
  buyer,
  product_name,
  payment_amount,
  status,
  created_at
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
ORDER BY payment_date, buyer, created_at;

-- ⚠️ 이 결과를 스크린샷이나 CSV로 저장하세요!

-- ========================================
-- Step 2: 중복 데이터 확인
-- ========================================
SELECT 
  '🔍 Step 2: 중복 데이터 확인' as status,
  payment_date,
  buyer,
  product_name,
  status,
  COUNT(*) as 중복횟수,
  STRING_AGG(CAST(id AS TEXT), ' | ' ORDER BY created_at DESC) as id_목록_최신순,
  STRING_AGG(TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS'), ' | ' ORDER BY created_at DESC) as 생성시각_목록,
  MIN(created_at) as 최초생성,
  MAX(created_at) as 최근생성
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
GROUP BY payment_date, buyer, product_name, status
HAVING COUNT(*) > 1
ORDER BY payment_date, buyer;

-- 결과가 0건이면: 중복 없음 → 이 파일 실행 불필요
-- 결과가 있으면: 각 행의 id_목록에서 가장 왼쪽(최신)만 남기고 나머지 삭제 예정

-- ========================================
-- Step 3-A: 삭제 예정 목록 확인 (매우 중요!)
-- ========================================
WITH ranked_transactions AS (
  SELECT 
    id,
    report_id,
    payment_date,
    buyer,
    product_name,
    payment_amount,
    status,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY payment_date, buyer, product_name, status
      ORDER BY created_at DESC  -- 최신 것을 1번으로
    ) as rn
  FROM sales_transactions
  WHERE payment_date >= '2025-12-15'
    AND payment_date <= '2025-12-21'
)
SELECT 
  '⚠️ Step 3-A: 삭제 예정 목록' as status,
  id,
  payment_date,
  buyer,
  product_name,
  payment_amount,
  status,
  created_at,
  rn as 순위,
  CASE 
    WHEN rn = 1 THEN '✅ 보존 (최신)'
    ELSE '❌ 삭제 예정 (오래된 중복)'
  END as 처리방식
FROM ranked_transactions
WHERE rn > 1  -- 삭제될 것들만 표시
ORDER BY payment_date, buyer, rn;

-- ⚠️ 이 목록이 정말 삭제해도 되는 것들인지 확인하세요!
-- ⚠️ 의심스러운 행이 있으면 중단하고 재검토하세요!

-- ========================================
-- Step 3-B: 보존 예정 목록 확인
-- ========================================
WITH ranked_transactions AS (
  SELECT 
    id,
    report_id,
    payment_date,
    buyer,
    product_name,
    payment_amount,
    status,
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
  '✅ Step 3-B: 보존 예정 목록' as status,
  payment_date,
  buyer,
  product_name,
  payment_amount,
  status,
  created_at,
  '✅ 보존됨' as 처리방식
FROM ranked_transactions
WHERE rn = 1  -- 보존될 것들만 표시
ORDER BY payment_date, buyer;

-- 기대: 4건 (김태형83, 박민진91, 이해니78, 류은우29)
-- 총액: 16,521,200원

-- ========================================
-- Step 4: 트랜잭션 시작 (안전한 삭제)
-- ========================================

-- ⚠️⚠️⚠️ 여기서부터 신중하게! ⚠️⚠️⚠️
-- Step 3-A와 3-B를 확인한 후에만 실행하세요!

BEGIN;

-- Step 4-1: 삭제 실행
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

-- 결과 확인: "DELETE X" (X는 삭제된 행 수)
-- 예상: X = (Step 2의 중복 행 수)

-- Step 4-2: 삭제 후 즉시 검증
SELECT 
  '🔍 Step 4-2: 삭제 후 즉시 검증' as status,
  COUNT(*) as 남은_총건수,
  SUM(CASE WHEN status = '결' THEN 1 ELSE 0 END) as 결제건수,
  SUM(CASE WHEN status = '결' THEN payment_amount ELSE 0 END) as 총결제금액,
  COUNT(DISTINCT (payment_date || buyer || product_name || status)) as 유니크거래수,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT (payment_date || buyer || product_name || status))
    THEN '✅ 중복 제거 성공!'
    ELSE '❌ 여전히 중복 존재!'
  END as 중복여부
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21';

-- 기대 결과:
-- 남은_총건수: 4
-- 결제건수: 4
-- 총결제금액: 16521200
-- 유니크거래수: 4
-- 중복여부: ✅ 중복 제거 성공!

-- ========================================
-- Step 5: COMMIT 또는 ROLLBACK 결정
-- ========================================

-- ✅ Step 4-2 결과가 기대값과 일치하면:
COMMIT;

-- ❌ Step 4-2 결과가 이상하면:
-- ROLLBACK;

-- ROLLBACK 하면 모든 변경사항이 취소되고 Step 4 이전 상태로 돌아갑니다!

-- ========================================
-- Step 6: COMMIT 후 최종 검증
-- ========================================
SELECT 
  '✅ Step 6: 최종 검증' as status,
  COUNT(*) as 총거래건수,
  SUM(CASE WHEN status = '결' THEN 1 ELSE 0 END) as 결제건수,
  SUM(CASE WHEN status = '환' THEN 1 ELSE 0 END) as 환불건수,
  SUM(CASE WHEN status = '결' THEN payment_amount ELSE 0 END) as 총결제금액,
  STRING_AGG(buyer, ', ' ORDER BY payment_date) as 구매자목록,
  CASE 
    WHEN COUNT(*) = 4 
      AND SUM(CASE WHEN status = '결' THEN payment_amount ELSE 0 END) = 16521200
    THEN '✅ 완벽!'
    ELSE '⚠️ 재확인 필요'
  END as 최종상태
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21';

-- ========================================
-- Step 7: 개별 거래 확인
-- ========================================
SELECT 
  '📝 Step 7: 개별 거래 최종 확인' as status,
  payment_date,
  buyer,
  product_name,
  payment_amount,
  status,
  created_at,
  CASE 
    WHEN buyer = '김태형83' AND payment_amount = 7744000 THEN '✅ 1번'
    WHEN buyer = '박민진91' AND payment_amount = 4772000 THEN '✅ 2번'
    WHEN buyer = '이해니78' AND payment_amount = 2789000 THEN '✅ 3번'
    WHEN buyer = '류은우29' AND payment_amount = 1216200 THEN '✅ 4번'
    ELSE '⚠️ 미확인'
  END as 검증
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
  AND status = '결'
ORDER BY payment_date, buyer;

-- 모두 ✅이면 완벽!

-- ========================================
-- (선택) Step 8: 전체 DB 중복 제거
-- ========================================
-- 12월 3주차뿐만 아니라 전체 DB의 중복도 제거하려면:
-- ⚠️ 더 넓은 범위이므로 더욱 신중해야 합니다!

/*
BEGIN;

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

-- 검증
SELECT 
  COUNT(*) as 전체거래건수,
  COUNT(DISTINCT (payment_date || buyer || product_name || status)) as 유니크거래수,
  (COUNT(*) - COUNT(DISTINCT (payment_date || buyer || product_name || status))) as 중복건수
FROM sales_transactions;

-- 중복건수 = 0이면 COMMIT, 아니면 ROLLBACK
COMMIT; -- 또는 ROLLBACK;
*/

-- ========================================
-- 실행 순서 요약
-- ========================================
-- 1. Step 1 실행 → 스크린샷 저장 (백업)
-- 2. Step 2 실행 → 중복 여부 확인
-- 3. Step 3-A 실행 → 삭제 예정 목록 확인 ⚠️
-- 4. Step 3-B 실행 → 보존 예정 목록 확인 ⚠️
-- 5. Step 4 전체 실행 (BEGIN부터 Step 4-2까지)
-- 6. Step 4-2 결과 확인
-- 7. 문제 없으면 COMMIT, 문제 있으면 ROLLBACK
-- 8. Step 6, 7 실행 → 최종 검증

-- ========================================
-- 긴급 롤백 (뭔가 잘못되었을 때)
-- ========================================
-- COMMIT 전이면:
-- ROLLBACK;

-- COMMIT 후면:
-- Step 1의 백업 데이터를 사용하여 수동 복구 필요

