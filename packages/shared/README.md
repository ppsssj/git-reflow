# git-reflow Shared

![TypeScript](https://img.shields.io/badge/TypeScript-types-3178C6?logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-runtime_validator-F7DF1E?logo=javascript&logoColor=111827)
![Shared Contract](https://img.shields.io/badge/Contract-FE%20%2F%20BE%20%2F%20Extension-111827)

`packages/shared`는 FE와 BE가 함께 사용하는 템플릿 계약을 담는 공간입니다.

현재는 별도 npm workspace로 패키징하지 않고, FE/BE에서 직접 파일을 참조합니다.

## 파일

```text
src/templateTypes.ts    TypeScript 타입 정의
src/templateSchema.js   런타임 검증과 normalize 로직
```

## 담고 있는 개념

- `TemplateLayout`
- `TemplateBlock`
- `TemplateRegion`
- `TemplateVariationId`
- `TemplateColumnLayout`
- `ExtensionTemplatePayload`
- template payload validator
- column width limit
- 기본 fallback payload

## 기술 스택

| 용도 | 기술 |
| --- | --- |
| 정적 타입 | TypeScript |
| 런타임 검증 | JavaScript validator |
| 계약 공유 | FE 타입 재수출, BE payload validation |

## 왜 필요한가

git-reflow는 FE, BE, Extension이 같은 템플릿 JSON을 공유합니다. 이 계약이 흔들리면 저장은 되지만 Extension 적용이 실패하거나, FE 편집기가 잘못된 상태를 보여줄 수 있습니다.

따라서 템플릿 구조와 검증 규칙은 한 곳에서 관리하는 방향으로 둡니다.

## 현재 사용처

- FE: `web/FE/src/types/template.ts`에서 타입을 재수출합니다.
- BE: `web/BE/server.js`에서 `validateTemplatePayload`, `normalizeTemplatePayload`를 사용합니다.

## 다음 개선 후보

- npm workspace 패키지로 분리
- schema를 TypeScript 소스에서 생성
- FE에서도 저장 전 동일 validator 사용
- Extension 빌드 구조 도입 후 shared schema 재사용
