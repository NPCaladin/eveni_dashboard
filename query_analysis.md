# 📊 대시보드 조회 지점 분석

## 발견된 조회 지점: 18개

### 그룹 1: 전체 데이터 조회 (라인 195-224)
**목적**: 환불 분석 + 인사이트 분석용 전체 데이터

| 라인 | 조건 | 변경 필요 |
|------|------|----------|
| 195-200 | 2024년 전체 (0-999) | ❌ 유지 (날짜 범위) |
| 203-208 | 2024년 전체 (1000-1999) | ❌ 유지 (날짜 범위) |
| 212-215 | 2025년 전체 | ❌ 유지 (날짜 범위) |

**결론**: 유지 (연도별 전체 데이터는 날짜 범위가 맞음)

---

### 그룹 2: 현재 주차 데이터 (라인 227-232)
**목적**: 선택된 주차의 결제 데이터

```typescript
const { data: currentWeekTxData } = await supabase
  .from("sales_transactions")
  .select("*")
  .gte("payment_date", weekStart)
  .lte("payment_date", weekEnd)
  .eq("status", "결");
```

**결론**: ✅ **변경 필요** (report_id 기반)

---

### 그룹 3: 비교 데이터 - 전주 (라인 237-244)
**목적**: 전주 결제 데이터

```typescript
const { data: prevWeekTxData } = await supabase
  .from("sales_transactions")
  .select("*")
  .gte("payment_date", formatDate(prevWeekStartDate))
  .lte("payment_date", formatDate(prevWeekEndDate))
  .eq("status", "결");
```

**결론**: ⚠️ **하이브리드** (weekly_reports에서 report_id 찾기 → 해당 ID로 조회)

---

### 그룹 4: 비교 데이터 - 전년 동기 (라인 247-254)
**목적**: 전년 동기 결제 데이터

**결론**: ⚠️ **하이브리드** (title 기반으로 report_id 찾기 → 해당 ID로 조회)

---

### 그룹 5: 누적 데이터 - 월별/연도별 (라인 258-269)
**목적**: 해당월/해당연도 누적 결제 데이터

**결론**: ⚠️ **하이브리드** (날짜 범위로 report_ids 찾기 → IN 조건으로 조회)

---

### 그룹 6: 환불 데이터 (라인 274-295, 673-690)
**목적**: 각 기간별 환불 데이터

**결론**: ✅ **현재 주차만 report_id, 나머지는 하이브리드**

---

### 그룹 7: 트렌드 차트용 데이터 (라인 572-616)
**목적**: 매출 추이 차트 (여러 주차 데이터)

**결론**: ✅ **report_id 기반** (generateTrendData 함수 내부)

---

## 🎯 수정 전략

### Level 1: 현재 주차만 report_id (최소 변경)
- **대상**: 그룹 2 (라인 227-232)
- **효과**: 현재 주차 데이터 100% 정확
- **리스크**: 낮음

### Level 2: 비교 데이터도 report_id (중간 변경)
- **대상**: 그룹 3, 4, 5
- **효과**: 모든 주차 데이터 정확
- **리스크**: 중간 (weekly_reports 조회 추가 필요)

### Level 3: 모든 조회 report_id (전면 변경)
- **대상**: 모든 그룹
- **효과**: 완벽한 데이터 정합성
- **리스크**: 높음 (코드 복잡도 증가)

---

## 🚀 권장 실행 계획

### Phase 1: 현재 주차만 수정 (5분)
```typescript
// 라인 227-232
const { data: currentWeekTxData } = await supabase
  .from("sales_transactions")
  .select("*")
  .eq("report_id", reportId)
  .eq("status", "결");
```

### Phase 2: 환불 데이터 수정 (5분)
```typescript
// 라인 274-277
const { data: currentWeekRefundData } = await supabase
  .from("sales_transactions")
  .select("*")
  .eq("report_id", reportId)
  .eq("status", "환");
```

### Phase 3: 비교 데이터 수정 (20분)
```typescript
// 전주 report_id 찾기
const { data: prevWeekReport } = await supabase
  .from("weekly_reports")
  .select("id")
  .eq("start_date", formatDate(prevWeekStartDate))
  .maybeSingle();

if (prevWeekReport) {
  const { data: prevWeekTxData } = await supabase
    .from("sales_transactions")
    .select("*")
    .eq("report_id", prevWeekReport.id)
    .eq("status", "결");
}
```

---

## ⚠️ 주의 사항

### 문제 1: report_id가 없는 경우
**상황**: 전주/전년 주차가 weekly_reports에 없으면?
**해결**: 
```typescript
if (!prevWeekReport) {
  // fallback: 날짜 범위로 조회
  const { data: prevWeekTxData } = await supabase
    .from("sales_transactions")
    .select("*")
    .gte("payment_date", formatDate(prevWeekStartDate))
    .lte("payment_date", formatDate(prevWeekEndDate))
    .eq("status", "결");
}
```

### 문제 2: 중복 데이터 처리
**상황**: 날짜 범위 조회 시 중복 데이터
**해결**:
```typescript
function deduplicateByKey(arr: any[], keyFn: (item: any) => string) {
  return Array.from(
    new Map(arr.map(item => [keyFn(item), item])).values()
  );
}

// 사용
const uniqueTx = deduplicateByKey(
  transactions,
  tx => `${tx.payment_date}_${tx.buyer}_${tx.product_name}_${tx.status}`
);
```

---

## 📋 테스트 체크리스트

### Phase 1 완료 후
- [ ] 12월 3주차 선택 → 4건, 1,652만원
- [ ] 12월 2주차 선택 → 기존 데이터 정상
- [ ] 전주/전년 비교는 기존 방식 (날짜 범위)

### Phase 2 완료 후
- [ ] 환불 데이터 정확성
- [ ] 환불율 계산 정확성

### Phase 3 완료 후
- [ ] 전주 대비 증감 정확
- [ ] 전년 대비 증감 정확
- [ ] 월별/연도별 누적 정확

---

## 🎯 최종 결론

**1단계 (즉시)**: Phase 1 + Phase 2 (현재 주차 + 환불)
- 시간: 10분
- 효과: 현재 주차 데이터 100% 정확
- 리스크: 거의 없음

**2단계 (선택)**: Phase 3 (비교 데이터)
- 시간: 20분
- 효과: 전체 정확성 향상
- 리스크: 낮음 (fallback 로직 포함)

**시작**: DB 중복 데이터 제거 후 Phase 1부터 시작!






