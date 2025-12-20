-- 마케팅 광고비 개요 인사이트 테이블 생성

-- 기존 정책/트리거/함수/테이블 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON mkt_ad_overview_notes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON mkt_ad_overview_notes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON mkt_ad_overview_notes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON mkt_ad_overview_notes;
DROP TRIGGER IF EXISTS update_mkt_ad_overview_notes_updated_at ON mkt_ad_overview_notes;
DROP FUNCTION IF EXISTS update_mkt_ad_overview_notes_updated_at();
DROP TABLE IF EXISTS mkt_ad_overview_notes;

CREATE TABLE mkt_ad_overview_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id)
);

-- RLS 정책 설정
ALTER TABLE mkt_ad_overview_notes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON mkt_ad_overview_notes
  FOR SELECT
  USING (true);

-- 인증된 사용자는 삽입 가능
CREATE POLICY "Enable insert for authenticated users" ON mkt_ad_overview_notes
  FOR INSERT
  WITH CHECK (true);

-- 인증된 사용자는 업데이트 가능
CREATE POLICY "Enable update for authenticated users" ON mkt_ad_overview_notes
  FOR UPDATE
  USING (true);

-- 인증된 사용자는 삭제 가능
CREATE POLICY "Enable delete for authenticated users" ON mkt_ad_overview_notes
  FOR DELETE
  USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_mkt_ad_overview_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mkt_ad_overview_notes_updated_at
  BEFORE UPDATE ON mkt_ad_overview_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_mkt_ad_overview_notes_updated_at();

