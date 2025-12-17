-- ============================================
-- 컨설턴트 리소스 테이블 마이그레이션
-- 개별 컨설턴트 정보 저장을 위한 컬럼 추가
-- ============================================

-- 1. 기존 데이터 백업 (선택사항)
-- CREATE TABLE consultant_resources_backup AS SELECT * FROM consultant_resources;

-- 2. 기존 데이터 삭제 (새로운 구조로 시작)
DELETE FROM consultant_resources;

-- 3. 새로운 컬럼 추가
ALTER TABLE consultant_resources 
ADD COLUMN IF NOT EXISTS consultant_name TEXT;

ALTER TABLE consultant_resources 
ADD COLUMN IF NOT EXISTS grade TEXT;

ALTER TABLE consultant_resources 
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;

-- 4. 제약조건 추가
DO $$ 
BEGIN
  -- grade 제약조건 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'consultant_resources_grade_check'
  ) THEN
    ALTER TABLE consultant_resources 
    ADD CONSTRAINT consultant_resources_grade_check 
    CHECK (grade IN ('일반', '숙련', '베테랑'));
  END IF;

  -- status 제약조건 업데이트 (기존 '전체마감' 제거)
  ALTER TABLE consultant_resources 
  DROP CONSTRAINT IF EXISTS consultant_resources_status_check;
  
  ALTER TABLE consultant_resources 
  ADD CONSTRAINT consultant_resources_status_check 
  CHECK (status IN ('가능', '불가', '조율'));
END $$;

-- 5. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_consultant_resources_name 
ON consultant_resources(consultant_name);

CREATE INDEX IF NOT EXISTS idx_consultant_resources_grade 
ON consultant_resources(grade);

-- 6. 확인
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'consultant_resources'
ORDER BY ordinal_position;

-- 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '✅ 컨설턴트 리소스 테이블 마이그레이션 완료';
  RAISE NOTICE '   - consultant_name 컬럼 추가';
  RAISE NOTICE '   - grade 컬럼 추가 (일반/숙련/베테랑)';
  RAISE NOTICE '   - capacity 컬럼 추가';
  RAISE NOTICE '   - 인덱스 추가 완료';
END $$;

