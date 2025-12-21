# ⚡ 빠른 배포 가이드 (5분 안에 배포하기)

## 📌 가장 빠른 방법: Vercel 배포

### Step 1: 로컬 빌드 테스트 (1분)

터미널에서 다음 명령어 실행:

```bash
# 빌드 테스트
npm run build

# 빌드가 성공하면 다음 명령어로 프로덕션 모드 확인
npm start
```

브라우저에서 `http://localhost:3000` 접속하여 정상 작동 확인

---

### Step 2: Git 저장소 준비 (2분)

```bash
# Git 초기화 (이미 되어있다면 생략)
git init

# 파일 추가
git add .

# 커밋
git commit -m "Ready for deployment"

# GitHub/GitLab에 새 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/eveni-dashboard.git
git branch -M main
git push -u origin main
```

---

### Step 3: Vercel 배포 (2분)

1. **https://vercel.com** 접속 → "Sign Up" (GitHub 계정으로 로그인)

2. **"Add New..." → "Project"** 클릭

3. Git 저장소 선택 (eveni-dashboard)

4. **Environment Variables 추가:**
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key

5. **"Deploy"** 클릭

6. 완료! 배포된 URL 확인 🎉

---

## 🔑 Supabase 환경 변수 찾기

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. Settings → API
4. 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ✅ 배포 완료 체크리스트

배포 후 다음을 확인하세요:

- [ ] 메인 페이지 로드
- [ ] 주차 선택 기능
- [ ] 조직별 탭 전환
- [ ] 데이터 로딩 (Supabase 연결 확인)
- [ ] Admin 페이지 접속

---

## 🚨 문제 발생 시

### 빌드 실패
```bash
rm -rf .next node_modules
npm install
npm run build
```

### 환경 변수 오류
- Vercel 프로젝트 Settings → Environment Variables 확인
- 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필수)

### Supabase 연결 오류
- Supabase Dashboard에서 프로젝트 상태 확인
- API 키가 올바른지 재확인

---

**자세한 배포 가이드는 `DEPLOYMENT_GUIDE.md` 파일을 참고하세요!**






