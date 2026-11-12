import { Link } from 'react-router-dom'
import { Landmark, Wallet, FolderKanban, Link2, BrainCircuit, ArrowRight } from 'lucide-react'
import Fingerprint from '../components/fingerprint/Fingerprint'
import { Logo } from '../components/layout/Shell'
import { Demo } from '../components/ui'
const stats = [['Total Anggaran Negara', 'Rp 5.230 T'], ['Total Realisasi Belanja', 'Rp 3.817 T'], ['Total Penerimaan Negara', 'Rp 2.116 T'], ['Proyek yang Dipantau', '14']]
const steps = [['Data dikumpulkan', 'Data Manager mengunggah dataset dan memvalidasinya.'], ['Hash dicatat', 'Setiap rekaman diberi hash untuk menjaga integritas konten.'], ['AI membantu menelaah', 'Pola tak biasa ditandai untuk diperiksa manusia, bukan untuk menuduh.'], ['Publik memantau', 'Siapa pun dapat menjelajahi angka dan sumbernya.']]
const feats = [[Landmark, 'Transparansi Penerimaan Negara', 'Pajak, bea cukai, PNBP, dan hibah: target versus realisasi.', 'penerimaan'], [Wallet, 'Transparansi Belanja Negara', 'Anggaran, realisasi, dan sisa dibedakan dengan jelas.', 'pengeluaran'],
  [FolderKanban, 'Pemantauan Proyek Pemerintah', 'Progres, nilai, dan sumber data tiap proyek.', 'proyek'], [Link2, 'Blockchain Verification', 'Hash yang cocok membuktikan konten tidak berubah dari yang tercatat. Ini tidak membuktikan transaksi awal benar secara faktual.', 'blockchain'],
  [BrainCircuit, 'AI Financial Intelligence', 'Anomali terdeteksi, memerlukan pemeriksaan lebih lanjut.', 'ai']] as const
export default function Home() {
  return (
    <div>
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
        <Logo />
        <nav className="hidden items-center gap-5 text-sm text-white/70 xl:flex" aria-label="Utama"><Link to="/">Beranda</Link>
          {[['dashboard', 'Dashboard'], ['penerimaan', 'Penerimaan'], ['pengeluaran', 'Pengeluaran'], ['proyek', 'Proyek'], ['blockchain', 'Verifikasi Blockchain'], ['assistant', 'AI Assistant']].map(([t, l]) => <Link key={t} to={'/app/' + t} className="hover:text-lime">{l}</Link>)}</nav>
        <Link to="/app/dashboard" className="btn-p">Lihat Dashboard</Link>
      </header>
      <section className="relative mx-auto grid max-w-7xl items-center gap-6 overflow-hidden px-4 pb-16 pt-8 md:px-8 lg:grid-cols-2">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">Uang Negara, <span className="text-lime">Terbuka</span> untuk Semua.</h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">Pantau pemasukan, pengeluaran, dan alokasi anggaran negara melalui satu platform transparansi yang mudah diakses dan dapat diverifikasi.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/app/dashboard" className="btn-p">Jelajahi Dashboard <ArrowRight size={16} /></Link><a href="#cara-kerja" className="btn-s">Pelajari Cara Kerja</a></div>
        </div>
        <Fingerprint className="mx-auto h-auto max-h-[560px] w-full max-w-md lg:max-w-none" />
      </section>
      <section className="mx-auto max-w-7xl px-4 md:px-8"><div className="mb-3 flex items-center gap-2 text-sm text-white/60"><Demo /> Angka demonstrasi, bukan data resmi pemerintah.</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([l, v]) => <div key={l} className="card"><p className="text-xs uppercase tracking-wide text-white/60">{l}</p><p className="mt-2 text-2xl font-extrabold text-lime">{v}</p></div>)}</div></section>
      <section id="cara-kerja" className="mx-auto max-w-7xl px-4 py-20 md:px-8"><h2 className="mb-8 text-3xl font-extrabold">Bagaimana Sistem Bekerja</h2>
        <div className="grid gap-4 md:grid-cols-4">{steps.map(([t, d], i) => <div key={t} className="card"><span className="text-sm font-bold text-lime">0{i + 1}</span><h3 className="mt-2 font-bold">{t}</h3><p className="mt-1 text-sm text-white/60">{d}</p></div>)}</div></section>
      <section className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-2 md:px-8 lg:grid-cols-3">{feats.map(([I, t, d, to]) =>
        <Link key={t} to={'/app/' + to} className="card transition hover:border-lime/50"><I className="text-lime" /><h3 className="mt-3 font-bold">{t}</h3><p className="mt-1 text-sm text-white/60">{d}</p></Link>)}</section>
      <footer className="mt-20 border-t border-white/10 px-4 py-8 text-center text-sm text-white/50">Nusantara Transparan — prototipe frontend. Seluruh data adalah DEMO dan bukan data resmi pemerintah.</footer>
    </div>
  )
}
