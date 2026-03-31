export default function Footer() {
  return (
    <footer
      className="hidden lg:flex items-center justify-between px-8 py-3"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: '#000',
      }}
    >
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
        SkillForge · APM Foundations Program
      </p>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Build in public · Day 3 of 21
      </p>
    </footer>
  )
}
