export default function ChapPanel({ chapters, questions, onJump, onClose }) {
  const isUnlocked = (ch) => {
    if (!ch.locked) return true
    const gate = questions.find(
      q => q.beforePage >= ch.pageNum - 2 && q.beforePage <= ch.pageNum + 2
    )
    return gate?.quality === 'good'
  }

  return (
    <>
      {/* Backdrop */}
      <div style={styles.backdrop} onClick={onClose} />

      {/* Panel */}
      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>Capítulos</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.list}>
          {chapters.map((ch, i) => {
            const unlocked = isUnlocked(ch)
            return (
              <button
                key={i}
                style={{ ...styles.item, opacity: unlocked ? 1 : 0.5 }}
                onClick={() => unlocked && onJump(ch.pageNum)}
                disabled={!unlocked}
              >
                <span style={styles.num}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={styles.chapTitle}>{ch.title}</span>
                {!unlocked && <span style={styles.lock}>🔒</span>}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(3,8,16,0.6)',
    backdropFilter: 'blur(4px)', zIndex: 200,
  },
  panel: {
    position: 'fixed', left: 0, top: 0, bottom: 0,
    width: 'min(300px, 85vw)',
    background: 'var(--bg2)', borderRight: '1px solid var(--border2)',
    zIndex: 201, display: 'flex', flexDirection: 'column',
    animation: 'slideInLeft 0.25s cubic-bezier(.22,1,.36,1)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 20px 16px',
    borderBottom: '1px solid var(--border)',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.1rem', color: 'var(--text)',
  },
  closeBtn: {
    background: 'none', border: 'none',
    color: 'var(--text3)', fontSize: '1rem', cursor: 'pointer',
  },
  list: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  item: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 20px', background: 'none', border: 'none',
    cursor: 'pointer', textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.15s',
    color: 'var(--text)',
  },
  num: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.72rem', fontWeight: 700,
    color: 'var(--gold)', letterSpacing: '0.05em', flexShrink: 0,
  },
  chapTitle: {
    fontSize: '0.85rem', lineHeight: 1.3, flex: 1,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  lock: { fontSize: '0.8rem', flexShrink: 0 },
}
