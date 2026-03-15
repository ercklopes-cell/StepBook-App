// supabase/functions/ai/index.ts
// Deploy: supabase functions deploy ai
// Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL         = 'claude-sonnet-4-20250514'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROMPTS: Record<string, (p: any) => string> = {
  cleanText: ({ text, title }) => `
Você é um assistente especializado em limpeza de texto de PDFs.
Livro: "${title}"

Texto extraído (pode ter artefatos, quebras erradas, hifenizações):
${text}

Retorne SOMENTE um array JSON válido com o texto corrigido, mantendo a estrutura:
[{"num": N, "text": "texto limpo aqui"}]
Não inclua nenhum texto fora do JSON.`,

  makeQuestions: ({ text, title, chapters }) => `
Você é um especialista em pedagogia e leitura ativa.
Livro: "${title}"
Capítulos detectados: ${chapters}

Com base no texto abaixo, gere perguntas de compreensão para engajar o leitor.
Alterne entre: perguntas abertas de reflexão (qtype:"text") e múltipla escolha (qtype:"mcq").
Uma pergunta a cada 2 capítulos aproximadamente.

Texto:
${text.slice(0, 8000)}

Retorne SOMENTE um array JSON:
[{
  "beforePage": <número da página antes da qual a pergunta aparece>,
  "qtype": "text" | "mcq",
  "type": "Reflexão" | "Quiz",
  "question": "texto da pergunta",
  "options": ["opção A", "opção B"],  // apenas para mcq
  "correct": 0 | 1                   // índice da opção correta, apenas para mcq
}]
Não inclua nenhum texto fora do JSON.`,

  evalAnswer: ({ question, answer, context }) => `
Você é um tutor cognitivo avaliando a resposta de um leitor.

Pergunta: "${question}"
Resposta do leitor: "${answer}"
Contexto do livro: "${context?.slice(0, 500) || ''}"

Avalie a qualidade da resposta considerando:
- Compreensão do conteúdo
- Profundidade da reflexão
- Conexão com o texto

Retorne SOMENTE um JSON:
{
  "score": <0 a 100>,
  "feedback": "<feedback construtivo em português, máx 120 chars>",
  "correct": <true se score >= 70>
}
Não inclua nenhum texto fora do JSON.`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { action, payload } = await req.json()
    const promptFn = PROMPTS[action]
    if (!promptFn) {
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 2048,
        messages:   [{ role: 'user', content: promptFn(payload) }],
      }),
    })

    const data   = await response.json()
    const result = data.content?.[0]?.text ?? ''

    return new Response(JSON.stringify({ result }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
