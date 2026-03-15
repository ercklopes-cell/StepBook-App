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

  useEffect(() => { if (tab === 'feed')    renderFeed()    }, [tab, selRef, stars])
  useEffect(() => { if (tab === 'stories') renderStories() }, [tab, quoteText])

  // ── CARD FEED 1080×1080 ──────────────────────────────────
  const renderFeed = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 1080, H = 1080
    canvas.width = W; canvas.height = H

    // BG
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#0a0a0a'); bg.addColorStop(1, '#111827')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    // Gold top bar
    const barG = ctx.createLinearGradient(0, 0, W, 0)
    barG.addColorStop(0, 'transparent'); barG.addColorStop(0.15, '#DEAD2A')
    barG.addColorStop(0.85, '#DEAD2A'); barG.addColorStop(1, 'transparent')
    ctx.fillStyle = barG; ctx.fillRect(0, 0, W, 5)

    // Logo top-right
    await drawLogoImg(ctx, W - 180, 22, 50)

    // StepBook text next to logo
    ctx.fillStyle = '#DEAD2A'
    ctx.font = '700 26px "Georgia", serif'
    ctx.textAlign = 'left'
    ctx.fillText('StepBook', W - 120, 54)

    // Cover
    const coverSrc = book.cover_url || (book.cover_b64 ? `data:image/jpeg;base64,${book.cover_b64}` : null)
    const CX = 80, CY = 180, CW = 300, CH = 450
    if (coverSrc) {
      await new Promise(res => {
        const img = new Image(); img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.save()
          ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 50; ctx.shadowOffsetX = 12
          ctx.drawImage(img, CX, CY, CW, CH); ctx.restore()
          ctx.strokeStyle = '#DEAD2A'; ctx.lineWidth = 2
          ctx.strokeRect(CX, CY, CW, CH); res()
        }
        img.onerror = res; img.src = coverSrc
      })
    } else {
      ctx.fillStyle = '#0d1a2e'; ctx.fillRect(CX, CY, CW, CH)
      ctx.strokeStyle = '#DEAD2A'; ctx.lineWidth = 2; ctx.strokeRect(CX, CY, CW, CH)
      ctx.fillStyle = '#DEAD2A'; ctx.font = '80px serif'; ctx.textAlign = 'center'
      ctx.fillText(book.emoji || '📖', CX + CW / 2, CY + CH / 2 + 30)
    }

    // Right column
    const RX = 430; ctx.textAlign = 'left'

    // Badge STEPBOOK
    ctx.fillStyle = 'rgba(222,173,42,0.15)'
    rrect(ctx, RX, 190, 200, 38, 19); ctx.fill()
    ctx.fillStyle = '#DEAD2A'; ctx.font = '600 14px sans-serif'
    ctx.textAlign = 'center'; ctx.fillText('STEPBOOK', RX + 100, 215); ctx.textAlign = 'left'

    // Title
    ctx.fillStyle = '#FFFFFF'; ctx.font = '700 38px "Georgia", serif'
    wrapText(ctx, book.title || 'Sem título', RX, 295, 560, 50)

    // Author
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '400 24px sans-serif'
    ctx.fillText(book.author || '', RX, 415)

    // Stars
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < stars ? '#DEAD2A' : 'rgba(255,255,255,0.2)'
      ctx.font = '28px serif'; ctx.fillText('★', RX + i * 36, 462)
    }

    // Progress bar
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; rrect(ctx, RX, 490, 560, 10, 5); ctx.fill()
    const pG = ctx.createLinearGradient(RX, 0, RX + (progress / 100) * 560, 0)
    pG.addColorStop(0, '#DEAD2A'); pG.addColorStop(1, '#f5c842')
    ctx.fillStyle = pG; rrect(ctx, RX, 490, (progress / 100) * 560, 10, 5); ctx.fill()
    ctx.fillStyle = '#DEAD2A'; ctx.font = '600 18px sans-serif'
    ctx.fillText(`${progress}% lido`, RX, 530)

    // Divider
    const dG = ctx.createLinearGradient(80, 0, W - 80, 0)
    dG.addColorStop(0, 'transparent'); dG.addColorStop(0.25, 'rgba(222,173,42,0.5)')
    dG.addColorStop(0.75, 'rgba(222,173,42,0.5)'); dG.addColorStop(1, 'transparent')
    ctx.strokeStyle = dG; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(80, 700); ctx.lineTo(W - 80, 700); ctx.stroke()

    // Reflection
    ctx.fillStyle = 'rgba(255,255,255,0.78)'; ctx.font = 'italic 400 26px "Georgia", serif'
    const ref = `"${feedText.slice(0, 150)}${feedText.length > 150 ? '…' : ''}"`
    wrapText(ctx, ref, 80, 758, W - 160, 38)

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '400 18px sans-serif'
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
    bg.addColorStop(0, '#0a1428'); bg.addColorStop(0.5, '#0d1f3c'); bg.addColorStop(1, '#1a253f')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    // Ondas douradas
    ctx.save(); ctx.globalAlpha = 0.18
    for (let w = 0; w < 5; w++) {
      ctx.beginPath(); ctx.strokeStyle = '#DEAD2A'; ctx.lineWidth = 1.5
      const amp = 55 + w * 25, offset = w * 180
      for (let x = 0; x <= W; x += 3) {
        const y = H * 0.42 + offset + Math.sin(x * 0.0035 + w * 1.2) * amp
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.restore()

    // Losangos dourados nos 4 cantos
    ;[[70,70],[W-70,70],[70,H-70],[W-70,H-70]].forEach(([cx,cy]) => {
      ctx.save()
      ctx.strokeStyle = '#DEAD2A'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.65
      ctx.beginPath()
      ctx.moveTo(cx, cy-75); ctx.lineTo(cx+75, cy)
      ctx.lineTo(cx, cy+75); ctx.lineTo(cx-75, cy)
      ctx.closePath(); ctx.stroke()
      ctx.globalAlpha = 0.12; ctx.fillStyle = '#DEAD2A'; ctx.fill()
      ctx.restore()
    })

    // Logo centralizada no topo
    await drawLogoImg(ctx, W / 2 - 55, 120, 110)

    // StepBook
    ctx.fillStyle = '#DEAD2A'; ctx.font = '700 60px "Georgia", serif'
    ctx.textAlign = 'center'; ctx.fillText('StepBook', W / 2, 310)

    // Subtítulo
    ctx.fillStyle = 'rgba(255,255,255,0.62)'; ctx.font = 'italic 400 34px "Georgia", serif'
    ctx.fillText('"Li essa frase pelo StepBook que me fez refletir"', W / 2, 390)

    // Linha topo
    goldenLine(ctx, W, 440)

    // Frase (grande, branca, centralizada)
    const quote = quoteText || feedText
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 52px "Georgia", serif'
    ctx.textAlign = 'center'
    wrapTextCtr(ctx, `"${quote.slice(0, 220)}"`, W / 2, 590, W - 180, 70)

    // Linha rodapé
    goldenLine(ctx, W, 1430)

    // Livro
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '400 36px sans-serif'
    ctx.textAlign = 'center'; ctx.fillText('Livro:', W / 2, 1510)
    ctx.fillStyle = '#DEAD2A'; ctx.font = '600 38px "Georgia", serif'
    wrapTextCtr(ctx, book.title || '', W / 2, 1565, W - 200, 48)

    ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.font = '400 30px sans-serif'
    ctx.fillText('stepbook.vercel.app', W / 2, H - 55)
  }

  function goldenLine(ctx, W, y) {
    const g = ctx.createLinearGradient(100, 0, W - 100, 0)
    g.addColorStop(0, 'transparent'); g.addColorStop(0.3, '#DEAD2A')
    g.addColorStop(0.7, '#DEAD2A'); g.addColorStop(1, 'transparent')
    ctx.strokeStyle = g; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(W - 100, y); ctx.stroke()
  }

  function drawLogoImg(ctx, x, y, size) {
    return new Promise(res => {
      const img = new Image()
      img.onload = () => { ctx.drawImage(img, x, y, size, size); res() }
      img.onerror = res; img.src = '/logo.png'
    })
  }

  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r)
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r)
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r)
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath()
  }

  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '', cy = y
    for (const w of words) {
      const t = line + w + ' '
      if (ctx.measureText(t).width > maxW && line) {
        ctx.fillText(line.trim(), x, cy); line = w + ' '; cy += lh
        if (cy > 1900) break
      } else line = t
    }
    if (line) ctx.fillText(line.trim(), x, cy)
  }

  function wrapTextCtr(ctx, text, cx, y, maxW, lh) {
    const words = text.split(' '); let line = '', cy = y
    for (const w of words) {
      const t = line + w + ' '
      if (ctx.measureText(t).width > maxW && line) {
        ctx.fillText(line.trim(), cx, cy); line = w + ' '; cy += lh
        if (cy > 1900) break
      } else line = t
    }
    if (line) ctx.fillText(line.trim(), cx, cy)
  }

  const getCanvas = () => tab === 'feed' ? canvasRef.current : storiesRef.current

  const download = () => {
    const a = document.createElement('a')
    a.href = getCanvas().toDataURL('image/png')
    a.download = `stepbook-${tab}-${(book.title || 'card').replace(/\s+/g,'-')}.png`
    a.click(); toast('Imagem salva! ✅')
  }

  const shareWA = () => {
    const txt = encodeURIComponent(
      tab === 'stories' && quoteText
        ? `"${quoteText}"\n\n— ${book.title}\n\nstepbook.vercel.app`
        : `Estou lendo "${book.title}" — ${progress}% concluído! stepbook.vercel.app`
    )
    window.open(`https://wa.me/?text=${txt}`, '_blank')
  }

  const copyText = async () => {
    const t = tab === 'stories' && quoteText
      ? `"${quoteText}" — ${book.title} | stepbook.vercel.app`
      : `Estou lendo "${book.title}" — ${progress}% lido! stepbook.vercel.app`
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
            ✂️ Card Stories
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
                <button key={s} style={{...styles.star, color: s<=stars?'#DEAD2A':'var(--text3)'}}
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
            {quoteText && (
              <div style={{ marginBottom:10 }}>
                <span style={styles.lbl}>Frase selecionada:</span>
                <p style={styles.quoteP}>"{quoteText.slice(0,120)}{quoteText.length>120?'…':''}"</p>
              </div>
            )}
          </>
        )}

        {/* Buttons */}
        <div style={styles.grid}>
          <button className="btn btn-gold btn-sm" onClick={shareWA}>💬 WhatsApp</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { download(); toast('Baixada! Abra o Instagram 📸') }}>📸 Instagram</button>
          <button className="btn btn-ghost btn-sm" onClick={copyText}>📋 Copiar texto</button>
          <button className="btn btn-ghost btn-sm" onClick={download}>⬇ Baixar imagem</button>
        </div>
        <button className="btn btn-ghost" style={{ width:'100%', marginTop:8 }} onClick={onClose}>Fechar</button>
      </div>
    </div>
  )
}

const styles = {
  modal: { maxWidth:520, padding:'20px 20px 24px' },
  tabs: { display:'flex', gap:8, marginBottom:16, borderBottom:'1px solid var(--border)', paddingBottom:12 },
  tab: {
    flex:1, padding:'8px 12px', background:'none',
    border:'1px solid var(--border)', borderRadius:'var(--radius)',
    color:'var(--text2)', fontSize:'0.80rem', fontWeight:600,
    cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
  },
  tabOn: { background:'var(--gold-dim2)', borderColor:'var(--gold)', color:'var(--gold)' },
  preview: { width:'100%', borderRadius:8, border:'1px solid var(--border2)', marginBottom:12 },
  storiesPrev: { height:320, borderRadius:8, border:'1px solid var(--border2)', aspectRatio:'9/16' },
  lbl: { fontSize:'0.72rem', fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', display:'block' },
  star: { background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', padding:'0 2px' },
  quoteP: { color:'var(--gold)', fontStyle:'italic', fontFamily:"'Crimson Pro',serif", fontSize:'0.9rem', lineHeight:1.5, marginTop:4 },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 },
}
