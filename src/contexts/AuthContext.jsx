import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const ADMIN_EMAILS = [
  'raflyalfazari622@gmail.com',
  'fadhilakbar050@gmail.com',
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user.id, user.user_metadata)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id, session.user.user_metadata)
      else { setProfile(null) }
      
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password')
      }
    })

    return () => subscription?.unsubscribe()
  }, [navigate])



  async function fetchProfile(uid, meta) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    if (data) {
      setProfile({ ...data, full_name: data.full_name || meta?.full_name || '', username: data.username || meta?.username || '' })
    } else if (meta?.full_name) {
      setProfile({ id: uid, full_name: meta.full_name, username: meta.username, role: meta.role })
    }
  }

  const isAdmin = profile?.role === 'admin' || (user && ADMIN_EMAILS.includes(user.email))

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, refreshProfile: () => user && fetchProfile(user.id, user?.user_metadata), signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
