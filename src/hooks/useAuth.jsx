import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tenta recuperar sessão atual
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        // Sessão inválida ou expirada — limpa tudo e mostra login
        supabase.auth.signOut().catch(() => {})
        setUser(null)
      } else {
        setUser(data.session.user)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null)
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null)
      } else if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
      } else if (!session) {
        // Token inválido — força logout limpo
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUpWithEmail = (email, password) =>
    supabase.auth.signUp({ email, password })

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
