import { useEffect, useRef, useState } from 'react'
import { useToast } from '../../hooks/useToast'

export default function ShareModal({ book, progress, mode = 'feed', quoteText = '', onClose }) {
  const canvasRef  = useRef()
  const storiesRef = useRef()
  const toast      = useToast()

  const [tab,    setTab]    = useState(mode)
  const [selRef, setSelRef] = useState(0)
  const [stars,  setStars]  = useState(5)

  const reflections = book.reflections?.filter(r => r.answered) || []
  const feedText    = reflections[selRef]?.answer
    || `${progress}% do livro lido com leitura ativa pelo StepBook.`
  const storyQuote  = quoteText || feedText

  // Limpar título — remover nome de arquivo se necessário
  const cleanTitle = (t = '') => t
    .replace(/[-_]/g, ' ')
    .replace(/\.(pdf|txt)$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)

  const bookTitle  = cleanTitle(book.title)
  const bookAuthor = book.author || ''

  useEffect(() => { if (tab === 'feed')    renderFeed()    }, [tab, selRef, stars])
  useEffect(() => { if (tab === 'stories') renderStories() }, [tab, quoteText])

  // ── LOGO — carrega da URL externa (fundo transparente preservado no canvas) ──
  const LOGO_URL = 'https://i.ibb.co/Xkfz5QKL/sua-logo-stepbook.png'

  const getLogoImg = () => new Promise(res => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => res(img)
    img.onerror = () => {
      // Fallback: tenta via /logo.png local
      const img2 = new Image()
      img2.onload  = () => res(img2)
      img2.onerror = () => res(null)
      img2.src = '/logo.png'
    }
    img.src = LOGO_URL
  })

  // ── CARD FEED 1080×1080 ──────────────────────────────────
  const renderFeed = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 1080, H = 1080
    canvas.width = W; canvas.height = H

    // BG gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#080c14'); bg.addColorStop(1, '#101820')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    // Gold top bar
    const barG = ctx.createLinearGradient(0, 0, W, 0)
    barG.addColorStop(0, 'transparent'); barG.addColorStop(0.15, '#DEAD2A')
    barG.addColorStop(0.85, '#DEAD2A'); barG.addColorStop(1, 'transparent')
    ctx.fillStyle = barG; ctx.fillRect(0, 0, W, 5)

    // Logo top-right (sem fundo escuro)
    const logoImg = await getLogoImg()
    if (logoImg) {
      ctx.drawImage(logoImg, W - 128, 18, 52, 52)
    }
    ctx.fillStyle = '#DEAD2A'
    ctx.font = '600 20px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('StepBook', W - 138, 52)
    ctx.textAlign = 'left'

    // Cover
    const coverSrc = book.cover_url || (book.cover_b64 ? `data:image/jpeg;base64,${book.cover_b64}` : null)
    const CX = 80, CY = 180, CW = 290, CH = 435
    if (coverSrc) {
      await new Promise(res => {
        const img = new Image(); img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.save()
          ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 40; ctx.shadowOffsetX = 10
          ctx.drawImage(img, CX, CY, CW, CH); ctx.restore()
          ctx.strokeStyle = '#DEAD2A'; ctx.lineWidth = 2; ctx.strokeRect(CX, CY, CW, CH); res()
        }
        img.onerror = res; img.src = coverSrc
      })
    } else {
      ctx.fillStyle = '#0d1a2e'; ctx.fillRect(CX, CY, CW, CH)
      ctx.strokeStyle = '#DEAD2A'; ctx.lineWidth = 2; ctx.strokeRect(CX, CY, CW, CH)
      ctx.fillStyle = '#DEAD2A'; ctx.font = '72px serif'; ctx.textAlign = 'center'
      ctx.fillText(book.emoji || '📖', CX + CW/2, CY + CH/2 + 25); ctx.textAlign = 'left'
    }

    // Right column
    const RX = 420; ctx.textAlign = 'left'

    // Badge
    ctx.fillStyle = 'rgba(222,173,42,0.15)'
    rrect(ctx, RX, 190, 185, 34, 17); ctx.fill()
    ctx.fillStyle = '#DEAD2A'; ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'; ctx.fillText('STEPBOOK', RX + 92, 212); ctx.textAlign = 'left'

    // Title — com wrap correto
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 34px "Georgia", serif'
    wrapText(ctx, bookTitle, RX, 288, 580, 44, 3)

    // Author
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '400 22px sans-serif'
    ctx.fillText(bookAuthor.slice(0, 40), RX, 400)

    // Stars
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < stars ? '#DEAD2A' : 'rgba(255,255,255,0.2)'
      ctx.font = '26px serif'; ctx.fillText('★', RX + i * 33, 448)
    }

    // Progress bar
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; rrect(ctx, RX, 474, 540, 9, 4); ctx.fill()
    const pw = (progress / 100) * 540
    const pG = ctx.createLinearGradient(RX, 0, RX + pw, 0)
    pG.addColorStop(0, '#DEAD2A'); pG.addColorStop(1, '#f5c842')
    ctx.fillStyle = pG; rrect(ctx, RX, 474, pw, 9, 4); ctx.fill()
    ctx.fillStyle = '#DEAD2A'; ctx.font = 'bold 16px sans-serif'
    ctx.fillText(`${progress}% lido`, RX, 510)

    // Divider
    const dG = ctx.createLinearGradient(80, 0, W - 80, 0)
    dG.addColorStop(0, 'transparent'); dG.addColorStop(0.2, 'rgba(222,173,42,0.6)')
    dG.addColorStop(0.8, 'rgba(222,173,42,0.6)'); dG.addColorStop(1, 'transparent')
    ctx.strokeStyle = dG; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(80, 690); ctx.lineTo(W - 80, 690); ctx.stroke()

    // Reflection
    ctx.fillStyle = 'rgba(255,255,255,0.78)'; ctx.font = 'italic 400 24px "Georgia", serif'
    wrapText(ctx, `"${feedText.slice(0, 160)}"`, 80, 745, W - 160, 36, 4)

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '400 16px sans-serif'
    ctx.textAlign = 'right'; ctx.fillText('stepbook.vercel.app', W - 80, H - 40)
  }

  // ── CARD STORIES 1080×1920 ───────────────────────────────
  const renderStories = async () => {
    const canvas = storiesRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 1080, H = 1920
    canvas.width = W; canvas.height = H

    // BG azul marinho
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0,   '#071020')
    bg.addColorStop(0.5, '#091830')
    bg.addColorStop(1,   '#0c1e3a')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    // ── Ondas douradas (lado direito, múltiplas linhas) ──
    drawWaves(ctx, W, H)

    // ── Logo centralizada no topo — tamanho grande com glow dourado ──
    const logoImg = await getLogoImg()
    const LS = 200  // grande para destaque máximo
    const LX = W / 2 - LS / 2
    if (logoImg) {
      ctx.save()
      ctx.shadowColor  = '#D4AF37'
      ctx.shadowBlur   = 35
      ctx.drawImage(logoImg, LX, 80, LS, LS)
      ctx.restore()
    } else {
      ctx.fillStyle = '#DEAD2A'
      ctx.font = '120px serif'
      ctx.textAlign = 'center'
      ctx.fillText('📖', W/2, 230)
    }

    // StepBook
    ctx.fillStyle = '#DEAD2A'
    ctx.font      = 'bold 68px "Georgia", serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(212,175,55,0.3)'
    ctx.shadowBlur  = 10
    ctx.fillText('StepBook', W / 2, 330)
    ctx.shadowBlur = 0

    // Subtítulo
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.font      = '400 36px "Georgia", serif'
    ctx.fillText('Li essa frase pelo StepBook', W / 2, 410)
    ctx.fillText('que me fez refletir', W / 2, 456)

    // Linha dourada
    goldLine(ctx, W, 510)

    // Frase principal
    const quote = storyQuote.slice(0, 280)
    ctx.fillStyle   = '#FFFFFF'
    ctx.font        = 'italic bold 60px "Georgia", serif'
    ctx.textAlign   = 'center'
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur  = 6
    wrapTextCtr(ctx, `\u201c${quote}\u201d`, W / 2, 660, W - 140, 80, 8)
    ctx.shadowBlur = 0

    // Linha inferior
    goldLine(ctx, W, 1450)

    // Livro
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font      = '400 38px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Livro:', W / 2, 1530)

    ctx.fillStyle = '#DEAD2A'
    ctx.font      = 'bold 42px "Georgia", serif'
    wrapTextCtr(ctx, bookTitle, W / 2, 1592, W - 160, 52, 2)

    // URL
    ctx.fillStyle = 'rgba(255,255,255,0.32)'
    ctx.font      = '400 30px sans-serif'
    ctx.fillText('stepbook.vercel.app', W / 2, H - 55)
  }

  // ── Ondas douradas fiel à referência ───────────────────
  function drawWaves(ctx, W, H) {
    // Onda principal dourada (à direita, como na imagem)
    const waveConfigs = [
      { startFrac: 0.38, amp1: 140, amp2: 70, freq1: 0.0030, freq2: 0.0055, lw: 2.0, alpha: 0.85 },
      { startFrac: 0.42, amp1: 110, amp2: 55, freq1: 0.0032, freq2: 0.0058, lw: 1.2, alpha: 0.45 },
      { startFrac: 0.46, amp1: 130, amp2: 65, freq1: 0.0028, freq2: 0.0052, lw: 0.8, alpha: 0.25 },
      { startFrac: 0.50, amp1: 100, amp2: 50, freq1: 0.0035, freq2: 0.0060, lw: 0.6, alpha: 0.18 },
      { startFrac: 0.55, amp1: 120, amp2: 60, freq1: 0.0025, freq2: 0.0048, lw: 0.5, alpha: 0.12 },
      // Reflexo suave à esquerda
      { startFrac: 0.20, amp1: 60,  amp2: 30, freq1: 0.0028, freq2: 0.0050, lw: 0.5, alpha: 0.10 },
    ]

    for (const wc of waveConfigs) {
      ctx.save()
      ctx.globalAlpha  = wc.alpha
      ctx.strokeStyle  = '#DEAD2A'
      ctx.lineWidth    = wc.lw
      ctx.beginPath()
      const startX = W * wc.startFrac
      ctx.moveTo(startX, 0)
      for (let y = 0; y <= H; y += 4) {
        const x = startX
          + Math.sin(y * wc.freq1) * wc.amp1
          + Math.sin(y * wc.freq2 + 1.5) * wc.amp2
        ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.restore()
    }
  }

  // ── HELPERS ─────────────────────────────────────────────
  function goldLine(ctx, W, y) {
    const g = ctx.createLinearGradient(60, 0, W - 60, 0)
    g.addColorStop(0,   'transparent')
    g.addColorStop(0.15,'rgba(222,173,42,0.9)')
    g.addColorStop(0.85,'rgba(222,173,42,0.9)')
    g.addColorStop(1,   'transparent')
    ctx.strokeStyle = g; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke()
  }

  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r)
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r)
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r)
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath()
  }

  function wrapText(ctx, text, x, y, maxW, lh, maxLines = 99) {
    const words = text.split(' '); let line = '', cy = y, lines = 0
    for (const w of words) {
      const t = line + w + ' '
      if (ctx.measureText(t).width > maxW && line) {
        ctx.fillText(line.trim(), x, cy)
        line = w + ' '; cy += lh; lines++
        if (lines >= maxLines) { ctx.fillText('…', x, cy); return }
      } else line = t
    }
    if (line) ctx.fillText(line.trim(), x, cy)
  }

  function wrapTextCtr(ctx, text, cx, y, maxW, lh, maxLines = 99) {
    const words = text.split(' '); let line = '', cy = y, lines = 0
    for (const w of words) {
      const t = line + w + ' '
      if (ctx.measureText(t).width > maxW && line) {
        ctx.fillText(line.trim(), cx, cy)
        line = w + ' '; cy += lh; lines++
        if (lines >= maxLines) { ctx.fillText('…', cx, cy); return }
      } else line = t
    }
    if (line) ctx.fillText(line.trim(), cx, cy)
  }

  // ── AÇÕES ────────────────────────────────────────────────
  const getCanvas = () => tab === 'feed' ? canvasRef.current : storiesRef.current

  const download = () => {
    const a = document.createElement('a')
    a.href = getCanvas().toDataURL('image/png')
    a.download = `stepbook-${tab}-${bookTitle.replace(/\s+/g,'-').slice(0,30)}.png`
    a.click(); toast('Imagem salva! ✅')
  }

  const shareWA = () => {
    const txt = encodeURIComponent(
      tab === 'stories' && quoteText
        ? `"${quoteText}"\n\n— ${bookTitle}\n\nstepbook.vercel.app`
        : `Estou lendo "${bookTitle}" — ${progress}% concluído!\n\nstepbook.vercel.app`
    )
    window.open(`https://wa.me/?text=${txt}`, '_blank')
  }

  const copyText = async () => {
    const t = tab === 'stories' && quoteText
      ? `"${quoteText}" — ${bookTitle} | stepbook.vercel.app`
      : `Estou lendo "${bookTitle}" — ${progress}% lido! stepbook.vercel.app`
    await navigator.clipboard.writeText(t); toast('Texto copiado!')
  }

  return (
    <div className="overlay center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={styles.modal}>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button style={{...styles.tab, ...(tab==='feed' ? styles.tabOn : {})}} onClick={() => setTab('feed')}>
            📊 Card Feed
          </button>
          <button style={{...styles.tab, ...(tab==='stories' ? styles.tabOn : {})}} onClick={() => setTab('stories')}>
            💬 Card Stories
          </button>
        </div>

        {/* Feed */}
        {tab === 'feed' && (
          <>
            <canvas ref={canvasRef} style={styles.preview} />
            {reflections.length > 0 && (
              <div style={{ marginBottom: 10 }}>
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
                <button key={s}
                  style={{...styles.star, color: s<=stars?'#DEAD2A':'var(--text3)'}}
                  onClick={() => setStars(s)}>★</button>
              ))}
            </div>
          </>
        )}

        {/* Stories */}
        {tab === 'stories' && (
          <>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
              <canvas ref={storiesRef} style={styles.storiesPrev} />
            </div>
            {storyQuote && (
              <div style={{ marginBottom:8 }}>
                <span style={styles.lbl}>Frase no card:</span>
                <p style={styles.quoteP}>
                  "{storyQuote.slice(0,100)}{storyQuote.length>100?'…':''}"
                </p>
              </div>
            )}
            {!quoteText && (
              <p style={{ fontSize:'0.76rem', color:'var(--text3)', marginBottom:8 }}>
                💡 Selecione um trecho do texto e toque no botão 💬 para criar um card personalizado.
              </p>
            )}
          </>
        )}

        {/* Botões */}
        <div style={styles.grid}>
          <button className="btn btn-gold btn-sm" onClick={shareWA}>💬 WhatsApp</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { download(); toast('Baixada! Salve nos Stories 📸') }}>📸 Instagram</button>
          <button className="btn btn-ghost btn-sm" onClick={copyText}>📋 Copiar texto</button>
          <button className="btn btn-ghost btn-sm" onClick={download}>⬇ Baixar imagem</button>
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
  lbl: {
    fontSize:'0.72rem', fontWeight:600, color:'var(--text3)',
    textTransform:'uppercase', letterSpacing:'0.08em', display:'block',
  },
  star: { background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', padding:'0 2px' },
  quoteP: {
    color:'var(--gold)', fontStyle:'italic',
    fontFamily:"'Crimson Pro',serif", fontSize:'0.9rem', lineHeight:1.5, marginTop:4,
  },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 },
}
