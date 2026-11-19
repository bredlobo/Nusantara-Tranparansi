import { useState, useEffect, FormEvent } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Landmark, Wallet, FolderKanban, Link2, BrainCircuit, MessageSquare, Settings, Menu, Search, Bell, User } from 'lucide-react'
import { api } from '../../services/api'
import type { Anomaly } from '../../types'

const nav = [
  ['dashboard', 'Overview', LayoutDashboard],
  ['penerimaan', 'Penerimaan Negara', Landmark],
  ['pengeluaran', 'Pengeluaran Negara', Wallet],
  ['proyek', 'Monitoring Proyek', FolderKanban],
  ['blockchain', 'Blockchain Explorer', Link2],
  ['ai', 'AI Intelligence', BrainCircuit],
  ['assistant', 'AI Assistant', MessageSquare],
  ['admin', 'Pengaturan', Settings],
] as const

export const Logo = () => (
  <Link to="/" className="group flex items-center gap-3">
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/30 bg-gradient-to-br from-blue/30 via-ink to-ink shadow-[0_0_18px_rgba(212,255,36,0.12)] transition group-hover:border-lime/70 group-hover:shadow-[0_0_24px_rgba(212,255,36,0.28)]">
      <svg viewBox="0 0 120 120" className="h-8 w-8" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="logo-shield" x1="12" y1="8" x2="108" y2="112" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D4FF24" />
            <stop offset="55%" stopColor="#1558C9" />
            <stop offset="100%" stopColor="#0B2D6E" />
          </linearGradient>
          <linearGradient id="logo-bar-lime" x1="0" y1="30" x2="0" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D4FF24" />
            <stop offset="100%" stopColor="#88B800" />
          </linearGradient>
        </defs>
        <path
          d="M60 6L106 31V79C106 96.5 86.2 109.4 60 115C33.8 109.4 14 96.5 14 79V31L60 6Z"
          fill="#060A17"
          stroke="url(#logo-shield)"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <rect x="33" y="46" width="12" height="38" rx="6" fill="#1558C9" />
        <path d="M39 51L81 78" stroke="url(#logo-shield)" strokeWidth="8.5" strokeLinecap="round" />
        <rect x="54" y="56" width="12" height="28" rx="6" fill="#1558C9" fillOpacity="0.65" />
        <rect x="75" y="34" width="12" height="50" rx="6" fill="url(#logo-bar-lime)" />
        <circle cx="39" cy="46" r="4" fill="#D4FF24" />
        <circle cx="81" cy="34" r="4.5" fill="#FFFFFF" stroke="#D4FF24" strokeWidth="2.5" />
        <circle cx="60" cy="23" r="3.5" fill="#D4FF24" />
        <path d="M39 46L60 23L81 34" stroke="#D4FF24" strokeOpacity="0.6" strokeWidth="2" strokeDasharray="3 2.5" />
      </svg>
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-base font-extrabold tracking-tight text-white">
        Nusantara <span className="text-lime">Transparan</span>
      </span>
      <span className="mt-1 font-mono text-[9.5px] font-semibold uppercase tracking-widest text-white/50">
        Blockchain • AI Audit
      </span>
    </div>
  </Link>
)

export default function Shell() {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(2026)
  const [q, setQ] = useState('')
  const [bell, setBell] = useState(false)
  const [liveAnomalies, setLiveAnomalies] = useState<Anomaly[]>([])
  const nav2 = useNavigate()

  useEffect(() => {
    if (bell) {
      api.anomalies().then(setLiveAnomalies).catch(() => {})
    }
  }, [bell])

  const search = (e: FormEvent) => {
    e.preventDefault()
    nav2('/app/proyek?q=' + encodeURIComponent(q))
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-ink p-4 transition-transform lg:static lg:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
        <div className="mb-8 mt-1">
          <Logo />
        </div>
        <nav className="space-y-1" aria-label="Navigasi dashboard">
          {nav.map(([to, label, I]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-blue text-white' : 'text-white/70 hover:bg-white/5'}`
              }
            >
              <I size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-white/10 bg-ink/90 px-4 py-3 backdrop-blur">
          <button className="lg:hidden" aria-label="Buka menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <form onSubmit={search} className="relative min-w-[160px] flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-3 text-white/50" />
            <input className="inp w-full pl-9" placeholder="Cari proyek…" value={q} onChange={e => setQ(e.target.value)} aria-label="Cari proyek" />
          </form>
          <select className="inp" value={year} onChange={e => setYear(+e.target.value)} aria-label="Tahun anggaran">
            {[2024, 2025, 2026].map(y => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <div className="relative">
            <button aria-label="Notifikasi" className="relative p-2" onClick={() => setBell(!bell)}>
              <Bell size={20} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-lime" />
            </button>
            {bell && (
              <div className="card absolute right-0 top-11 z-30 w-80 bg-ink text-xs">
                <p className="mb-2 font-bold text-lime">Notifikasi AI Anomaly Detection</p>
                {liveAnomalies.length === 0 ? (
                  <p className="text-white/60">Tidak ada anomali terdeteksi saat ini.</p>
                ) : (
                  liveAnomalies.map(a => (
                    <div key={a.id} className="border-b border-white/10 py-2 last:border-0">
                      <p className="font-semibold text-white">{a.title}</p>
                      <p className="mt-0.5 text-white/60">{a.data}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <User size={18} />
            <span className="hidden sm:inline">Publik</span>
          </div>
        </header>
        <main className="p-4 md:p-8">
          <Outlet context={{ year }} />
        </main>
      </div>
    </div>
  )
}
