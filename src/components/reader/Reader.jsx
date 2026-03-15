import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useBooks } from '../../hooks/useBooks'
import { useToast } from '../../hooks/useToast'
import QBlock from './QBlock'
import ChapPanel from './ChapPanel'
import ShareModal from '../share/ShareModal'
import ReflectionPrompt from './ReflectionPrompt'
import Logo from '../ui/Logo'

export default function Reader({ book: initialBook, onGoHome }) {
  const { updateProgress, updateQuestions, saveReflection } = useBooks()
  const toast = useToast()

  const [book,         setBook]         = useState(initialBook)
  const [pages,        setPages]        = useState(initialBook.pages || [])
  const [questions,    setQuestions]    = useState(initialBook.questions || [])
  const [chapOpen,     setChapOpen]     = useState(false)
  const [shareOpen,    setShareOpen]    = useState(false)
  const [shareMode,    setShareMode]    = useState('feed') // 'feed' | 'stories'
  const [reflPrompt,   setReflPrompt]   = useState(null) // 60 | 100
  const [progress,     setProgress]     = useState(initialBook.progress || 0)
  const [bookmarkExp,  setBookmarkExp]  = useState(false)
  const [quoteText,    setQuoteText]    = useState('')
  const bodyRef = useRef()

  // Load pages from Supabase if not in memory
  useEffect(() => {
    if (!pages.length) loadPages()
  }, [])

  const loadPages = async () => {
    const { data } = await supabase
      .from('book_pages')
      .select('page_num, text')
      .eq('book_id', book.id)
      .order('page_num')
    if (data) setPages(data.map(r => ({ num: r.page_num, text: r.text })))
  }

  // Track scroll progress
  const onScroll = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)
    const clamped = Math.min(100, Math.max(0, pct || 0))
    setProgress(clamped)
    updateProgress(book.id, clamped)

    // Milestone reflections
    if (clamped >= 60 && (book.progress || 0) < 60) {
      const already = book.reflections?.some(r => r._milestone === 60)
      if (!already) setReflPrompt(60)
    }
    if (clamped >= 100 && (book.progress || 0) < 100) {
      const already = book.reflections?.some(r => r._milestone === 100)
      if (!already) setReflPrompt(100)
    }
  }, [book, updateProgress])

  // Update a question (answered, quality, etc.)
  const patchQuestion = useCallback((idx, patch) => {
    setQuestions(qs => {
      const updated = qs.map((q, i) => i === idx ? { ...q, ...patch } : q)
      updateQuestions(book.id, updated)
      return updated
    })
  }, [book.id, updateQuestions])

  // Check if a page is locked (chapter gate)
  const isPageLocked = (pageNum) => {
    for (const ch of (book.chapters || [])) {
      if (!ch.locked) continue
      if (pageNum >= ch.pageNum) {
        // Find gate question for this chapter
        const gate = questions.find(q => q.beforePage >= ch.pageNum - 1 && q.beforePage <= ch.pageNum + 1)
        if (gate && gate.quality === 'good') continue
        if (gate && gate.quality !== 'good') {
          // Find next unlocked chapter
          const nextUnlocked = (book.chapters || []).find(c => !c.locked && c.pageNum > ch.pageNum)
          if (!nextUnlocked || pageNum < nextUnlocked.pageNum) return true
        }
      }
    }
    return false
  }

  const handleReflSave = async (text) => {
    const ref = {
      type: 'text', answer: text, question: `Reflexão aos ${reflPrompt}%`,
      answered: true, quality: 'good',
      _milestone: reflPrompt, addedAt: Date.now(),
    }
    await saveReflection(book.id, ref)
    setBook(b => ({ ...b, reflections: [...(b.reflections || []), ref] }))
    setReflPrompt(null)
    toast('Reflexão salva! ✨')
  }

  const jumpTo = (pageNum) => {
    setChapOpen(false)
    setTimeout(() => {
      const el = document.getElementById(`page-${pageNum}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div style={styles.wrap}>
      {/* ── TOP BAR ─────────────────────────────── */}
      <header style={styles.rbar}>
        <div style={styles.rbarLeft}>
          <Logo size={28} showText={false} />
          <button className="btn btn-ghost btn-sm" onClick={onGoHome}>
            ← Biblioteca
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setChapOpen(true)}>
            Capítulos
          </button>
        </div>
        <span style={styles.rbarTitle} title={book.title}>{book.title}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => { setShareMode('feed'); setShareOpen(true) }}>
          Compartilhar
        </button>
      </header>

      {/* Progress bar */}
      <div style={styles.progressWrap}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* ── READER BODY ─────────────────────────── */}
      <div style={styles.body} ref={bodyRef} onScroll={onScroll}>
        <div style={styles.pageWrap}>
          {pages.length === 0 ? (
            <div style={styles.loading}>
              <div className="spinner" />
              <p style={{ color: 'var(--text2)', marginTop: 12 }}>Carregando páginas…</p>
            </div>
          ) : pages.map((page, pi) => {
            const locked = isPageLocked(page.num)
            const pageQuestions = questions
              .map((q, qi) => ({ ...q, _qi: qi }))
              .filter(q => q.beforePage === page.num || q.beforePage === page.num - 1)

            return (
              <div key={page.num} id={`page-${page.num}`}>
                {/* Page label */}
                <div style={styles.pageLabel}>— pág. {page.num} —</div>

                {/* Page text */}
                <div
                  style={styles.pageText}
                  className={locked ? 'locked-blur' : ''}
                >
                  {page.text}
                </div>

                {/* Questions after this page */}
                {pageQuestions.map(q => (
                  <QBlock
                    key={q._qi}
                    question={q}
                    questionIdx={q._qi}
                    bookId={book.id}
                    context={page.text}
                    onPatch={patchQuestion}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── BOOKMARK ───────────────────────────── */}
      <button
        className="bookmark-btn"
        onClick={() => setBookmarkExp(b => !b)}
        title="Progresso"
      >
        {bookmarkExp ? `${progress}% lido` : `${progress}%`}
      </button>

      {/* ── BOTÃO QUOTE (canto inferior direito) ──── */}
      <button
        style={styles.quoteBtn}
        title="Selecione um trecho e crie um card para compartilhar"
        onClick={() => {
          const sel = window.getSelection()?.toString().trim()
          if (!sel || sel.length < 10) {
            toast('Selecione uma frase do texto primeiro.')
            return
          }
          setQuoteText(sel)
          setShareMode('stories')
          setShareOpen(true)
        }}
      >
        {/* Ícone balão de mensagem (como no modelo) */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
            fill="#000"
            stroke="#000"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ── CHAPTER PANEL ──────────────────────── */}
      {chapOpen && (
        <ChapPanel
          chapters={book.chapters || []}
          questions={questions}
          onJump={jumpTo}
          onClose={() => setChapOpen(false)}
        />
      )}

      {/* ── SHARE MODAL ─────────────────────────── */}
      {shareOpen && (
        <ShareModal
          book={book}
          progress={progress}
          mode={shareMode}
          quoteText={quoteText}
          onClose={() => { setShareOpen(false); setQuoteText('') }}
        />
      )}

      {/* ── REFLECTION PROMPT ──────────────────── */}
      {reflPrompt && (
        <ReflectionPrompt
          milestone={reflPrompt}
          onSave={handleReflSave}
          onClose={() => setReflPrompt(null)}
        />
      )}
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' },
  rbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'rgba(3,8,16,0.95)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0, gap: 8,
  },
  rbarLeft: { display: 'flex', gap: 8, alignItems: 'center' },
  rbarTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '0.9rem', color: 'var(--text2)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    flex: 1, textAlign: 'center',
  },
  progressWrap: { height: 2, background: 'var(--border)', flexShrink: 0 },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--gold), var(--gold2))',
    transition: 'width 0.5s ease',
  },
  body: { flex: 1, overflowY: 'auto', padding: '0 0 80px' },
  pageWrap: { maxWidth: 680, margin: '0 auto', padding: '32px 20px' },
  pageLabel: {
    textAlign: 'center', color: 'var(--text3)',
    fontSize: '0.70rem', letterSpacing: '0.12em',
    marginBottom: 16, userSelect: 'none',
  },
  pageText: {
    fontFamily: "'Crimson Pro', serif",
    fontSize: '1.08rem', lineHeight: 1.85,
    color: 'var(--text)',
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    marginBottom: 8,
  },
  loading: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh',
  },
  quoteBtn: {
    position: 'fixed',
    bottom: 28,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'var(--gold)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(222,173,42,0.45)',
    zIndex: 50,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
}
