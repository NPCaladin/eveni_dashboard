-- ============================================
-- 추가 제약 조건 및 인덱스
-- ============================================

-- edu_revenue_stats: report_id와 category 조합이 unique해야 함
CREATE UNIQUE INDEX IF NOT EXISTS idx_edu_revenue_stats_unique 
ON edu_revenue_stats(report_id, category);

-- edu_product_sales: report_id, product_group, product_variant 조합이 unique해야 할 수도 있음
-- (필요에 따라 주석 해제)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_edu_product_sales_unique 
-- ON edu_product_sales(report_id, product_group, product_variant);

-- consultant_resources: report_id와 job_group 조합이 unique해야 함
CREATE UNIQUE INDEX IF NOT EXISTS idx_consultant_resources_unique 
ON consultant_resources(report_id, job_group);





