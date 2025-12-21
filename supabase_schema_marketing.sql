-- ============================================
-- 마케팅 대시보드 스키마
-- ============================================

-- 1. 광고비 데이터 - 개요
CREATE TABLE IF NOT EXISTS mkt_ad_overview (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    media TEXT NOT NULL, -- '메타', '카카오' 등
    stage_1_name TEXT, -- '1차 (특강/비법서 신청)'
    stage_1_count INTEGER DEFAULT 0,
    stage_1_cost_per_lead INTEGER DEFAULT 0, -- 비용/1명
    stage_2_name TEXT, -- '상담 신청'
    stage_2_count INTEGER DEFAULT 0,
    stage_2_conversion_rate NUMERIC(5, 2), -- 28.5%
    stage_2_cost_per_lead INTEGER DEFAULT 0, -- 비용/1명
    total_spend INTEGER DEFAULT 0, -- 총 지출
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_ad_overview_report_id ON mkt_ad_overview(report_id);
CREATE INDEX IF NOT EXISTS idx_mkt_ad_overview_media ON mkt_ad_overview(media);

ALTER TABLE mkt_ad_overview ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON mkt_ad_overview
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON mkt_ad_overview
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON mkt_ad_overview
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON mkt_ad_overview
    FOR DELETE USING (true);

-- 2. 비용 추이
CREATE TABLE IF NOT EXISTS mkt_cost_trend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    media TEXT NOT NULL, -- '메타', '카카오'
    stage_1_cost INTEGER DEFAULT 0, -- 1차 DB 비용
    stage_2_cost INTEGER DEFAULT 0, -- 상담 DB 비용
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_cost_trend_report_id ON mkt_cost_trend(report_id);
CREATE INDEX IF NOT EXISTS idx_mkt_cost_trend_media ON mkt_cost_trend(media);

ALTER TABLE mkt_cost_trend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON mkt_cost_trend
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON mkt_cost_trend
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON mkt_cost_trend
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON mkt_cost_trend
    FOR DELETE USING (true);

-- 3. DB개수 추이
CREATE TABLE IF NOT EXISTS mkt_db_count_trend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    media TEXT NOT NULL, -- '메타', '카카오'
    stage_1_count INTEGER DEFAULT 0, -- 1차 DB 개수
    stage_2_count INTEGER DEFAULT 0, -- 상담 DB 개수
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_db_count_trend_report_id ON mkt_db_count_trend(report_id);
CREATE INDEX IF NOT EXISTS idx_mkt_db_count_trend_media ON mkt_db_count_trend(media);

ALTER TABLE mkt_db_count_trend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON mkt_db_count_trend
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON mkt_db_count_trend
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON mkt_db_count_trend
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON mkt_db_count_trend
    FOR DELETE USING (true);

-- 4. 기타 보고 사항
CREATE TABLE IF NOT EXISTS mkt_report_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_report_notes_report_id ON mkt_report_notes(report_id);

ALTER TABLE mkt_report_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON mkt_report_notes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON mkt_report_notes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON mkt_report_notes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON mkt_report_notes
    FOR DELETE USING (true);



