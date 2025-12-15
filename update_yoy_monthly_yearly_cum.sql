-- 기존 데이터의 전년동기, 해당월 누적, 해당연도 누적 업데이트

-- 1. 전년동기 (yoy_amt) 업데이트
-- title 기반으로 같은 월의 같은 주차 찾기 (예: "2025년 1월 2주차" -> "2024년 1월 2주차")
UPDATE edu_revenue_stats ers
SET yoy_amt = COALESCE(
  (
    SELECT yoy.weekly_amt
    FROM edu_revenue_stats yoy
    JOIN weekly_reports curr_wr ON ers.report_id = curr_wr.id
    JOIN weekly_reports yoy_wr ON yoy.report_id = yoy_wr.id
    WHERE yoy.category = ers.category
      -- title에서 연도, 월, 주차 파싱하여 전년도 같은 월 같은 주차 찾기
      AND yoy_wr.title = REGEXP_REPLACE(
        curr_wr.title,
        '(\d+)년',
        (EXTRACT(YEAR FROM curr_wr.start_date) - 1)::TEXT || '년',
        'g'
      )
    LIMIT 1
  ),
  0
)
WHERE yoy_amt = 0;

-- 2. 해당월 누적 (monthly_cum_amt) 업데이트
-- 같은 월의 모든 주차 합산 (현재 주차 포함)
UPDATE edu_revenue_stats ers
SET monthly_cum_amt = COALESCE(
  (
    SELECT SUM(monthly.weekly_amt)
    FROM edu_revenue_stats monthly
    JOIN weekly_reports curr_wr ON ers.report_id = curr_wr.id
    JOIN weekly_reports monthly_wr ON monthly.report_id = monthly_wr.id
    WHERE monthly.category = ers.category
      AND EXTRACT(YEAR FROM monthly_wr.start_date) = EXTRACT(YEAR FROM curr_wr.start_date)
      AND EXTRACT(MONTH FROM monthly_wr.start_date) = EXTRACT(MONTH FROM curr_wr.start_date)
      AND monthly_wr.start_date <= curr_wr.start_date
  ),
  0
)
WHERE monthly_cum_amt = 0;

-- 3. 해당연도 누적 (yearly_cum_amt) 업데이트
-- 같은 연도의 모든 주차 합산 (현재 주차 포함)
UPDATE edu_revenue_stats ers
SET yearly_cum_amt = COALESCE(
  (
    SELECT SUM(yearly.weekly_amt)
    FROM edu_revenue_stats yearly
    JOIN weekly_reports curr_wr ON ers.report_id = curr_wr.id
    JOIN weekly_reports yearly_wr ON yearly.report_id = yearly_wr.id
    WHERE yearly.category = ers.category
      AND EXTRACT(YEAR FROM yearly_wr.start_date) = EXTRACT(YEAR FROM curr_wr.start_date)
      AND yearly_wr.start_date <= curr_wr.start_date
  ),
  0
)
WHERE yearly_cum_amt = 0;

-- 결과 확인
SELECT 
  wr.title,
  wr.start_date,
  ers.category,
  ers.weekly_amt,
  ers.prev_weekly_amt,
  ers.yoy_amt,
  ers.monthly_cum_amt,
  ers.yearly_cum_amt
FROM edu_revenue_stats ers
JOIN weekly_reports wr ON ers.report_id = wr.id
ORDER BY wr.start_date DESC, ers.category
LIMIT 30;

