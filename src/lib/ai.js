// Calls the Vercel serverless proxy at /api/ai
// which uses GitHub Models (gpt-4.1-mini) — GITHUB_AI_KEY stored in Vercel env vars
async function callAI(action, payload) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })
  if (!res.ok) throw new Error(`AI proxy error: ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.result
}

export async function cleanTextAI(pages, title) {
  const BATCH = 6
  const cleaned = []
  for (let i = 0; i < pages.length; i += BATCH) {
    const batch = pages.slice(i, i + BATCH)
    const text  = batch.map(p => `[PAGE ${p.num}]\n${p.text}`).join('\n\n')
    try {
      const result = await callAI('cleanText', { text, title })
      const parsed = typeof result === 'string' ? JSON.parse(result) : result
      cleaned.push(...parsed)
    } catch {
      cleaned.push(...batch)
    }
  }
  return cleaned
}

export async function makeQuestionsAI(pages, title, chapters) {
  const sample = pages.slice(0, Math.min(pages.length, 60))
  const text   = sample.map(p => `[PAGE ${p.num}]\n${p.text}`).join('\n\n')
  const chaps  = chapters.map(c => `${c.title} (pág ${c.pageNum})`).join(', ')
  try {
    const result = await callAI('makeQuestions', { text, title, chapters: chaps })
    const parsed = typeof result === 'string' ? JSON.parse(result) : result
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function evalAnswerAI(question, answer, context) {
  const result = await callAI('evalAnswer', { question, answer, context })
  const parsed = typeof result === 'string' ? JSON.parse(result) : result
  return parsed // { score, feedback, correct }
}
