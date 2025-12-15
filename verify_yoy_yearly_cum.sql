-- PPT 수치 검증 쿼리
-- 전년동기와 해당연도 누적 수치 확인

-- 1. 현재 주차 확인 (2025년 12월 7일 기준)
SELECT 
  id,
  title,
  start_date,
  end_date
FROM weekly_reports
WHERE '2025-12-07' BETWEEN start_date AND end_date
ORDER BY start_date DESC
LIMIT 1;

-- 2. 전년동기 검증 (2025년 12월 주차의 전년동기 = 2024년 12월 같은 주차)
-- 먼저 현재 주차의 title을 확인한 후, 그에 맞는 전년동기 주차를 찾아야 함
WITH current_week AS (
  SELECT 
    id,
    title,
    start_date,
    EXTRACT(YEAR FROM start_date) as year,
    EXTRACT(MONTH FROM start_date) as month
  FROM weekly_reports
  WHERE '2025-12-07' BETWEEN start_date AND end_date
  ORDER BY start_date DESC
  LIMIT 1
)
SELECT 
  cw.title as current_week_title,
  cw.start_date as current_week_start,
  yoy_wr.title as yoy_week_title,
  yoy_wr.start_date as yoy_week_start,
  yoy_ers.weekly_amt as yoy_real_revenue,
  yoy_ers.weekly_amt as expected_value,
  63949840 as ppt_value,
  CASE 
    WHEN yoy_ers.weekly_amt = 63949840 THEN '일치'
    ELSE '불일치'
  END as match_status
FROM current_week cw
LEFT JOIN weekly_reports yoy_wr ON 
  EXTRACT(YEAR FROM yoy_wr.start_date) = cw.year - 1
  AND EXTRACT(MONTH FROM yoy_wr.start_date) = cw.month
  AND yoy_wr.title = REGEXP_REPLACE(cw.title, '(\d+)년', (cw.year - 1)::TEXT || '년', 'g')
LEFT JOIN edu_revenue_stats yoy_ers ON 
  yoy_ers.report_id = yoy_wr.id 
  AND yoy_ers.category = '실매출';

-- 3. 해당연도 누적 검증 (2025년 1월 1일 ~ 2025년 12월 7일까지의 모든 주차 실매출 합계)
SELECT 
  COUNT(DISTINCT wr.id) as total_weeks,
  SUM(ers.weekly_amt) as total_yearly_cumulative,
  2889505163 as ppt_value,
  CASE 
    WHEN SUM(ers.weekly_amt) = 2889505163 THEN '일치'
    ELSE '불일치'
  END as match_status,
  ABS(SUM(ers.weekly_amt) - 2889505163) as difference
FROM weekly_reports wr
JOIN edu_revenue_stats ers ON ers.report_id = wr.id
WHERE ers.category = '실매출'
  AND EXTRACT(YEAR FROM wr.start_date) = 2025
  AND wr.start_date <= '2025-12-07';

-- 4. 상세 내역 확인 (2025년 모든 주차별 실매출)
SELECT 
  wr.title,
  wr.start_date,
  wr.end_date,
  ers.weekly_amt as real_revenue,
  SUM(ers.weekly_amt) OVER (ORDER BY wr.start_date) as cumulative_revenue
FROM weekly_reports wr
JOIN edu_revenue_stats ers ON ers.report_id = wr.id
WHERE ers.category = '실매출'
  AND EXTRACT(YEAR FROM wr.start_date) = 2025
  AND wr.start_date <= '2025-12-07'
ORDER BY wr.start_date;

-- 5. 전년동기 상세 확인 (2024년 12월 모든 주차)
SELECT 
  wr.title,
  wr.start_date,
  wr.end_date,
  ers.weekly_amt as real_revenue
FROM weekly_reports wr
JOIN edu_revenue_stats ers ON ers.report_id = wr.id
WHERE ers.category = '실매출'
  AND EXTRACT(YEAR FROM wr.start_date) = 2024
  AND EXTRACT(MONTH FROM wr.start_date) = 12
ORDER BY wr.start_date;



