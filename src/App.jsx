import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import AuthScreen from './components/auth/AuthScreen'
import Library    from './components/library/Library'
import Reader     from './components/reader/Reader'
import './styles/globals.css'

// Verifica variáveis de ambiente antes de tudo
const MISSING_ENV = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

function AppInner() {
  const { user, loading } = useAuth()
  const [openBook, setOpenBook] = useState(null)

  if (loading) {
    return (
      <div className="loading-overlay">
        <img src="/logo.png" alt="StepBook" style={{ width: 80, marginBottom: 8 }} />
        <div className="loading-logo">StepBook</div>
        <div className="spinner" />
        <p style={{ color: 'var(--text3)', fontSize: '0.8rem', marginTop: 8 }}>
          Conectando…
        </p>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  if (openBook) {
    return <Reader book={openBook} onGoHome={() => setOpenBook(null)} />
  }

  return <Library onOpenBook={setOpenBook} />
}

export default function App() {
  // Tela de erro quando variáveis de ambiente não estão configuradas
  if (MISSING_ENV) {
    return (
      <div style={{
        minHeight: '100vh', background: '#030810',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: "'DM Sans', sans-serif",
        color: '#fff', gap: 16, textAlign: 'center'
      }}>
        <img src="/logo.png" alt="StepBook" style={{ width: 72 }} />
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#DEAD2A', fontSize: '1.6rem' }}>
          StepBook
        </h1>
        <div style={{
          background: '#07111f', border: '1px solid rgba(208,80,80,0.4)',
          borderRadius: 8, padding: '20px 24px', maxWidth: 420
        }}>
          <p style={{ color: '#d05050', fontWeight: 600, marginBottom: 12 }}>
            ⚠️ Variáveis de ambiente não configuradas
          </p>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            Configure no Vercel → Settings → Environment Variables:
          </p>
          <div style={{
            background: '#030810', borderRadius: 6,
            padding: '12px 14px', marginTop: 12,
            fontFamily: 'monospace', fontSize: '0.78rem',
            color: '#DEAD2A', textAlign: 'left', lineHeight: 2
          }}>
            VITE_SUPABASE_URL<br />
            VITE_SUPABASE_ANON_KEY<br />
            GITHUB_AI_KEY
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  )
}
