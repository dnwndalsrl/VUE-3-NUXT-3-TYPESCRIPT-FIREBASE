import { initFirebase } from '~/utils/firebase'

export default defineNuxtPlugin(() => {
  const { firebaseApp, auth, db } = initFirebase()

  return {
    provide: {
      firebaseApp,
      auth,
      db
    }
  }
})
