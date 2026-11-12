import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { api } from '../services/api'
import { monthly } from '../data/mock'
import { useData } from '../hooks/useData'
import { Head, Stat, ChartBox, Async, Table, fmt, T, tip } from '../components/ui'
export default function Budget({ kind }: { kind: 'revenue' | 'expenditure' }) {
  const rev = kind === 'revenue', s = useData(rev ? api.revenue : api.expenditure), [per, setPer] = useState('all')
  const trend = monthly.filter((_, i) => per === 'all' || Math.floor(i / 3) === +per.slice(1) - 1).map(x => ({ m: x.m, v: rev ? x.revenue : x.spend }))
  return (
    <>
      <Head title={rev ? 'Penerimaan Negara' : 'Pengeluaran Negara'} sub={rev ? 'Pajak, Bea dan Cukai, PNBP, dan Hibah.' : 'Anggaran (pagu), realisasi, dan sisa dibedakan. Rencana bukan bukti pembayaran.'} />
      <select className="inp mb-6" value={per} onChange={e => setPer(e.target.value)} aria-label="Periode"><option value="all">Setahun</option>{['q1', 'q2', 'q3', 'q4'].map(q => <option key={q} value={q}>Triwulan {q[1]}</option>)}</select>
      <Async s={s}>{rows => {
        const base = rows.filter(r => rev || r.group === 'Jenis Belanja'), T0 = base.reduce((a, r) => a + r.target, 0), R0 = base.reduce((a, r) => a + r.real, 0)
        return <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label={rev ? 'Target penerimaan' : 'Total anggaran'} value={fmt(T0)} /><Stat label={rev ? 'Realisasi penerimaan' : 'Total realisasi'} value={fmt(R0)} />
            <Stat label={rev ? 'Kekurangan dari target' : 'Sisa anggaran'} value={fmt(T0 - R0)} /><Stat label={rev ? 'Pencapaian' : 'Persentase realisasi'} value={(R0 / T0 * 100).toFixed(1) + '%'} hot /></div>
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <ChartBox title={rev ? 'Target vs realisasi per kategori' : 'Alokasi vs realisasi'}><BarChart data={rows}><CartesianGrid stroke="#ffffff14" /><XAxis dataKey="name" stroke={T} tick={{ fontSize: 10 }} /><YAxis stroke={T} /><Tooltip {...tip} /><Legend /><Bar dataKey="target" name="Target/Pagu" fill="#1558C9" /><Bar dataKey="real" name="Realisasi" fill="#D4FF24" /></BarChart></ChartBox>
            <ChartBox title="Tren bulanan"><LineChart data={trend}><CartesianGrid stroke="#ffffff14" /><XAxis dataKey="m" stroke={T} /><YAxis stroke={T} /><Tooltip {...tip} /><Line dataKey="v" name={rev ? 'Penerimaan' : 'Belanja'} stroke="#D4FF24" strokeWidth={2} /></LineChart></ChartBox></div>
          <Table head={['Kelompok', 'Kategori', 'Target/Pagu', 'Realisasi', 'Sisa', '%']} rows={rows.map(r => [r.group, r.name, fmt(r.target), fmt(r.real), fmt(r.target - r.real), (r.real / r.target * 100).toFixed(1) + '%'])} />
        </>
      }}</Async>
    </>
  )
}
