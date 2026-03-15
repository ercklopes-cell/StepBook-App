import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString()

export async function readPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf         = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages       = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text    = content.items.map(item => item.str).join(' ').trim()
    pages.push({ num: i, text })
  }

  // Extract cover from page 1
  const coverB64 = await extractCover(pdf)
  return { pages, coverB64, totalPages: pdf.numPages }
}

async function extractCover(pdf) {
  try {
    const page     = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 0.6 })
    const canvas   = document.createElement('canvas')
    canvas.width   = viewport.width
    canvas.height  = viewport.height
    const ctx      = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
  } catch {
    return null
  }
}

export function detectChapters(pages) {
  const patterns = [
    /^(cap[íi]tulo\s+[\divxlcdmIVXLCDM]+[.\s:])/i,
    /^(chapter\s+\d+)/i,
    /^(parte\s+[\divxlcdmIVXLCDM]+)/i,
    /^(\d{1,2}\.\s{1,3}[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜ][^\n]{3,60})/m,
  ]

  const chapters = []
  for (const page of pages) {
    const firstLine = page.text.split(/\n/)[0].trim()
    for (const re of patterns) {
      if (re.test(firstLine)) {
        chapters.push({ title: firstLine.slice(0, 80), pageNum: page.num, locked: false })
        break
      }
    }
  }

  // Fallback: 8 equal sections
  if (chapters.length < 2) {
    const step = Math.floor(pages.length / 8)
    return Array.from({ length: 8 }, (_, i) => ({
      title:   `Seção ${i + 1}`,
      pageNum: pages[i * step]?.num ?? 1,
      locked:  i % 2 !== 0,
    }))
  }

  return chapters.map((c, i) => ({ ...c, locked: i % 2 !== 0 }))
}

export function injectAutoMCQ(questions, totalPages) {
  const points = [
    { idx: Math.floor(totalPages * 0.25), label: '25%' },
    { idx: Math.round(totalPages * 0.50), label: '50%' },
    { idx: Math.round(totalPages * 0.75), label: '75%' },
    { idx: totalPages - 1,                label: '100%' },
  ]

  for (const pt of points) {
    const near = questions.some(q => Math.abs(q.beforePage - pt.idx) <= 3)
    if (!near) {
      questions.push({
        beforePage: pt.idx,
        qtype: 'mcq',
        type:  'Quiz',
        question: `Checkpoint ${pt.label}: Qual das afirmações abaixo melhor resume o que você leu até aqui?`,
        options: ['Faz um bom resumo do conteúdo lido', 'Não representa bem o que foi lido'],
        correct: 0,
        answered: false,
        answer: null,
        quality: null,
        _auto: true,
      })
    }
  }
  return questions.sort((a, b) => a.beforePage - b.beforePage)
}

export async function fetchBookMeta(title) {
  try {
    const q   = encodeURIComponent(title)
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`)
    const data = await res.json()
    const item = data.items?.[0]?.volumeInfo
    if (!item) return {}
    return {
      title:       item.title       || title,
      author:      item.authors?.[0]|| 'Autor desconhecido',
      description: item.description || '',
      coverUrl:    item.imageLinks?.thumbnail || '',
    }
  } catch {
    return {}
  }
}

export function guessEmoji(title) {
  const t = title.toLowerCase()
  if (/psicolog|mente|comportamento|habit/.test(t)) return '🧠'
  if (/lider|gestão|empresa|negócio|empreend/.test(t)) return '💼'
  if (/financ|invest|dinheiro|riqueza/.test(t)) return '💰'
  if (/filosofia|plato|aristotel|estoic/.test(t)) return '🏛️'
  if (/história|guerra|impér/.test(t)) return '⚔️'
  if (/romance|amor|relacionamento/.test(t)) return '❤️'
  if (/ciência|física|biolog|evolução/.test(t)) return '🔬'
  if (/programação|código|software|tech/.test(t)) return '💻'
  return '📖'
}
