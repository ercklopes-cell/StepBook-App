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

  makeQuestions: ({ text, title, chapters, description, currentChapter, chapterIndex }) => `
Você é um educador especialista em leitura ativa e pensamento crítico.
Livro: "${title}"
${description ? `Sobre o livro: "${description.slice(0,300)}"` : ''}
Capítulo atual: "${currentChapter || `Capítulo ${(chapterIndex||0)+1}`}"
Todos os capítulos: ${chapters}

Sua missão: criar 2 perguntas ESPECÍFICAS ao conteúdo deste capítulo.
As perguntas devem fazer o leitor PENSAR, não apenas lembrar fatos.
NUNCA faça perguntas genéricas como "O que você achou?" ou "Resuma o capítulo".
Cada pergunta deve referenciar algo CONCRETO do texto: personagem, conceito, situação, argumento.

Exemplos de perguntas ruins (EVITE):
- "O que você aprendeu neste capítulo?"
- "Qual é o tema principal?"
- "Resuma o que leu."

Exemplos de perguntas boas:
- "O autor argumenta que [conceito específico]. Você concorda? Por quê?"
- "Qual é a relação entre [elemento A] e [elemento B] apresentados neste capítulo?"
- "Se [situação do livro] acontecesse com você, como reagiria?"

Texto do capítulo:
${text.slice(0, 6000)}

Crie EXATAMENTE 2 perguntas:
1. Uma pergunta aberta de reflexão (qtype: "text")
2. Uma questão de múltipla escolha com 3 opções (qtype: "mcq")

Retorne SOMENTE um array JSON válido, sem nenhum texto adicional:
[{
  "beforePage": <última página do trecho fornecido>,
  "chapterTitle": "${currentChapter || `Capítulo ${(chapterIndex||0)+1}`}",
  "qtype": "text",
  "type": "Reflexão",
  "question": "<pergunta aberta específica ao conteúdo — máx 180 caracteres>",
  "answered": false,
  "answer": null,
  "quality": null
},
{
  "beforePage": <última página do trecho fornecido>,
  "chapterTitle": "${currentChapter || `Capítulo ${(chapterIndex||0)+1}`}",
  "qtype": "mcq",
  "type": "Quiz",
  "question": "<pergunta de múltipla escolha específica ao conteúdo — máx 180 caracteres>",
  "options": ["<opção A — a correta>", "<opção B — incorreta plausível>", "<opção C — incorreta plausível>"],
  "correct": 0,
  "answered": false,
  "answer": null,
  "quality": null
}]`,

  evalAnswer: ({ question, answer, context, bookTitle }) => `
Você é um mentor de leitura — caloroso, encorajador e perspicaz como um bom professor.
${bookTitle ? `Livro em leitura: "${bookTitle}"` : ''}

Pergunta feita ao leitor: "${question}"
Resposta do leitor: "${answer}"
Trecho do livro para contexto: "${(context || '').slice(0, 600)}"

Avalie com generosidade. O objetivo é encorajar a reflexão, não reprovar.

Critérios de pontuação:
- 70-100: Demonstra compreensão real + alguma reflexão própria → LIBERA próximo capítulo
- 40-69:  Boa tentativa, mas falta profundidade ou especificidade
- 0-39:   Muito superficial, fora do contexto ou resposta mínima sem esforço

O feedback DEVE ser:
- Conversacional e caloroso (como uma conversa, não uma avaliação escolar)
- Específico ao que o leitor escreveu (mencione algo da resposta dele)
- Encorajador mesmo quando for baixa pontuação
- Máximo 160 caracteres
- Em português brasileiro informal

Exemplos de feedback BOM:
- "Excelente! Você captou exatamente o ponto central — a contradição entre X e Y. Próximo capítulo liberado! 🔓"
- "Boa percepção sobre X! Para aprofundar, tente conectar isso com Y que o autor menciona."
- "Você está no caminho! Releia o trecho sobre X e tente responder como ele se relaciona com Y."

Retorne SOMENTE JSON válido:
{
  "score": <0-100>,
  "feedback": "<feedback caloroso, específico e encorajador>",
  "correct": <true se score >= 70>
}`

}

export default async function handler(req, res) {
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
        temperature: 0.5,
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
