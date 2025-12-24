-- sales_transactions 테이블에 report_id 컬럼 추가
-- 이렇게 하면 주차별 데이터 관리가 훨씬 쉬워집니다

ALTER TABLE sales_transactions 
ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES weekly_reports(id) ON DELETE SET NULL;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_sales_report_id ON sales_transactions(report_id);

-- 코멘트 추가
COMMENT ON COLUMN sales_transactions.report_id IS '주간 보고서 ID - 어느 주차에 업로드된 데이터인지 추적';

-- 기존 데이터의 report_id는 NULL로 남습니다
-- 새로 업로드되는 데이터부터 report_id가 설정됩니다








