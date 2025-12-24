# 🔬 근본 원인 분석 보고서

## 1. 문제 요약
- **증상**: 엑셀 업로드 후 대시보드에 표시되는 데이터가 업로드한 데이터와 다름
- **예**: 12월 3주차에 4건 (1,652만원) 업로드 → 대시보드에 7건 (3,520만원) 표시

---

## 2. 근본 원인 파악

### 🚨 **데이터 조회 방식의 불일치**

#### 업로드 API (`/api/upload/migration/route.ts`)
```typescript
// 삭제 시 report_id 기반
await supabase
  .from("sales_transactions")
  .delete()
  .eq("report_id", reportId);

// 삽입 시 report_id 포함
{
  report_id: reportId,
  payment_date: r.payment_date,
  // ... 기타 필드
}
```

#### 대시보드 (`app/dashboard/sales/page.tsx` 라인 227-232)
```typescript
// 조회 시 payment_date 범위 기반 (report_id 사용 안 함!)
const { data: currentWeekTxData } = await supabase
  .from("sales_transactions")
  .select("*")
  .gte("payment_date", weekStart)
  .lte("payment_date", weekEnd)
  .eq("status", "결");
```

---

## 3. 문제 시나리오

### Case 1: 중복 데이터
1. 12월 3주차 데이터를 처음 업로드 (report_id: A)
2. 삭제 버튼을 눌렀지만 DB에 데이터가 남음
3. 다시 업로드 (report_id: A에 또 삽입)
4. **대시보드**: 날짜 범위로 조회하므로 중복된 데이터를 모두 가져옴

### Case 2: 다른 주차에 데이터 존재
1. 12월 3주차 (2025-12-15 ~ 2025-12-21) 선택
2. DB에는 같은 날짜 범위에 다른 report_id의 데이터도 존재
3. **대시보드**: 날짜 범위로 조회하므로 모든 report_id의 데이터를 가져옴

### Case 3: localStorage의 report_id와 DB의 report_id 불일치
1. localStorage에 저장된 report_id: `f8aec082-230a-403e-b520-f67291484f26` (잘못된 ID)
2. 실제 DB의 12월 3주차 report_id: `0d1bc50d-fe6e-44ea-bd5c-3dbf5bebbfd6` (올바른 ID)
3. **업로드**: 잘못된 ID로 삭제/삽입 시도 → 실패 또는 다른 주차 데이터 영향
4. **대시보드**: 날짜 범위로 조회하므로 다른 주차의 데이터도 섞임

---

## 4. 실제 검증

### 엑셀 파싱 결과 (deep_analysis_root_cause.js)
```
✅ 파싱 성공: 4건
예상 실매출: 16,521,200원
```

### DB 쿼리 필요
```sql
-- 12월 3주차 날짜 범위의 모든 데이터 (report_id 무관)
SELECT 
  report_id,
  payment_date,
  buyer,
  payment_amount,
  status
FROM sales_transactions
WHERE payment_date >= '2025-12-15'
  AND payment_date <= '2025-12-21'
  AND status = '결'
ORDER BY payment_date, created_at;
```

이 쿼리 결과가 7건이면 → 중복 데이터 확인!

---

## 5. 해결 방안

### 🎯 Option A: 대시보드 조회 로직 수정 (권장)
**장점**: 데이터 정합성 보장, 주차별 독립성 유지
**단점**: 코드 수정 필요

```typescript
// AS-IS (날짜 범위)
.gte("payment_date", weekStart)
.lte("payment_date", weekEnd)

// TO-BE (report_id 기반)
.eq("report_id", reportId)
```

### 🎯 Option B: DB 제약 조건 추가
**장점**: 중복 데이터 원천 차단
**단점**: 기존 데이터 정리 필요

```sql
-- report_id + payment_date + buyer 조합으로 unique 제약
ALTER TABLE sales_transactions
ADD CONSTRAINT unique_transaction 
UNIQUE (report_id, payment_date, buyer, product_name);
```

### 🎯 Option C: 현재 DB 데이터 완전 정리 후 재업로드
**장점**: 깨끗한 시작
**단점**: 모든 주차 데이터 재업로드 필요

---

## 6. 즉시 조치 사항

1. **DB 중복 데이터 확인**
   ```sql
   SELECT 
     payment_date,
     buyer,
     product_name,
     COUNT(*) as cnt
   FROM sales_transactions
   WHERE payment_date >= '2025-12-15'
     AND payment_date <= '2025-12-21'
   GROUP BY payment_date, buyer, product_name
   HAVING COUNT(*) > 1;
   ```

2. **중복 제거 (최신 것만 유지)**
   ```sql
   DELETE FROM sales_transactions
   WHERE id NOT IN (
     SELECT MAX(id)
     FROM sales_transactions
     WHERE payment_date >= '2025-12-15'
       AND payment_date <= '2025-12-21'
     GROUP BY payment_date, buyer, product_name
   );
   ```

3. **대시보드 조회 로직 수정** (코드 수정)

4. **LocalStorage 초기화**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

---

## 7. 결론

**근본 원인**: 
- 업로드 API는 `report_id` 기반으로 데이터를 관리
- 대시보드는 `payment_date` 범위 기반으로 데이터를 조회
- 이로 인해 중복 데이터나 다른 주차의 데이터가 섞여서 표시됨

**해결책**:
1. 대시보드 조회 로직을 `report_id` 기반으로 변경
2. DB 중복 데이터 제거
3. LocalStorage 초기화

**예상 소요 시간**: 30분 (코드 수정 + DB 정리 + 테스트)






