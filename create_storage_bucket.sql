-- ============================================
-- Supabase Storage 버킷 생성 (이미지 업로드용)
-- ============================================

-- 1. reports 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 모든 사용자가 업로드 가능하도록 정책 설정
CREATE POLICY "Anyone can upload reports images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Anyone can read reports images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reports');

CREATE POLICY "Anyone can update their own reports images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'reports');

CREATE POLICY "Anyone can delete reports images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'reports');

-- 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '✅ Supabase Storage 버킷 "reports" 생성 완료';
  RAISE NOTICE '   - 이미지 업로드 가능';
  RAISE NOTICE '   - Public 접근 가능';
END $$;



