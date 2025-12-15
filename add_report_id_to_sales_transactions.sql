-- ============================================================================
-- sales_transactions 테이블에 report_id 필드 추가
-- 목적: 주차별 데이터 조회를 위한 연결 고리
-- ============================================================================

-- report_id 컬럼 추가 (nullable로 추가 후 기존 데이터는 NULL)
ALTER TABLE sales_transactions
ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES weekly_reports(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_sales_report_id ON sales_transactions(report_id);

-- 코멘트 추가
COMMENT ON COLUMN sales_transactions.report_id IS '주차 보고서 ID (주차별 데이터 조회용)';



