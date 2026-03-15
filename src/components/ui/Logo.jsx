// Logo component — logo oficial StepBook (PNG fundo transparente)
export default function Logo({ size = 36, showText = true, textSize = '1.15rem' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <img
        src="/logo.png"
        alt="StepBook"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 6px rgba(222,173,42,0.35))',
        }}
      />
      {showText && (
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: textSize,
          fontWeight: 700,
          color: 'var(--gold)',
          letterSpacing: '0.03em',
          lineHeight: 1,
        }}>
          StepBook
        </span>
      )}
    </div>
  )
}
