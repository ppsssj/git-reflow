# git-reflow Frontend

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6-CA4245?logo=reactrouter&logoColor=white)
![Google Identity](https://img.shields.io/badge/Google-Identity_Services-4285F4?logo=google&logoColor=white)

`web/FE`는 git-reflow의 React + TypeScript 웹 앱입니다. 사용자는 여기서 Google로 로그인하고, GitHub Home 기본 템플릿을 복제해 자신만의 레이아웃 템플릿을 만들고 편집합니다.

## 주요 기능

- Google Identity Services 로그인
- 상단 설정 메뉴와 로그아웃
- 템플릿 목록 조회
- 템플릿 Grid/List 전환
- 템플릿 미리보기 카드
- 새 템플릿 생성
- 기본 GitHub Home 템플릿 편집
- 컬럼 폭 조정
- GitHub-safe variation 선택
- Extension으로 동기화할 템플릿 저장

## 기술 스택

| 용도 | 기술 |
| --- | --- |
| UI | React 18 |
| 언어 | TypeScript |
| 번들러 | Vite |
| 라우팅 | React Router |
| 로그인 | Google Identity Services |
| API 통신 | Fetch 기반 `src/lib/api.ts` |
| 세션 | Browser `localStorage` |
| 스타일 | 전역 CSS (`src/styles/global.css`) |

## 실행

```powershell
cd web/FE
npm install
npm run dev
```

브라우저에서 다음 주소를 엽니다.

```text
http://127.0.0.1:5173
```

## 환경변수

`.env.example`을 복사해 `.env`를 만듭니다.

```env
VITE_GIT_REFLOW_API_URL=http://localhost:8787
VITE_GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
```

`VITE_GOOGLE_CLIENT_ID`는 백엔드의 `GOOGLE_CLIENT_ID`와 같은 값이어야 합니다.

## 라우트

```text
/                  Intro page
/login             Google 로그인
/templates         템플릿 목록
/templates/:id     템플릿 편집기
```

## 폴더 구조

```text
src/
  app/              라우터와 앱 진입점
  components/       공통 UI와 레이아웃 컴포넌트
  features/auth/    로그인 화면
  features/intro/   소개 화면
  features/templates/
                    템플릿 목록, 카드, 생성 흐름
  features/editor/  템플릿 편집기와 GitHub 미리보기
  lib/              API 클라이언트와 인증 세션 유틸
  mocks/            개발용 샘플 데이터
  styles/           전역 스타일
  types/            shared 타입 재수출
```

## 템플릿 흐름

1. `/templates`에서 기본 GitHub Home 템플릿을 확인합니다.
2. `New Template` 카드에서 제목을 입력해 사용자 템플릿을 생성합니다.
3. 생성된 템플릿은 기본 템플릿을 복제한 상태로 시작합니다.
4. `/templates/:id`에서 컬럼 폭, 블록 표시 상태, variation을 수정합니다.
5. `Save Draft`를 누르면 백엔드에 저장됩니다.
6. Extension은 최신 템플릿을 읽어 GitHub에 적용합니다.

## 빌드

```powershell
npm run build
```

## 주의사항

- `.env`는 git에 올리지 않습니다.
- 기본 템플릿은 항상 유지되어야 하며, 사용자는 기본 템플릿을 직접 덮어쓰지 않고 복제본을 저장합니다.
- Google 로그인 버튼이 비어 보이면 `VITE_GOOGLE_CLIENT_ID`가 실제 `.env`에 있는지 확인해야 합니다.
