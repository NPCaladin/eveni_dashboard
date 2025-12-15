# 이븐아이 주간보고 대시보드

게임회사 취업 교육기관 '이븐아이'의 주간 업무 보고 대시보드 관리자 페이지입니다.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Database**: Supabase (PostgreSQL)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 데이터베이스 스키마 설정

`supabase_schema.sql` 파일의 내용을 Supabase SQL Editor에서 실행하여 테이블을 생성하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
├── app/
│   ├── admin/              # 관리자 페이지
│   │   ├── education/     # 교육사업본부
│   │   ├── management/     # 경영혁신실
│   │   ├── marketing/      # 마케팅본부
│   │   └── settings/       # 설정
│   └── layout.tsx          # 루트 레이아웃
├── components/
│   ├── education/          # 교육사업본부 컴포넌트
│   ├── layout/            # 레이아웃 컴포넌트
│   └── ui/                # Shadcn/ui 컴포넌트
├── hooks/
│   ├── use-weekly-report.ts  # 주간 보고서 훅
│   └── use-toast.ts          # Toast 훅
├── lib/
│   ├── supabase/          # Supabase 클라이언트 및 타입
│   └── utils.ts           # 유틸리티 함수
└── supabase_schema.sql    # 데이터베이스 스키마
```

## 주요 기능

### 🌟 프리미엄 대시보드 (`/dashboard/premium`)

교육사업본부 전용 데이터 중심 인사이트 대시보드

#### Row 1: Executive Summary Bar
- **4대 핵심 KPI 카드**
  - 주간 순매출 (전주/전년 대비)
  - 전환 건강도 (환불률 기반)
  - 1타 집중도 (상품 믹스)
  - 재결제 비중 (Mini Sparkline)

#### Row 2: Revenue Intelligence
- **Triple-Layer Revenue Chart**
  - 2025 주문액/실매출 (Area + Bar)
  - 2024 동기 실매출 비교 (Line)
  - 환불 발생액 (Area)
  - 환불률 추이 (우측 Y축)
- **월별 Waterfall 차트**
  - 전월 대비 증감 시각화
  - 월별 환불률 히트맵

#### Row 3: Product & Customer Analytics
- **Double Donut Chart**: 상품군 × 판매유형
- **Sales by Agent**: 판매자별 성과 (환불률 기반 색상)
- **Cohort Retention Table**: 결제월별 환불 발생 시점 히트맵
- **AI Alert Box**: 자동 이상 탐지 및 인사이트

#### Row 4: Resource & Capacity Planning
- **Consultant Availability Matrix**: 직군 × 상태 히트맵 (Badge UI)
- **Weekly Capacity vs Demand**: 가용 인력/투입 인력 트렌드

#### Row 5: Operational Logs
- **멘토링 현황 Tab**
  - 배정/신규/누적 멘티 메트릭스
  - 이슈 타임라인 (Accordion)
  - 직군별 필터링
- **미개시 환불 추적 Tab**
  - 2024년 환불 추적 테이블
  - 금액/건수 합계 Summary
- **진행 업무 Status Tab**
  - Kanban 스타일 (예정/진행중/완료)
  - Progress Bar 및 담당자 표시

### 교육사업본부 관리 (`/admin/education`)

1. **엑셀 업로드 섹션**
   - 매출 데이터 자동 파싱
   - 거래 내역 일괄 업로드

2. **매출 입력 섹션**
   - 매출 요약 테이블 (실매출/순매출)
   - 상품별 판매 현황

3. **멘토링 이슈 섹션**
   - 멘토별 이슈 입력
   - 동적 멘토 추가/삭제

4. **컨설턴트 리소스 현황**
   - 직군별 리소스 상태 관리
   - 드롭다운으로 상태 선택

## 데이터베이스 스키마

주요 테이블:
- `weekly_reports`: 주간 보고서 메타데이터
- `edu_revenue_stats`: 매출 통계
- `edu_product_sales`: 상품별 판매 현황
- `edu_mentoring_reports`: 멘토링 보고
- `consultant_resources`: 컨설턴트 리소스 현황

자세한 스키마는 `supabase_schema.sql` 파일을 참조하세요.

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.



