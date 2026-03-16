import { useEffect, useRef, useState } from 'react'
import { useToast } from '../../hooks/useToast'

// ─── Imagens base hospedadas — URLs DIRETAS do ImgBB ────────────────────────
// Essas imagens já contêm: logo, "StepBook", "Li essa frase...", ondas, fundo
// O código sobrepõe SOMENTE os textos dinâmicos nas áreas VAZIAS
const CARD_AZUL  = 'https://i.ibb.co/Q7km8JGM/dreamina-2026-03-15-6884-Remove-the-central-quote-text-Se-desej.jpg'
const CARD_PRETO = 'https://i.ibb.co/CKdNHKQc/dreamina-2026-03-15-6664-Remove-the-central-quote-text-Se-desej.jpg'

// ─── Contador global de geração — controla alternância azul/preto ────────────
// Par (0,2,4...) → azul | Ímpar (1,3,5...) → preto
let cardGenerationCount = 0

// ═══════════════════════════════════════════════════════════════════════════════
// generatePremiumCard
// Carrega imagem base e sobrepõe SOMENTE os textos dinâmicos.
// NÃO desenha fundo, ondas, logo ou qualquer elemento visual — apenas texto.
//
// Parâmetros:
//   canvas    — elemento <canvas> 1080×1920
//   quoteText — frase selecionada pelo leitor
//   bookTitle — título limpo do livro
// ═══════════════════════════════════════════════════════════════════════════════
async function generatePremiumCard(canvas, quoteText, bookTitle) {
  const ctx = canvas.getContext('2d')
  const W = 1080, H = 1920
  canvas.width  = W
  canvas.height = H

  // ── Determina qual imagem base usar ─────────────────────────────────────
  const isFirst = cardGenerationCount % 2 === 0
  const baseUrl = isFirst ? CARD_AZUL : CARD_PRETO

  // ── Carrega a imagem base (SEM cache buster — ImgBB não suporta query params) ─
  const baseImg = await new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => {
      // Tenta sem crossOrigin como fallback
      const img2 = new Image()
      img2.onload  = () => resolve(img2)
      img2.onerror = () => resolve(null)
      img2.src = baseUrl
    }
    img.src = baseUrl
  })

  // ── Passo 1: Desenha imagem base cobrindo 100% do canvas ──────────────
  if (baseImg) {
    ctx.drawImage(baseImg, 0, 0, W, H)
  } else {
    ctx.fillStyle = isFirst ? '#0a1428' : '#0a0a0a'
    ctx.fillRect(0, 0, W, H)
  }

  // ── Passo 2: Somente textos dinâmicos nas áreas VAZIAS da base ────────
  // Base JÁ TEM: logo, "StepBook", "Li essa frase...", ondas, fundo
  // Área vazia começa em ~Y=800 (após o subtítulo da imagem base)

  ctx.textAlign = 'center'

  // 2a. Citação — limitada a 100 chars, centralizada, italic bold
  // Y=860 — bem abaixo do subtítulo fixo da base (~Y=750)
  const quoteShort = quoteText.length > 100
    ? quoteText.slice(0, 97) + '...'
    : quoteText
  ctx.fillStyle = '#F4EFEA'
  ctx.font      = 'italic bold 64px "Playfair Display", "Georgia", serif'
  wrapCentered(ctx, `\u201c${quoteShort}\u201d`, W / 2, 860, W - 150, 84)

  // 2b. Título do livro — elegante, centralizado, quebra de linha natural
  // Font menor para caber sem truncamento
  ctx.fillStyle = '#D4AF37'
  ctx.font      = '400 36px "Playfair Display", "Georgia", serif'
  // "Livro:" em linha separada para elegância
  ctx.fillText('Livro:', W / 2, 1470)
  ctx.font = '600 38px "Playfair Display", "Georgia", serif'
  // Título com wrap sem limite de linhas — cabe tudo
  wrapCentered(ctx, bookTitle, W / 2, 1530, W - 160, 50)

  return canvas.toDataURL('image/png', 1.0)
}

// ─── Wrap centralizado SEM truncamento forçado ───────────────────────────────
function wrapCentered(ctx, text, cx, startY, maxW, lineH) {
  const words = text.split(' ')
  let line = '', cy = startY
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), cx, cy)
      line = word + ' '
      cy += lineH
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line.trim(), cx, cy)
}

// ─── Limpa título (remove hifens/underscores de nomes de arquivo) ─────────────
function cleanTitle(t = '') {
  return t.replace(/[-_]/g, ' ').replace(/\.(pdf|txt)$/i, '').trim().slice(0, 55)
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE REACT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ShareModal({ book, progress, mode = 'feed', quoteText = '', onClose }) {
  const canvasRef  = useRef()   // canvas Feed 1080×1080
  const storiesRef = useRef()   // canvas Stories/Premium 1080×1920
  const toast      = useToast()

  const [tab,          setTab]          = useState(mode)
  const [selRef,       setSelRef]       = useState(0)
  const [stars,        setStars]        = useState(5)
  const [premiumReady, setPremiumReady] = useState(false)
  // Mensagem exata para compartilhamento — nunca muda
  const SHARE_MSG = 'Baixe o StepBook.vercel.app'

  const reflections = book.reflections?.filter(r => r.answered) || []
  const feedText    = reflections[selRef]?.answer
    || `${progress}% do livro lido com leitura ativa pelo StepBook.`
  const bookTitle  = cleanTitle(book.title)
  const bookAuthor = (book.author || '').slice(0, 45)
  const storyQuote = quoteText || feedText

  useEffect(() => { if (tab === 'feed')    renderFeed()    }, [tab, selRef, stars])
  useEffect(() => {
    if (tab === 'stories') {
      setPremiumReady(false)
      runPremium()
    }
  }, [tab, quoteText])

  // ── Renderiza Stories Premium ──────────────────────────────────────────────
  const runPremium = async () => {
    const canvas = storiesRef.current
    if (!canvas) return
    // Gera com o contador atual, incrementa DEPOIS para próxima chamada
    await generatePremiumCard(canvas, storyQuote, bookTitle)
    cardGenerationCount++   // incrementa APÓS geração — próximo click usa base diferente
    setPremiumReady(true)
  }

  // ── CARD FEED 1080×1080 ────────────────────────────────────────────────────
  const renderFeed = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 1080, H = 1080
    canvas.width = W; canvas.height = H

    // Fundo
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#080c14'); bg.addColorStop(1, '#101820')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    // Barra dourada topo
    const barG = ctx.createLinearGradient(0, 0, W, 0)
    barG.addColorStop(0, 'transparent'); barG.addColorStop(0.15, '#D4AF37')
    barG.addColorStop(0.85, '#D4AF37'); barG.addColorStop(1, 'transparent')
    ctx.fillStyle = barG; ctx.fillRect(0, 0, W, 5)

    // Logo canto superior direito
    const logo = await new Promise(r => {
      const img = new Image(); img.crossOrigin = 'anonymous'
      img.onload = () => r(img); img.onerror = () => r(null)
      img.src = 'https://i.ibb.co/Xkfz5QKL/sua-logo-stepbook.png'
    })
    if (logo) ctx.drawImage(logo, W - 125, 18, 50, 50)
    ctx.fillStyle = '#D4AF37'; ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'right'; ctx.fillText('StepBook', W - 135, 52)
    ctx.textAlign = 'left'

    // Capa
    const coverSrc = book.cover_url || (book.cover_b64 ? `data:image/jpeg;base64,${book.cover_b64}` : null)
    const CX = 80, CY = 180, CW = 285, CH = 430
    if (coverSrc) {
      await new Promise(res => {
        const img = new Image(); img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.save(); ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=40; ctx.shadowOffsetX=10
          ctx.drawImage(img, CX, CY, CW, CH); ctx.restore()
          ctx.strokeStyle='#D4AF37'; ctx.lineWidth=2; ctx.strokeRect(CX, CY, CW, CH); res()
        }
        img.onerror = res; img.src = coverSrc
      })
    } else {
      ctx.fillStyle='#0d1a2e'; ctx.fillRect(CX,CY,CW,CH)
      ctx.strokeStyle='#D4AF37'; ctx.lineWidth=2; ctx.strokeRect(CX,CY,CW,CH)
      ctx.fillStyle='#D4AF37'; ctx.font='70px serif'; ctx.textAlign='center'
      ctx.fillText(book.emoji||'📖', CX+CW/2, CY+CH/2+24); ctx.textAlign='left'
    }

    const RX = 415

    // Badge
    ctx.fillStyle = 'rgba(212,175,55,0.15)'
    rr(ctx, RX, 190, 180, 32, 16); ctx.fill()
    ctx.fillStyle='#D4AF37'; ctx.font='bold 11px sans-serif'
    ctx.textAlign='center'; ctx.fillText('STEPBOOK', RX+90, 211); ctx.textAlign='left'

    // Título
    ctx.fillStyle='#FFFFFF'; ctx.font='bold 34px "Georgia", serif'
    wrapL(ctx, bookTitle, RX, 280, 585, 44, 3)

    // Autor
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='400 21px sans-serif'
    ctx.fillText(bookAuthor, RX, 395)

    // Estrelas
    for (let i=0;i<5;i++){
      ctx.fillStyle = i<stars?'#D4AF37':'rgba(255,255,255,0.2)'
      ctx.font='26px serif'; ctx.fillText('★', RX+i*32, 440)
    }

    // Progresso
    ctx.fillStyle='rgba(255,255,255,0.1)'; rr(ctx,RX,466,540,8,4); ctx.fill()
    const pw=(progress/100)*540
    const pG=ctx.createLinearGradient(RX,0,RX+pw,0)
    pG.addColorStop(0,'#D4AF37'); pG.addColorStop(1,'#f5c842')
    ctx.fillStyle=pG; rr(ctx,RX,466,pw,8,4); ctx.fill()
    ctx.fillStyle='#D4AF37'; ctx.font='bold 15px sans-serif'
    ctx.fillText(`${progress}% lido`, RX, 500)

    // Divisor
    const dG=ctx.createLinearGradient(80,0,W-80,0)
    dG.addColorStop(0,'transparent'); dG.addColorStop(0.2,'rgba(212,175,55,0.6)')
    dG.addColorStop(0.8,'rgba(212,175,55,0.6)'); dG.addColorStop(1,'transparent')
    ctx.strokeStyle=dG; ctx.lineWidth=1
    ctx.beginPath(); ctx.moveTo(80,685); ctx.lineTo(W-80,685); ctx.stroke()

    // Reflexão
    ctx.fillStyle='rgba(255,255,255,0.78)'; ctx.font='italic 400 23px "Georgia", serif'
    wrapL(ctx, `"${feedText.slice(0,170)}"`, 80, 740, W-160, 34, 4)

    // Rodapé
    ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.font='400 15px sans-serif'
    ctx.textAlign='right'; ctx.fillText('stepbook.vercel.app', W-80, H-40)
  }

  // helpers ─────────────────────────────────────────────────────────────────
  function rr(ctx,x,y,w,h,r){
    ctx.beginPath()
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r)
    ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r)
    ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r)
    ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath()
  }
  function wrapL(ctx,text,x,y,mw,lh,ml=99){
    const ws=text.split(' ');let l='',cy=y,n=0
    for(const w of ws){
      const t=l+w+' '
      if(ctx.measureText(t).width>mw&&l){
        ctx.fillText(l.trim(),x,cy);l=w+' ';cy+=lh;n++
        if(n>=ml){ctx.fillText('…',x,cy);return}
      }else l=t
    }
    if(l)ctx.fillText(l.trim(),x,cy)
  }

  // ── Ações ─────────────────────────────────────────────────────────────────
  const getCanvas = () => tab === 'feed' ? canvasRef.current : storiesRef.current

  const download = () => {
    const a = document.createElement('a')
    a.href = getCanvas().toDataURL('image/png')
    a.download = `stepbook-${tab}-${bookTitle.replace(/\s+/g,'-').slice(0,30)}.png`
    a.click(); toast('Imagem salva! ✅')
  }

  const shareWA = () => {
    // Para Stories: mensagem exata "Baixe o StepBook.vercel.app"
    const txt = encodeURIComponent(
      tab === 'stories'
        ? SHARE_MSG
        : `Estou lendo "${bookTitle}" — ${progress}% concluído!\n\nstepbook.vercel.app`
    )
    window.open(`https://wa.me/?text=${txt}`, '_blank')
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(SHARE_MSG)
    toast('Copiado!')
  }

  return (
    <div className="overlay center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={s.modal}>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={{...s.tab,...(tab==='feed'?s.on:{})}} onClick={()=>setTab('feed')}>
            📊 Card Feed
          </button>
          <button style={{...s.tab,...(tab==='stories'?s.on:{})}} onClick={()=>setTab('stories')}>
            💬 Card Stories
          </button>
        </div>

        {/* Feed */}
        {tab === 'feed' && (
          <>
            <canvas ref={canvasRef} style={s.preview} />
            {reflections.length > 0 && (
              <div style={{marginBottom:10}}>
                <span style={s.lbl}>Reflexão no card:</span>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:6}}>
                  {reflections.map((r,i) => (
                    <button key={i} className={`btn btn-sm ${selRef===i?'btn-gold':'btn-ghost'}`}
                      onClick={() => setSelRef(i)}>
                      {r._milestone?`${r._milestone}%`:`#${i+1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:12}}>
              <span style={s.lbl}>Avaliação:</span>
              {[1,2,3,4,5].map(n => (
                <button key={n} style={{...s.star,color:n<=stars?'#D4AF37':'var(--text3)'}}
                  onClick={()=>setStars(n)}>★</button>
              ))}
            </div>
          </>
        )}

        {/* Stories Premium */}
        {tab === 'stories' && (
          <>
            <div style={{display:'flex',justifyContent:'center',marginBottom:12,position:'relative'}}>
              <canvas ref={storiesRef} style={s.stPrev} />
              {!premiumReady && (
                <div style={s.loader}>
                  <div className="spinner" />
                  <p style={{fontSize:'0.75rem',color:'var(--text2)',marginTop:8}}>
                    Carregando card premium…
                  </p>
                </div>
              )}
            </div>

            {/* Botão gerar outro (incrementa contador → alterna base) */}
            <button className="btn btn-ghost btn-sm"
              style={{width:'100%',marginBottom:10}}
              onClick={() => { setPremiumReady(false); runPremium() }}>
              🔄 Gerar outro estilo
            </button>

            {storyQuote && (
              <div style={{marginBottom:8}}>
                <span style={s.lbl}>Frase no card:</span>
                <p style={s.qp}>"{storyQuote.slice(0,100)}{storyQuote.length>100?'…':''}"</p>
              </div>
            )}

            {/* Caixa com EXATAMENTE "Baixe o StepBook.vercel.app" */}
            {premiumReady && (
              <div style={s.shareBox}>
                <span style={s.shareMsg}>{SHARE_MSG}</span>
                <button className="btn btn-ghost btn-sm" onClick={copyLink}>Copiar</button>
              </div>
            )}

            {!quoteText && (
              <p style={{fontSize:'0.75rem',color:'var(--text3)',marginBottom:6}}>
                💡 Selecione um trecho do texto e toque em 💬 para personalizar.
              </p>
            )}
          </>
        )}

        {/* Botões de compartilhamento */}
        <div style={s.grid}>
          <button className="btn btn-gold btn-sm" onClick={shareWA}>💬 WhatsApp</button>
          <button className="btn btn-ghost btn-sm"
            onClick={()=>{download();toast('Baixada! 📸')}}>📸 Instagram</button>
          <button className="btn btn-ghost btn-sm" onClick={copyLink}>📋 Copiar link</button>
          <button className="btn btn-ghost btn-sm" onClick={download}>⬇ Baixar</button>
        </div>

        <button className="btn btn-ghost" style={{width:'100%',marginTop:8}} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  )
}

const s = {
  modal:    { maxWidth:520, padding:'20px 20px 24px' },
  tabs:     { display:'flex', gap:8, marginBottom:16, borderBottom:'1px solid var(--border)', paddingBottom:12 },
  tab:      { flex:1, padding:'8px 12px', background:'none', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text2)', fontSize:'0.80rem', fontWeight:600, cursor:'pointer' },
  on:       { background:'var(--gold-dim2)', borderColor:'var(--gold)', color:'var(--gold)' },
  preview:  { width:'100%', borderRadius:8, border:'1px solid var(--border2)', marginBottom:12 },
  stPrev: {
    // Exibe em altura fixa mas mantém proporção 9:16
    // image-rendering crisp para não borrar o canvas 1080×1920
    height: 360,
    borderRadius: 8,
    border: '1px solid var(--border2)',
    aspectRatio: '9/16',
    imageRendering: 'auto',
    display: 'block',
  },
  loader:   { position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(3,8,16,0.7)', borderRadius:8 },
  lbl:      { fontSize:'0.72rem', fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', display:'block' },
  star:     { background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', padding:'0 2px' },
  qp:       { color:'var(--gold)', fontStyle:'italic', fontFamily:"'Crimson Pro',serif", fontSize:'0.9rem', lineHeight:1.5, marginTop:4 },
  shareBox: { display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:10 },
  shareMsg: { fontSize:'0.86rem', color:'var(--gold)', fontWeight:700, letterSpacing:'0.02em' },
  grid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 },
}
