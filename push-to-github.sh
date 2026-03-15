#!/bin/bash
# ─────────────────────────────────────────────────────────
# push-to-github.sh
# Faz push do StepBook 2.0 para o repositório GitHub
#
# USO:
#   chmod +x push-to-github.sh
#   ./push-to-github.sh SEU_GITHUB_TOKEN
# ─────────────────────────────────────────────────────────

TOKEN=$1
REPO="ercklopes-cell/StepBook-App"

if [ -z "$TOKEN" ]; then
  echo "❌ Informe seu GitHub token:"
  echo "   ./push-to-github.sh ghp_SEU_TOKEN_AQUI"
  echo ""
  echo "   Crie em: https://github.com/settings/tokens"
  echo "   Permissões necessárias: repo (full)"
  exit 1
fi

echo "🚀 Fazendo push para $REPO..."

# Configura remote com token
git remote set-url origin "https://${TOKEN}@github.com/${REPO}.git" 2>/dev/null || \
git remote add origin "https://${TOKEN}@github.com/${REPO}.git"

# Configura user (necessário para commit)
git config user.email "deploy@stepbook.app"
git config user.name "StepBook Deploy"

# Inicializa se necessário
git init 2>/dev/null

# Adiciona todos os arquivos
git add -A

# Commit
git commit -m "feat: StepBook 2.0 — React + Vite + Supabase + GitHub Models AI

- React 18 + Vite (componentes modulares)
- Supabase: auth, database, storage (substitui localStorage/IndexedDB)
- IA via GitHub Models GPT-4.1 Mini (Vercel /api/ai.js)
- Leitura gateada com perguntas geradas por IA
- Sistema de planos Grátis/Pro com chaves mensais
- Cards de compartilhamento (Canvas 2D 1080x1080)
- Reflexões nos milestones 60% e 100%
- Design system completo (dark/gold palette)
- RLS no Supabase (cada usuário vê só seus dados)"

# Push
git push -u origin main --force

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Push realizado com sucesso!"
  echo "   Repositório: https://github.com/${REPO}"
  echo ""
  echo "📋 Próximos passos:"
  echo "   1. Acesse o Vercel e conecte o repositório"
  echo "   2. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY"
  echo "   3. Configure GITHUB_AI_KEY"
  echo "   4. Execute o SQL em supabase/migrations/001_initial_schema.sql"
else
  echo ""
  echo "❌ Erro no push. Verifique o token e tente novamente."
fi
