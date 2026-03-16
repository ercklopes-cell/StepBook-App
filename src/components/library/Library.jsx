import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { usePlan } from '../../hooks/usePlan'
import { useToast } from '../../hooks/useToast'
import { useBooks } from '../../hooks/useBooks'
import BookCard from './BookCard'
import DropZone from './DropZone'
import PaywallModal from '../ui/PaywallModal'
import DeleteModal from '../ui/DeleteModal'
import ImportFlow from './ImportFlow'

const LOGO_URL = 'https://i.ibb.co/Xkfz5QKL/sua-logo-stepbook.png'

export default function Library({ onOpenBook }) {
  const { user, signOut }              = useAuth()
  const { isPro }                      = usePlan()
  const toast                          = useToast()
  const { books, loading, deleteBook } = useBooks()

  const [showPaywall, setShowPaywall] = useState(false)
  const [delTarget,   setDelTarget]   = useState(null)
  const [importFile,  setImportFile]  = useState(null)

  const canAdd = () => isPro || books.length < 1

  const handleFile = (file) => {
    if (!canAdd()) { setShowPaywall(true); return }
    setImportFile(file)
  }

  const handleDelConfirm = async () => {
    await deleteBook(delTarget.id, delTarget.title)
    toast('Livro removido.')
    setDelTarget(null)
  }

  if (importFile) {
    return <ImportFlow file={importFile} onDone={() => setImportFile(null)} onOpenBook={onOpenBook} />
  }

  return (
    <div style={styles.wrap}>
      {/* ── NAV — só texto, sem logo ───── */}
      <nav style={styles.nav}>
        <span style={styles.navBrand}>
          StepBook <span style={styles.navSub}>— Leitura Interativa</span>
        </span>
        <div style={styles.navRight}>
          <span className="badge badge-gold">{isPro ? '⭐ Pro' : 'Grátis'}</span>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>Sair</button>
        </div>
      </nav>

      <div style={styles.content}>
        {/* ── HERO com logo centralizada no topo ── */}
        <header style={styles.hero}>
          {/* Logo central grande */}
          <div style={styles.logoWrap}>
            <img
              src={LOGO_URL}
              alt="StepBook"
              style={styles.logoImg}
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>

          {/* Label Mentor Cognitivo */}
          <p style={styles.heroLabel}>
            <span style={styles.heroLine} />
            Mentor Cognitivo
            <span style={styles.heroLineR} />
          </p>

          {/* Título principal */}
          <h1 style={styles.heroTitle}>
            Não é um leitor.<br />
            <em style={{ color: 'var(--gold)' }}>É um Mentor Cognitivo.</em>
          </h1>

          <p style={styles.heroSub}>
            Importe seu PDF. Responda perguntas. Desbloqueie cada capítulo.
          </p>
        </header>

        {/* ── PLAN BAR ──────────────────── */}
        {!isPro && (
          <div style={styles.planBar}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text2)' }}>
              Plano Grátis · {books.length}/1 livro
            </span>
            <button className="btn btn-gold btn-sm" onClick={() => setShowPaywall(true)}>
              Upgrade Pro ⭐
            </button>
          </div>
        )}

        {/* ── DROP ZONE ─────────────────── */}
        <DropZone onFile={handleFile} />

        {/* ── LIBRARY ───────────────────── */}
        <section style={{ marginTop: 48 }}>
          <div className="section-label">Minha Biblioteca</div>

          {loading ? (
            <div style={styles.emptyState}><div className="spinner" /></div>
          ) : books.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: '3rem' }}>📚</span>
              <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginTop: 12 }}>
                Sua biblioteca está vazia. Importe um PDF para começar.
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {books.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onOpen={() => onOpenBook(book)}
                  onDelete={() => setDelTarget({ id: book.id, title: book.title })}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      {delTarget && (
        <DeleteModal
          title={delTarget.title}
          onConfirm={handleDelConfirm}
          onClose={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: 'var(--bg)' },

  // Navbar — só texto
  nav: {
    position: 'sticky', top: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px',
    background: 'rgba(3,8,16,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
  },
  navBrand: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.05rem', fontWeight: 700,
    color: 'var(--gold)', letterSpacing: '0.02em',
  },
  navSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.78rem', fontWeight: 400,
    color: 'var(--text3)', letterSpacing: '0',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: 10 },

  // Conteúdo
  content: { maxWidth: 640, margin: '0 auto', padding: '32px 20px 80px' },

  // Hero
  hero: { textAlign: 'center', marginBottom: 36 },

  // Logo centralizada no topo do hero
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImg: {
    width: 120,
    height: 120,
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 18px rgba(212,175,55,0.55))',
    animation: 'none',
  },

  heroLabel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    color: 'var(--gold)', fontSize: '0.68rem', fontWeight: 600,
    letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16,
  },
  heroLine: {
    display: 'inline-block', width: 40, height: 1,
    background: 'linear-gradient(90deg, transparent, var(--gold))',
  },
  heroLineR: {
    display: 'inline-block', width: 40, height: 1,
    background: 'linear-gradient(90deg, var(--gold), transparent)',
  },
  heroTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
    fontWeight: 700, lineHeight: 1.25,
    color: 'var(--text)', marginBottom: 14,
  },
  heroSub: { color: 'var(--text2)', fontSize: '0.92rem', lineHeight: 1.6 },

  planBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 16,
  },
  emptyState: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '60px 20px', textAlign: 'center',
  },
}


export default function Library({ onOpenBook }) {
  const { user, signOut }           = useAuth()
  const { isPro, plan }             = usePlan()
  const toast                       = useToast()
  const { books, loading, deleteBook } = useBooks()

  const [showPaywall,  setShowPaywall]  = useState(false)
  const [delTarget,    setDelTarget]    = useState(null)  // {id, title}
  const [importFile,   setImportFile]   = useState(null)  // File to import

  const canAdd = () => isPro || books.length < 1

  const handleFile = (file) => {
    if (!canAdd()) { setShowPaywall(true); return }
    setImportFile(file)
  }

  const handleDelConfirm = async () => {
    await deleteBook(delTarget.id, delTarget.title)
    toast('Livro removido.')
    setDelTarget(null)
  }

  if (importFile) {
    return <ImportFlow file={importFile} onDone={() => setImportFile(null)} onOpenBook={onOpenBook} />
  }

  return (
    <div style={styles.wrap}>
      {/* ── NAV ───────────────────────── */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <Logo size={34} textSize="1.15rem" />
        </div>
        <div style={styles.navRight}>
          <span className="badge badge-gold">{isPro ? '⭐ Pro' : 'Grátis'}</span>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>Sair</button>
        </div>
      </nav>

      <div style={styles.content}>
        {/* ── HERO ──────────────────────── */}
        <header style={styles.hero}>
          <p style={styles.heroLabel}>
            <span style={styles.heroLine} />
            Mentor Cognitivo
            <span style={styles.heroLine} />
          </p>
          <h1 style={styles.heroTitle}>
            Não é um leitor.<br />
            <em style={{ color: 'var(--gold)' }}>É um Mentor Cognitivo.</em>
          </h1>
          <p style={styles.heroSub}>
            Importe seu PDF. Responda perguntas. Desbloqueie cada capítulo.
          </p>
        </header>

        {/* ── PLAN BAR ──────────────────── */}
        {!isPro && (
          <div style={styles.planBar}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text2)' }}>
              Plano Grátis · {books.length}/1 livro
            </span>
            <button className="btn btn-gold btn-sm" onClick={() => setShowPaywall(true)}>
              Upgrade Pro ⭐
            </button>
          </div>
        )}

        {/* ── DROP ZONE ─────────────────── */}
        <DropZone onFile={handleFile} />

        {/* ── LIBRARY ───────────────────── */}
        <section style={{ marginTop: 48 }}>
          <div className="section-label">Minha Biblioteca</div>

          {loading ? (
            <div style={styles.emptyState}>
              <div className="spinner" />
            </div>
          ) : books.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: '3rem' }}>📚</span>
              <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginTop: 12 }}>
                Sua biblioteca está vazia. Importe um PDF para começar.
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {books.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onOpen={() => onOpenBook(book)}
                  onDelete={() => setDelTarget({ id: book.id, title: book.title })}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      {delTarget   && (
        <DeleteModal
          title={delTarget.title}
          onConfirm={handleDelConfirm}
          onClose={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: 'var(--bg)' },
  nav: {
    position: 'sticky', top: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px',
    background: 'rgba(3,8,16,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: 9 },
  navLogoText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.15rem', fontWeight: 700,
    color: 'var(--gold)',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: 10 },
  content: { maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' },
  hero: { textAlign: 'center', marginBottom: 36 },
  heroLabel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    color: 'var(--gold)', fontSize: '0.68rem', fontWeight: 600,
    letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16,
  },
  heroLine: {
    display: 'inline-block', width: 40, height: 1,
    background: 'linear-gradient(90deg, transparent, var(--gold))',
  },
  heroTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
    fontWeight: 700, lineHeight: 1.25,
    color: 'var(--text)', marginBottom: 14,
  },
  heroSub: { color: 'var(--text2)', fontSize: '0.92rem', lineHeight: 1.6 },
  planBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 16,
  },
  emptyState: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '60px 20px', textAlign: 'center',
  },
}
