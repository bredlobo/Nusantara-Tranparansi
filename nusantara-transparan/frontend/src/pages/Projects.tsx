import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { useData } from '../hooks/useData'
import { Head, Async, Table, Modal, Pill, fmt } from '../components/ui'
import type { Project } from '../types'
const PER = 5
export default function Projects() {
  const s = useData(api.projects), [sp, setSp] = useSearchParams()
  const [cat, setCat] = useState(''), [reg, setReg] = useState(''), [st, setSt] = useState(''), [page, setPage] = useState(1), [sel, setSel] = useState<Project>()
  const q = sp.get('q') ?? ''
  return (
    <>
      <Head title="Monitoring Proyek" sub="Nilai rencana pengadaan bukan bukti pembayaran atau realisasi." />
      <Async s={s}>{all => {
        const opt = (k: keyof Project) => [...new Set(all.map(p => String(p[k])))]
        const list = all.filter(p => (!q || (p.name + p.agency).toLowerCase().includes(q.toLowerCase())) && (!cat || p.category === cat) && (!reg || p.region === reg) && (!st || p.status === st))
        const pages = Math.max(1, Math.ceil(list.length / PER)), cur = Math.min(page, pages)
        const sel2 = (v: string, set: (x: string) => void, label: string, o: string[]) => <select className="inp" value={v} onChange={e => { set(e.target.value); setPage(1) }} aria-label={label}><option value="">{label}</option>{o.map(x => <option key={x}>{x}</option>)}</select>
        return <>
          <div className="mb-4 flex flex-wrap gap-3">
            <input className="inp flex-1 min-w-[180px]" placeholder="Cari nama proyek atau instansi" aria-label="Cari proyek" value={q} onChange={e => { setSp(e.target.value ? { q: e.target.value } : {}); setPage(1) }} />
            {sel2(cat, setCat, 'Kategori', opt('category'))}{sel2(reg, setReg, 'Wilayah', opt('region'))}{sel2(st, setSt, 'Status', opt('status'))}
          </div>
          <Table head={['Proyek', 'Instansi', 'Wilayah', 'Anggaran', 'Progres', 'Status', '']} empty="Tidak ada proyek yang cocok dengan filter."
            rows={list.slice((cur - 1) * PER, cur * PER).map(p => [p.name, p.agency, p.region, fmt(p.budget / 1000 * 10).replace(' T', ' M'), p.progress + '%', <Pill ok={p.status === 'Selesai'} warn={p.status === 'Tertunda'}>{p.status}</Pill>, <button className="btn-s py-1.5" onClick={() => setSel(p)}>Detail</button>])} />
          <div className="mt-4 flex items-center justify-between text-sm"><span className="text-white/60">{list.length} proyek</span>
            <div className="flex items-center gap-2"><button className="btn-s" disabled={cur === 1} onClick={() => setPage(cur - 1)}>Sebelumnya</button><span>{cur}/{pages}</span><button className="btn-s" disabled={cur === pages} onClick={() => setPage(cur + 1)}>Berikutnya</button></div></div>
          {sel && <Modal title={sel.name} onClose={() => setSel(undefined)}>
            <dl className="grid grid-cols-2 gap-3 text-sm">{([['ID', sel.id], ['Instansi', sel.agency], ['Lokasi', sel.region], ['Periode', sel.period], ['Nilai anggaran', sel.budget + ' M (DEMO)'], ['Realisasi anggaran', sel.spent + ' M (DEMO)'], ['Progres', sel.progress + '%'], ['Status', sel.status]] as string[][]).map(([k, v]) => <div key={k}><dt className="text-white/50">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
            <div className="mt-4 h-2 rounded bg-white/10"><div className="h-2 rounded bg-lime" style={{ width: sel.progress + '%' }} /></div>
            <p className="mt-4 text-xs text-white/60">Sumber data: {sel.source}</p></Modal>}
        </>
      }}</Async>
    </>
  )
}
