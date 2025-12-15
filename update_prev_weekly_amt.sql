-- 기존 데이터의 prev_weekly_amt 업데이트
-- 각 주차의 전주 데이터를 찾아서 prev_weekly_amt에 설정

UPDATE edu_revenue_stats ers
SET prev_weekly_amt = COALESCE(
  (
    SELECT prev.weekly_amt
    FROM edu_revenue_stats prev
    JOIN weekly_reports prev_wr ON prev.report_id = prev_wr.id
    JOIN weekly_reports curr_wr ON ers.report_id = curr_wr.id
    WHERE prev.category = ers.category
      AND prev_wr.start_date < curr_wr.start_date
      AND prev_wr.start_date = (
        SELECT MAX(wr.start_date)
        FROM weekly_reports wr
        JOIN edu_revenue_stats ers2 ON wr.id = ers2.report_id
        WHERE wr.start_date < curr_wr.start_date
          AND ers2.category = ers.category
      )
    LIMIT 1
  ),
  0
)
WHERE prev_weekly_amt = 0;

-- 결과 확인
SELECT 
  wr.title,
  wr.start_date,
  ers.category,
  ers.weekly_amt,
  ers.prev_weekly_amt,
  CASE 
    WHEN ers.prev_weekly_amt > 0 
    THEN ROUND(((ers.weekly_amt - ers.prev_weekly_amt) / ers.prev_weekly_amt * 100)::numeric, 2)
    ELSE NULL
  END as change_percent
FROM edu_revenue_stats ers
JOIN weekly_reports wr ON ers.report_id = wr.id
WHERE ers.prev_weekly_amt > 0
ORDER BY wr.start_date DESC, ers.category
LIMIT 20;



