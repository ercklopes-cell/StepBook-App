import { useRef } from 'react'
import { useBooks } from '../../hooks/useBooks'
import { useToast } from '../../hooks/useToast'

export default function BookCard({ book, onOpen, onDelete }) {
  const { uploadCover } = useBooks()
  const toast = useToast()
  const fileRef = useRef()

  const handleCover = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadCover(book.id, file)
      toast('Capa atualizada!')
    } catch {
      toast('Erro ao atualizar capa.')
    }
  }

  const coverSrc = book.cover_url
    ? book.cover_url
    : book.cover_b64
    ? `data:image/jpeg;base64,${book.cover_b64}`
    : null

  return (
    <div style={styles.card}>
      {/* Cover */}
      <div style={styles.cover} onClick={onOpen}>
        {coverSrc
          ? <img src={coverSrc} alt={book.title} style={styles.coverImg} />
          : <div style={styles.coverEmpty}>
              <span style={{ fontSize: '2rem' }}>{book.emoji || '📖'}</span>
            </div>
        }
        <div style={styles.coverOverlay}>
          <span style={styles.playIcon}>▶</span>
        </div>
      </div>

      {/* Meta */}
      <div style={styles.meta}>
        <p style={styles.title} title={book.title}>{book.title}</p>
        <p style={styles.author}>{book.author}</p>

        {/* Progress */}
        <div className="progress-bar" style={{ marginTop: 8 }}>
          <div className="progress-bar-fill" style={{ width: `${book.progress ?? 0}%` }} />
        </div>
        <p style={styles.pct}>{book.progress ?? 0}%</p>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button
          style={styles.actionBtn}
          title="Alterar capa"
          onClick={() => fileRef.current?.click()}
        >📷</button>
        <button
          style={{ ...styles.actionBtn, color: 'var(--red)' }}
          title="Remover livro"
          onClick={onDelete}
        >✕</button>
      </div>

      <input
        ref={fileRef} type="file" accept="image/*"
        style={{ display: 'none' }} onChange={handleCover}
      />
    </div>
  )
}

const styles = {
  card: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    transition: 'border-color 0.2s, transform 0.2s',
    position: 'relative',
    cursor: 'pointer',
  },
  cover: {
    aspectRatio: '2/3',
    background: 'var(--bg3)',
    position: 'relative',
    overflow: 'hidden',
  },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover' },
  coverEmpty: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface)',
  },
  coverOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(3,8,16,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0, transition: 'opacity 0.2s',
  },
  playIcon: { color: 'var(--gold)', fontSize: '1.5rem' },
  meta: { padding: '10px 12px 4px' },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '0.82rem', fontWeight: 600,
    color: 'var(--text)', lineHeight: 1.3,
    overflow: 'hidden', textOverflow: 'ellipsis',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
    marginBottom: 3,
  },
  author: { fontSize: '0.72rem', color: 'var(--text3)' },
  pct: { fontSize: '0.68rem', color: 'var(--gold)', fontWeight: 600, marginTop: 4 },
  actions: {
    display: 'flex', justifyContent: 'flex-end', gap: 4,
    padding: '4px 8px 8px',
  },
  actionBtn: {
    background: 'none', border: 'none',
    color: 'var(--text3)', fontSize: '0.8rem',
    cursor: 'pointer', padding: '4px 6px', borderRadius: 4,
    transition: 'color 0.15s',
  },
}
