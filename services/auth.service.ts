import { signOut, type Auth, type UserCredential } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'
import type { UserProfile } from '~/types/user'
import type { TeamRole } from '~/utils/team'
import { loginWithPassword, signupWithPassword } from '~/utils/firebase'

export interface SignupPayload {
  team: TeamRole
  userId: string
  name: string
  password: string
}

export interface CreateUserProfilePayload {
  uid: string
  userId: string
  name: string
  team: TeamRole
  email: string
}

export const signInWithUserId = async (userId: string, password: string): Promise<UserCredential> => {
  return loginWithPassword(userId, password)
}

export const createAccountWithPassword = async (payload: SignupPayload): Promise<UserCredential> => {
  return signupWithPassword(payload.userId, payload.password, payload.name)
}

export const fetchUserProfile = async (db: Firestore, uid: string): Promise<UserProfile | null> => {
  const snapshot = await getDoc(doc(db, 'users', uid))

  if (!snapshot.exists()) {
    return null
  }

  return {
    uid,
    ...snapshot.data()
  } as UserProfile
}

export const createUserProfile = async (db: Firestore, payload: CreateUserProfilePayload): Promise<UserProfile> => {
  const profile: UserProfile = {
    uid: payload.uid,
    userId: payload.userId,
    name: payload.name,
    team: payload.team,
    displayName: payload.name,
    email: payload.email,
    approved: false
  }

  await setDoc(doc(db, 'users', payload.uid), {
    userId: profile.userId,
    name: profile.name,
    team: profile.team,
    displayName: profile.displayName,
    email: profile.email,
    approved: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  return profile
}

export const signOutAuth = async (auth: Auth): Promise<void> => {
  await signOut(auth)
}
