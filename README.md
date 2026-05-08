# 개인용 연차 확인 플랫폼

Vue 3, Nuxt 3, TypeScript, Pinia, SCSS, Firebase SDK 기반의 개인용 연차 기록 앱입니다.

## Firebase 서비스

- Firebase Authentication: Google 로그인
- Cloud Firestore: 연차 설정 및 사용 내역 저장
- Firebase Hosting: 정적 배포

## Firestore 구조

```text
users/{uid}
users/{uid}/leaveSettings/{year}
users/{uid}/leaveRecords/{recordId}
```

## 환경변수

`.env`에 Firebase 웹 앱 설정값을 입력하세요.

```text
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
```

## 실행

```bash
npm install
npm run dev
```

## 배포

```bash
npm run generate
firebase deploy --only hosting
```

## Firebase 콘솔 설정 순서

1. Firebase Console에서 프로젝트를 생성합니다.
2. Authentication > Sign-in method에서 Google provider를 활성화합니다.
3. Project settings > General에서 Web app을 추가하고 Firebase config 값을 복사합니다.
4. `.env` 파일의 `NUXT_PUBLIC_FIREBASE_*` 값에 복사한 config를 입력합니다.
5. Firestore Database를 생성합니다. 테스트 중에는 로그인 사용자만 본인 문서에 접근하도록 Rules를 설정하세요.

예시 Firestore Rules:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

`.env` 수정 후에는 dev server를 껐다가 다시 실행해야 값이 반영됩니다.
