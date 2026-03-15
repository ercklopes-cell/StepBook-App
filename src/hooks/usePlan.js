import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const VALID_KEYS = {
  'STEP-JAN26-X7K2': 'Janeiro 2026',
  'STEP-FEV26-M3P9': 'Fevereiro 2026',
  'STEP-MAR26-Q5R1': 'Março 2026',
  'STEP-ABR26-T8W4': 'Abril 2026',
  'STEP-MAI26-Y2N6': 'Maio 2026',
  'STEP-JUN26-K9P3': 'Junho 2026',
  'STEP-JUL26-H4F7': 'Julho 2026',
  'STEP-AGO26-B6D1': 'Agosto 2026',
  'STEP-SET26-C3M8': 'Setembro 2026',
  'STEP-OUT26-Z5R2': 'Outubro 2026',
  'STEP-NOV26-W7K9': 'Novembro 2026',
  'STEP-DEZ26-J1P4': 'Dezembro 2026',
}

export function usePlan() {
  const { user } = useAuth()
  const [plan,    setPlan]    = useState('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setPlan('free'); setLoading(false); return }
    supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.plan === 'pro') {
          const expired = data.plan_expires_at && new Date(data.plan_expires_at) < new Date()
          setPlan(expired ? 'free' : 'pro')
        }
        setLoading(false)
      })
  }, [user])

  const isPro = plan === 'pro'

  const activateKey = async (key) => {
    const upper = key.trim().toUpperCase()
    if (!VALID_KEYS[upper]) return { ok: false, msg: 'Chave inválida.' }

    // Check if key was already used globally
    const { data: usedRow } = await supabase
      .from('used_keys')
      .select('id')
      .eq('key', upper)
      .single()

    if (usedRow) return { ok: false, msg: 'Chave já utilizada.' }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('profiles').update({
      plan: 'pro',
      plan_expires_at: expiresAt
    }).eq('id', user.id)

    await supabase.from('used_keys').insert({ key: upper, user_id: user.id })

    setPlan('pro')
    return { ok: true, msg: `Pro ativado! Válido até ${new Date(expiresAt).toLocaleDateString('pt-BR')}.` }
  }

  return { plan, isPro, loading, activateKey }
}
