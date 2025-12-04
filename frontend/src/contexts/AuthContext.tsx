import { createContext, useState, useEffect, useContext } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, useLocalMode } from '../lib/supabase'
import { workersApi, WorkerProfile } from '../services'

// ローカルモード用のテストユーザー
const LOCAL_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', email: 'admin@linguabridge.com', full_name: 'Admin User', role: 'admin' },
  { id: '22222222-2222-2222-2222-222222222222', email: 'client@example.com', full_name: 'Test Client', role: 'client' },
  { id: '33333333-3333-3333-3333-333333333333', email: 'annotator1@example.com', full_name: 'John Annotator', role: 'annotator' },
  { id: '44444444-4444-4444-4444-444444444444', email: 'annotator2@example.com', full_name: 'Jane Annotator', role: 'annotator' },
]

interface LocalUser {
  id: string
  email: string
  full_name: string
  role: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: WorkerProfile | null
  loading: boolean
  profileLoading: boolean
  isLocalMode: boolean
  localUsers: LocalUser[]
  signUp: (email: string, password: string, metadata?: { full_name?: string; role?: string }) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInLocal: (userId: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ローカルユーザーからSupabase User形式に変換
function createMockUser(localUser: LocalUser): User {
  return {
    id: localUser.id,
    email: localUser.email,
    app_metadata: {},
    user_metadata: {
      full_name: localUser.full_name,
      role: localUser.role,
    },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User
}

// ローカルユーザーからセッション形式に変換
function createMockSession(localUser: LocalUser): Session {
  return {
    access_token: `local_token_${localUser.id}`,
    refresh_token: `local_refresh_${localUser.id}`,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: createMockUser(localUser),
  } as Session
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (useLocalMode) {
      // ローカルモード: localStorageからユーザーを復元
      const savedUserId = localStorage.getItem('linguabridge_local_user')
      if (savedUserId) {
        const localUser = LOCAL_USERS.find(u => u.id === savedUserId)
        if (localUser) {
          setUser(createMockUser(localUser))
          setSession(createMockSession(localUser))
        }
      }
      setLoading(false)
    } else {
      // Supabaseモード: 通常のセッション取得
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  // Fetch profile when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null)
        return
      }

      // ローカルモードではプロファイル取得をスキップ（APIが認証を必要とするため）
      if (useLocalMode) {
        const localUser = LOCAL_USERS.find(u => u.id === user.id)
        if (localUser) {
          setProfile({
            id: localUser.id,
            email: localUser.email,
            full_name: localUser.full_name,
            role: localUser.role,
          } as WorkerProfile)
        }
        return
      }

      try {
        setProfileLoading(true)
        const data = await workersApi.getMyProfile()
        setProfile(data)
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        setProfile(null)
      } finally {
        setProfileLoading(false)
      }
    }

    if (user && !loading) {
      fetchProfile()
    } else {
      setProfile(null)
    }
  }, [user, loading])

  const refreshProfile = async () => {
    if (!user) return

    if (useLocalMode) {
      // ローカルモードでは何もしない
      return
    }

    try {
      setProfileLoading(true)
      const data = await workersApi.getMyProfile()
      setProfile(data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const signUp = async (email: string, password: string, metadata?: { full_name?: string; role?: string }) => {
    if (useLocalMode) {
      return { error: new Error('Sign up is not available in local mode') as AuthError }
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (useLocalMode) {
      // ローカルモード: メールアドレスでユーザーを検索
      const localUser = LOCAL_USERS.find(u => u.email === email)
      if (localUser) {
        localStorage.setItem('linguabridge_local_user', localUser.id)
        setUser(createMockUser(localUser))
        setSession(createMockSession(localUser))
        return { error: null }
      }
      return { error: { message: 'User not found' } as AuthError }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // ローカルモード専用: ユーザーIDで直接ログイン
  const signInLocal = async (userId: string) => {
    if (!useLocalMode) {
      return { error: new Error('Local sign in is only available in local mode') }
    }

    const localUser = LOCAL_USERS.find(u => u.id === userId)
    if (!localUser) {
      return { error: new Error('User not found') }
    }

    localStorage.setItem('linguabridge_local_user', localUser.id)
    setUser(createMockUser(localUser))
    setSession(createMockSession(localUser))
    return { error: null }
  }

  const signOut = async () => {
    if (useLocalMode) {
      localStorage.removeItem('linguabridge_local_user')
      setUser(null)
      setSession(null)
      setProfile(null)
      return { error: null }
    }

    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    profileLoading,
    isLocalMode: useLocalMode,
    localUsers: LOCAL_USERS,
    signUp,
    signIn,
    signInLocal,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
