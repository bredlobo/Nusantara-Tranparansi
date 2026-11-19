import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Landmark, Wallet, FolderKanban, Link2, BrainCircuit, ArrowRight, ShieldCheck, Lock, Cpu, Sparkles } from 'lucide-react'
import Fingerprint from '../components/fingerprint/Fingerprint'
import { Logo } from '../components/layout/Shell'
import { fmt, Reveal } from '../components/ui'
import { api } from '../services/api'

const steps = [
  ['Data Dikumpulkan & Divalidasi', 'Data Manager mengunggah dataset anggaran/proyek ke PostgreSQL dengan status Draf.'],
  ['Hash Kriptografi Dicatat', 'Setiap rekaman dikunci dengan SHA-256 Hash Chain & tanda tangan digital ECDSA P-256.'],
  ['AI & Auditor Menelaah', 'AI mendeteksi pola anomali secara Read-Only dan Auditor BPK memverifikasi kecocokan hash.'],
  ['Publik Memantau Real-Time', 'Setelah disahkan Administrator, masyarakat dapat memverifikasi setiap rupiah dan bloknya.'],
]

const feats = [
  [Landmark, 'Transparansi Penerimaan Negara', 'Pantau realisasi Pajak, Bea & Cukai, PNBP, serta Hibah secara akurat terhadap target.', 'penerimaan'],
  [Wallet, 'Transparansi Belanja Negara', 'Pemisahan tegas antara Pagu Anggaran, Realisasi Kumulatif, dan Transaksi SP2D.', 'pengeluaran'],
  [FolderKanban, 'Pemantauan Proyek Strategis', 'Lacak progres fisik di lapangan, lokasi wilayah, anggaran terpakai, dan kirim laporan warga.', 'proyek'],
  [Link2, 'Blockchain Hash Chain Verifier', 'Uji keaslian data secara langsung dengan pembuktian SHA-256 Hash Chain & ECDSA P-256.', 'blockchain'],
  [BrainCircuit, 'AI Financial Intelligence', 'Deteksi deviasi serapan, over-budget, dan proyeksi akhir tahun berbasis Machine Learning.', 'ai'],
  [Sparkles, 'AI Financial Assistant (RAG)', 'Tanya-jawab interaktif berbasis data resmi PostgreSQL tanpa halusinasi angka.', 'assistant'],
] as const

export default function Home() {
  const [totalBudget, setTotalBudget] = useState(0)
  const [totalSpend, setTotalSpend] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [projectCount, setProjectCount] = useState(0)

  useEffect(() => {
    api
      .expenditure()
      .then(rows => {
        const base = rows.filter(r => r.group === 'Jenis Belanja')
        setTotalBudget(base.reduce((a, r) => a + r.target, 0))
        setTotalSpend(base.reduce((a, r) => a + r.real, 0))
      })
      .catch(() => {})

    api
      .revenue()
      .then(rows => {
        setTotalRevenue(rows.reduce((a, r) => a + r.real, 0))
      })
      .catch(() => {})

    api
      .projects()
      .then(prjs => {
        setProjectCount(prjs.length)
      })
      .catch(() => {})
  }, [])

  const stats = [
    ['Total Pagu Anggaran', fmt(totalBudget)],
    ['Total Realisasi Belanja', fmt(totalSpend)],
    ['Total Penerimaan Negara', fmt(totalRevenue)],
    ['Proyek Strategis Dipantau', `${projectCount} Proyek`],
  ]

  return (
    <div className="min-h-screen">
      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 xl:flex" aria-label="Utama">
            <Link to="/" className="text-white hover:text-lime">
              Beranda
            </Link>
            {[
              ['dashboard', 'Dashboard'],
              ['penerimaan', 'Penerimaan'],
              ['pengeluaran', 'Pengeluaran'],
              ['proyek', 'Proyek'],
              ['blockchain', 'Verifikasi Blockchain'],
              ['assistant', 'AI Assistant'],
            ].map(([t, l]) => (
              <Link key={t} to={'/app/' + t} className="transition-colors hover:text-lime">
                {l}
              </Link>
            ))}
          </nav>
          <Link to="/app/dashboard" className="btn-p">
            Buka Dashboard <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-10 overflow-hidden px-4 pb-20 pt-12 md:px-8 lg:grid-cols-2 lg:pt-16">
        <Reveal direction="left">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime/35 bg-lime/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-lime shadow-[0_0_24px_rgba(212,255,36,0.18)]">
              <ShieldCheck size={15} /> 18-Layer Cyber Defense • SHA-256 Blockchain • AI Audit
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight md:text-6xl">
              Uang Negara, <span className="text-shimmer">Terbuka & Terverifikasi</span> untuk Semua.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
              Platform transparansi dan akuntabilitas keuangan publik generasi baru. Setiap anggaran, realisasi, dan proyek strategis dikunci dengan rantai hash kriptografi dan diawasi oleh kecerdasan buatan secara <i>Read-Only</i>.
            </p>
            <div className="mt-9 flex flex-wrap gap-3.5">
              <Link to="/app/dashboard" className="btn-p px-6 py-3 text-base">
                Jelajahi Dashboard <ArrowRight size={18} />
              </Link>
              <a href="#cara-kerja" className="btn-s px-6 py-3 text-base">
                Pelajari Arsitektur
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal direction="right" delay={150}>
          <div className="float-slow relative mx-auto w-full max-w-md lg:max-w-none">
            <Fingerprint className="mx-auto h-auto max-h-[540px] w-full drop-shadow-[0_0_45px_rgba(21,88,201,0.45)]" />
          </div>
        </Reveal>
      </section>

      {/* Live PostgreSQL Statistics Section (Scroll Reveal Staggered) */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Reveal direction="up">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-lime/90">
            <span className="h-2 w-2 animate-ping rounded-full bg-lime" />
            Data Real-Time dari Database PostgreSQL Nusantara Transparan
          </div>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([l, v], idx) => (
            <Reveal key={l} direction="scale" delay={idx * 110}>
              <div className="card group h-full">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/55 group-hover:text-white/80">
                  {l}
                </p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-lime drop-shadow-[0_0_14px_rgba(212,255,36,0.28)]">
                  {v}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How It Works Section (Scroll Reveal on Scroll Down) */}
      <section id="cara-kerja" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <Reveal direction="up">
          <div className="mb-12 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-lime">Alur Tata Kelola Berjenjang</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              Bagaimana Sistem Menjaga Keaslian Data
            </h2>
            <p className="mt-3 text-sm text-white/65">
              Menggabungkan prinsip <i>Four-Eyes Principle</i> (Data Manager, Auditor BPK, Administrator) dengan bukti kriptografi yang tidak dapat diubah.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-4">
          {steps.map(([t, d], i) => (
            <Reveal key={t} direction="up" delay={i * 130}>
              <div className="card h-full">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-lime/40 bg-lime/10 font-mono text-sm font-extrabold text-lime">
                  0{i + 1}
                </div>
                <h3 className="mt-4 text-base font-bold text-white">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Feature Modules Grid (Scroll Reveal Staggered) */}
      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <Reveal direction="up">
          <div className="mb-12 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-lime">Ekosistem Modul</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              Eksplorasi Fitur Transparansi & Analitik
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {feats.map(([I, t, d, to], idx) => (
            <Reveal key={t} direction="up" delay={idx * 100}>
              <Link to={'/app/' + to} className="card group flex h-full flex-col justify-between">
                <div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-lime/30 bg-blue/25 text-lime transition-transform duration-300 group-hover:scale-110 group-hover:border-lime">
                    <I size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white transition-colors group-hover:text-lime">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{d}</p>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-lime opacity-80 transition-all group-hover:translate-x-1.5 group-hover:opacity-100">
                  Buka Modul <ArrowRight size={14} />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Security & Compliance Highlight Banner (Scroll Reveal) */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <Reveal direction="scale">
          <div className="card flex flex-col items-start justify-between gap-6 border-lime/30 bg-gradient-to-r from-blue/25 via-ink to-lime/10 p-8 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-lime">
                <Lock size={14} /> Pertahanan Siber Berlapis (Defense-in-Depth)
              </div>
              <h3 className="text-2xl font-extrabold">Dilindungi Enkripsi AES-256-GCM, ECDSA P-256, & In-App WAF</h3>
              <p className="max-w-2xl text-sm text-white/70">
                Mematuhi standar keamanan OWASP/CWE Top 25 serta regulasi UU KIP No. 14/2008, UU PDP No. 27/2022, dan UU ITE No. 1/2024.
              </p>
            </div>
            <Link to="/app/blockchain" className="btn-p shrink-0 px-5 py-3">
              <Cpu size={16} /> Cek Verifikasi Blockchain
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/10 bg-ink/80 px-4 py-10 text-center text-sm text-white/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row md:px-8">
          <Logo />
          <p>Nusantara Transparan — Platform Transparansi Keuangan Berbasis PostgreSQL, Blockchain, & AI.</p>
        </div>
      </footer>
    </div>
  )
}
