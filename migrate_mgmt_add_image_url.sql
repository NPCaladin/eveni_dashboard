-- ============================================
-- 경영혁신실 보고에 이미지 URL 필드 추가
-- ============================================

-- 1. image_url 컬럼 추가
ALTER TABLE mgmt_innovation_reports 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_mgmt_innovation_reports_image_url 
ON mgmt_innovation_reports(image_url) 
WHERE image_url IS NOT NULL;

-- 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '✅ 경영혁신실 보고 테이블에 image_url 컬럼 추가 완료';
END $$;



