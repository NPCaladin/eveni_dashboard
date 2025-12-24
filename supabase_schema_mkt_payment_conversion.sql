-- ============================================
-- 마케팅 결제 전환율 데이터 테이블 생성
-- ============================================

-- 기존 정책/트리거/함수/테이블 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON mkt_payment_conversion;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON mkt_payment_conversion;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON mkt_payment_conversion;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON mkt_payment_conversion;
DROP TRIGGER IF EXISTS update_mkt_payment_conversion_updated_at ON mkt_payment_conversion;
DROP FUNCTION IF EXISTS update_mkt_payment_conversion_updated_at();
DROP TABLE IF EXISTS mkt_payment_conversion;

-- 테이블 생성
CREATE TABLE mkt_payment_conversion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
  
  -- 특강 DB → 결제 전환
  special_db_count INTEGER NOT NULL DEFAULT 0,      -- 특강/비법서 신청 DB 수
  special_payment_count INTEGER NOT NULL DEFAULT 0, -- 특강 DB → 결제 전환 수
  special_conversion_rate NUMERIC(5, 2),            -- 전환율 (%)
  
  -- 일반 DB → 결제 전환
  general_db_count INTEGER NOT NULL DEFAULT 0,      -- 일반 DB 수
  general_payment_count INTEGER NOT NULL DEFAULT 0, -- 일반 DB → 결제 전환 수
  general_conversion_rate NUMERIC(5, 2),            -- 전환율 (%)
  
  -- 전체 집계
  total_db_count INTEGER NOT NULL DEFAULT 0,        -- 총 DB 수
  total_payment_count INTEGER NOT NULL DEFAULT 0,   -- 총 결제 수
  total_conversion_rate NUMERIC(5, 2),              -- 전체 전환율 (%)
  
  -- 메타 데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약조건: 하나의 보고서에 하나의 결제 전환 데이터
  UNIQUE(report_id)
);

-- 인덱스 생성
CREATE INDEX idx_mkt_payment_conversion_report_id 
  ON mkt_payment_conversion(report_id);

-- RLS 정책 설정
ALTER TABLE mkt_payment_conversion ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" 
  ON mkt_payment_conversion
  FOR SELECT
  USING (true);

-- 인증된 사용자는 삽입 가능
CREATE POLICY "Enable insert for authenticated users" 
  ON mkt_payment_conversion
  FOR INSERT
  WITH CHECK (true);

-- 인증된 사용자는 업데이트 가능
CREATE POLICY "Enable update for authenticated users" 
  ON mkt_payment_conversion
  FOR UPDATE
  USING (true);

-- 인증된 사용자는 삭제 가능
CREATE POLICY "Enable delete for authenticated users" 
  ON mkt_payment_conversion
  FOR DELETE
  USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_mkt_payment_conversion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mkt_payment_conversion_updated_at
  BEFORE UPDATE ON mkt_payment_conversion
  FOR EACH ROW
  EXECUTE FUNCTION update_mkt_payment_conversion_updated_at();

-- 완료 메시지
SELECT 'mkt_payment_conversion 테이블 생성 완료!' as status;


