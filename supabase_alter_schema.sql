-- ============================================
-- DB 스키마 수정 쿼리
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. marketing_metrics 테이블에 consultation_db_count 컬럼 추가
ALTER TABLE marketing_metrics
ADD COLUMN IF NOT EXISTS consultation_db_count INTEGER NOT NULL DEFAULT 0;

-- 2. mgmt_innovation_reports 테이블에 is_completed 컬럼 추가
ALTER TABLE mgmt_innovation_reports
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- 스키마 수정 완료
-- ============================================

-- 3. sales_transactions 테이블 추가 (매출 거래 내역)
CREATE TABLE IF NOT EXISTS sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    buyer_name TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    seller_team TEXT NOT NULL CHECK (seller_team IN ('Sales', 'Operations')),
    sale_type TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_category TEXT NOT NULL CHECK (product_category IN ('1타', '일반')),
    product_week TEXT,
    list_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    order_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_count_valid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_transactions_report_id ON sales_transactions(report_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_transaction_date ON sales_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_seller_team ON sales_transactions(seller_team);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_sale_type ON sales_transactions(sale_type);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_product_category ON sales_transactions(product_category);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_created_at ON sales_transactions(created_at DESC);

ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;

-- 정책이 없을 때만 생성 (안전한 방법)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'sales_transactions' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON sales_transactions
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'sales_transactions' 
        AND policyname = 'Enable insert access for all users'
    ) THEN
        CREATE POLICY "Enable insert access for all users" ON sales_transactions
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'sales_transactions' 
        AND policyname = 'Enable update access for all users'
    ) THEN
        CREATE POLICY "Enable update access for all users" ON sales_transactions
            FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'sales_transactions' 
        AND policyname = 'Enable delete access for all users'
    ) THEN
        CREATE POLICY "Enable delete access for all users" ON sales_transactions
            FOR DELETE USING (true);
    END IF;
END $$;

-- 4. sales_transactions 테이블에 환불 관련 컬럼 추가
ALTER TABLE sales_transactions
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(15, 2) NOT NULL DEFAULT 0;

ALTER TABLE sales_transactions
ADD COLUMN IF NOT EXISTS refund_date DATE;

ALTER TABLE sales_transactions
ADD COLUMN IF NOT EXISTS status TEXT;

CREATE INDEX IF NOT EXISTS idx_sales_transactions_status ON sales_transactions(status);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_refund_date ON sales_transactions(refund_date);

-- 5. 컨설턴트 배정 가능 현황 (T_resource 업로드용 집계 테이블)
CREATE TABLE IF NOT EXISTS consultant_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    job_group TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('일반', '1타')),
    is_available BOOLEAN NOT NULL DEFAULT false,
    source TEXT NOT NULL DEFAULT 'excel',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultant_availability_report_id ON consultant_availability(report_id);
CREATE INDEX IF NOT EXISTS idx_consultant_availability_job_group ON consultant_availability(job_group);
CREATE INDEX IF NOT EXISTS idx_consultant_availability_tier ON consultant_availability(tier);
CREATE INDEX IF NOT EXISTS idx_consultant_availability_updated_at ON consultant_availability(updated_at DESC);

ALTER TABLE consultant_availability ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'consultant_availability' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON consultant_availability
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'consultant_availability' 
        AND policyname = 'Enable insert access for all users'
    ) THEN
        CREATE POLICY "Enable insert access for all users" ON consultant_availability
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'consultant_availability' 
        AND policyname = 'Enable update access for all users'
    ) THEN
        CREATE POLICY "Enable update access for all users" ON consultant_availability
            FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'consultant_availability' 
        AND policyname = 'Enable delete access for all users'
    ) THEN
        CREATE POLICY "Enable delete access for all users" ON consultant_availability
            FOR DELETE USING (true);
    END IF;
END $$;

-- 6. 교육 보고 사항 (리치텍스트/이미지 경로 저장용)
CREATE TABLE IF NOT EXISTS edu_report_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    content TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_report_notes_report_id ON edu_report_notes(report_id);
CREATE INDEX IF NOT EXISTS idx_edu_report_notes_updated_at ON edu_report_notes(updated_at DESC);

ALTER TABLE edu_report_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'edu_report_notes' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON edu_report_notes
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'edu_report_notes' 
        AND policyname = 'Enable insert access for all users'
    ) THEN
        CREATE POLICY "Enable insert access for all users" ON edu_report_notes
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'edu_report_notes' 
        AND policyname = 'Enable update access for all users'
    ) THEN
        CREATE POLICY "Enable update access for all users" ON edu_report_notes
            FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'edu_report_notes' 
        AND policyname = 'Enable delete access for all users'
    ) THEN
        CREATE POLICY "Enable delete access for all users" ON edu_report_notes
            FOR DELETE USING (true);
    END IF;
END $$;

