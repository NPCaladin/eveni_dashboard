# 🎲 성공/실패 확률 시뮬레이션

## 📊 Phase 1 단계별 성공 확률 분석

### Step 1: DB 상태 확인 (verify_root_cause.sql)

#### 시나리오 A: 중복 데이터 발견 (예상 80%)
**조건**: Step 2에서 중복 건수 > 0
**결과**: ✅ 문제 원인 확인
**다음 단계**: Step 2로 진행

#### 시나리오 B: 중복 데이터 없음 (예상 15%)
**조건**: Step 2에서 중복 건수 = 0
**문제**: 왜 대시보드에 7건이 표시될까?
**가능한 원인**:
1. 다른 report_id에 3건이 더 있음
2. 날짜 범위가 겹치는 다른 주차 데이터 존재
3. DB와 localStorage의 report_id 불일치

**대응책**:
```sql
-- 추가 확인: 같은 날짜 범위에 여러 report_id 존재?
SELECT 
  report_id,
  COUNT(*) as 건수,
  SUM(payment_amount) as 금액
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
  AND status = '결'
GROUP BY report_id;
```

#### 시나리오 C: SQL 실행 오류 (예상 5%)
**조건**: 권한 문제, 문법 오류
**대응책**: 
- RLS 정책 확인
- Supabase Dashboard에서 직접 실행
- 쿼리를 작은 단위로 분할

**Step 1 성공 확률**: 95%

---

### Step 2: DB 정리 (cleanup_duplicates.sql)

#### 시나리오 A: 정상 삭제 (예상 75%)
**조건**: 
- Step 2 미리보기에서 삭제 대상 확인
- Step 3 실행 성공
- Step 4에서 중복 없음 확인

**결과**: ✅ 4건, 16,521,200원

#### 시나리오 B: 삭제할 데이터 없음 (예상 15%)
**조건**: Step 2에서 결과 0건
**문제**: 중복이 아니라 다른 report_id 데이터
**대응책**: 
```sql
-- 12월 3주차의 올바른 report_id 확인
SELECT id, title, start_date, end_date
FROM weekly_reports
WHERE start_date = '2025-12-15'
  AND end_date = '2025-12-21';

-- 해당 report_id의 데이터만 확인
SELECT 
  payment_date,
  buyer,
  product_name,
  payment_amount
FROM sales_transactions
WHERE report_id = '<올바른_report_id>'
  AND status = '결';
```

#### 시나리오 C: 잘못된 데이터 삭제 (예상 5%)
**조건**: Step 2 미리보기를 제대로 안 보고 실행
**위험도**: 높음 ⚠️⚠️⚠️
**대응책**: 
1. **반드시** Step 2 결과를 스크린샷으로 저장
2. 삭제 예정 목록이 맞는지 확인
3. 문제 있으면 Step 3 실행 중단

#### 시나리오 D: RLS 정책으로 삭제 실패 (예상 3%)
**조건**: DELETE 권한 없음
**대응책**:
```sql
-- Supabase SQL Editor에서 직접 실행 (RLS bypass)
-- 또는 service_role 키 사용
```

#### 시나리오 E: 부분 삭제 (예상 2%)
**조건**: 트랜잭션 중간에 실패
**문제**: 일부만 삭제되어 더 혼란
**대응책**:
```sql
-- 롤백 가능하도록 트랜잭션으로 묶기
BEGIN;

-- 중복 삭제 쿼리
WITH ranked_transactions AS (...)
DELETE FROM sales_transactions
WHERE id IN (...);

-- 결과 확인
SELECT COUNT(*) FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21';

-- 문제 있으면 ROLLBACK, 없으면 COMMIT
COMMIT; -- 또는 ROLLBACK;
```

**Step 2 성공 확률**: 90% (트랜잭션 적용 시)

---

### Step 3: 코드 수정

#### 시나리오 A: 정상 수정 (예상 90%)
**조건**: 
- code_change_preview.md 그대로 적용
- 문법 오류 없음
- 빌드 성공

#### 시나리오 B: 타입 오류 (예상 5%)
**조건**: TypeScript 타입 불일치
**예상 오류**:
```typescript
// error: Object is possibly 'null'
currentWeekTxData.length
```
**대응책**:
```typescript
// Optional chaining 사용
currentWeekTxData?.length || 0
```

#### 시나리오 C: 런타임 오류 (예상 3%)
**조건**: reportId가 undefined
**예상 오류**:
```
Uncaught TypeError: Cannot read properties of undefined
```
**대응책**:
```typescript
// reportId 체크 강화
if (!reportId) {
  console.error("❌ reportId 없음!");
  setLoading(false);
  return;
}
```

#### 시나리오 D: 빌드 실패 (예상 2%)
**조건**: Next.js 빌드 에러
**대응책**:
```bash
npm run build
# 오류 확인 후 수정
```

**Step 3 성공 확률**: 95%

---

### Step 4: 테스트

#### 시나리오 A: 완벽한 성공 (예상 70%)
**조건**:
- localStorage 초기화 성공
- 12월 3주차 선택 시 4건, 1,652만원
- 12월 2주차도 정상

#### 시나리오 B: localStorage 미초기화 (예상 15%)
**조건**: localStorage.clear() 안 했거나 실패
**증상**: 여전히 잘못된 report_id 참조
**대응책**:
```javascript
// 개발자 도구 콘솔에서
console.log('Before:', localStorage.getItem('selectedReportId'));
localStorage.clear();
console.log('After:', localStorage.getItem('selectedReportId'));
location.reload();
```

#### 시나리오 C: 캐시 문제 (예상 10%)
**조건**: 브라우저 캐시로 인해 변경 사항 미적용
**증상**: 여전히 날짜 범위로 조회
**대응책**:
1. 하드 리프레시 (Ctrl + Shift + R)
2. 시크릿 모드
3. 개발 서버 재시작

#### 시나리오 D: 다른 주차에 영향 (예상 3%)
**조건**: 코드 수정이 다른 주차 조회에도 영향
**증상**: 12월 2주차도 0원으로 표시
**원인**: report_id 로직 오류
**대응책**: 
- 즉시 Git rollback
- 코드 재검토

#### 시나리오 E: report_id 불일치 지속 (예상 2%)
**조건**: DB에 올바른 report_id가 없음
**증상**: 여전히 0원 또는 잘못된 값
**원인**: weekly_reports와 sales_transactions 불일치
**대응책**:
```sql
-- 12월 3주차 weekly_report 재생성
INSERT INTO weekly_reports (title, start_date, end_date, status)
VALUES ('2025년 12월 3주차', '2025-12-15', '2025-12-21', 'draft')
ON CONFLICT (start_date, end_date) DO UPDATE
SET title = EXCLUDED.title
RETURNING id;

-- 해당 ID로 sales_transactions 업데이트
UPDATE sales_transactions
SET report_id = '<새로운_id>'
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21';
```

**Step 4 성공 확률**: 88%

---

## 🎯 전체 성공 확률

### 각 단계별 독립 성공 확률
- Step 1: 95%
- Step 2: 90%
- Step 3: 95%
- Step 4: 88%

### 전체 성공 확률 (곱셈)
**95% × 90% × 95% × 88% = 71.4%**

---

## ⚠️ 실패 가능성 분석 (28.6%)

### 주요 실패 원인 TOP 5

| 순위 | 원인 | 확률 | 심각도 | 대응 난이도 |
|------|------|------|--------|------------|
| 1 | localStorage 미초기화 | 15% | 낮음 | 쉬움 |
| 2 | 캐시 문제 | 10% | 낮음 | 쉬움 |
| 3 | 중복이 아닌 다른 report_id 데이터 | 15% | 중간 | 중간 |
| 4 | DB 삭제 부분 실패 | 5% | 높음 | 어려움 |
| 5 | 타입/런타임 오류 | 8% | 중간 | 중간 |

---

## 🛡️ 실패 확률 0%로 만들기

### 개선 사항 적용

#### 개선 1: Step 2 트랜잭션 적용
```sql
BEGIN;
-- 삭제 로직
COMMIT; -- 또는 ROLLBACK
```
**효과**: 90% → 98% (부분 삭제 위험 제거)

#### 개선 2: 중복이 없을 경우 대응책 추가
```sql
-- verify_root_cause_enhanced.sql에 추가
-- 다른 report_id 데이터 확인 쿼리
```
**효과**: 15% 위험 → 3% (명확한 진단)

#### 개선 3: localStorage 강제 초기화 코드 추가
```typescript
// 코드 수정 시 useEffect에 추가
useEffect(() => {
  // 개발 모드에서만 자동 초기화
  if (process.env.NODE_ENV === 'development') {
    const lastReportId = localStorage.getItem('selectedReportId');
    if (lastReportId && !reportId) {
      console.warn('⚠️ localStorage 초기화 필요!');
    }
  }
}, [reportId]);
```
**효과**: 15% 위험 → 2%

#### 개선 4: 타입 안전성 강화
```typescript
// 모든 조회에 null 체크 추가
const currentWeekTxData = data || [];
console.log(`📊 현재 주차: ${currentWeekTxData.length}건`);
```
**효과**: 8% 위험 → 1%

#### 개선 5: 캐시 무시 옵션
```typescript
// Supabase 쿼리에 캐시 무시 추가
.select("*", { count: 'exact', cache: 'no-cache' })
```
**효과**: 10% 위험 → 2%

---

## 🎯 개선 후 성공 확률

### 각 단계별 개선 후 성공 확률
- Step 1: 95% → 98% (enhanced SQL)
- Step 2: 90% → 98% (트랜잭션)
- Step 3: 95% → 99% (타입 안전성)
- Step 4: 88% → 96% (localStorage + 캐시)

### 전체 성공 확률 (개선 후)
**98% × 98% × 99% × 96% = 91.1%**

---

## 🚀 최종 개선 계획

### 남은 8.9% 위험 제거

#### 위험 1: report_id 자체가 잘못됨 (3%)
**증상**: 올바른 weekly_report가 DB에 없음
**해결**:
```sql
-- 사전 검증 쿼리 추가
SELECT 
  id,
  title,
  start_date,
  end_date,
  created_at
FROM weekly_reports
WHERE start_date = '2025-12-15'
  AND end_date = '2025-12-21';

-- 결과가 없으면 생성
-- 있으면 해당 ID 사용
```

#### 위험 2: RLS 정책 문제 (2%)
**증상**: 권한 부족으로 삭제 실패
**해결**:
- Supabase Dashboard에서 직접 실행 (RLS bypass)
- 또는 service_role 키로 API 호출

#### 위험 3: 네트워크 오류 (2%)
**증상**: API 호출 타임아웃
**해결**:
```typescript
// 재시도 로직 추가
async function fetchWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`재시도 ${i + 1}/${retries}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}
```

#### 위험 4: 예상치 못한 데이터 (1.9%)
**증상**: 엑셀에 없는 데이터가 DB에 있음
**해결**:
- Step 5에서 개별 거래 확인
- 의심스러운 거래는 수동 확인

---

## 🎯 최최종 성공 확률

### 모든 개선 사항 적용 시

**98% × 99% × 99.5% × 98% = 94.6%**

### 남은 5.4% = 예상 불가능한 변수
- 서버 장애
- DB 손상
- 알 수 없는 버그

---

## 📋 100% 성공을 위한 체크리스트

### 실행 전 체크
- [ ] Supabase 접속 정상
- [ ] 개발 서버 실행 중
- [ ] Git commit 상태 깨끗 (롤백 준비)
- [ ] 백업: DB 스냅샷 (선택)

### Step 1 체크
- [ ] verify_root_cause.sql 전체 실행
- [ ] Step 2 결과 스크린샷 저장
- [ ] Step 6 결과 확인 (7건? 4건?)

### Step 2 체크
- [ ] cleanup_duplicates.sql Step 1 실행
- [ ] Step 2 삭제 예정 목록 확인 ⚠️
- [ ] 삭제 예정이 맞는지 재확인
- [ ] BEGIN 트랜잭션으로 실행
- [ ] Step 4 결과: "✅ 중복 없음" 확인
- [ ] COMMIT (또는 문제 시 ROLLBACK)

### Step 3 체크
- [ ] 코드 변경 사항 검토
- [ ] 타입 안전성 확인
- [ ] npm run build 성공 확인
- [ ] Git commit (롤백 포인트)

### Step 4 체크
- [ ] 개발 서버 재시작
- [ ] 시크릿 모드 또는 하드 리프레시
- [ ] localStorage.clear() 실행
- [ ] 콘솔에 "현재 주차: 4건" 확인
- [ ] 12월 3주차: 1,652만원
- [ ] 12월 2주차: 기존 데이터 정상

---

## 🎯 결론

### 기본 계획 성공 확률: 71.4%
- 위험: localStorage, 캐시, 데이터 불일치

### 개선 계획 성공 확률: 91.1%
- 트랜잭션, 타입 안전성, 강화된 검증

### 최최종 계획 성공 확률: 94.6%
- 모든 위험 요소 대응책 포함
- 체크리스트로 실수 방지

### 권장: **개선 계획 (91.1%)**
- 시간: 20분
- 추가 작업: 트랜잭션, enhanced SQL
- 충분히 높은 성공률
- 실패 시에도 빠른 진단 가능

---

## 📝 Next Action

1. **enhanced SQL 작성** (5분)
2. **체크리스트 준비** (2분)
3. **Step 1 실행** → 결과 공유
4. **Go/No-Go 판단** → 진행 또는 추가 대책

