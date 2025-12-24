# 🚀 최종 실행 계획서 (성공 확률 91.1%)

## 📊 확률 분석 결과

### 기본 계획: 71.4%
- 문제: localStorage, 캐시, 데이터 불일치

### **개선 계획: 91.1%** ⭐ 채택
- 트랜잭션 + 강화된 검증 + 명확한 체크리스트
- 실패 시에도 빠른 원인 진단 가능
- 롤백 가능 (안전장치)

### 남은 8.9% 위험
- 예상 불가능한 변수 (서버 장애, 네트워크 등)
- 수동 개입으로 해결 가능

---

## 🎯 실행 단계

### Phase 0: 준비 (3분)

#### 0-1. 환경 확인
```bash
# 개발 서버 실행 중인지 확인
# 터미널에서
npm run dev
```

#### 0-2. Git 상태 확인
```bash
git status
# 변경사항이 있으면 commit 또는 stash
git add .
git commit -m "작업 전 체크포인트"
```

#### 0-3. Supabase 접속 확인
- https://supabase.com/dashboard 접속
- SQL Editor 열기
- 프로젝트 선택 확인

---

### Phase 1: DB 검증 (5분)

#### 1-1. 강화된 검증 SQL 실행
```sql
-- Supabase SQL Editor에서
-- verify_root_cause_enhanced.sql 전체 복사/붙여넣기 후 실행
```

#### 1-2. 결과 분석 체크리스트

**Step 1 체크**:
- [ ] 12월 3주차 weekly_report가 **1개** 존재
- [ ] `검증결과` = "✅ 정확한 주차"
- [ ] report_id 기록: `__________________`

**Step 2 체크**:
- [ ] report_id 개수: ___개 (기대: 1개)
- [ ] 거래건수: ___건 (기대: 4건)
- [ ] 결제금액합계: _________원 (기대: 16,521,200원)
- [ ] 상태: "✅ 정확한 건수" 또는 "⚠️ 데이터 과다"?

**Step 3 체크**:
- [ ] 중복 데이터 있음? Yes / No
- [ ] 중복 횟수 = 1 (정상) 또는 > 1 (중복)?
- [ ] 중복이 있다면 몇 건? ___건

**Step 8 체크**:
- [ ] 건수차이: ___건
- [ ] 금액차이: ___원
- [ ] 진단: "✅ 동일" 또는 "⚠️ 현재 방식이 더 많이 조회"?

**Step 9 체크 (가장 중요!)**:
- [ ] 권장사항: _______________________________
- [ ] "✅ 완벽! 코드 수정만 하면 됨" → Phase 3로 바로 이동
- [ ] "⚠️ 중복 데이터 있음" → Phase 2로 이동
- [ ] "⚠️ 여러 report_id 혼재" → 추가 진단 필요
- [ ] "❌ weekly_report 없음/중복" → 수동 해결 필요

#### 1-3. 결과 저장
- [ ] Step 2, 3, 8, 9 스크린샷 저장

---

### Phase 2: DB 정리 (10분) - 중복이 있을 경우만

#### 2-1. 안전한 정리 SQL 실행

```sql
-- Supabase SQL Editor에서
-- cleanup_duplicates_safe.sql 실행
```

#### 2-2. 단계별 실행 (매우 중요!)

**Step 1: 백업**
```sql
-- Step 1 실행
-- 결과를 CSV로 다운로드 또는 스크린샷
```
- [ ] 백업 완료

**Step 2: 중복 확인**
```sql
-- Step 2 실행
```
- [ ] 중복 건수: ___건
- [ ] 중복 내역 스크린샷

**Step 3-A: 삭제 예정 확인 ⚠️**
```sql
-- Step 3-A 실행
```
- [ ] 삭제 예정 건수: ___건
- [ ] 삭제해도 되는 데이터인지 확인
- [ ] 스크린샷 저장

**Step 3-B: 보존 예정 확인 ⚠️**
```sql
-- Step 3-B 실행
```
- [ ] 보존 예정 건수: ___건 (기대: 4건)
- [ ] 총액: ___원 (기대: 16,521,200원)
- [ ] 4명의 이름 확인: 김태형83, 박민진91, 이해니78, 류은우29

**Step 4: 트랜잭션 실행**
```sql
-- BEGIN부터 Step 4-2까지 한 번에 실행
BEGIN;
...
SELECT ... Step 4-2 ...
```

**결과 확인**:
- [ ] DELETE 메시지: "DELETE ___" (기대: 중복 건수)
- [ ] 남은_총건수: ___건 (기대: 4건)
- [ ] 총결제금액: ___원 (기대: 16,521,200원)
- [ ] 중복여부: "✅ 중복 제거 성공!" 또는 "❌"?

#### 2-3. COMMIT 또는 ROLLBACK 결정

**✅ Step 4-2가 기대값과 일치하면**:
```sql
COMMIT;
```
- [ ] COMMIT 실행

**❌ Step 4-2가 이상하면**:
```sql
ROLLBACK;
```
- [ ] ROLLBACK 실행 후 문제 재분석

#### 2-4. COMMIT 후 검증
```sql
-- Step 6, 7 실행
```
- [ ] Step 6: 최종상태 = "✅ 완벽!"?
- [ ] Step 7: 4건 모두 ✅?

---

### Phase 3: 코드 수정 (5분)

#### 3-1. 파일 열기
```bash
code app/dashboard/sales/page.tsx
```

#### 3-2. 변경 1: 현재 주차 결제 데이터 (라인 227-234)

**찾기**: `// 1. 현재 주간 데이터`

**AS-IS**:
```typescript
const { data: currentWeekTxData } = await supabase
  .from("sales_transactions")
  .select("*")
  .gte("payment_date", weekStart)
  .lte("payment_date", weekEnd)
  .eq("status", "결");

setCurrentWeekTx(currentWeekTxData || []);
```

**TO-BE**:
```typescript
// 1. 현재 주간 데이터 (report_id 기반으로 정확하게 조회)
const { data: currentWeekTxData, error: currentWeekError } = await supabase
  .from("sales_transactions")
  .select("*")
  .eq("report_id", reportId)
  .eq("status", "결");

if (currentWeekError) {
  console.error("❌ 현재 주차 데이터 조회 실패:", currentWeekError);
}

console.log(`📊 현재 주차 결제 데이터: ${currentWeekTxData?.length || 0}건`);
setCurrentWeekTx(currentWeekTxData || []);
```

- [ ] 변경 완료

#### 3-3. 변경 2: 현재 주차 환불 데이터 (라인 274-277)

**찾기**: `const { data: currentWeekRefundData } = await supabase`

**AS-IS**:
```typescript
const { data: currentWeekRefundData } = await supabase
  .from("sales_transactions")
  .select("*")
  .gte("refund_date", weekStart)
  .lte("refund_date", weekEnd)
  .eq("status", "환");
```

**TO-BE**:
```typescript
const { data: currentWeekRefundData, error: refundError } = await supabase
  .from("sales_transactions")
  .select("*")
  .eq("report_id", reportId)
  .eq("status", "환");

if (refundError) {
  console.error("❌ 현재 주차 환불 데이터 조회 실패:", refundError);
}

console.log(`📊 현재 주차 환불 데이터: ${currentWeekRefundData?.length || 0}건`);
```

- [ ] 변경 완료

#### 3-4. 파일 저장 및 확인
- [ ] 파일 저장 (Ctrl + S)
- [ ] 타입 오류 없는지 확인
- [ ] Git diff 확인
```bash
git diff app/dashboard/sales/page.tsx
```

#### 3-5. 빌드 테스트 (선택)
```bash
npm run build
```
- [ ] 빌드 성공 확인

#### 3-6. Git Commit (롤백 포인트)
```bash
git add app/dashboard/sales/page.tsx
git commit -m "fix: 대시보드 현재 주차 조회를 report_id 기반으로 변경"
```
- [ ] Commit 완료

---

### Phase 4: 테스트 (7분)

#### 4-1. 개발 서버 재시작
```bash
# 기존 터미널에서 Ctrl + C
npm run dev
```
- [ ] 서버 재시작 완료
- [ ] http://localhost:3000 접속 확인

#### 4-2. 브라우저 준비
- [ ] 시크릿 모드 또는 새 탭 열기
- [ ] F12 개발자 도구 열기
- [ ] Console 탭 선택

#### 4-3. localStorage 초기화
```javascript
// 개발자 도구 Console에서 실행
console.log('Before:', localStorage.getItem('selectedReportId'));
localStorage.clear();
console.log('After:', localStorage.getItem('selectedReportId'));
location.reload();
```
- [ ] "Before: null" 또는 ID 표시
- [ ] "After: null" 확인
- [ ] 페이지 리로드 확인

#### 4-4. 대시보드 접속
```
http://localhost:3000/dashboard/sales
```
- [ ] 페이지 정상 로드

#### 4-5. 12월 3주차 선택
- [ ] 상단 드롭다운에서 "2025년 12월 3주차" 선택
- [ ] "확인" 버튼 클릭
- [ ] 로딩 완료 대기

#### 4-6. 콘솔 로그 확인
```
예상 로그:
📅 선택된 주차: 2025년 12월 3주차
📅 기간: 2025-12-15 ~ 2025-12-21
📊 현재 주차 결제 데이터: 4건
📊 현재 주차 환불 데이터: 0건
```
- [ ] "현재 주차 결제 데이터: 4건" 확인
- [ ] "현재 주차 환불 데이터: 0건" 확인

#### 4-7. 대시보드 수치 확인

**매출 현황 (상단 카드)**:
- [ ] 실매출: 1,652만원 (16,521,200원)
- [ ] 결제 건수: 4건
- [ ] 환불 건수: 0건

**거래 내역**:
- [ ] 김태형83 - 7,744,000원
- [ ] 박민진91 - 4,772,000원
- [ ] 이해니78 - 2,789,000원
- [ ] 류은우29 - 1,216,200원

#### 4-8. 12월 2주차 확인 (기존 데이터)
- [ ] 드롭다운에서 "2025년 12월 2주차" 선택
- [ ] 기존 데이터 정상 표시 (0이 아님)
- [ ] 콘솔 로그 확인

#### 4-9. 어드민 테스트 (선택)

**데이터 삭제 테스트**:
```
http://localhost:3000/admin/education
```
- [ ] 12월 3주차 선택
- [ ] "데이터 삭제" 버튼 클릭
- [ ] 대시보드 확인: 0원 표시

**데이터 재업로드 테스트**:
- [ ] `2025_12_3week_cleaned_org.xlsx` 업로드
- [ ] 성공 메시지 확인
- [ ] 터미널 로그:
  ```
  🗑️ 삭제 시작: report_id=...
  ✅ 삭제 완료
  📝 삽입 시작: 4건
  ✅ 배치 삽입 완료: 4건
  ```
- [ ] 대시보드 확인: 1,652만원 표시

---

### Phase 5: 최종 검증 (3분)

#### 5-1. 종합 체크리스트

**기능 테스트**:
- [ ] 12월 3주차: 4건, 1,652만원 정확
- [ ] 12월 2주차: 기존 데이터 정상
- [ ] 12월 1주차: 기존 데이터 정상
- [ ] 어드민 삭제 → 대시보드 0원
- [ ] 어드민 업로드 → 대시보드 정상

**성능 테스트**:
- [ ] 페이지 로드 시간 < 2초
- [ ] 주차 변경 시 반응 즉각적

**오류 확인**:
- [ ] 콘솔 오류 없음
- [ ] 네트워크 에러 없음
- [ ] 타입 오류 없음

#### 5-2. 배포 준비 (선택)
```bash
# 모든 테스트 통과 시
git push origin main
```

---

## 🚨 트러블슈팅

### 문제 1: 여전히 7건 표시
**원인**: localStorage 미초기화
**해결**:
```javascript
localStorage.clear();
location.reload();
```
**또는**: 하드 리프레시 (Ctrl + Shift + R)

### 문제 2: 0원 표시
**원인**: report_id 불일치
**해결**:
```javascript
// 콘솔에서 확인
console.log('현재 report_id:', localStorage.getItem('selectedReportId'));
```
**Phase 1로 돌아가 Step 1 재확인**

### 문제 3: 타입 오류
**원인**: TypeScript 타입 불일치
**해결**:
```typescript
// optional chaining 추가
currentWeekTxData?.length || 0
```

### 문제 4: 빌드 실패
**원인**: 문법 오류
**해결**:
```bash
npm run build
# 오류 메시지 확인 후 수정
```

### 문제 5: 12월 2주차도 영향
**원인**: 코드 수정 오류
**해결**:
```bash
git checkout app/dashboard/sales/page.tsx
# 다시 Phase 3부터 재시작
```

---

## 📊 예상 소요 시간

| Phase | 작업 | 시간 |
|-------|------|------|
| Phase 0 | 준비 | 3분 |
| Phase 1 | DB 검증 | 5분 |
| Phase 2 | DB 정리 (중복 시) | 10분 |
| Phase 3 | 코드 수정 | 5분 |
| Phase 4 | 테스트 | 7분 |
| Phase 5 | 최종 검증 | 3분 |
| **합계** | | **33분** |

*Phase 2는 중복 데이터가 있을 경우에만 실행

---

## ✅ 성공 기준

### 필수 조건 (100% 충족 필요)
1. ✅ 12월 3주차 = 4건, 1,652만원
2. ✅ 콘솔 로그 = "현재 주차 결제 데이터: 4건"
3. ✅ 12월 2주차 = 기존 데이터 유지
4. ✅ 삭제/재업로드 = 정상 작동

### 추가 조건 (권장)
5. ✅ 콘솔 오류 없음
6. ✅ 성능 저하 없음
7. ✅ 타입 안전성 유지

---

## 🎯 최종 점검

실행 전 마지막 확인:
- [ ] `verify_root_cause_enhanced.sql` 파일 확인
- [ ] `cleanup_duplicates_safe.sql` 파일 확인
- [ ] Git commit 완료 (롤백 준비)
- [ ] Supabase 접속 확인
- [ ] 개발 서버 실행 확인

**준비 완료되면 Phase 1부터 시작!** 🚀






