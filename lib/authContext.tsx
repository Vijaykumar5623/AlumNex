import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth, db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'

interface UserProfile {
  uid: string
  email: string
  role: 'student' | 'alumni' | 'admin'
  createdAt: string
  verified?: boolean
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const profileRef = doc(db, 'profiles', firebaseUser.uid)
          const profileSnap = await getDoc(profileRef)
          if (profileSnap.exists()) {
            setProfile(profileSnap.data() as UserProfile)
          }
        } catch (err) {
          console.error('Error fetching profile:', err)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
