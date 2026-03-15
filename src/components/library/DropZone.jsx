import { useRef, useState } from 'react'

export default function DropZone({ onFile }) {
  const inputRef  = useRef()
  const [drag, setDrag] = useState(false)

  const pick = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf','txt'].includes(ext)) { alert('Somente PDF ou TXT.'); return }
    onFile(file)
  }

  return (
    <div
      style={{ ...styles.zone, ...(drag ? styles.zoneDrag : {}) }}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]) }}
    >
      <span style={{ fontSize: '2.2rem' }}>📄</span>
      <p style={styles.text}>
        {drag ? 'Solte aqui!' : 'Toque ou arraste um PDF'}
      </p>
      <p style={styles.sub}>PDF ou TXT · Máx. 50MB</p>
      <input
        ref={inputRef} type="file" accept=".pdf,.txt"
        style={{ display: 'none' }}
        onChange={e => pick(e.target.files?.[0])}
      />
    </div>
  )
}

const styles = {
  zone: {
    border: '2px dashed var(--border2)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px 20px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8,
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  },
  zoneDrag: {
    borderColor: 'var(--gold)',
    background: 'var(--gold-dim)',
  },
  text: {
    fontSize: '0.9rem', color: 'var(--text2)', fontWeight: 500,
  },
  sub: { fontSize: '0.76rem', color: 'var(--text3)' },
}
