# git-reflow

사용자가 웹에서 GitHub 레이아웃을 설정하고, 브라우저 확장 프로그램이 해당 설정을 GitHub 페이지에 적용하는 UI 개인화 프로젝트입니다.

git-reflow는 GitHub의 기본 화면을 그대로 사용하는 대신,  
사용자별 목적에 맞게 피드 구조, 섹션 우선순위, 노출 방식, 레이아웃 구성을 재설계할 수 있도록 하는 것을 목표로 합니다.

---

## Overview

GitHub는 많은 정보를 제공하지만, 사용자가 원하는 방식으로 화면 구조를 직접 제어하기는 어렵습니다.  
홈 피드, 추천 레포지토리, 탐색 섹션, 활동 정보 등은 플랫폼이 정한 순서와 형태로 제공되며, 사용 목적에 따라 필요한 정보를 더 위로 올리거나 덜 중요한 정보를 숨기기는 쉽지 않습니다.

git-reflow는 이 문제를 해결하기 위해 다음과 같은 구조를 제안합니다.

- **Web App**: 사용자가 원하는 GitHub 레이아웃을 설정하는 공간
- **Chrome Extension**: 설정된 레이아웃을 실제 GitHub 페이지에 적용하는 실행기

즉, git-reflow는 단순히 GitHub 화면을 꾸미는 확장 프로그램이 아니라,  
**사용자 설정 기반 GitHub UI 재구성 시스템**을 지향합니다.

---

## Core Idea

git-reflow의 핵심은 다음과 같습니다.

> **설정은 웹에서 관리하고, 적용은 확장 프로그램이 수행한다.**

이 구조를 통해 사용자는 GitHub UI를 자신의 목적에 맞게 재구성할 수 있습니다.

예를 들어 다음과 같은 시나리오를 지원할 수 있습니다.

- `Trending repositories`를 홈 화면 상단으로 이동
- `Recommended for you` 섹션을 더 강조해서 표시
- 관심 없는 피드 블록 숨기기
- 섹션 순서 직접 변경
- 정보 밀도 높은 대시보드형 레이아웃 적용
- 저장한 프리셋을 다시 불러와 동일한 환경 재사용

---

## Architecture

### 1. Web App
사용자가 레이아웃을 설정하는 관리 화면입니다.

주요 역할:
- 섹션 노출 여부 설정
- 섹션 순서 변경
- 카드 밀도 / 강조 방식 설정
- 레이아웃 프리셋 저장
- 사용자별 설정 관리
- 설정 미리보기 및 편집

### 2. Chrome Extension
웹에서 정의한 설정을 GitHub 페이지에 적용하는 실행 계층입니다.

주요 역할:
- GitHub 페이지 감지
- 사용자 설정 불러오기
- DOM 재배치
- CSS 오버라이드
- 추가 UI 패널 렌더링
- 페이지 유형별 동작 분기

---

## How It Works

git-reflow는 GitHub 서버를 수정하지 않습니다.  
대신 브라우저 환경에서 렌더링된 GitHub 페이지를 기준으로 DOM과 스타일을 재구성합니다.

기본 흐름은 다음과 같습니다.

1. 사용자가 웹 앱에서 원하는 GitHub 레이아웃을 설정합니다.
2. 설정 정보는 저장소 또는 사용자 계정 기준으로 보관됩니다.
3. 사용자가 GitHub 페이지에 접속합니다.
4. Chrome Extension이 현재 페이지를 감지합니다.
5. 저장된 설정을 불러옵니다.
6. content script가 GitHub DOM 구조를 기반으로 섹션을 이동, 숨김, 강조, 확장합니다.
7. 사용자는 개인화된 GitHub UI를 보게 됩니다.

---

## Features

### Layout Customization
- GitHub 홈 피드 섹션 표시 / 숨김
- 섹션 순서 재배치
- 특정 블록 강조 표시
- 카드 간격 및 정보 밀도 조절
- 사용자 정의 레이아웃 프리셋 적용

### Feed Optimization
- Trending repositories 우선 노출
- Recommended for you 강조
- 불필요한 피드 블록 축소 또는 제거
- 탐색 중심 레이아웃 구성
- 정보 우선순위 기반 화면 재배치

### Personalized Experience
- 사용자별 레이아웃 저장
- 목적별 프리셋 분리
- 웹에서 설정 후 확장에서 즉시 적용
- 반복적으로 같은 화면 구성 재사용

---

## Planned Features

- [ ] 섹션 drag-and-drop 정렬
- [ ] 레이아웃 프리셋 저장 / 불러오기
- [ ] GitHub Home 전용 레이아웃 모드
- [ ] Repository / Profile 페이지 대응
- [ ] 강조 규칙 설정
- [ ] 관심 없는 블록 자동 숨김
- [ ] 사용자 계정 기반 설정 동기화
- [ ] 미리보기 기반 레이아웃 편집기
- [ ] 공개 프리셋 공유 기능

---

## Tech Stack

### Web
- React
- TypeScript
- Tailwind CSS
- State Management
- Layout Config Editor

### Extension
- TypeScript
- Chrome Extension API
- Content Script
- DOM Manipulation
- CSS Override
- Chrome Storage / Remote Config Sync

### Optional Backend
- Supabase or Firebase
- User Authentication
- Layout Preset Storage
- Settings Sync

---

## Why Web + Extension?

일반적인 확장 프로그램은 popup이나 options page 안에서만 설정을 제공하는 경우가 많습니다.  
하지만 복잡한 레이아웃 설정은 더 넓은 화면과 명확한 편집 UI가 필요합니다.

git-reflow는 이 한계를 해결하기 위해 웹과 확장 프로그램을 분리합니다.

### Web이 적합한 이유
- 더 풍부한 설정 UI 제공 가능
- 드래그 앤 드롭 정렬 UX 구현 가능
- 프리셋 저장 및 관리에 유리
- 미리보기 화면 제공 가능
- 사용자 계정 및 동기화 구조 확장 가능

### Extension이 적합한 이유
- 실제 GitHub 페이지에 직접 적용 가능
- DOM 조작과 스타일 재구성 가능
- 페이지 방문 시 자동 실행 가능
- 브라우저 단에서 즉시 사용자 경험 변경 가능

이 조합을 통해 git-reflow는  
**설정 편집기 + UI 적용 엔진** 구조를 갖는 프로젝트로 확장됩니다.

---

## Use Cases

### 1. 추천 레포지토리를 더 자주 보고 싶은 사용자
추천 섹션을 더 위로 올리고 강조해서 빠르게 확인할 수 있습니다.

### 2. GitHub 홈 피드를 더 탐색 친화적으로 쓰고 싶은 사용자
불필요한 블록을 줄이고 관심 있는 정보 위주로 재구성할 수 있습니다.

### 3. GitHub를 개인화된 대시보드처럼 쓰고 싶은 사용자
자신만의 레이아웃 프리셋을 저장하고 반복해서 사용할 수 있습니다.

### 4. 여러 목적에 따라 화면 구성을 바꾸고 싶은 사용자
탐색용, 협업용, 정보 확인용 등 목적별로 다른 레이아웃을 구성할 수 있습니다.

---

## Project Goals

git-reflow는 다음을 목표로 합니다.

- GitHub의 고정된 UI 구조를 사용자 중심으로 재해석하기
- 정보 탐색 흐름을 더 빠르고 명확하게 만들기
- 브라우저 확장 프로그램을 활용한 실질적 UI 재구성 사례 만들기
- 웹과 확장 프로그램을 연결한 개인화 시스템 설계하기
- 향후 GitHub 외 플랫폼으로도 확장 가능한 구조 확보하기

---

## Project Scope

초기 범위는 GitHub 전체가 아니라, 우선적으로 다음 영역에 집중합니다.

- GitHub Home Feed
- 추천 레포지토리 섹션
- 탐색 관련 사이드 블록
- 일부 메타 정보 강조 UI

초기 MVP에서는 **GitHub Home 레이아웃 개인화**에 집중하고,  
이후 점진적으로 Repository / Profile / Explore 영역으로 확장하는 것을 목표로 합니다.

---

## Status

> Planning / Early Development

현재는 다음 항목을 중심으로 구조를 설계하고 있습니다.

- GitHub 홈 피드 DOM 분석
- 섹션 단위 레이아웃 제어 방식 정의
- 웹 기반 설정 화면 구조 설계
- 확장 프로그램 적용 로직 분리
- 설정 저장 및 동기화 방식 검토

---

## Roadmap

### Phase 1. MVP Extension
- [ ] GitHub Home DOM 구조 분석
- [ ] 섹션 탐지 로직 구현
- [ ] 표시 / 숨김 기능 구현
- [ ] 섹션 순서 변경 기능 구현
- [ ] 로컬 설정 저장 기능 구현

### Phase 2. Web Configurator
- [ ] 웹 설정 화면 구축
- [ ] 레이아웃 옵션 편집 UI 구현
- [ ] 프리셋 저장 구조 설계
- [ ] 설정 export / import 지원

### Phase 3. Productization
- [ ] 사용자 계정 연동
- [ ] 클라우드 설정 동기화
- [ ] 레이아웃 프리셋 공유
- [ ] 페이지 유형별 확장 적용
- [ ] 고급 규칙 기반 UI 재구성 지원

---

## Repository Structure

```bash
git-reflow/
├─ apps/
│  ├─ web/          # 레이아웃 설정 웹 앱
│  └─ extension/    # GitHub UI에 설정을 적용하는 Chrome Extension
├─ packages/
│  ├─ shared/       # 공통 타입, 설정 스키마, 유틸
│  └─ config/       # 레이아웃 규칙 및 preset 정의
└─ README.md
