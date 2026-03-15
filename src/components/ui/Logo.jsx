// Logo component — usa a logo oficial do StepBook
export default function Logo({ size = 32, showText = true, textSize = '1.15rem' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <img
        src="/logo.png"
        alt="StepBook"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          filter: 'brightness(1)',
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
