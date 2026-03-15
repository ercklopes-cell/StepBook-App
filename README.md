# StepBook 2.0

> **Leitura ativa com IA** — importe PDFs, responda perguntas geradas por Claude, desbloqueie capítulos e compartilhe seu progresso.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite |
| Auth & DB | Supabase (Auth, PostgreSQL, Storage) |
| IA | GitHub Models (GPT-4.1 Mini) via Vercel `/api/ai` |
| PDF | pdfjs-dist |
| Hospedagem | Vercel (frontend) + Supabase (backend) |

---

## Setup rápido

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/stepbook-app
cd stepbook-app
npm install
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env`:
```
VITE_SUPABASE_URL=https://SEU_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

### 3. Crie o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → New Project
2. No **SQL Editor**, cole e execute o arquivo:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Em **Storage**, confirme que os buckets `pdfs` e `covers` foram criados.

### 4. Configure a IA no Vercel

No **Vercel Dashboard** → seu projeto → **Settings → Environment Variables**:

| Nome | Valor |
|------|-------|
| `GITHUB_AI_KEY` | seu token do GitHub com permissão `models:read` |

Para criar o token: [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token (classic) → marque `models:read`.

A função já está em `api/ai.js` e usa **GPT-4.1 Mini** via GitHub Models — o Vercel faz o deploy automaticamente no push.

### 5. Rode localmente

```bash
npm run dev
```

---

## Estrutura do projeto

```
stepbook/
├── src/
│   ├── components/
│   │   ├── auth/          AuthScreen.jsx
│   │   ├── library/       Library, BookCard, DropZone, ImportFlow
│   │   ├── reader/        Reader, QBlock, ChapPanel, ReflectionPrompt
│   │   ├── share/         ShareModal
│   │   └── ui/            PaywallModal, DeleteModal
│   ├── hooks/             useAuth, useBooks, usePlan, useToast
│   ├── lib/               supabase.js, ai.js, pdf.js
│   └── styles/            globals.css
├── supabase/
│   ├── functions/ai/      Edge Function (proxy Claude AI)
│   └── migrations/        SQL schema
├── .env.example
└── vite.config.js
```

---

## Funcionalidades

- **Importação de PDF** com extração automática de capa, metadados (Google Books API), detecção de capítulos e limpeza de texto por IA
- **Leitura gateada** — capítulos bloqueados até resposta correta
- **Perguntas por IA** — reflexões abertas avaliadas pelo Claude + MCQs automáticas em 25/50/75/100%
- **Sistema de planos** — Grátis (1 livro) / Pro (ilimitado, R$6,99/mês via chave mensal)
- **Compartilhamento** — card 1080×1080 via Canvas 2D para WhatsApp, Instagram, LinkedIn
- **Reflexões nos milestones** — aos 60% e 100% de progresso
- **Supabase completo** — auth, DB, storage, Edge Functions

---

## Deploy no Vercel

```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure as env vars no dashboard do Vercel:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

---

## Chaves Pro 2026

Distribua manualmente. Cada chave ativa 30 dias de Pro:

| Mês | Chave |
|-----|-------|
| Janeiro | `STEP-JAN26-X7K2` |
| Fevereiro | `STEP-FEV26-M3P9` |
| Março | `STEP-MAR26-Q5R1` |
| Abril | `STEP-ABR26-T8W4` |
| ... | ... |

---

## Licença

MIT
