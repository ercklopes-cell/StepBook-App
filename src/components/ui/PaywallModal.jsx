import { useState } from 'react'
import { usePlan } from '../../hooks/usePlan'
import { useToast } from '../../hooks/useToast'

export default function PaywallModal({ onClose }) {
  const { activateKey } = usePlan()
  const toast = useToast()
  const [key,     setKey]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleActivate = async () => {
    if (!key.trim()) return
    setLoading(true)
    const { ok, msg } = await activateKey(key)
    setLoading(false)
    toast(msg)
    if (ok) onClose()
  }

  return (
    <div className="overlay center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: '2.5rem' }}>⭐</span>
          <h3 className="modal-title" style={{ marginTop: 10 }}>StepBook Pro</h3>
          <p className="modal-sub">Desbloqueie livros ilimitados por R$&nbsp;6,99/mês</p>
        </div>

        {/* Features */}
        <div style={styles.features}>
          {[
            ['📚', 'Livros ilimitados'],
            ['🤖', 'IA para avaliação de respostas'],
            ['📊', 'Cards de compartilhamento'],
            ['🔄', 'Sincronização entre dispositivos'],
          ].map(([icon, label]) => (
            <div key={label} style={styles.feature}>
              <span>{icon}</span>
              <span style={{ fontSize: '0.88rem', color: 'var(--text2)' }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="divider" />

        {/* Key activation */}
        <p style={{ fontSize: '0.80rem', color: 'var(--text2)', marginBottom: 10 }}>
          Tem uma chave de ativação? Insira abaixo:
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            value={key}
            onChange={e => setKey(e.target.value.toUpperCase())}
            placeholder="STEP-MAR26-XXXX"
            style={{ letterSpacing: '0.08em', fontFamily: 'monospace', fontSize: '0.85rem' }}
            onKeyDown={e => e.key === 'Enter' && handleActivate()}
          />
          <button
            className="btn btn-gold"
            onClick={handleActivate}
            disabled={loading || !key.trim()}
            style={{ flexShrink: 0 }}
          >
            {loading
              ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              : 'Ativar'}
          </button>
        </div>

        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 8 }}>
          Chaves disponíveis via Telegram: @stepbook_app
        </p>

        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }} onClick={onClose}>
          Continuar grátis
        </button>
      </div>
    </div>
  )
}

const styles = {
  features: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 },
  feature: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px',
    background: 'var(--gold-dim)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
}
