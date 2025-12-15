# 배포 가이드 (Vercel)

## 1. 빌드 준비

현재 일부 TypeScript 타입 에러가 있습니다. 먼저 빌드가 성공하도록 수정해야 합니다.

```bash
npm run build
```

빌드가 성공하면 다음 단계로 진행하세요.

## 2. Git 저장소 설정

```bash
# Git 초기화 (이미 되어 있다면 생략)
git init

# .gitignore 확인 (node_modules, .next, .env.local 등이 제외되어 있어야 함)
# 필요시 .gitignore 파일 확인

# 변경사항 커밋
git add .
git commit -m "Deploy to Vercel"
```

## 3. GitHub/GitLab 저장소 생성 및 푸시

1. GitHub 또는 GitLab에서 새 저장소 생성
2. 로컬 저장소를 원격 저장소에 연결:

```bash
git remote add origin <YOUR_REPO_URL>
git branch -M main
git push -u origin main
```

## 4. Vercel 배포

### 4.1 Vercel 계정 생성
- https://vercel.com 접속
- GitHub/GitLab 계정으로 로그인

### 4.2 프로젝트 Import
1. Vercel 대시보드에서 "Add New..." → "Project" 클릭
2. 방금 푸시한 저장소 선택
3. "Import" 클릭

### 4.3 환경 변수 설정
Vercel 프로젝트 설정에서 다음 환경 변수를 추가:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**중요:** `.env.local` 파일의 값들을 복사해서 입력하세요.

### 4.4 빌드 설정 확인
- Framework Preset: Next.js (자동 감지)
- Build Command: `npm run build` (기본값)
- Output Directory: `.next` (기본값)
- Install Command: `npm install` (기본값)

### 4.5 배포
1. "Deploy" 버튼 클릭
2. 배포 진행 상황 확인 (약 2-3분 소요)
3. 배포 완료 후 제공되는 URL로 접속 확인

## 5. 배포 후 확인사항

1. ✅ 홈페이지 로딩 확인
2. ✅ 대시보드 데이터 로딩 확인
3. ✅ Supabase 연결 확인
4. ✅ 환경 변수 적용 확인

## 6. 문제 해결

### 빌드 실패 시
- 타입 에러 수정
- 의존성 문제: `npm install` 재실행
- 환경 변수 누락 확인

### 런타임 에러 시
- 브라우저 콘솔 확인
- Vercel 로그 확인 (Functions 탭)
- Supabase 연결 확인

## 7. 도메인 설정 (선택사항)

Vercel은 기본적으로 `your-project.vercel.app` 도메인을 제공합니다.
커스텀 도메인을 설정하려면:

1. Vercel 프로젝트 → Settings → Domains
2. 원하는 도메인 추가
3. DNS 설정 안내에 따라 진행
