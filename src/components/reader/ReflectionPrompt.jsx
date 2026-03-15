import { useState } from 'react'

export default function ReflectionPrompt({ milestone, onSave, onClose }) {
  const [text, setText] = useState('')

  return (
    <div className="overlay">
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: '1.4rem' }}>
            {milestone === 100 ? '🏆' : '✨'}
          </span>
          <span className="badge badge-gold">
            {milestone}% concluído
          </span>
        </div>
        <h3 className="modal-title">
          {milestone === 100
            ? 'Você terminou o livro!'
            : `Você chegou à metade do livro!`}
        </h3>
        <p className="modal-sub">
          Reserve um momento para registrar o que esse livro está te ensinando.
        </p>

        <textarea
          className="input"
          rows={5}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={
            milestone === 100
              ? 'Qual foi a maior lição desse livro para você?'
              : 'O que mais te marcou até aqui?'
          }
          autoFocus
        />

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Agora não
          </button>
          <button
            className="btn btn-gold"
            disabled={text.trim().length < 10}
            onClick={() => onSave(text)}
          >
            Salvar reflexão
          </button>
        </div>
      </div>
    </div>
  )
}
