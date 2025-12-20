# 🔬 해결 방안 재검증 보고서

## 1. 제안한 해결책: 대시보드를 report_id 기반으로 변경

### 현재 문제
- **업로드 API**: report_id로 삭제/삽입
- **대시보드**: payment_date 범위로 조회
- **결과**: 데이터 불일치 발생

### 제안한 해결책
```typescript
// AS-IS
.gte("payment_date", weekStart)
.lte("payment_date", weekEnd)

// TO-BE
.eq("report_id", reportId)
```

---

## 2. 검증 항목

### ✅ 체크 1: 대시보드의 모든 조회 지점 파악
- [ ] 현재 주차 데이터 조회
- [ ] 전주 데이터 조회
- [ ] 전년 동기 데이터 조회
- [ ] 월별 누적 데이터 조회
- [ ] 연도별 누적 데이터 조회
- [ ] 환불 데이터 조회
- [ ] 인사이트 데이터 조회

### ✅ 체크 2: report_id 기반 조회 시 문제점
1. **전주 데이터**: report_id를 어떻게 찾을까?
   - 날짜 범위로 weekly_reports를 조회해야 함
   - 그 후 해당 report_id로 transactions 조회

2. **전년 동기 데이터**: 
   - 작년 같은 주차의 report_id를 찾아야 함
   - weekly_reports의 title로 찾기? (예: "2024년 12월 3주차")

3. **월별/연도별 누적**:
   - 여러 report_id를 IN 조건으로 조회해야 함

### ✅ 체크 3: 혼합 방식의 필요성
- **단일 주차 데이터**: report_id 사용 (정확성)
- **범위 데이터** (월별, 연도별): 날짜 범위 + report_id 조합

---

## 3. 더 나은 해결책 제안

### 🎯 Option A: 하이브리드 방식 (권장)

#### 원칙
1. **현재 주차 데이터**: report_id 기반
2. **비교 데이터** (전주, 전년, 누적): 날짜 범위 + 중복 제거 로직

#### 장점
- 현재 주차 데이터는 100% 정확
- 과거 데이터도 안전하게 조회
- 중복 데이터 자동 필터링

#### 구현 예시
```typescript
// 현재 주차: report_id 기반
const currentWeek = await supabase
  .from("sales_transactions")
  .select("*")
  .eq("report_id", reportId);

// 전주: 날짜 범위 + 최신 것만 선택
const prevWeek = await supabase
  .from("sales_transactions")
  .select("*")
  .gte("payment_date", prevWeekStart)
  .lte("payment_date", prevWeekEnd)
  .order("created_at", { ascending: false });

// 중복 제거 (클라이언트 측)
const uniquePrevWeek = Array.from(
  new Map(
    prevWeek.map(tx => [
      `${tx.payment_date}_${tx.buyer}_${tx.product_name}`,
      tx
    ])
  ).values()
);
```

### 🎯 Option B: DB 제약 조건 추가 (근본적 해결)

#### DB 레벨에서 중복 방지
```sql
-- 1. 기존 중복 데이터 정리
DELETE FROM sales_transactions a
USING sales_transactions b
WHERE a.id < b.id
  AND a.payment_date = b.payment_date
  AND a.buyer = b.buyer
  AND a.product_name = b.product_name;

-- 2. Unique 제약 조건 추가
ALTER TABLE sales_transactions
ADD CONSTRAINT unique_transaction
UNIQUE (payment_date, buyer, product_name, status);
```

#### 장점
- 중복 데이터 원천 차단
- 코드 수정 최소화
- 데이터 정합성 보장

#### 단점
- 기존 데이터 정리 필요
- 정말 같은 날짜/구매자/상품으로 2번 결제하는 경우 문제 (매우 드물 것으로 예상)

---

## 4. 리스크 분석

### 🚨 Risk 1: report_id만 사용 시 문제
- **문제**: 전주/전년 데이터를 조회할 때 report_id를 찾는 추가 쿼리 필요
- **영향**: 쿼리 수 증가, 성능 저하 가능
- **해결**: 캐싱 또는 하이브리드 방식

### 🚨 Risk 2: 날짜 범위만 사용 시 문제 (현재 상태)
- **문제**: 중복 데이터 또는 잘못된 report_id 데이터까지 조회
- **영향**: 부정확한 대시보드 수치
- **해결**: 중복 제거 로직 추가 또는 DB 제약 조건

### 🚨 Risk 3: 하이브리드 방식 시 복잡도
- **문제**: 코드가 복잡해질 수 있음
- **영향**: 유지보수 어려움
- **해결**: 명확한 함수 분리, 주석 추가

---

## 5. 최종 권장 방안

### 📌 3단계 접근법

#### Phase 1: 즉시 조치 (15분)
1. **DB 중복 데이터 제거**
   ```sql
   -- verify_root_cause.sql의 Step 2로 중복 확인
   -- 중복이 있으면 최신 것만 남기고 삭제
   ```

2. **LocalStorage 초기화**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

3. **테스트**: 12월 3주차 데이터 재업로드

#### Phase 2: 단기 개선 (30분)
1. **현재 주차 조회를 report_id 기반으로 변경**
   - `app/dashboard/sales/page.tsx`의 현재 주차 조회 부분만 수정
   - 전주/전년은 기존 날짜 범위 방식 유지

2. **클라이언트 측 중복 제거 로직 추가**
   ```typescript
   function deduplicateTransactions(transactions) {
     return Array.from(
       new Map(
         transactions.map(tx => [
           `${tx.payment_date}_${tx.buyer}_${tx.product_name}_${tx.status}`,
           tx
         ])
       ).values()
     );
   }
   ```

#### Phase 3: 장기 개선 (1시간)
1. **DB Unique 제약 조건 추가**
2. **모든 조회를 하이브리드 방식으로 통일**
3. **E2E 테스트**

---

## 6. 검증 체크리스트

### Phase 1 완료 후 확인
- [ ] 12월 3주차: 4건, 1,652만원 정확히 표시
- [ ] 12월 2주차: 기존 데이터 정상 표시
- [ ] 어드민에서 데이터 삭제 → 대시보드 0원
- [ ] 어드민에서 데이터 재업로드 → 대시보드 정상

### Phase 2 완료 후 확인
- [ ] 현재 주차 데이터 정확성 100%
- [ ] 전주/전년 데이터도 정상 표시
- [ ] 중복 데이터 필터링 확인

### Phase 3 완료 후 확인
- [ ] 중복 데이터 삽입 시도 → DB 에러 발생
- [ ] 모든 주차 데이터 정상
- [ ] 성능 이슈 없음

---

## 7. 결론

### 🎯 최종 추천: Phase 1 → Phase 2 순차 진행

**Why?**
1. Phase 1만으로도 즉시 문제 해결 가능
2. Phase 2는 재발 방지
3. Phase 3는 선택적 (데이터 정합성 강화)

**시작 지점**: DB 중복 데이터 확인 및 제거

**검증 방법**: verify_root_cause.sql 실행 → 결과 분석 → 중복 제거

