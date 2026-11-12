import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { api } from '../services/api'
import { monthly } from '../data/mock'
import { useData } from '../hooks/useData'
import { Head, Async, ChartBox, Pill, T, tip } from '../components/ui'
const tabs = ['Anomaly Detection', 'Spending Pattern', 'Budget Forecast', 'Financial Insight']
export default function Intelligence() {
  const s = useData(api.anomalies), [tab, setTab] = useState(0)
  const fc = monthly.map((x, i) => ({ m: x.m, aktual: i < 10 ? x.spend : undefined, prakiraan: i >= 9 ? x.spend + (i - 9) * 6 : undefined }))
  return (
    <>
      <Head title="AI Intelligence" sub="Temuan AI adalah petunjuk untuk diperiksa manusia, bukan kesimpulan atau tuduhan." />
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">{tabs.map((t, i) => <button key={t} role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={tab === i ? 'btn-p' : 'btn-s'}>{t}</button>)}</div>
      <Async s={s}>{an => <>
        {(tab === 0 || tab === 3) && <div className="grid gap-4 lg:grid-cols-3">{an.map(a => <div key={a.id} className="card"><div className="flex items-center justify-between"><Pill ok={a.priority === 'Rendah'} warn={a.priority === 'Tinggi'}>Prioritas {a.priority}</Pill><span className="text-xs text-white/50">{a.period}</span></div>
          <h3 className="mt-3 font-bold">{a.title}</h3><p className="mt-1 text-sm text-white/70">{a.desc}</p><p className="mt-3 text-xs text-lime">Data pendukung: {a.data}</p><p className="mt-2 text-sm"><b>Pemeriksaan:</b> {a.rec}</p></div>)}</div>}
        {tab === 1 && <ChartBox title="Pola belanja bulanan vs anggaran (DEMO)"><BarChart data={monthly}><CartesianGrid stroke="#ffffff14" /><XAxis dataKey="m" stroke={T} /><YAxis stroke={T} /><Tooltip {...tip} /><Legend /><Bar dataKey="budget" name="Anggaran" fill="#1558C9" /><Bar dataKey="spend" name="Belanja" fill="#D4FF24" /></BarChart></ChartBox>}
        {tab === 2 && <ChartBox title="Prakiraan belanja Nov–Des (model sederhana, DEMO)"><LineChart data={fc}><CartesianGrid stroke="#ffffff14" /><XAxis dataKey="m" stroke={T} /><YAxis stroke={T} /><Tooltip {...tip} /><Legend /><Line dataKey="aktual" name="Aktual" stroke="#1558C9" strokeWidth={2} /><Line dataKey="prakiraan" name="Prakiraan" stroke="#D4FF24" strokeDasharray="6 4" strokeWidth={2} /></LineChart></ChartBox>}
      </>}</Async>
    </>
  )
}
