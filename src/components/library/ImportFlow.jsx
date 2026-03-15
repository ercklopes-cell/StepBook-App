import { useEffect, useState } from 'react'
import { useBooks } from '../../hooks/useBooks'
import { useToast } from '../../hooks/useToast'
import { readPDF, detectChapters, injectAutoMCQ, fetchBookMeta, guessEmoji } from '../../lib/pdf'
import { cleanTextAI, makeQuestionsAI } from '../../lib/ai'

const STEPS = [
  'Lendo o PDF…',
  'Buscando metadados do livro…',
  'Detectando capítulos…',
  'Limpando texto com IA…',
  'Gerando perguntas com IA…',
  'Salvando na sua biblioteca…',
]

export default function ImportFlow({ file, onDone, onOpenBook }) {
  const { saveBook, uploadPDF } = useBooks()
  const toast = useToast()
  const [step,  setStep]  = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    run()
  }, [])

  const run = async () => {
    try {
      // Step 0 — read PDF
      setStep(0)
      const { pages, coverB64, totalPages } = await readPDF(file)

      // Step 1 — book meta
      setStep(1)
      const rawTitle = file.name.replace(/\.(pdf|txt)$/i, '').replace(/_/g, ' ')
      const meta = await fetchBookMeta(rawTitle)

      // Step 2 — detect chapters
      setStep(2)
      const chapters = detectChapters(pages)

      // Step 3 — clean text
      setStep(3)
      const cleanPages = await cleanTextAI(pages, meta.title || rawTitle)

      // Step 4 — make questions
      setStep(4)
      let questions = await makeQuestionsAI(cleanPages, meta.title || rawTitle, chapters)
      questions = injectAutoMCQ(questions, totalPages)

      // Step 5 — save
      setStep(5)
      const bookData = {
        title:       meta.title   || rawTitle,
        author:      meta.author  || 'Autor desconhecido',
        cover_b64:   coverB64,
        cover_url:   meta.coverUrl || null,
        emoji:       guessEmoji(meta.title || rawTitle),
        description: meta.description || '',
        chapters,
        questions,
        reflections: [],
        total_pages: totalPages,
        progress:    0,
        added_at:    new Date().toISOString(),
      }

      const saved = await saveBook(bookData)

      // Upload PDF to storage
      try { await uploadPDF(saved.id, file) } catch { /* non-fatal */ }

      // Also persist pages in Supabase (in chunks to avoid payload limits)
      await savePages(saved.id, cleanPages)

      toast(`"${saved.title}" importado com sucesso!`)
      onOpenBook({ ...saved, pages: cleanPages })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Erro ao importar o PDF.')
    }
  }

  async function savePages(bookId, pages) {
    // Save pages as chunks of 50 to avoid row limits
    const CHUNK = 50
    // First delete existing
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('book_pages').delete().eq('book_id', bookId)
    for (let i = 0; i < pages.length; i += CHUNK) {
      const chunk = pages.slice(i, i + CHUNK).map(p => ({
        book_id:  bookId,
        page_num: p.num,
        text:     p.text,
      }))
      await supabase.from('book_pages').insert(chunk)
    }
  }

  if (error) {
    return (
      <div style={styles.center}>
        <span style={{ fontSize: '2rem' }}>❌</span>
        <p style={{ color: 'var(--red)', marginTop: 12 }}>{error}</p>
        <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={onDone}>
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div style={styles.center}>
      <div className="loading-logo">StepBook</div>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={styles.stepText}>{STEPS[step]}</p>
      <div style={styles.stepsBar}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.dot,
              background: i <= step ? 'var(--gold)' : 'var(--border2)',
              transform: i === step ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>
      <p style={{ color: 'var(--text3)', fontSize: '0.76rem', marginTop: 8 }}>
        Passo {step + 1} de {STEPS.length}
      </p>
    </div>
  )
}

const styles = {
  center: {
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16,
    padding: 20,
  },
  stepText: { color: 'var(--text2)', fontSize: '0.9rem', textAlign: 'center' },
  stepsBar: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
}
