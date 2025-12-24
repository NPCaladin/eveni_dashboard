# 🎯 결제 전환율 구현 설계안

## 📊 데이터 분석 결과

### 현재 데이터 구조
- **파일**: `2025_payment_data.xlsx`
- **기간**: 2025년 1월 ~ 12월 (50주)
- **데이터 필드**:
  ```
  시작일, 종료일
  특강 DB 수, 결제 고객 수 (특강 전환율: 13.35%)
  일반 DB 수, 결제 고객 수 (일반 전환율: 2.96%)
  총 DB 수, 총 결제 고객 수 (전체 전환율: 5.61%)
  ```

### 핵심 인사이트
```
현재 마케팅 퍼널: 광고 → 1차 DB → 상담 DB → ❓
완성 마케팅 퍼널: 광고 → 1차 DB → 상담 DB → 결제 → ROI
```

**문제점**: 
- 현재 `ConversionTrendData`에는 stage1 (1차 DB), stage2 (상담 DB)만 존재
- **결제 전환 데이터가 완전히 누락**
- ROI, 실제 마케팅 효율성을 측정할 수 없음

---

## 🗄️ 1단계: DB 스키마 설계

### A. 새 테이블: `mkt_payment_conversion`

```sql
CREATE TABLE mkt_payment_conversion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
  
  -- 특강 DB → 결제 전환
  special_db_count INTEGER NOT NULL DEFAULT 0,      -- 특강/비법서 신청 DB 수
  special_payment_count INTEGER NOT NULL DEFAULT 0, -- 특강 DB → 결제 전환 수
  special_conversion_rate NUMERIC(5, 2),            -- 전환율 (자동 계산 또는 저장)
  
  -- 일반 DB → 결제 전환
  general_db_count INTEGER NOT NULL DEFAULT 0,      -- 일반 DB 수
  general_payment_count INTEGER NOT NULL DEFAULT 0, -- 일반 DB → 결제 전환 수
  general_conversion_rate NUMERIC(5, 2),            -- 전환율
  
  -- 전체 집계
  total_db_count INTEGER NOT NULL DEFAULT 0,        -- 총 DB 수 (검증용)
  total_payment_count INTEGER NOT NULL DEFAULT 0,   -- 총 결제 수
  total_conversion_rate NUMERIC(5, 2),              -- 전체 전환율
  
  -- 메타 데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약조건: 하나의 보고서에 하나의 결제 전환 데이터
  UNIQUE(report_id)
);

-- 인덱스
CREATE INDEX idx_mkt_payment_conversion_report_id 
  ON mkt_payment_conversion(report_id);

-- RLS 정책
ALTER TABLE mkt_payment_conversion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
  ON mkt_payment_conversion FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" 
  ON mkt_payment_conversion FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
  ON mkt_payment_conversion FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" 
  ON mkt_payment_conversion FOR DELETE USING (true);

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
```

### B. 타입 정의 확장: `lib/supabase/types.ts`

```typescript
// Supabase 테이블 타입에 추가
mkt_payment_conversion: {
  Row: {
    id: string;
    report_id: string;
    special_db_count: number;
    special_payment_count: number;
    special_conversion_rate: number | null;
    general_db_count: number;
    general_payment_count: number;
    general_conversion_rate: number | null;
    total_db_count: number;
    total_payment_count: number;
    total_conversion_rate: number | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    report_id: string;
    special_db_count?: number;
    special_payment_count?: number;
    special_conversion_rate?: number | null;
    general_db_count?: number;
    general_payment_count?: number;
    general_conversion_rate?: number | null;
    total_db_count?: number;
    total_payment_count?: number;
    total_conversion_rate?: number | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    // ... 모든 필드 optional
  };
};
```

### C. 대시보드 타입 확장: `lib/types/dashboard.ts`

```typescript
export interface ConversionTrendData {
  reportId: string;
  title: string;
  startDate: string;
  endDate: string;
  kakao: {
    stage1Count: number;
    stage2Count: number;
    conversionRate: number;
    totalSpend: number;
  };
  meta: {
    stage1Count: number;
    stage2Count: number;
    conversionRate: number;
    totalSpend: number;
  };
  // ✨ 새로 추가
  payment?: {
    specialDbCount: number;
    specialPaymentCount: number;
    specialConversionRate: number;
    generalDbCount: number;
    generalPaymentCount: number;
    generalConversionRate: number;
    totalDbCount: number;
    totalPaymentCount: number;
    totalConversionRate: number;
  };
}
```

---

## 📥 2단계: 데이터 마이그레이션

### A. Excel → DB 변환 스크립트

```javascript
// scripts/migrate_payment_data.js
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// 1. Excel 파일 읽기
// 2. 날짜 기반으로 report_id 매칭
// 3. 전환율 계산
// 4. Supabase INSERT
```

**매칭 로직**:
- Excel의 `시작일`, `종료일` → `weekly_reports`의 `start_date`, `end_date`
- 날짜 매칭으로 `report_id` 자동 연결

**검증**:
- 50주 데이터 모두 매칭되는지 확인
- 전환율 재계산 검증

### B. SQL INSERT 생성 (대안)

```sql
-- 스크립트가 생성한 INSERT 문을 SQL 파일로 저장
INSERT INTO mkt_payment_conversion 
  (report_id, special_db_count, special_payment_count, ...)
VALUES
  ('uuid1', 168, 8, ...),
  ('uuid2', 35, 11, ...),
  ...;
```

---

## 🔌 3단계: API 확장

### A. 기존 API 수정: `/api/marketing/conversion-trend/route.ts`

```typescript
// 기존 로직에 payment 데이터 조회 추가
const { data: paymentData } = await supabase
  .from("mkt_payment_conversion")
  .select("*")
  .eq("report_id", report.id)
  .single();

return {
  reportId: report.id,
  // ... 기존 필드
  payment: paymentData ? {
    specialDbCount: paymentData.special_db_count,
    specialPaymentCount: paymentData.special_payment_count,
    specialConversionRate: paymentData.special_conversion_rate,
    generalDbCount: paymentData.general_db_count,
    generalPaymentCount: paymentData.general_payment_count,
    generalConversionRate: paymentData.general_conversion_rate,
    totalDbCount: paymentData.total_db_count,
    totalPaymentCount: paymentData.total_payment_count,
    totalConversionRate: paymentData.total_conversion_rate,
  } : undefined,
};
```

---

## 🎨 4단계: 대시보드 UI 구현

### A. 새 차트: `components/dashboard/marketing/payment-conversion-chart.tsx`

**기능**:
- 주차별 결제 전환율 추이
- 특강 vs 일반 DB 전환율 비교
- 토글: [특강] / [일반] / [전체]
- 이중 축: 전환율(%) + 결제 수(건)

### B. KPI 카드 추가

```tsx
<KpiCard
  title="평균 결제 전환율"
  value={`${avgPaymentConversionRate}%`}
  trend={weeklyTrend}
  icon="💳"
/>
```

### C. 풀 퍼널 시각화

```
광고 집행
    ↓
1차 DB (100%)
    ↓ (30% 전환)
상담 DB (30%)
    ↓ (5.6% 전환)  ← ✨ 새로 추가
결제 (1.7%)
```

---

## 🛠️ 5단계: 어드민 기능

### A. 입력 폼: `components/marketing/payment-conversion-form.tsx`

**필드**:
- 주차 선택 (weekly_reports 드롭다운)
- 특강 DB 수 / 특강 결제 수
- 일반 DB 수 / 일반 결제 수
- 전환율 자동 계산 & 표시
- 저장/수정/삭제 버튼

### B. 대시보드 페이지: `/app/dashboard/marketing-admin/page.tsx`

**기능**:
- 주차별 결제 전환 데이터 입력
- 기존 데이터 수정
- Excel 일괄 업로드 (선택사항)
- 데이터 검증 (1차 DB vs 결제 수 비율 체크)

---

## 📈 6단계: 인사이트 & 분석

### A. 새로운 지표 계산

1. **결제 CPA (Cost Per Acquisition)**
   ```
   결제 CPA = 총 광고비 / 결제 수
   ```

2. **단계별 전환율**
   ```
   1차 DB → 상담 DB: 30%
   상담 DB → 결제: ~18.7% (5.6% / 30%)
   1차 DB → 결제: 5.6%
   ```

3. **ROI (Return on Investment)**
   ```
   ROI = (결제 매출 - 광고비) / 광고비 × 100
   ```
   *매출 데이터는 교육사업본부와 연동 필요*

### B. 새 차트 아이디어

- 결제 전환율 추이 (주차별)
- 특강 vs 일반 전환율 비교
- 결제 CPA 추이
- 퍼널 드롭오프 분석

---

## ✅ 작업 단계별 체크리스트

### Phase 1: 기반 구축 (1-2일)
- [ ] DB 스키마 생성 (`mkt_payment_conversion`)
- [ ] 타입 정의 확장 (types.ts, dashboard.ts)
- [ ] Excel → DB 마이그레이션 스크립트 작성
- [ ] 데이터 마이그레이션 실행 & 검증

### Phase 2: API & 데이터 연동 (1일)
- [ ] API 라우트 수정 (conversion-trend)
- [ ] 데이터 페칭 로직 업데이트
- [ ] 타입 안전성 검증

### Phase 3: 대시보드 UI (2-3일)
- [ ] 결제 전환율 차트 컴포넌트 개발
- [ ] KPI 카드 추가
- [ ] 풀 퍼널 시각화 구현
- [ ] 기존 차트에 결제 데이터 통합

### Phase 4: 어드민 기능 (2일)
- [ ] 결제 전환 데이터 입력 폼
- [ ] CRUD API 엔드포인트
- [ ] 유효성 검증 & 에러 핸들링

### Phase 5: 최적화 & 테스트 (1일)
- [ ] 전체 데이터 흐름 테스트
- [ ] 성능 최적화
- [ ] 문서화

---

## 🔍 고려사항

### 데이터 정합성
- **문제**: 특강 DB + 일반 DB ≠ 총 DB (일부 주차에서 불일치 가능)
- **해결**: 검증 로직 추가, 관리자 경고 표시

### 매체별 분리
- **현재**: 특강/일반으로만 구분
- **향후**: 카카오 결제 vs 메타 결제로도 추적 가능?
  - 기술적으로 가능하나 데이터 수집 필요

### 매출 데이터 연동
- **현재**: 결제 전환율만 추적
- **향후**: 실제 결제 금액 데이터 연동 시 ROI 계산 가능
  - 교육사업본부 매출 데이터와 조인

---

## 🎯 예상 결과

### Before (현재)
```
광고비 집행 → 1차 DB → 상담 DB → ❓
```
- CPA만 측정 가능
- 실제 매출 기여도 불명확

### After (구현 후)
```
광고비 집행 → 1차 DB → 상담 DB → 결제 → 매출
             ↓        ↓        ↓      ↓
           CPA    전환율    결제율   ROI
```
- **완전한 마케팅 퍼널 추적**
- **채널별 실제 효율성 측정**
- **데이터 기반 예산 배분 결정**

---

## 📝 다음 단계

**설계안 검토 후**:
1. 사용자께서 원하시는 대시보드 형태 공유
2. 우선순위 결정 (어떤 Phase부터 시작?)
3. 단계별 실행 시작

**추가 질문**:
- 매체별(카카오/메타) 결제 전환도 추적하시겠습니까?
- Excel 일괄 업로드 기능이 필요하신가요?
- 실시간 데이터 입력 vs 주 단위 일괄 입력?


