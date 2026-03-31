export default function Footer() {
  return (
    <footer
      className="hidden lg:flex items-center justify-between px-8 py-3"
      style={{
        borderTop: '1px solid var(--border-1)',
        background: 'var(--bg)',
      }}
    >
      <p className="text-xs" style={{ color: 'var(--text-6)' }}>
        SkillForge · APM Foundations Program
      </p>
      <p className="text-xs" style={{ color: 'var(--text-6)' }}>
        Build in public · Day 3 of 21
      </p>
    </footer>
  )
}
