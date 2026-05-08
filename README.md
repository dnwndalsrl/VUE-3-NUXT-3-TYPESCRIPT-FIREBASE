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
