import { useEffect, useRef, useState } from 'react'
import { useToast } from '../../hooks/useToast'

// ─── URLs dos cards base hospedados no ImgBB ────────────────────────────────
const CARD_AZUL   = 'https://i.ibb.co/Q7km8JGM/card-azul-escuro-premium.png'
const CARD_PRETO  = 'https://i.ibb.co/s9SkV9qf/card-preto-gradiente-premium.png'
const LOGO_URL    = 'https://i.ibb.co/Xkfz5QKL/sua-logo-stepbook.png'

// ─── Contador global de cards gerados (alternância azul/preto) ──────────────
let cardCount = 0

// ─── Função utilitária: carrega imagem via URL com crossOrigin anonymous ─────
// Isso preserva a transparência PNG no canvas e evita CORS taint
function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ─── Wrap de texto alinhado à esquerda ───────────────────────────────────────
function wrapText(ctx, text, x, y, maxW, lineH, maxLines = 99) {
  const words = text.split(' ')
  let line = '', cy = y, n = 0
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, cy)
      line = word + ' '; cy += lineH; n++
      if (n >= maxLines) { ctx.fillText('…', x, cy); return cy }
    } else line = test
  }
  if (line) ctx.fillText(line.trim(), x, cy)
  return cy
}

// ─── Wrap de texto centralizado ──────────────────────────────────────────────
function wrapTextCtr(ctx, text, cx, y, maxW, lineH, maxLines = 99) {
  const words = text.split(' ')
  let line = '', cy = y, n = 0
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), cx, cy)
      line = word + ' '; cy += lineH; n++
      if (n >= maxLines) { ctx.fillText('…', cx, cy); return cy }
    } else line = test
  }
  if (line) ctx.fillText(line.trim(), cx, cy)
  return cy
}

// ─── Linha horizontal dourada com fade nas bordas ───────────────────────────
function goldLine(ctx, W, y) {
  const g = ctx.createLinearGradient(60, 0, W - 60, 0)
  g.addColorStop(0,    'transparent')
  g.addColorStop(0.12, 'rgba(212,175,55,0.85)')
  g.addColorStop(0.88, 'rgba(212,175,55,0.85)')
  g.addColorStop(1,    'transparent')
  ctx.strokeStyle = g
  ctx.lineWidth   = 1.5
  ctx.beginPath()
  ctx.moveTo(60, y); ctx.lineTo(W - 60, y)
  ctx.stroke()
}

// ─── Retângulo arredondado ────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL: generatePremiumCard
// Parâmetros:
//   canvas    — elemento <canvas> 1080×1920
//   quoteText — frase selecionada pelo leitor
//   bookTitle — título do livro (limpo)
//   isFirst   — true → base azul escuro | false → base preto gradiente
// Retorna: data URL PNG do card gerado
// ═══════════════════════════════════════════════════════════════════════════════
async function generatePremiumCard(canvas, quoteText, bookTitle, isFirst = true) {
  const ctx = canvas.getContext('2d')
  const W = 1080, H = 1920
  canvas.width  = W
  canvas.height = H

  // ── PASSO 1: Carrega e desenha a imagem base (preenche 100% do canvas) ─────
  // isFirst=true → azul escuro premium | isFirst=false → preto gradiente premium
  const baseUrl = isFirst ? CARD_AZUL : CARD_PRETO
  const baseImg = await loadImage(baseUrl)

  if (baseImg) {
    // ctx.drawImage preserva qualidade e transparência da imagem base
    ctx.drawImage(baseImg, 0, 0, W, H)
  } else {
    // Fallback: fundo sólido caso a imagem não carregue
    const fbBg = ctx.createLinearGradient(0, 0, 0, H)
    fbBg.addColorStop(0, isFirst ? '#0a1428' : '#0a0a0a')
    fbBg.addColorStop(1, isFirst ? '#1a253f' : '#1a1a2e')
    ctx.fillStyle = fbBg
    ctx.fillRect(0, 0, W, H)
  }

  // ── PASSO 2: Sobreposição de textos dinâmicos ─────────────────────────────
  // (A logo e "StepBook" já estão na imagem base — não redesenhamos)

  // ── 2a. Frase introdutória (logo abaixo da logo na base) ─────────────────
  // Fonte: 50px DM Sans, dourado #D4AF37, centralizado
  ctx.save()
  ctx.textAlign   = 'center'
  ctx.fillStyle   = '#D4AF37'
  ctx.font        = '400 50px "DM Sans", sans-serif'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur  = 8
  // Posição Y calculada para ficar logo abaixo da área da logo (já na base)
  ctx.fillText('Li essa frase pelo StepBook', W / 2, 430)
  ctx.fillText('que me fez refletir',         W / 2, 492)
  ctx.restore()

  // ── 2b. Linha separadora dourada superior ────────────────────────────────
  goldLine(ctx, W, 540)

  // ── 2c. Citação central — grande, italic, off-white com sombra dourada ───
  // Fonte: Playfair Display italic bold 70px
  ctx.save()
  ctx.textAlign   = 'center'
  ctx.fillStyle   = '#F4EFEA'               // off-white quente
  ctx.font        = 'italic bold 68px "Playfair Display", "Georgia", serif'
  ctx.shadowColor = 'rgba(212,175,55,0.35)' // sombra dourada sutil
  ctx.shadowBlur  = 10
  // Aspas tipográficas " " (curvas)
  const quoteFull = `\u201c${quoteText.slice(0, 260)}\u201d`
  wrapTextCtr(ctx, quoteFull, W / 2, 650, W - 120, 88, 10)
  ctx.restore()

  // ── 2d. Linha separadora dourada inferior ────────────────────────────────
  goldLine(ctx, W, 1465)

  // ── 2e. Crédito do livro ─────────────────────────────────────────────────
  ctx.save()
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font      = '400 40px "DM Sans", sans-serif'
  ctx.fillText('Livro:', W / 2, 1542)

  ctx.fillStyle = '#D4AF37'
  ctx.font      = '600 44px "Playfair Display", "Georgia", serif'
  wrapTextCtr(ctx, bookTitle, W / 2, 1605, W - 140, 54, 2)
  ctx.restore()

  // ── 2f. URL no rodapé ────────────────────────────────────────────────────
  ctx.save()
  ctx.textAlign   = 'center'
  ctx.fillStyle   = 'rgba(212,175,55,0.75)'
  ctx.font        = '400 32px "DM Sans", sans-serif'
  ctx.fillText('stepbook.vercel.app', W / 2, H - 48)
  ctx.restore()

  // Retorna data URL PNG pronto para download/share
  return canvas.toDataURL('image/png')
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE REACT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ShareModal({ book, progress, mode = 'feed', quoteText = '', onClose }) {
  const canvasRef  = useRef()  // canvas para card Feed 1080×1080
  const storiesRef = useRef()  // canvas para card Stories/Premium 1080×1920
  const toast      = useToast()

  const [tab,          setTab]          = useState(mode)
  const [selRef,       setSelRef]       = useState(0)
  const [stars,        setStars]        = useState(5)
  const [premiumReady, setPremiumReady] = useState(false)
  const [shareLink,    setShareLink]    = useState('')  // "Baixe o StepBook.vercel.app"

  const reflections = book.reflections?.filter(r => r.answered) || []
  const feedText    = reflections[selRef]?.answer
    || `${progress}% do livro lido com leitura ativa pelo StepBook.`

  // Limpa título — remove hifens/underscores de nomes de arquivo
  const cleanTitle = (t = '') =>
    t.replace(/[-_]/g, ' ').replace(/\.(pdf|txt)$/i, '').trim().slice(0, 55)

  const bookTitle  = cleanTitle(book.title)
  const bookAuthor = (book.author || '').slice(0, 45)
  const storyQuote = quoteText || feedText

  // Renderiza quando muda tab/seleção
  useEffect(() => { if (tab === 'feed')    renderFeed()    }, [tab, selRef, stars])
  useEffect(() => {
    if (tab === 'stories') {
      setPremiumReady(false)
      renderStories()
    }
  }, [tab, quoteText])

  // ── CARD FEED 1080×1080 ──────────────────────────────────────────────────
  const renderFeed = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 1080, H = 1080
    canvas.width = W; canvas.height = H

    // Fundo escuro
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#080c14'); bg.addColorStop(1, '#101820')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    // Barra dourada topo
    const barG = ctx.createLinearGradient(0, 0, W, 0)
    barG.addColorStop(0, 'transparent'); barG.addColorStop(0.15, '#D4AF37')
    barG.addColorStop(0.85, '#D4AF37'); barG.addColorStop(1, 'transparent')
    ctx.fillStyle = barG; ctx.fillRect(0, 0, W, 5)

    // Logo canto superior direito
    const logo = await loadImage(LOGO_URL)
    if (logo) {
      ctx.save()
      ctx.shadowColor = '#D4AF37'; ctx.shadowBlur = 15
      ctx.drawImage(logo, W - 125, 18, 50, 50)
      ctx.restore()
    }
    ctx.fillStyle = '#D4AF37'; ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'right'; ctx.fillText('StepBook', W - 135, 52)
    ctx.textAlign = 'left'

    // Capa do livro
    const coverSrc = book.cover_url || (book.cover_b64 ? `data:image/jpeg;base64,${book.cover_b64}` : null)
    const CX = 80, CY = 180, CW = 285, CH = 430
    if (coverSrc) {
      await new Promise(res => {
        const img = new Image(); img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.save()
          ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 40; ctx.shadowOffsetX = 10
          ctx.drawImage(img, CX, CY, CW, CH); ctx.restore()
          ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 2
          ctx.strokeRect(CX, CY, CW, CH); res()
        }
        img.onerror = res; img.src = coverSrc
      })
    } else {
      ctx.fillStyle = '#0d1a2e'; ctx.fillRect(CX, CY, CW, CH)
      ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 2; ctx.strokeRect(CX, CY, CW, CH)
      ctx.fillStyle = '#D4AF37'; ctx.font = '70px serif'; ctx.textAlign = 'center'
      ctx.fillText(book.emoji || '📖', CX + CW/2, CY + CH/2 + 24); ctx.textAlign = 'left'
    }

    // Coluna direita
    const RX = 415

    // Badge STEPBOOK
    ctx.fillStyle = 'rgba(212,175,55,0.15)'
    rrect(ctx, RX, 190, 180, 32, 16); ctx.fill()
    ctx.fillStyle = '#D4AF37'; ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'; ctx.fillText('STEPBOOK', RX + 90, 211); ctx.textAlign = 'left'

    // Título
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 34px "Georgia", serif'
    wrapText(ctx, bookTitle, RX, 280, 585, 44, 3)

    // Autor
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '400 21px sans-serif'
    ctx.fillText(bookAuthor, RX, 395)

    // Estrelas
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < stars ? '#D4AF37' : 'rgba(255,255,255,0.2)'
      ctx.font = '26px serif'; ctx.fillText('★', RX + i * 32, 440)
    }

    // Barra de progresso
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; rrect(ctx, RX, 466, 540, 8, 4); ctx.fill()
    const pw = (progress / 100) * 540
    const pG = ctx.createLinearGradient(RX, 0, RX + pw, 0)
    pG.addColorStop(0, '#D4AF37'); pG.addColorStop(1, '#f5c842')
    ctx.fillStyle = pG; rrect(ctx, RX, 466, pw, 8, 4); ctx.fill()
    ctx.fillStyle = '#D4AF37'; ctx.font = 'bold 15px sans-serif'
    ctx.fillText(`${progress}% lido`, RX, 500)

    // Divisor dourado
    goldLine(ctx, W, 685)

    // Reflexão
    ctx.fillStyle = 'rgba(255,255,255,0.78)'; ctx.font = 'italic 400 23px "Georgia", serif'
    wrapText(ctx, `"${feedText.slice(0, 170)}"`, 80, 740, W - 160, 34, 4)

    // Rodapé
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '400 15px sans-serif'
    ctx.textAlign = 'right'; ctx.fillText('stepbook.vercel.app', W - 80, H - 40)
  }

  // ── CARD STORIES/PREMIUM 1080×1920 ───────────────────────────────────────
  // Usa generatePremiumCard com alternância azul/preto
  const renderStories = async () => {
    const canvas = storiesRef.current
    if (!canvas) return

    // Alterna base a cada geração: par → azul, ímpar → preto
    cardCount++
    const isFirst = cardCount % 2 !== 0  // 1,3,5... = azul | 2,4,6... = preto

    await generatePremiumCard(canvas, storyQuote, bookTitle, isFirst)
    setPremiumReady(true)

    // Mensagem de compartilhamento — EXATAMENTE como pedido
    setShareLink('Baixe o StepBook.vercel.app')
  }

  // ── AÇÕES ────────────────────────────────────────────────────────────────
  const getCanvas = () => tab === 'feed' ? canvasRef.current : storiesRef.current

  const download = () => {
    const a = document.createElement('a')
    a.href = getCanvas().toDataURL('image/png')
    a.download = `stepbook-${tab}-${bookTitle.replace(/\s+/g,'-').slice(0,30)}.png`
    a.click(); toast('Imagem salva! ✅')
  }

  const shareWA = () => {
    const txt = encodeURIComponent(
      tab === 'stories'
        ? shareLink   // "Baixe o StepBook.vercel.app"
        : `Estou lendo "${bookTitle}" — ${progress}% concluído!\n\nstepbook.vercel.app`
    )
    window.open(`https://wa.me/?text=${txt}`, '_blank')
  }

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareLink || 'Baixe o StepBook.vercel.app')
    toast('Copiado!')
  }

  return (
    <div className="overlay center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={styles.modal}>

        {/* ── Tabs ── */}
        <div style={styles.tabs}>
          <button style={{...styles.tab, ...(tab==='feed'    ? styles.tabOn : {})}} onClick={() => setTab('feed')}>
            📊 Card Feed
          </button>
          <button style={{...styles.tab, ...(tab==='stories' ? styles.tabOn : {})}} onClick={() => setTab('stories')}>
            💬 Card Stories
          </button>
        </div>

        {/* ── Tab Feed ── */}
        {tab === 'feed' && (
          <>
            <canvas ref={canvasRef} style={styles.preview} />
            {reflections.length > 0 && (
              <div style={{ marginBottom:10 }}>
                <span style={styles.lbl}>Reflexão no card:</span>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
                  {reflections.map((r,i) => (
                    <button key={i} className={`btn btn-sm ${selRef===i?'btn-gold':'btn-ghost'}`}
                      onClick={() => setSelRef(i)}>
                      {r._milestone ? `${r._milestone}%` : `#${i+1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:12 }}>
              <span style={styles.lbl}>Avaliação:</span>
              {[1,2,3,4,5].map(s => (
                <button key={s} style={{...styles.star, color: s<=stars?'#D4AF37':'var(--text3)'}}
                  onClick={() => setStars(s)}>★</button>
              ))}
            </div>
          </>
        )}

        {/* ── Tab Stories/Premium ── */}
        {tab === 'stories' && (
          <>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:12, position:'relative' }}>
              <canvas ref={storiesRef} style={styles.storiesPrev} />
              {/* Loader enquanto gera */}
              {!premiumReady && (
                <div style={styles.canvasLoader}>
                  <div className="spinner" />
                  <p style={{ fontSize:'0.75rem', color:'var(--text2)', marginTop:8 }}>
                    Gerando card premium…
                  </p>
                </div>
              )}
            </div>

            {/* Botão para gerar novo card com alternância */}
            <button
              className="btn btn-ghost btn-sm"
              style={{ width:'100%', marginBottom:10 }}
              onClick={() => { setPremiumReady(false); renderStories() }}
            >
              🔄 Gerar outro estilo
            </button>

            {/* Frase no card */}
            {storyQuote && (
              <div style={{ marginBottom:8 }}>
                <span style={styles.lbl}>Frase no card:</span>
                <p style={styles.quoteP}>
                  "{storyQuote.slice(0,100)}{storyQuote.length>100?'…':''}"
                </p>
              </div>
            )}

            {/* Link de compartilhamento — EXATAMENTE "Baixe o StepBook.vercel.app" */}
            {premiumReady && (
              <div style={styles.shareBox}>
                <span style={styles.shareText}>{shareLink}</span>
                <button className="btn btn-ghost btn-sm" onClick={copyShareLink}>
                  Copiar
                </button>
              </div>
            )}

            {!quoteText && (
              <p style={{ fontSize:'0.75rem', color:'var(--text3)', marginBottom:6 }}>
                💡 Selecione um trecho do texto e toque no botão 💬 para personalizar o card.
              </p>
            )}
          </>
        )}

        {/* ── Botões de compartilhamento ── */}
        <div style={styles.grid}>
          <button className="btn btn-gold btn-sm" onClick={shareWA}>💬 WhatsApp</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { download(); toast('Imagem baixada! 📸') }}>📸 Instagram</button>
          <button className="btn btn-ghost btn-sm" onClick={copyShareLink}>📋 Copiar link</button>
          <button className="btn btn-ghost btn-sm" onClick={download}>⬇ Baixar</button>
        </div>

        <button className="btn btn-ghost" style={{ width:'100%', marginTop:8 }} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  )
}

const styles = {
  modal: { maxWidth:520, padding:'20px 20px 24px' },
  tabs: {
    display:'flex', gap:8, marginBottom:16,
    borderBottom:'1px solid var(--border)', paddingBottom:12,
  },
  tab: {
    flex:1, padding:'8px 12px', background:'none',
    border:'1px solid var(--border)', borderRadius:'var(--radius)',
    color:'var(--text2)', fontSize:'0.80rem', fontWeight:600,
    cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
  },
  tabOn: { background:'var(--gold-dim2)', borderColor:'var(--gold)', color:'var(--gold)' },
  preview: { width:'100%', borderRadius:8, border:'1px solid var(--border2)', marginBottom:12 },
  storiesPrev: { height:340, borderRadius:8, border:'1px solid var(--border2)', aspectRatio:'9/16' },
  canvasLoader: {
    position:'absolute', inset:0, display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    background:'rgba(3,8,16,0.7)', borderRadius:8,
  },
  lbl: {
    fontSize:'0.72rem', fontWeight:600, color:'var(--text3)',
    textTransform:'uppercase', letterSpacing:'0.08em', display:'block',
  },
  star: { background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', padding:'0 2px' },
  quoteP: {
    color:'var(--gold)', fontStyle:'italic',
    fontFamily:"'Crimson Pro',serif", fontSize:'0.9rem', lineHeight:1.5, marginTop:4,
  },
  // Caixa "Baixe o StepBook.vercel.app"
  shareBox: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    background:'var(--bg)', border:'1px solid var(--border2)',
    borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:10,
  },
  shareText: {
    fontSize:'0.84rem', color:'var(--gold)',
    fontWeight:600, letterSpacing:'0.02em',
  },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 },
}
