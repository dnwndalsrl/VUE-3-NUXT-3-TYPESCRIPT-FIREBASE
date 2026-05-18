# Frontend Rules

모든 코드는 아래 규칙을 반드시 따른다.

━━━━━━━━━━━━━━━━━━
1. 기본 기술 스택
━━━━━━━━━━━━━━━━━━

- TypeScript
- Composition API
- `<script setup lang="ts">`
- SCSS
- Pinia
- Axios 기반 API 통신

━━━━━━━━━━━━━━━━━━
2. 기본 코드 구조 규칙
━━━━━━━━━━━━━━━━━━

모든 Vue 파일은 반드시 아래 순서를 유지한다.

```vue
<template>
</template>

<script setup lang="ts">
</script>

<style lang="scss">
</style>
```

[필수 규칙]

- Composition API만 사용
- Options API 사용 금지
- JavaScript 사용 금지
- TypeScript 필수
- `any` 사용 금지
- `script setup` 필수
- SCSS 필수
- 신규 컴포넌트는 scoped style을 기본으로 고려
- 현재 페이지 단위 스타일은 기존 정책에 따라 `page-name-page` 네임스페이스를 붙인 `<style lang="scss">`를 허용
- 불필요한 주석 금지
- 사용하지 않는 import 제거
- 사용하지 않는 변수 제거
- 중복 코드 작성 금지

━━━━━━━━━━━━━━━━━━
3. TypeScript 규칙
━━━━━━━━━━━━━━━━━━

[필수 규칙]

- `any` 절대 사용 금지
- 타입 추론 가능하면 추론 사용
- 불명확한 타입은 `interface` 또는 `type` 생성
- `unknown` 사용 후 타입 가드 처리
- props/emits 타입 반드시 정의
- API 응답 타입 정의 필수
- Firebase 문서 데이터는 명시적 interface/type으로 변환 후 사용
- nullable 값은 optional chaining 또는 명시적 guard로 처리
- enum 성격의 값은 string literal union type으로 관리
- DOM 이벤트 target은 필요한 HTML Element 타입으로 좁혀 사용

[예시]

```ts
interface User {
  id: number
  name: string
}
```

[금지]

```ts
const data: any = {}
```

━━━━━━━━━━━━━━━━━━
4. 변수 및 함수 네이밍 규칙
━━━━━━━━━━━━━━━━━━

[변수]

- 의미가 명확해야 함
- 축약형 남발 금지

[함수]

- 동사로 시작
- 역할 명확히 표현

[예시]

```ts
fetchUserList
createSchedule
updateMemberInfo
deleteNotification
handleSubmit
toggleModal
```

━━━━━━━━━━━━━━━━━━
5. State 관리 규칙
━━━━━━━━━━━━━━━━━━

[ref 사용]

- 단일 값
- boolean
- number
- string

[reactive 사용]

- form
- object
- 복합 상태

━━━━━━━━━━━━━━━━━━
6. Computed / Watch 규칙
━━━━━━━━━━━━━━━━━━

[computed]

- 파생 데이터 전용

[watch]

- 꼭 필요한 경우에만 사용
- 과도한 watch 사용 금지
- watch 내부에서 복잡한 비즈니스 로직 처리 금지

━━━━━━━━━━━━━━━━━━
7. Pinia 규칙
━━━━━━━━━━━━━━━━━━

[기본 원칙]

- 전역 상태만 store에서 관리
- 화면 전용 상태는 local state 사용
- store 직접 수정 최소화
- action 통해 상태 변경
- 저장 버튼이 있으면 local state 수정 후 저장 버튼 클릭 시 store/API 반영
- 비동기 action은 loading/error 상태를 명확히 관리
- Firestore query, mutation, derived summary 계산은 store 또는 service/composable로 분리
- 컴포넌트에서 store 내부 배열/객체를 직접 mutate하지 않는다

[금지]

```ts
store.user.name = 'kim'
```

[권장]

```ts
store.updateUser(payload)
```

━━━━━━━━━━━━━━━━━━
8. API 호출 규칙
━━━━━━━━━━━━━━━━━━

[모든 API 호출 필수 규칙]

- 반드시 `try/catch/finally` 사용
- 반드시 loading 처리
- `async/await` 사용
- `then/catch` 체인 사용 금지
- Firebase SDK 호출도 API 호출과 동일하게 try/catch/finally와 loading 규칙을 적용
- 사용자에게 실패 피드백을 제공할 수 있는 errorMessage 또는 store error 상태를 둔다
- 페이지 내부에 긴 API/Firebase 로직을 작성하지 않고 service/store/composable로 분리
- 반복 호출 가능성이 있는 조회는 Firebase 비용을 고려해 필요한 범위만 요청

━━━━━━━━━━━━━━━━━━
9. Loading Hook 규칙
━━━━━━━━━━━━━━━━━━

[필수 규칙]

- API 호출 시 loading 필수
- 페이지마다 중복 loading 작성 금지
- composable 형태로 관리
- 공통 로딩 UI는 `AppLoading` 컴포넌트를 우선 사용
- 중복 클릭이 가능한 버튼은 loading 중 disabled 처리
- 초기 로딩, 저장 로딩, 목록 로딩을 구분해야 할 경우 명확한 상태명을 사용

[기본 구조]

```ts
export const useLoading = () => {
  const isLoading = ref(false)

  const startLoading = () => {
    isLoading.value = true
  }

  const stopLoading = () => {
    isLoading.value = false
  }

  return {
    isLoading,
    startLoading,
    stopLoading
  }
}
```

━━━━━━━━━━━━━━━━━━
10. Error 처리 규칙
━━━━━━━━━━━━━━━━━━

[필수 규칙]

- catch 생략 금지
- 사용자 피드백 제공
- `console.error` 최소 포함
- `catch (error: unknown)` 형태를 기본으로 사용
- 사용자 메시지는 기술적인 에러 원문을 그대로 노출하지 않는다

━━━━━━━━━━━━━━━━━━
11. Component 규칙
━━━━━━━━━━━━━━━━━━

[기본 원칙]

- 공통 컴포넌트 우선 재사용
- props 타입 정의 필수
- emits 타입 정의 필수
- props 직접 수정 금지

[v-model 규칙]

- `modelValue`
- `update:modelValue`

━━━━━━━━━━━━━━━━━━
12. 폴더 구조 규칙
━━━━━━━━━━━━━━━━━━

[권장 구조]

```txt
components/
composables/
pages/
stores/
types/
services/
utils/
assets/scss/
```

━━━━━━━━━━━━━━━━━━
13. SCSS 규칙
━━━━━━━━━━━━━━━━━━

[필수 규칙]

- 신규 단일 컴포넌트는 scoped 사용을 우선 고려
- 페이지 전역 스타일은 페이지 루트 클래스 네임스페이스를 사용
- 페이지 전역 스타일이 필요한 경우 페이지 루트 클래스 네임스페이스를 반드시 붙인다
- SCSS 사용
- nesting 과도하게 사용 금지
- 반응형 고려
- flex/grid 적극 활용
- `!important` 남발 금지
- reset/global/font/variable/mixin은 `assets/css`와 `assets/scss` 구조를 유지해 관리

━━━━━━━━━━━━━━━━━━
14. 반응형 규칙
━━━━━━━━━━━━━━━━━━

[필수]

- 모바일 우선 개발
- overflow 발생 여부 확인
- width 고정 최소화
- flex-wrap/grid 적극 사용
- 360px 모바일 폭에서 텍스트/버튼/테이블 overflow를 확인
- 표, 캘린더처럼 고정폭이 필요한 UI는 명시적 scroll container를 제공
- 데스크톱/태블릿/모바일에서 주요 CTA와 필터가 접히거나 겹치지 않게 구성

━━━━━━━━━━━━━━━━━━
15. UI/UX 규칙
━━━━━━━━━━━━━━━━━━

[필수]

- loading 상태 제공
- empty 상태 제공
- error 상태 고려
- 중복 클릭 방지
- 버튼 disabled 처리 고려
- 저장 버튼은 변경사항 존재 시만 활성화 고려

━━━━━━━━━━━━━━━━━━
16. API 구조 규칙
━━━━━━━━━━━━━━━━━━

[권장 구조]

```txt
services/
 ├─ auth.service.ts
 ├─ user.service.ts
 └─ schedule.service.ts
```

[금지]

- 페이지 내부에 axios 로직 대량 작성

━━━━━━━━━━━━━━━━━━
17. 비즈니스 로직 규칙
━━━━━━━━━━━━━━━━━━

[필수]

- UI 로직과 비즈니스 로직 분리
- 복잡한 로직 composable 분리

━━━━━━━━━━━━━━━━━━
18. 성능 최적화 규칙
━━━━━━━━━━━━━━━━━━

[필수]

- unnecessary watch 금지
- unnecessary rerender 방지
- computed 적극 활용
- 큰 리스트 virtual scroll 고려
- template 내부 복잡한 계산 금지
- 목록은 페이지네이션 또는 필요한 범위 조회를 우선 적용
- Firestore collection group query는 필요한 index와 필터 조건을 고려
- template에서는 함수 호출 반복보다 computed된 표시 데이터를 사용

━━━━━━━━━━━━━━━━━━
19. 접근성 규칙
━━━━━━━━━━━━━━━━━━

[필수]

- button 사용 목적 명확화
- label/input 연결
- disabled 상태 고려
- semantic tag 사용
- 아이콘 버튼은 접근 가능한 label 또는 명확한 텍스트를 제공
- form error는 입력 맥락에서 확인 가능하게 배치
- 색상만으로 상태를 구분하지 않고 텍스트 라벨을 함께 제공

━━━━━━━━━━━━━━━━━━
20. 금지 사항
━━━━━━━━━━━━━━━━━━

[절대 금지]

- `any` 사용
- Options API 사용
- try/catch 없는 API 호출
- loading 없는 API 호출
- props 직접 수정
- 중복 코드 복붙
- 하드코딩 남발
- 의미없는 변수명
- 무분별한 watch 사용
- 불필요한 전역 상태 사용
- template 내부 복잡한 계산

━━━━━━━━━━━━━━━━━━
21. 코드 생성 출력 규칙
━━━━━━━━━━━━━━━━━━

[필수]

- 전체 파일 코드 제공
- 생략 금지
- 바로 붙여넣기 가능해야 함
- 수정 파일 경로 표시
- 기존 구조 최대한 유지
- 필요한 import 포함
- 타입 포함
- 설명 최소화

━━━━━━━━━━━━━━━━━━
22. 코덱스 응답 규칙
━━━━━━━━━━━━━━━━━━

[반드시 준수]

- `frontend_rules.md` 기준으로 작업
- 규칙 위반 코드 생성 금지
- 기존 프로젝트 구조 우선 유지
- 기존 공통 컴포넌트 우선 재사용
- 실무 운영 기준으로 작성
- 유지보수성을 우선 고려
- 확장 가능 구조로 작성

━━━━━━━━━━━━━━━━━━
23. 최종 목표
━━━━━━━━━━━━━━━━━━

모든 코드는 아래 기준을 만족해야 한다.

- 유지보수 가능
- 확장 가능
- 타입 안정성 확보
- 운영 환경 대응 가능
- Firebase 비용 최소화
- 실무 협업 가능 수준
- 공통화 가능한 구조
- 재사용 가능한 구조
