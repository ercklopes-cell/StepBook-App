import { useState } from 'react'
import { evalAnswerAI } from '../../lib/ai'
import { useToast } from '../../hooks/useToast'

export default function QBlock({ question, questionIdx, bookId, context, onPatch }) {
  const toast   = useToast()
  const [text,  setText]    = useState(question.answer || '')
  const [busy,  setBusy]    = useState(false)

  // ── Already answered correctly ──────────────────────────
  if (question.quality === 'good') {
    return (
      <div className="q-block">
        <div className="q-block-header">
          <div className="q-dot" style={{ background: 'var(--green)' }} />
          <span className="q-badge" style={{ color: 'var(--green)' }}>
            {question.type}
          </span>
        </div>
        <p className="q-question">{question.question}</p>
        <div className="q-status-good">
          <span>✓</span> Gate liberado · Próximo capítulo desbloqueado
        </div>
      </div>
    )
  }

  // ── MCQ ─────────────────────────────────────────────────
  if (question.qtype === 'mcq') {
    return (
      <div className="q-block">
        <div className="q-block-header">
          <div className="q-dot" />
          <span className="q-badge">Quiz</span>
        </div>
        <p className="q-question">{question.question}</p>

        <div className="mcq-options">
          {question.options?.map((opt, i) => {
            let cls = 'mcq-option'
            if (question.answered) {
              if (i === question.correct)              cls += ' correct'
              else if (i === question.selectedOpt)     cls += ' wrong'
            } else if (i === question.selectedOpt) {
              cls += ' selected'
            }
            return (
              <button
                key={i} className={cls}
                disabled={question.answered}
                onClick={() => onPatch(questionIdx, { selectedOpt: i })}
              >
                <span style={styles.optLetter}>{i === 0 ? 'A' : 'B'}</span>
                {opt}
              </button>
            )
          })}
        </div>

        {!question.answered && (
          <button
            className="btn btn-gold btn-sm"
            disabled={question.selectedOpt === undefined || question.selectedOpt === null}
            onClick={() => {
              const correct = question.selectedOpt === question.correct
              onPatch(questionIdx, {
                answered: true,
                quality: correct ? 'good' : 'retry',
                answer: question.options[question.selectedOpt],
              })
              if (!correct) toast('Resposta incorreta. Tente novamente!')
            }}
          >
            Confirmar resposta
          </button>
        )}

        {question.answered && question.quality === 'retry' && (
          <>
            <div className="q-status-retry">Resposta incorreta. Revise o capítulo e tente novamente.</div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onPatch(questionIdx, { answered: false, selectedOpt: null, quality: null })}
            >
              Tentar novamente
            </button>
          </>
        )}
      </div>
    )
  }

  // ── TEXT (open answer) ───────────────────────────────────
  const submit = async () => {
    if (text.trim().length < 20) { toast('Escreva pelo menos 20 caracteres.'); return }
    setBusy(true)
    try {
      const result = await evalAnswerAI(question.question, text, context)
      const score  = result?.score ?? 0
      const quality = score >= 70 ? 'good' : score >= 40 ? 'close' : 'retry'
      onPatch(questionIdx, { answered: true, answer: text, quality, feedback: result?.feedback })
    } catch {
      toast('Erro ao avaliar. Tente novamente.')
    }
    setBusy(false)
  }

  return (
    <div className="q-block">
      <div className="q-block-header">
        <div className="q-dot" />
        <span className="q-badge">Reflexão</span>
      </div>
      <p className="q-question">{question.question}</p>

      {question.answered && question.quality === 'close' && (
        <div className="q-status-close">
          💡 {question.feedback || 'Boa tentativa! Aprofunde um pouco mais sua resposta.'}
        </div>
      )}
      {question.answered && question.quality === 'retry' && (
        <div className="q-status-retry">
          ⚠️ {question.feedback || 'Resposta muito superficial. Revise o trecho e tente novamente.'}
        </div>
      )}

      <textarea
        className="input"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Escreva sua reflexão aqui…"
        rows={4}
        disabled={busy}
        style={{ marginBottom: 12 }}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          className="btn btn-gold btn-sm"
          onClick={submit}
          disabled={busy || text.trim().length < 5}
        >
          {busy
            ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Avaliando…</>
            : 'Enviar resposta'}
        </button>
        {question.answered && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onPatch(questionIdx, { answered: false, quality: null, feedback: null })}
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  optLetter: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 22, height: 22, borderRadius: '50%',
    background: 'var(--border2)', color: 'var(--gold)',
    fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
  },
}
