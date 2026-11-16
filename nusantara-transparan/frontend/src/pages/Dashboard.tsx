import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { api } from '../services/api'
import { useData } from '../hooks/useData'
import { Head, Stat, ChartBox, Async, Table, fmt, T, tip } from '../components/ui'

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

export default function Dashboard() {
  const { year } = useOutletContext<{ year: number }>()
  const s = useData(api.dashboard)
  const [per, setPer] = useState('all')
  const [min, setMin] = useState('all')
  const [cat, setCat] = useState('all')
  const f = 1 - (2026 - year) * 0.07

  return (
    <>
      <Head title="Financial Dashboard" sub={`Tahun anggaran ${year}. Nilai dalam Rp triliun.`} />
      <Async s={s}>{d => {
        const ms = d.monthly.filter((_, i) => per === 'all' || (per === 's1' ? i < 6 : i >= 6)).map(x => ({ ...x, revenue: Math.round(x.revenue * f), spend: Math.round(x.spend * f), budget: Math.round(x.budget * f) }))
        const mi = d.ministries.filter(x => min === 'all' || x.name === min).map(x => ({ ...x, budget: Math.round(x.budget * f), real: Math.round(x.real * f) }))
        const yr = [2024, 2025, 2026].map(y => ({ y, revenue: Math.round(sum(d.monthly.map(x => x.revenue)) * (1 - (2026 - y) * 0.07)), spend: Math.round(sum(d.monthly.map(x => x.spend)) * (1 - (2026 - y) * 0.07)) }))
        const B = sum(ms.map(x => x.budget))
        const R = sum(ms.map(x => x.revenue))
        const S = sum(ms.map(x => x.spend))

        return (
          <>
            <div className="mb-6 flex flex-wrap gap-3">
              <select className="inp" value={per} onChange={e => setPer(e.target.value)} aria-label="Bulan">
                <option value="all">Semua bulan</option>
                <option value="s1">Jan–Jun</option>
                <option value="s2">Jul–Des</option>
              </select>
              <select className="inp" value={cat} onChange={e => setCat(e.target.value)} aria-label="Kategori">
                <option value="all">Semua kategori</option>
                <option value="revenue">Penerimaan</option>
                <option value="spend">Belanja</option>
              </select>
              <select className="inp" value={min} onChange={e => setMin(e.target.value)} aria-label="Kementerian/Lembaga">
                <option value="all">Semua K/L</option>
                {d.ministries.map(x => (
                  <option key={x.name}>{x.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Total APBN (pagu)" value={fmt(B)} />
              <Stat label="Total Penerimaan" value={fmt(R)} />
              <Stat label="Total Belanja" value={fmt(S)} />
              <Stat label="Persentase Realisasi" value={B > 0 ? (S / B * 100).toFixed(1) + '%' : '0.0%'} hot />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {cat !== 'spend' && (
                <ChartBox title="Penerimaan negara per bulan">
                  <AreaChart data={ms}>
                    <CartesianGrid stroke="#ffffff14" />
                    <XAxis dataKey="m" stroke={T} />
                    <YAxis stroke={T} />
                    <Tooltip {...tip} />
                    <Area dataKey="revenue" name="Penerimaan" stroke="#1558C9" fill="#1558C9" fillOpacity={0.35} />
                  </AreaChart>
                </ChartBox>
              )}
              {cat !== 'revenue' && (
                <ChartBox title="Pengeluaran negara per bulan">
                  <BarChart data={ms}>
                    <CartesianGrid stroke="#ffffff14" />
                    <XAxis dataKey="m" stroke={T} />
                    <YAxis stroke={T} />
                    <Tooltip {...tip} />
                    <Bar dataKey="spend" name="Belanja" fill="#1558C9" />
                  </BarChart>
                </ChartBox>
              )}
              <ChartBox title="Anggaran vs realisasi">
                <ComposedChart data={ms}>
                  <CartesianGrid stroke="#ffffff14" />
                  <XAxis dataKey="m" stroke={T} />
                  <YAxis stroke={T} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="budget" name="Anggaran" fill="#1558C9" />
                  <Line dataKey="spend" name="Realisasi" stroke="#D4FF24" strokeWidth={2} />
                </ComposedChart>
              </ChartBox>
              <ChartBox title="Tren keuangan tahunan">
                <LineChart data={yr}>
                  <CartesianGrid stroke="#ffffff14" />
                  <XAxis dataKey="y" stroke={T} />
                  <YAxis stroke={T} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Line dataKey="revenue" name="Penerimaan" stroke="#1558C9" strokeWidth={2} />
                  <Line dataKey="spend" name="Realisasi" stroke="#D4FF24" strokeWidth={2} />
                </LineChart>
              </ChartBox>
            </div>
            <h2 className="mb-3 mt-8 font-bold">Kementerian/Lembaga</h2>
            <Table
              head={['K/L', 'Anggaran', 'Realisasi', '%']}
              rows={mi.map(x => [x.name, fmt(x.budget), fmt(x.real), x.budget > 0 ? (x.real / x.budget * 100).toFixed(1) + '%' : '0.0%'])}
            />
          </>
        )
      }}</Async>
    </>
  )
}
