-- ============================================================================
-- 교육사업본부 매출 데이터 스키마 V2 (정제 데이터 기반)
-- 작성일: 2025-12-13
-- 목적: 정제된 엑셀 데이터(2024-2025_sales_data_cleaned.xlsx)를 위한 테이블
-- ============================================================================

-- 기존 테이블 백업 (선택사항)
-- CREATE TABLE sales_transactions_backup AS SELECT * FROM sales_transactions;

-- 기존 테이블 삭제 (주의: 데이터 손실)
DROP TABLE IF EXISTS sales_transactions CASCADE;

-- 새 sales_transactions 테이블 생성
CREATE TABLE sales_transactions (
  -- 기본 정보
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 년월 정보
  ym VARCHAR(6) NOT NULL,                    -- 2401 = 2024년 1월
  payment_year INT NOT NULL,                 -- 2024, 2025
  payment_month INT NOT NULL,                -- 1~12
  payment_yearmonth VARCHAR(7) NOT NULL,     -- 2024-01
  payment_date DATE NOT NULL,                -- 결제일
  
  -- 판매자 정보
  seller VARCHAR(10) NOT NULL,               -- 샐, 써, 에 등
  seller_type VARCHAR(20) NOT NULL,          -- 세일즈본부/운영팀/퇴사자
  
  -- 구매자 정보
  buyer VARCHAR(100) NOT NULL,               -- 구매자명
  
  -- 판매 구분
  category_code INT,                         -- 구분코드 (10, 11, 12, 13, 14 등)
  sales_type VARCHAR(30) NOT NULL,           -- 신규/분할/완납/재결제:추가/재결제:변경
  
  -- 상품 정보
  product_code INT,                          -- 매출코드 (120, 126, 220, 226 등)
  product_name VARCHAR(100),                 -- 판매상품 (일반 26회, 1타 32회 등)
  product_type VARCHAR(30) NOT NULL,         -- 일반/1타/게임톤/합격보장반/GM/그룹반/첫스터디/기타
  weeks INT,                                 -- 주차 (20, 26, 32, 40 등)
  
  -- 금액 정보
  list_price DECIMAL(12, 0),                 -- 상품정가
  order_amount DECIMAL(12, 0) NOT NULL,      -- 주문금액
  points DECIMAL(12, 0) DEFAULT 0,           -- 포인트 (0 = 미사용)
  coupon DECIMAL(12, 0) DEFAULT 0,           -- 쿠폰 할인 (0 = 미사용)
  payment_amount DECIMAL(12, 0) NOT NULL,    -- 결제매출 (실제 매출)
  
  -- 상태
  status VARCHAR(5) NOT NULL,                -- 결/환/미/재/프
  quantity INT DEFAULT 1,                    -- 결제수량
  
  -- 결제건수 (핵심!)
  payment_count_original INT DEFAULT 1,      -- 원본 결제건수 (참고용)
  payment_count_refined INT DEFAULT 1,       -- 정제된 결제건수 (집계 시 사용!)
  is_count_valid BOOLEAN GENERATED ALWAYS AS (payment_count_refined = 1) STORED,
  
  -- 환불 정보
  refund_date DATE,                          -- 환불일
  refund_amount DECIMAL(12, 0) DEFAULT 0,    -- 환불금액 (0 = 환불 없음)
  
  -- 최종 매출
  final_revenue DECIMAL(12, 0),              -- 마감매출 (결제매출 - 환불금액)
  
  -- 메타데이터
  created_by VARCHAR(50),                    -- 작성자
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 제약조건
  CONSTRAINT valid_payment_year CHECK (payment_year >= 2023 AND payment_year <= 2030),
  CONSTRAINT valid_payment_month CHECK (payment_month >= 1 AND payment_month <= 12),
  CONSTRAINT valid_status CHECK (status IN ('결', '환', '미', '재', '프')),
  CONSTRAINT valid_payment_count CHECK (payment_count_refined IN (0, 1))
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_sales_payment_date ON sales_transactions(payment_date);
CREATE INDEX idx_sales_payment_year ON sales_transactions(payment_year);
CREATE INDEX idx_sales_payment_yearmonth ON sales_transactions(payment_yearmonth);
CREATE INDEX idx_sales_seller ON sales_transactions(seller);
CREATE INDEX idx_sales_seller_type ON sales_transactions(seller_type);
CREATE INDEX idx_sales_product_type ON sales_transactions(product_type);
CREATE INDEX idx_sales_sales_type ON sales_transactions(sales_type);
CREATE INDEX idx_sales_status ON sales_transactions(status);
CREATE INDEX idx_sales_is_count_valid ON sales_transactions(is_count_valid);
CREATE INDEX idx_sales_buyer ON sales_transactions(buyer);

-- 복합 인덱스 (자주 사용되는 조합)
CREATE INDEX idx_sales_date_count ON sales_transactions(payment_date, is_count_valid);
CREATE INDEX idx_sales_yearmonth_count ON sales_transactions(payment_yearmonth, is_count_valid);
CREATE INDEX idx_sales_year_type ON sales_transactions(payment_year, product_type);

-- 코멘트 추가
COMMENT ON TABLE sales_transactions IS '교육사업본부 매출 트랜잭션 (정제 데이터 기반)';
COMMENT ON COLUMN sales_transactions.payment_count_refined IS '정제된 결제건수 - 집계 시 반드시 이 값이 1인 것만 사용';
COMMENT ON COLUMN sales_transactions.is_count_valid IS '집계 유효 여부 - payment_count_refined = 1일 때 true';
COMMENT ON COLUMN sales_transactions.sales_type IS '신규/분할/완납/재결제:추가/재결제:변경';
COMMENT ON COLUMN sales_transactions.product_type IS '일반/1타/게임톤/합격보장반/GM/그룹반/첫스터디/기타';

-- RLS (Row Level Security) 정책
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "sales_transactions_select_policy" ON sales_transactions
  FOR SELECT
  USING (true);

-- 인증된 사용자만 삽입 가능
CREATE POLICY "sales_transactions_insert_policy" ON sales_transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 인증된 사용자만 업데이트 가능
CREATE POLICY "sales_transactions_update_policy" ON sales_transactions
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 집계 뷰 (자주 사용하는 쿼리)
-- ============================================================================

-- 월별 매출 집계 뷰
CREATE OR REPLACE VIEW v_monthly_sales AS
SELECT 
  payment_yearmonth,
  payment_year,
  payment_month,
  COUNT(*) FILTER (WHERE is_count_valid) as 결제건수,
  SUM(payment_amount) FILTER (WHERE is_count_valid) as 총매출,
  SUM(CASE WHEN status = '환' THEN refund_amount ELSE 0 END) FILTER (WHERE is_count_valid) as 환불액,
  SUM(payment_amount) FILTER (WHERE is_count_valid) - 
    SUM(CASE WHEN status = '환' THEN refund_amount ELSE 0 END) FILTER (WHERE is_count_valid) as 순매출
FROM sales_transactions
GROUP BY payment_yearmonth, payment_year, payment_month
ORDER BY payment_yearmonth;

-- 판매자별 실적 뷰
CREATE OR REPLACE VIEW v_seller_performance AS
SELECT 
  seller,
  seller_type,
  COUNT(*) FILTER (WHERE is_count_valid) as 결제건수,
  SUM(payment_amount) FILTER (WHERE is_count_valid) as 매출,
  AVG(payment_amount) FILTER (WHERE is_count_valid) as 평균객단가
FROM sales_transactions
WHERE seller_type = '세일즈본부'
GROUP BY seller, seller_type
ORDER BY 매출 DESC;

-- 상품타입별 매출 뷰
CREATE OR REPLACE VIEW v_product_sales AS
SELECT 
  product_type,
  weeks,
  COUNT(*) FILTER (WHERE is_count_valid) as 건수,
  SUM(payment_amount) FILTER (WHERE is_count_valid) as 매출,
  AVG(payment_amount) FILTER (WHERE is_count_valid) as 평균가격
FROM sales_transactions
GROUP BY product_type, weeks
ORDER BY product_type, weeks;

-- 신규 vs 재결제 뷰
CREATE OR REPLACE VIEW v_sales_type_analysis AS
SELECT 
  CASE 
    WHEN sales_type = '신규' THEN '신규'
    WHEN sales_type LIKE '재결제%' THEN '재결제'
    ELSE '기타'
  END as 구분,
  COUNT(*) FILTER (WHERE is_count_valid) as 건수,
  SUM(payment_amount) FILTER (WHERE is_count_valid) as 매출,
  ROUND(AVG(payment_amount) FILTER (WHERE is_count_valid), 0) as 평균객단가
FROM sales_transactions
GROUP BY 구분;

-- ============================================================================
-- 샘플 쿼리
-- ============================================================================

-- 1. 월별 매출 조회
-- SELECT * FROM v_monthly_sales;

-- 2. 특정 기간 매출
-- SELECT 
--   SUM(payment_amount) as 총매출
-- FROM sales_transactions
-- WHERE payment_date BETWEEN '2025-12-01' AND '2025-12-07'
--   AND is_count_valid = true;

-- 3. 1타 vs 일반 비교
-- SELECT 
--   product_type,
--   COUNT(*) as 건수,
--   SUM(payment_amount) as 매출
-- FROM sales_transactions
-- WHERE is_count_valid = true
--   AND product_type IN ('1타', '일반')
-- GROUP BY product_type;

-- ============================================================================
-- 완료
-- ============================================================================







