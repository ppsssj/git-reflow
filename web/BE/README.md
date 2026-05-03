# git-reflow Backend

![Node.js](https://img.shields.io/badge/Node.js-API-339933?logo=nodedotjs&logoColor=white)
![Google Auth Library](https://img.shields.io/badge/google--auth--library-10.6-4285F4?logo=google&logoColor=white)
![dotenv](https://img.shields.io/badge/dotenv-env-ECD53F)
![JSON Store](https://img.shields.io/badge/JSON-local_store-111827)

`web/BE`는 git-reflow 웹 앱과 Extension이 사용하는 로컬 API 서버입니다. 현재는 MVP 단계라 별도 데이터베이스 대신 JSON 파일에 템플릿과 세션을 저장합니다.

## 역할

- Google ID token 검증
- 로컬 세션 발급 및 로그아웃
- 템플릿 목록 조회
- 템플릿 단건 조회
- 템플릿 저장 및 최신 템플릿 제공
- Extension이 읽을 최신 GitHub Home 템플릿 제공

## 기술 스택

| 용도 | 기술 |
| --- | --- |
| HTTP 서버 | Node.js `node:http` |
| 환경변수 | `dotenv` |
| Google 로그인 검증 | `google-auth-library` |
| 로컬 저장소 | JSON 파일 (`web/BE/data`) |
| 템플릿 검증 | `packages/shared/src/templateSchema.js` |

## 실행

```powershell
cd web/BE
npm install
npm run dev
```

기본 포트는 `8787`입니다.

```text
http://localhost:8787
```

## 환경변수

`.env.example`을 복사해 `.env`를 만듭니다.

```env
PORT=8787
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
```

`GOOGLE_CLIENT_ID`는 FE의 `VITE_GOOGLE_CLIENT_ID`와 같은 값이어야 합니다. Client Secret은 사용하지 않습니다.

## API

### Health

```http
GET /health
```

### Google 로그인

```http
POST /api/auth/google
Content-Type: application/json

{
  "credential": "google-id-token"
}
```

Google ID token을 검증하고 로컬 세션을 발급합니다.

### 내 정보

```http
GET /api/auth/me
Authorization: Bearer <session-token>
```

### 로그아웃

```http
POST /api/auth/logout
Authorization: Bearer <session-token>
```

### 템플릿 목록

```http
GET /api/templates
```

### 템플릿 단건

```http
GET /api/templates/:templateId
```

### GitHub Home 템플릿 저장

```http
POST /api/templates/github-home
Content-Type: application/json
```

공유 스키마(`packages/shared/src/templateSchema.js`)로 payload를 검증한 뒤 저장합니다.

### Extension용 최신 템플릿

```http
GET /api/templates/github-home/latest
```

Extension이 현재 적용할 최신 템플릿을 가져옵니다.

## 로컬 데이터

서버는 실행 중 다음 파일을 만들 수 있습니다.

```text
web/BE/data/templates.json
web/BE/data/sessions.json
```

`data/`는 `.gitignore`에 포함되어 있습니다.

## 검증

```powershell
node --check server.js
```
