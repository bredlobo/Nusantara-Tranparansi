import { useState, FormEvent } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Landmark, Wallet, FolderKanban, Link2, BrainCircuit, MessageSquare, Settings, Menu, Search, Bell, User, Fingerprint as Fp } from 'lucide-react'
import { anomalies } from '../../data/mock'
const nav = [
  ['dashboard', 'Overview', LayoutDashboard], ['penerimaan', 'Penerimaan Negara', Landmark], ['pengeluaran', 'Pengeluaran Negara', Wallet],
  ['proyek', 'Monitoring Proyek', FolderKanban], ['blockchain', 'Blockchain Explorer', Link2], ['ai', 'AI Intelligence', BrainCircuit], ['assistant', 'AI Assistant', MessageSquare], ['admin', 'Pengaturan', Settings]] as const
export const Logo = () => <Link to="/" className="flex items-center gap-2 font-extrabold"><Fp className="text-lime" size={24} /><span>Nusantara <span className="text-lime">Transparan</span></span></Link>
export default function Shell() {
  const [open, setOpen] = useState(false), [year, setYear] = useState(2026), [q, setQ] = useState(''), [bell, setBell] = useState(false), nav2 = useNavigate()
  const search = (e: FormEvent) => { e.preventDefault(); nav2('/app/proyek?q=' + encodeURIComponent(q)) }
  return (
    <div className="min-h-screen lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-ink p-4 transition-transform lg:static lg:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
        <div className="mb-8 mt-1"><Logo /></div>
        <nav className="space-y-1" aria-label="Navigasi dashboard">{nav.map(([to, label, I]) =>
          <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-blue text-white' : 'text-white/70 hover:bg-white/5'}`}><I size={18} />{label}</NavLink>)}</nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-white/10 bg-ink/90 px-4 py-3 backdrop-blur">
          <button className="lg:hidden" aria-label="Buka menu" onClick={() => setOpen(true)}><Menu /></button>
          <form onSubmit={search} className="relative min-w-[160px] flex-1 max-w-md"><Search size={16} className="absolute left-3 top-3 text-white/50" />
            <input className="inp w-full pl-9" placeholder="Cari proyek…" value={q} onChange={e => setQ(e.target.value)} aria-label="Cari proyek" /></form>
          <select className="inp" value={year} onChange={e => setYear(+e.target.value)} aria-label="Tahun anggaran">{[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}</select>
          <div className="relative"><button aria-label="Notifikasi" className="relative p-2" onClick={() => setBell(!bell)}><Bell size={20} /><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-lime" /></button>
            {bell && <div className="card absolute right-0 top-11 z-30 w-72 bg-ink text-sm">{anomalies.map(a => <p key={a.id} className="border-b border-white/10 py-2 last:border-0">{a.title}</p>)}</div>}</div>
          <div className="flex items-center gap-2 text-sm text-white/70"><User size={18} /><span className="hidden sm:inline">Publik</span></div>
        </header>
        <main className="p-4 md:p-8"><Outlet context={{ year }} /></main>
      </div>
    </div>
  )
}
