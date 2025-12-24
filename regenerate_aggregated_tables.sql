-- ============================================================================
-- 집계 테이블 재생성 (새로운 sales_transactions 기반)
-- ============================================================================

-- ============================================================================
-- 1. weekly_reports 테이블 확인 및 생성
-- ============================================================================

-- weekly_reports는 기존 것을 유지하거나, 없으면 생성
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  year INT NOT NULL,
  week_number INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(start_date, end_date)
);

-- 2025년 12월 주차 데이터 삽입 (없으면)
INSERT INTO weekly_reports (title, start_date, end_date, year, week_number)
VALUES 
  ('2025년 12월 1주차', '2025-12-01', '2025-12-07', 2025, 1),
  ('2025년 12월 2주차', '2025-12-08', '2025-12-14', 2025, 2)
ON CONFLICT (start_date, end_date) DO NOTHING;

-- ============================================================================
-- 2. edu_revenue_stats 테이블 재생성
-- ============================================================================

DROP TABLE IF EXISTS edu_revenue_stats CASCADE;

CREATE TABLE edu_revenue_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES weekly_reports(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,  -- '실매출', '순매출', '환불' 등
  
  -- 주간 금액
  weekly_amt DECIMAL(12, 0) DEFAULT 0,
  
  -- 전주 금액
  prev_weekly_amt DECIMAL(12, 0) DEFAULT 0,
  
  -- 전년 동기 금액
  yoy_amt DECIMAL(12, 0) DEFAULT 0,
  
  -- 월간 누적
  monthly_cum DECIMAL(12, 0) DEFAULT 0,
  
  -- 연간 누적
  yearly_cum DECIMAL(12, 0) DEFAULT 0,
  
  -- 환불 관련 (실매출 카테고리에만)
  monthly_refund_amt DECIMAL(12, 0) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(report_id, category)
);

-- 인덱스
CREATE INDEX idx_edu_revenue_stats_report ON edu_revenue_stats(report_id);
CREATE INDEX idx_edu_revenue_stats_category ON edu_revenue_stats(category);

-- ============================================================================
-- 3. edu_product_sales 테이블 재생성
-- ============================================================================

DROP TABLE IF EXISTS edu_product_sales CASCADE;

CREATE TABLE edu_product_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES weekly_reports(id) ON DELETE CASCADE,
  
  product_group VARCHAR(20) NOT NULL,  -- '1타', '일반'
  sales_count INT DEFAULT 0,
  total_amount DECIMAL(12, 0) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(report_id, product_group)
);

-- 인덱스
CREATE INDEX idx_edu_product_sales_report ON edu_product_sales(report_id);
CREATE INDEX idx_edu_product_sales_group ON edu_product_sales(product_group);

-- ============================================================================
-- 4. 데이터 집계 및 삽입 함수
-- ============================================================================

-- edu_revenue_stats 데이터 생성 함수
CREATE OR REPLACE FUNCTION populate_edu_revenue_stats()
RETURNS void AS $$
DECLARE
  report_record RECORD;
  current_week_start DATE;
  current_week_end DATE;
  prev_week_start DATE;
  prev_week_end DATE;
  yoy_week_start DATE;
  yoy_week_end DATE;
  current_month INT;
  current_year INT;
  
  weekly_real DECIMAL(12, 0);
  weekly_net DECIMAL(12, 0);
  weekly_refund DECIMAL(12, 0);
  prev_weekly_real DECIMAL(12, 0);
  prev_weekly_net DECIMAL(12, 0);
  yoy_real DECIMAL(12, 0);
  yoy_net DECIMAL(12, 0);
  monthly_cum_real DECIMAL(12, 0);
  monthly_cum_net DECIMAL(12, 0);
  yearly_cum_real DECIMAL(12, 0);
  yearly_cum_net DECIMAL(12, 0);
  monthly_refund DECIMAL(12, 0);
BEGIN
  -- 모든 weekly_reports에 대해 반복
  FOR report_record IN SELECT * FROM weekly_reports ORDER BY start_date LOOP
    current_week_start := report_record.start_date;
    current_week_end := report_record.end_date;
    current_month := EXTRACT(MONTH FROM current_week_start);
    current_year := EXTRACT(YEAR FROM current_week_start);
    
    -- 전주 계산
    prev_week_start := current_week_start - INTERVAL '7 days';
    prev_week_end := current_week_end - INTERVAL '7 days';
    
    -- 전년 동기 계산
    yoy_week_start := current_week_start - INTERVAL '1 year';
    yoy_week_end := current_week_end - INTERVAL '1 year';
    
    -- 현재 주차 실매출
    SELECT COALESCE(SUM(payment_amount), 0) INTO weekly_real
    FROM sales_transactions
    WHERE payment_date BETWEEN current_week_start AND current_week_end
      AND is_count_valid = true;
    
    -- 현재 주차 환불
    SELECT COALESCE(SUM(refund_amount), 0) INTO weekly_refund
    FROM sales_transactions
    WHERE payment_date BETWEEN current_week_start AND current_week_end
      AND is_count_valid = true
      AND status = '환';
    
    -- 현재 주차 순매출
    weekly_net := weekly_real - weekly_refund;
    
    -- 전주 실매출
    SELECT COALESCE(SUM(payment_amount), 0) INTO prev_weekly_real
    FROM sales_transactions
    WHERE payment_date BETWEEN prev_week_start AND prev_week_end
      AND is_count_valid = true;
    
    -- 전주 순매출
    SELECT COALESCE(SUM(payment_amount - refund_amount), 0) INTO prev_weekly_net
    FROM sales_transactions
    WHERE payment_date BETWEEN prev_week_start AND prev_week_end
      AND is_count_valid = true;
    
    -- 전년 동기 실매출
    SELECT COALESCE(SUM(payment_amount), 0) INTO yoy_real
    FROM sales_transactions
    WHERE payment_date BETWEEN yoy_week_start AND yoy_week_end
      AND is_count_valid = true;
    
    -- 전년 동기 순매출
    SELECT COALESCE(SUM(payment_amount - refund_amount), 0) INTO yoy_net
    FROM sales_transactions
    WHERE payment_date BETWEEN yoy_week_start AND yoy_week_end
      AND is_count_valid = true;
    
    -- 월간 누적 실매출
    SELECT COALESCE(SUM(payment_amount), 0) INTO monthly_cum_real
    FROM sales_transactions
    WHERE EXTRACT(YEAR FROM payment_date) = current_year
      AND EXTRACT(MONTH FROM payment_date) = current_month
      AND is_count_valid = true;
    
    -- 월간 누적 순매출
    SELECT COALESCE(SUM(payment_amount - refund_amount), 0) INTO monthly_cum_net
    FROM sales_transactions
    WHERE EXTRACT(YEAR FROM payment_date) = current_year
      AND EXTRACT(MONTH FROM payment_date) = current_month
      AND is_count_valid = true;
    
    -- 연간 누적 실매출
    SELECT COALESCE(SUM(payment_amount), 0) INTO yearly_cum_real
    FROM sales_transactions
    WHERE EXTRACT(YEAR FROM payment_date) = current_year
      AND is_count_valid = true;
    
    -- 연간 누적 순매출
    SELECT COALESCE(SUM(payment_amount - refund_amount), 0) INTO yearly_cum_net
    FROM sales_transactions
    WHERE EXTRACT(YEAR FROM payment_date) = current_year
      AND is_count_valid = true;
    
    -- 월간 환불액
    SELECT COALESCE(SUM(refund_amount), 0) INTO monthly_refund
    FROM sales_transactions
    WHERE EXTRACT(YEAR FROM payment_date) = current_year
      AND EXTRACT(MONTH FROM payment_date) = current_month
      AND is_count_valid = true
      AND status = '환';
    
    -- 실매출 데이터 삽입
    INSERT INTO edu_revenue_stats (
      report_id, category, weekly_amt, prev_weekly_amt, yoy_amt,
      monthly_cum, yearly_cum, monthly_refund_amt
    ) VALUES (
      report_record.id, '실매출', weekly_real, prev_weekly_real, yoy_real,
      monthly_cum_real, yearly_cum_real, monthly_refund
    ) ON CONFLICT (report_id, category) DO UPDATE SET
      weekly_amt = EXCLUDED.weekly_amt,
      prev_weekly_amt = EXCLUDED.prev_weekly_amt,
      yoy_amt = EXCLUDED.yoy_amt,
      monthly_cum = EXCLUDED.monthly_cum,
      yearly_cum = EXCLUDED.yearly_cum,
      monthly_refund_amt = EXCLUDED.monthly_refund_amt,
      updated_at = NOW();
    
    -- 순매출 데이터 삽입
    INSERT INTO edu_revenue_stats (
      report_id, category, weekly_amt, prev_weekly_amt, yoy_amt,
      monthly_cum, yearly_cum
    ) VALUES (
      report_record.id, '순매출', weekly_net, prev_weekly_net, yoy_net,
      monthly_cum_net, yearly_cum_net
    ) ON CONFLICT (report_id, category) DO UPDATE SET
      weekly_amt = EXCLUDED.weekly_amt,
      prev_weekly_amt = EXCLUDED.prev_weekly_amt,
      yoy_amt = EXCLUDED.yoy_amt,
      monthly_cum = EXCLUDED.monthly_cum,
      yearly_cum = EXCLUDED.yearly_cum,
      updated_at = NOW();
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- edu_product_sales 데이터 생성 함수
CREATE OR REPLACE FUNCTION populate_edu_product_sales()
RETURNS void AS $$
DECLARE
  report_record RECORD;
  tier1_count INT;
  tier1_amount DECIMAL(12, 0);
  normal_count INT;
  normal_amount DECIMAL(12, 0);
BEGIN
  FOR report_record IN SELECT * FROM weekly_reports ORDER BY start_date LOOP
    
    -- 1타 집계
    SELECT 
      COALESCE(COUNT(*), 0),
      COALESCE(SUM(payment_amount), 0)
    INTO tier1_count, tier1_amount
    FROM sales_transactions
    WHERE payment_date BETWEEN report_record.start_date AND report_record.end_date
      AND is_count_valid = true
      AND product_type = '1타';
    
    -- 일반 집계
    SELECT 
      COALESCE(COUNT(*), 0),
      COALESCE(SUM(payment_amount), 0)
    INTO normal_count, normal_amount
    FROM sales_transactions
    WHERE payment_date BETWEEN report_record.start_date AND report_record.end_date
      AND is_count_valid = true
      AND product_type = '일반';
    
    -- 1타 데이터 삽입
    INSERT INTO edu_product_sales (report_id, product_group, sales_count, total_amount)
    VALUES (report_record.id, '1타', tier1_count, tier1_amount)
    ON CONFLICT (report_id, product_group) DO UPDATE SET
      sales_count = EXCLUDED.sales_count,
      total_amount = EXCLUDED.total_amount,
      updated_at = NOW();
    
    -- 일반 데이터 삽입
    INSERT INTO edu_product_sales (report_id, product_group, sales_count, total_amount)
    VALUES (report_record.id, '일반', normal_count, normal_amount)
    ON CONFLICT (report_id, product_group) DO UPDATE SET
      sales_count = EXCLUDED.sales_count,
      total_amount = EXCLUDED.total_amount,
      updated_at = NOW();
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. 함수 실행 (데이터 생성)
-- ============================================================================

SELECT populate_edu_revenue_stats();
SELECT populate_edu_product_sales();

-- ============================================================================
-- 6. 검증 쿼리
-- ============================================================================

-- edu_revenue_stats 확인
SELECT 
  wr.title,
  ers.category,
  ers.weekly_amt,
  ers.monthly_refund_amt
FROM edu_revenue_stats ers
JOIN weekly_reports wr ON wr.id = ers.report_id
WHERE wr.start_date >= '2025-12-01'
ORDER BY wr.start_date, ers.category;

-- edu_product_sales 확인
SELECT 
  wr.title,
  eps.product_group,
  eps.sales_count,
  eps.total_amount
FROM edu_product_sales eps
JOIN weekly_reports wr ON wr.id = eps.report_id
WHERE wr.start_date >= '2025-12-01'
ORDER BY wr.start_date, eps.product_group;

-- ============================================================================
-- 완료
-- ============================================================================










