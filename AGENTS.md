# AGENTS.md

이 문서는 이 프로젝트에서 Codex 및 AI 개발 에이전트가 반드시 따를 전역 작업 규칙이다.

## Project Stack

- 이 프로젝트는 Nuxt 3 + Vue 3 + TypeScript 기반 개인 연차 관리 플랫폼이다.
- Vue 코드는 Composition API와 `<script setup lang="ts">`를 사용한다.
- 상태 관리는 Pinia를 사용한다.
- 스타일은 SCSS를 사용하며, 전역 스타일과 페이지 네임스페이스 정책을 유지한다.
- Firebase Authentication, Cloud Firestore, Firebase Hosting을 사용한다.

## Mandatory Rules

- 모든 생성 코드는 `frontend_rules.md` 규칙을 반드시 따른다.
- 기존 프로젝트 구조를 유지한다.
- 기존 공통 컴포넌트를 우선 재사용한다.
- 불필요한 리팩토링을 하지 않는다.
- 유지보수성과 확장성을 우선 고려한다.
- UI 로직과 비즈니스 로직을 분리한다.
- 운영 환경 기준으로 안전한 코드를 작성한다.

## Prohibited

- `any` 사용 금지
- Options API 사용 금지
- Pinia state 직접 수정 금지
- `try/catch/finally` 없는 API 호출 금지
- loading 처리 없는 API 호출 금지
- 중복 비즈니스 로직 생성 금지
- 기존 기능 또는 런타임 동작을 요청 없이 변경 금지
- 관련 없는 파일 리팩토링 금지

## Phaseharness Workflow

큰 기능 개발, 여러 파일을 건드리는 작업, 데이터 구조나 권한 흐름에 영향을 주는 작업은 반드시 phaseharness workflow를 사용한다.

필수 workflow 순서:

1. clarify
2. context-gather
3. plan
4. generate
5. evaluate

각 단계의 원칙:

- `clarify`: 요구사항이 불명확하거나 위험한 가정이 있으면 먼저 정리한다.
- `context-gather`: `frontend_rules.md`, 관련 store/component/page/service/type 파일을 확인한다.
- `plan`: 기존 아키텍처를 유지하고, 유지보수 가능한 phase 단위로 작업을 나눈다.
- `generate`: 계획된 phase 범위 안에서만 운영 수준 코드를 작성한다.
- `evaluate`: `frontend_rules.md`와 `.phaseharness/context.json`의 evaluate rules 기준으로 검증한다.

## Small vs Large Work

- 작은 작업: 단일 파일 또는 명확한 UI 문구/스타일 수정처럼 영향 범위가 제한된 경우 직접 수행할 수 있다.
- 큰 작업: 신규 기능, 권한/데이터/상태 흐름 변경, 여러 페이지 연동, Firebase 규칙/쿼리 변경은 phaseharness workflow를 사용한다.

## Validation

- 코드 변경 후 관련 빌드 또는 최소 검증을 수행한다.
- UI 변경 후 가능한 경우 로컬 렌더링을 확인한다.
- 배포 요청이 있을 때만 Firebase Hosting 배포를 수행한다.
