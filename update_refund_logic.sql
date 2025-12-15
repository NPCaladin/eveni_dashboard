-- ============================================================================
-- 환불 집계 로직 수정: payment_date → refund_date 기준
-- ============================================================================

-- populate_edu_revenue_stats 함수 재생성
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
    
    -- 현재 주차 실매출 (결제일 기준)
    SELECT COALESCE(SUM(payment_amount), 0) INTO weekly_real
    FROM sales_transactions
    WHERE payment_date BETWEEN current_week_start AND current_week_end
      AND is_count_valid = true;
    
    -- 현재 주차 환불 (환불일 기준!) ← 변경됨
    SELECT COALESCE(SUM(refund_amount), 0) INTO weekly_refund
    FROM sales_transactions
    WHERE refund_date BETWEEN current_week_start AND current_week_end
      AND is_count_valid = true
      AND refund_amount > 0;
    
    -- 현재 주차 순매출
    weekly_net := weekly_real - weekly_refund;
    
    -- 전주 실매출
    SELECT COALESCE(SUM(payment_amount), 0) INTO prev_weekly_real
    FROM sales_transactions
    WHERE payment_date BETWEEN prev_week_start AND prev_week_end
      AND is_count_valid = true;
    
    -- 전주 환불 (환불일 기준!)
    SELECT COALESCE(SUM(refund_amount), 0) INTO prev_weekly_net
    FROM sales_transactions
    WHERE payment_date BETWEEN prev_week_start AND prev_week_end
      AND is_count_valid = true;
    
    SELECT prev_weekly_real - COALESCE((
      SELECT SUM(refund_amount)
      FROM sales_transactions
      WHERE refund_date BETWEEN prev_week_start AND prev_week_end
        AND is_count_valid = true
        AND refund_amount > 0
    ), 0) INTO prev_weekly_net;
    
    -- 전년 동기 실매출
    SELECT COALESCE(SUM(payment_amount), 0) INTO yoy_real
    FROM sales_transactions
    WHERE payment_date BETWEEN yoy_week_start AND yoy_week_end
      AND is_count_valid = true;
    
    -- 전년 동기 순매출
    SELECT yoy_real - COALESCE((
      SELECT SUM(refund_amount)
      FROM sales_transactions
      WHERE refund_date BETWEEN yoy_week_start AND yoy_week_end
        AND is_count_valid = true
        AND refund_amount > 0
    ), 0) INTO yoy_net;
    
    -- 월간 누적 실매출
    SELECT COALESCE(SUM(payment_amount), 0) INTO monthly_cum_real
    FROM sales_transactions
    WHERE EXTRACT(YEAR FROM payment_date) = current_year
      AND EXTRACT(MONTH FROM payment_date) = current_month
      AND is_count_valid = true;
    
    -- 월간 누적 환불 (환불일 기준!)
    SELECT COALESCE(SUM(refund_amount), 0) INTO monthly_refund
    FROM sales_transactions
    WHERE EXTRACT(YEAR FROM refund_date) = current_year
      AND EXTRACT(MONTH FROM refund_date) = current_month
      AND is_count_valid = true
      AND refund_amount > 0;
    
    -- 월간 누적 순매출
    monthly_cum_net := monthly_cum_real - monthly_refund;
    
    -- 연간 누적 실매출
    SELECT COALESCE(SUM(payment_amount), 0) INTO yearly_cum_real
    FROM sales_transactions
    WHERE EXTRACT(YEAR FROM payment_date) = current_year
      AND is_count_valid = true;
    
    -- 연간 누적 순매출
    SELECT yearly_cum_real - COALESCE((
      SELECT SUM(refund_amount)
      FROM sales_transactions
      WHERE EXTRACT(YEAR FROM refund_date) = current_year
        AND is_count_valid = true
        AND refund_amount > 0
    ), 0) INTO yearly_cum_net;
    
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

-- 함수 실행
SELECT populate_edu_revenue_stats();

-- 검증 쿼리
SELECT 
  wr.title,
  ers.category,
  ers.weekly_amt,
  ers.monthly_refund_amt
FROM edu_revenue_stats ers
JOIN weekly_reports wr ON wr.id = ers.report_id
WHERE wr.start_date >= '2025-11-01'
ORDER BY wr.start_date, ers.category;



