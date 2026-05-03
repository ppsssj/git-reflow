# git-reflow

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-API-339933?logo=nodedotjs&logoColor=white)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Google Identity](https://img.shields.io/badge/Google-Identity-4285F4?logo=google&logoColor=white)

git-reflow는 사용자가 웹에서 GitHub 홈 레이아웃 템플릿을 만들고, Chrome Extension이 그 설정을 실제 GitHub 페이지에 적용하는 UI 개인화 프로젝트입니다.

현재는 GitHub Home 화면을 우선 대상으로 합니다. 웹에서는 기본 GitHub 템플릿을 복제해 사용자 템플릿을 만들고, 좌측/중앙/우측 컬럼 폭과 안전한 레이아웃 변형을 조정할 수 있습니다. Extension은 저장된 최신 템플릿을 읽어 GitHub DOM에 적용합니다.

## 구성

```text
git-reflow/
  web/
    BE/              # Node 기반 API 서버
    FE/              # React + TypeScript 웹 앱
  Extension App/     # Chrome Extension content script
  packages/
    shared/          # FE/BE가 공유하는 템플릿 타입과 검증 로직
```

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router |
| Backend | Node.js HTTP server, dotenv, google-auth-library |
| Auth | Google Identity Services, Google ID token verification |
| Extension | Chrome Extension Manifest V3, Content Script, Chrome Storage |
| Shared Contract | TypeScript types, JavaScript runtime validator |
| Local Storage | JSON file store for templates and sessions |

## 현재 기능

- Google Identity Services 기반 로그인
- 로컬 세션 저장 및 로그아웃
- 기본 GitHub Home 템플릿 제공
- 사용자 템플릿 생성, 저장, 목록 조회
- 템플릿 목록 Grid/List 전환
- 템플릿 카드 미리보기
- 템플릿 편집 화면에서 컬럼 폭, 변형, 블록 표시 상태 조정
- Extension에서 최신 템플릿을 가져와 GitHub Home에 적용

## 빠른 실행

### 1. 환경변수 생성

`web/BE/.env.example`을 복사해 `web/BE/.env`를 만들고 Google OAuth Client ID를 넣습니다.

```env
PORT=8787
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
```

`web/FE/.env.example`을 복사해 `web/FE/.env`를 만듭니다.

```env
VITE_GIT_REFLOW_API_URL=http://localhost:8787
VITE_GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
```

FE와 BE에는 같은 Google OAuth Web Client ID를 넣어야 합니다.

### 2. 백엔드 실행

```powershell
cd web/BE
npm install
npm run dev
```

### 3. 프론트엔드 실행

```powershell
cd web/FE
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173`을 엽니다.

### 4. Extension 실행

1. Chrome에서 `chrome://extensions` 열기
2. Developer mode 켜기
3. `Load unpacked` 클릭
4. `Extension App` 폴더 선택
5. `https://github.com/` 접속

## Google OAuth 설정

Google Cloud Console에서 OAuth Client를 만들 때 Application type은 `Web application`으로 선택합니다.

Authorized JavaScript origins:

```text
http://127.0.0.1:5173
http://localhost:5173
```

현재 구현은 redirect flow가 아니라 ID token 검증 방식이므로 Client Secret은 사용하지 않습니다.

## 개발 메모

- 실제 `.env` 파일과 `web/BE/data/`는 git에 올리지 않습니다.
- 템플릿 저장소는 현재 `web/BE/data/templates.json` 파일 기반입니다.
- 세션 저장소는 현재 `web/BE/data/sessions.json` 파일 기반입니다.
- 기본 GitHub 템플릿은 항상 FE에서 제공하며, 사용자는 이 기본 템플릿을 복제해 수정합니다.

## 폴더별 문서

- [Backend README](web/BE/README.md)
- [Frontend README](web/FE/README.md)
- [Extension README](Extension%20App/README.md)
- [Shared README](packages/shared/README.md)
