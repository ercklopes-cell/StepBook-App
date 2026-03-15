import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import Logo from '../ui/Logo'

export default function AuthScreen() {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const toast = useToast()
  const [mode,     setMode]     = useState('login') // 'login' | 'signup'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    const fn = mode === 'login' ? signInWithEmail : signUpWithEmail
    const { error } = await fn(email, password)
    setLoading(false)
    if (error) {
      toast(error.message)
    } else if (mode === 'signup') {
      toast('Conta criada! Verifique seu e-mail para confirmar.')
    }
  }

  return (
    <div style={styles.wrap}>
      {/* Background glow */}
      <div style={styles.glow} />

      <div style={styles.box}>
        {/* Logo com destaque */}
        <div style={styles.logo}>
          <img
            src="/logo.png"
            alt="StepBook"
            style={{
              width: 72,
              height: 72,
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 14px rgba(222,173,42,0.5))',
              display: 'block',
              margin: '0 auto 4px',
            }}
          />
          <span style={styles.logoText}>StepBook</span>
        </div>

        <h1 style={styles.title}>
          {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
        </h1>
        <p style={styles.sub}>
          {mode === 'login'
            ? 'Sua biblioteca te espera.'
            : 'Comece sua jornada de leitura ativa.'}
        </p>

        <form onSubmit={handle} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>E-mail</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            className="btn btn-gold"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
          >
            {loading
              ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> Aguarde…</>
              : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div className="divider" />

        <p style={styles.switch}>
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button
            style={styles.switchBtn}
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Criar agora' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(222,173,42,0.06) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    pointerEvents: 'none',
  },
  box: {
    width: '100%',
    maxWidth: 400,
    background: 'var(--bg2)',
    border: '1px solid var(--border2)',
    borderRadius: 'var(--radius-lg)',
    padding: '36px 32px',
    position: 'relative',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginBottom: 28,
  },
  logoText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.04em',
    textAlign: 'center',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.5rem',
    color: 'var(--text)',
    marginBottom: 6,
  },
  sub: {
    fontSize: '0.88rem',
    color: 'var(--text2)',
    marginBottom: 28,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.05em', textTransform: 'uppercase' },
  switch: { textAlign: 'center', fontSize: '0.85rem', color: 'var(--text2)' },
  switchBtn: {
    background: 'none', border: 'none',
    color: 'var(--gold)', fontWeight: 600,
    cursor: 'pointer', fontSize: '0.85rem',
    textDecoration: 'underline',
  },
}
