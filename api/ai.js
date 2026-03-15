// api/ai.js — Vercel Serverless Function
// Proxy seguro para GitHub Models (gpt-4.1-mini)
// Variável de ambiente no Vercel: GITHUB_AI_KEY

const ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions'
const MODEL    = 'gpt-4.1-mini'

const PROMPTS = {
  cleanText: ({ text, title }) => `
Você é um assistente especializado em limpeza de texto extraído de PDFs.
Livro: "${title}"

Texto extraído (pode conter artefatos, quebras erradas, hifenizações incorretas):
${text}

Corrija APENAS os artefatos técnicos do PDF (hifenizações, quebras de linha erradas, caracteres estranhos).
NÃO altere o conteúdo ou significado do texto.

Retorne SOMENTE um array JSON válido, sem nenhum texto adicional:
[{"num": N, "text": "texto corrigido"}]`,

  makeQuestions: ({ text, title, chapters }) => `
Você é um especialista em pedagogia ativa e andragogia.
Livro: "${title}"
Capítulos: ${chapters}

Analise o texto e gere perguntas de compreensão que estimulem reflexão profunda.
Alterne entre perguntas abertas (qtype:"text") e múltipla escolha (qtype:"mcq").
Crie uma pergunta a cada 2 capítulos aproximadamente.

Texto (amostra):
${text.slice(0, 8000)}

Retorne SOMENTE um array JSON válido, sem nenhum texto adicional:
[{
  "beforePage": <número inteiro da página>,
  "qtype": "text",
  "type": "Reflexão",
  "question": "pergunta aberta aqui"
},
{
  "beforePage": <número inteiro da página>,
  "qtype": "mcq",
  "type": "Quiz",
  "question": "pergunta de múltipla escolha",
  "options": ["opção A correta", "opção B incorreta"],
  "correct": 0
}]`,

  evalAnswer: ({ question, answer, context }) => `
Você é um tutor cognitivo avaliando a resposta de um leitor ativo.

Pergunta feita ao leitor: "${question}"
Resposta do leitor: "${answer}"
Trecho do livro para referência: "${(context || '').slice(0, 400)}"

Avalie a resposta considerando:
- Demonstra compreensão do conteúdo lido
- Apresenta reflexão genuína (não apenas repete o texto)
- Conecta o conteúdo com ideias próprias do leitor

Critérios de pontuação:
- 70-100: Resposta completa com reflexão genuína → libera o próximo capítulo
- 40-69:  Boa tentativa, mas pode aprofundar mais → incentiva retry
- 0-39:   Superficial ou fora do contexto → pede nova tentativa

Retorne SOMENTE um JSON válido, sem nenhum texto adicional:
{
  "score": <número de 0 a 100>,
  "feedback": "<feedback encorajador em português, máximo 120 caracteres>",
  "correct": <true se score >= 70, false caso contrário>
}`
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GITHUB_AI_KEY
  if (!apiKey) return res.status(500).json({ error: 'GITHUB_AI_KEY not configured' })

  try {
    const { action, payload } = req.body
    const promptFn = PROMPTS[action]
    if (!promptFn) return res.status(400).json({ error: `Unknown action: ${action}` })

    const prompt = promptFn(payload)

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       MODEL,
        max_tokens:  2048,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente preciso. Retorne APENAS JSON válido quando solicitado, sem texto adicional, sem markdown, sem blocos de código.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('GitHub Models error:', response.status, errBody)
      return res.status(502).json({ error: `Upstream error: ${response.status}` })
    }

    const data   = await response.json()
    const result = data.choices?.[0]?.message?.content ?? ''

    return res.status(200).json({ result })
  } catch (err) {
    console.error('API handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}
