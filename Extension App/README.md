# git-reflow Extension App

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853)
![JavaScript](https://img.shields.io/badge/JavaScript-Content_Script-F7DF1E?logo=javascript&logoColor=111827)
![Chrome Storage](https://img.shields.io/badge/Chrome_Storage-local-4285F4)

`Extension App`은 GitHub 페이지에 git-reflow 템플릿을 적용하는 Chrome Extension입니다. 현재는 Manifest V3 content script 기반의 MVP입니다.

## 역할

- GitHub Home 화면 감지
- 백엔드에서 최신 GitHub Home 템플릿 조회
- GitHub DOM에 컬럼 폭 적용
- feed 1열/2열 variation 적용
- 좌측 사이드바 직접 resize 핸들 제공
- 로컬 reset 및 refresh 컨트롤 제공

## 기술 스택

| 용도 | 기술 |
| --- | --- |
| Extension 형식 | Chrome Extension Manifest V3 |
| 실행 방식 | Content Script |
| 화면 적용 | DOM manipulation, CSS override |
| 로컬 저장 | `chrome.storage.local` |
| 템플릿 조회 | Fetch API |

## 실행 방법

1. 백엔드를 실행합니다.

```powershell
cd web/BE
npm run dev
```

2. 프론트엔드를 실행하고 템플릿을 저장합니다.

```powershell
cd web/FE
npm run dev
```

3. Chrome에서 `chrome://extensions`를 엽니다.
4. Developer mode를 켭니다.
5. `Load unpacked`를 클릭합니다.
6. 이 폴더(`Extension App`)를 선택합니다.
7. `https://github.com/`에 접속합니다.

## 현재 읽는 API

```text
http://localhost:8787/api/templates/github-home/latest
```

## 적용하는 설정

- `columnLayout.left`
- `columnLayout.main`
- `columnLayout.right`
- `leftSidebarResizeEnabled`
- `selectedVariationId`

## 화면 컨트롤

GitHub 페이지 우측 하단에 `Git Reflow Preview` 컨트롤이 표시됩니다.

- `Refresh template`: 백엔드에서 최신 템플릿 다시 읽기
- `Reset page styles`: Extension이 적용한 스타일 초기화
- 좌측 사이드바 edge drag: GitHub 좌측 사이드바 폭 직접 조정

## 파일

```text
manifest.json   Chrome Extension manifest
content.js      GitHub DOM 감지와 템플릿 적용 로직
content.css     컨트롤 패널, 리사이저, feed variation 스타일
```

## 다음 개선 후보

- TypeScript + Vite 기반 Extension 빌드 구조 도입
- content script 모듈 분리
- GitHub DOM selector registry 강화
- block visibility/order를 실제 GitHub DOM에 적용
- Extension popup/options 페이지 추가
