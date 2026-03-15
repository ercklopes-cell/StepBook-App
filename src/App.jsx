import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import AuthScreen from './components/auth/AuthScreen'
import Library    from './components/library/Library'
import Reader     from './components/reader/Reader'
import './styles/globals.css'

function AppInner() {
  const { user, loading } = useAuth()
  const [openBook, setOpenBook] = useState(null)

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-logo">StepBook</div>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  if (openBook) {
    return (
      <Reader
        book={openBook}
        onGoHome={() => setOpenBook(null)}
      />
    )
  }

  return (
    <Library onOpenBook={setOpenBook} />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  )
}
