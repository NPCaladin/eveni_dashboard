-- ============================================
-- 이븐아이 주간 업무 보고 대시보드 DB Schema
-- Supabase SQL Editor용 스크립트
-- ============================================

-- ============================================
-- 1. 메타 데이터: 주간 보고서
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_weekly_reports_created_at ON weekly_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_status ON weekly_reports(status);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_dates ON weekly_reports(start_date, end_date);

-- RLS 활성화
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (예시: 모든 사용자 읽기/쓰기 허용 - 필요에 따라 수정)
CREATE POLICY "Enable read access for all users" ON weekly_reports
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON weekly_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON weekly_reports
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON weekly_reports
    FOR DELETE USING (true);

-- ============================================
-- 2. 경영혁신실
-- ============================================
CREATE TABLE IF NOT EXISTS mgmt_innovation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('인사', '총무', 'PM', '기타')),
    content TEXT NOT NULL,
    note TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mgmt_innovation_reports_report_id ON mgmt_innovation_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_mgmt_innovation_reports_category ON mgmt_innovation_reports(category);
CREATE INDEX IF NOT EXISTS idx_mgmt_innovation_reports_created_at ON mgmt_innovation_reports(created_at DESC);

ALTER TABLE mgmt_innovation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON mgmt_innovation_reports
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON mgmt_innovation_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON mgmt_innovation_reports
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON mgmt_innovation_reports
    FOR DELETE USING (true);

-- ============================================
-- 3. 마케팅사업본부
-- ============================================

-- 3-1) 광고비 데이터
CREATE TABLE IF NOT EXISTS marketing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('Meta', 'Kakao', 'Total')),
    cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    db_count INTEGER NOT NULL DEFAULT 0,
    consultation_db_count INTEGER NOT NULL DEFAULT 0,
    conversion_rate NUMERIC(5, 2),
    type TEXT NOT NULL CHECK (type IN ('overview', 'trend')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_metrics_report_id ON marketing_metrics(report_id);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_channel ON marketing_metrics(channel);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_type ON marketing_metrics(type);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_created_at ON marketing_metrics(created_at DESC);

ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON marketing_metrics
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON marketing_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON marketing_metrics
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON marketing_metrics
    FOR DELETE USING (true);

-- 3-2) 기타 보고
CREATE TABLE IF NOT EXISTS marketing_misc_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    content TEXT,
    dynamic_tables JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_misc_reports_report_id ON marketing_misc_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_marketing_misc_reports_created_at ON marketing_misc_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_misc_reports_dynamic_tables ON marketing_misc_reports USING GIN (dynamic_tables);

ALTER TABLE marketing_misc_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON marketing_misc_reports
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON marketing_misc_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON marketing_misc_reports
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON marketing_misc_reports
    FOR DELETE USING (true);

-- ============================================
-- 4. 교육사업본부
-- ============================================

-- 4-1) 주간동향 - 매출
CREATE TABLE IF NOT EXISTS edu_revenue_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('실매출', '순매출')),
    weekly_amt NUMERIC(15, 2) NOT NULL DEFAULT 0,
    prev_weekly_amt NUMERIC(15, 2) NOT NULL DEFAULT 0,
    yoy_amt NUMERIC(15, 2) NOT NULL DEFAULT 0,
    monthly_cum_amt NUMERIC(15, 2) NOT NULL DEFAULT 0,
    monthly_refund_amt NUMERIC(15, 2) NOT NULL DEFAULT 0,
    yearly_cum_amt NUMERIC(15, 2) NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_revenue_stats_report_id ON edu_revenue_stats(report_id);
CREATE INDEX IF NOT EXISTS idx_edu_revenue_stats_category ON edu_revenue_stats(category);
CREATE INDEX IF NOT EXISTS idx_edu_revenue_stats_created_at ON edu_revenue_stats(created_at DESC);

ALTER TABLE edu_revenue_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON edu_revenue_stats
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON edu_revenue_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON edu_revenue_stats
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON edu_revenue_stats
    FOR DELETE USING (true);

-- 4-2) 주간동향 - 상품별 판매 현황
CREATE TABLE IF NOT EXISTS edu_product_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    product_group TEXT NOT NULL CHECK (product_group IN ('1타', '일반', '그룹반', '기타')),
    product_variant TEXT,
    sales_count INTEGER NOT NULL DEFAULT 0,
    sales_share NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_product_sales_report_id ON edu_product_sales(report_id);
CREATE INDEX IF NOT EXISTS idx_edu_product_sales_product_group ON edu_product_sales(product_group);
CREATE INDEX IF NOT EXISTS idx_edu_product_sales_created_at ON edu_product_sales(created_at DESC);

ALTER TABLE edu_product_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON edu_product_sales
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON edu_product_sales
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON edu_product_sales
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON edu_product_sales
    FOR DELETE USING (true);

-- 4-3) 주간동향 - 환불 요약
CREATE TABLE IF NOT EXISTS edu_refund_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('환불확정자', '환불확정액')),
    weekly_val NUMERIC(15, 2) NOT NULL DEFAULT 0,
    prev_weekly_val NUMERIC(15, 2) NOT NULL DEFAULT 0,
    yoy_val NUMERIC(15, 2) NOT NULL DEFAULT 0,
    monthly_cum_val NUMERIC(15, 2) NOT NULL DEFAULT 0,
    yearly_cum_val NUMERIC(15, 2) NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_refund_summary_report_id ON edu_refund_summary(report_id);
CREATE INDEX IF NOT EXISTS idx_edu_refund_summary_category ON edu_refund_summary(category);
CREATE INDEX IF NOT EXISTS idx_edu_refund_summary_created_at ON edu_refund_summary(created_at DESC);

ALTER TABLE edu_refund_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON edu_refund_summary
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON edu_refund_summary
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON edu_refund_summary
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON edu_refund_summary
    FOR DELETE USING (true);

-- 4-4) 주간동향 - 환불 상세 리스트
CREATE TABLE IF NOT EXISTS edu_refund_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    refund_date DATE NOT NULL,
    student_name TEXT NOT NULL,
    refund_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    refund_reason TEXT,
    consultant_name TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_refund_list_report_id ON edu_refund_list(report_id);
CREATE INDEX IF NOT EXISTS idx_edu_refund_list_refund_date ON edu_refund_list(refund_date);
CREATE INDEX IF NOT EXISTS idx_edu_refund_list_created_at ON edu_refund_list(created_at DESC);

ALTER TABLE edu_refund_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON edu_refund_list
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON edu_refund_list
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON edu_refund_list
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON edu_refund_list
    FOR DELETE USING (true);

-- 4-5) 주간동향 - 미개시 환불
CREATE TABLE IF NOT EXISTS edu_unstarted_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
    count INTEGER NOT NULL DEFAULT 0,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_unstarted_refunds_report_id ON edu_unstarted_refunds(report_id);
CREATE INDEX IF NOT EXISTS idx_edu_unstarted_refunds_period_type ON edu_unstarted_refunds(period_type);
CREATE INDEX IF NOT EXISTS idx_edu_unstarted_refunds_created_at ON edu_unstarted_refunds(created_at DESC);

ALTER TABLE edu_unstarted_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON edu_unstarted_refunds
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON edu_unstarted_refunds
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON edu_unstarted_refunds
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON edu_unstarted_refunds
    FOR DELETE USING (true);

-- 4-6) 멘토제 주간보고
CREATE TABLE IF NOT EXISTS edu_mentoring_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    mentor_name TEXT NOT NULL,
    mentee_status TEXT,
    issues TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_mentoring_reports_report_id ON edu_mentoring_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_edu_mentoring_reports_mentor_name ON edu_mentoring_reports(mentor_name);
CREATE INDEX IF NOT EXISTS idx_edu_mentoring_reports_created_at ON edu_mentoring_reports(created_at DESC);

ALTER TABLE edu_mentoring_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON edu_mentoring_reports
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON edu_mentoring_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON edu_mentoring_reports
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON edu_mentoring_reports
    FOR DELETE USING (true);

-- 4-7) 컨설턴트 리소스
CREATE TABLE IF NOT EXISTS consultant_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    job_group TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('가능', '불가', '조율', '전체마감')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultant_resources_report_id ON consultant_resources(report_id);
CREATE INDEX IF NOT EXISTS idx_consultant_resources_job_group ON consultant_resources(job_group);
CREATE INDEX IF NOT EXISTS idx_consultant_resources_status ON consultant_resources(status);
CREATE INDEX IF NOT EXISTS idx_consultant_resources_created_at ON consultant_resources(created_at DESC);

ALTER TABLE consultant_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON consultant_resources
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON consultant_resources
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON consultant_resources
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON consultant_resources
    FOR DELETE USING (true);

-- 4-8) 진행 업무 보고
CREATE TABLE IF NOT EXISTS edu_progress_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    content TEXT,
    dynamic_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_progress_reports_report_id ON edu_progress_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_edu_progress_reports_created_at ON edu_progress_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edu_progress_reports_dynamic_data ON edu_progress_reports USING GIN (dynamic_data);

ALTER TABLE edu_progress_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON edu_progress_reports
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON edu_progress_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON edu_progress_reports
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON edu_progress_reports
    FOR DELETE USING (true);

-- ============================================
-- 5. 세일즈본부 (추후 확장용)
-- ============================================

-- 세일즈본부 관련 테이블은 추후 확장을 위해 주석 처리합니다.
-- 필요시 아래 주석을 해제하고 스키마를 정의하세요.

/*
CREATE TABLE IF NOT EXISTS sales_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    content TEXT,
    dynamic_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_reports_report_id ON sales_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_created_at ON sales_reports(created_at DESC);

ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON sales_reports
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON sales_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON sales_reports
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON sales_reports
    FOR DELETE USING (true);
*/

-- ============================================
-- 추가 유틸리티 함수 (선택사항)
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- weekly_reports의 updated_at 자동 업데이트 트리거
CREATE TRIGGER update_weekly_reports_updated_at
    BEFORE UPDATE ON weekly_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 스키마 생성 완료
-- ============================================


