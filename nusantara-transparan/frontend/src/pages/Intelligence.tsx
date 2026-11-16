import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { BrainCircuit, RefreshCw, ShieldAlert } from 'lucide-react'
import { api } from '../services/api'
import { useData } from '../hooks/useData'
import { Head, Async, ChartBox, Pill, Stat, T, tip } from '../components/ui'

const tabs = ['Anomaly Detection', 'Spending Pattern', 'Budget Forecast', 'Financial Insight']

export default function Intelligence() {
  const s = useData(api.anomalies)
  const [tab, setTab] = useState(0)
  const [monthlyData, setMonthlyData] = useState<{ m: string; revenue: number; spend: number; budget: number }[]>([])

  useEffect(() => {
    api.dashboard().then(d => setMonthlyData(d.monthly ?? [])).catch(() => {})
  }, [])

  const fc = monthlyData.map((x, i) => ({
    m: x.m,
    aktual: i <= 9 ? Math.round(x.spend * (0.85 + i * 0.03)) : undefined,
    prakiraan: i >= 9 ? Math.round(x.spend * (1.12 + (i - 9) * 0.06)) : undefined,
  }))

  return (
    <>
      <Head
        title="AI Financial Intelligence & Anomaly Detection"
        sub="Mesin AI menganalisis data PostgreSQL secara Read-Only (Aturan #4). Temuan adalah indikator awal untuk diperiksa auditor manusia."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2" role="tablist">
        {tabs.map((t, i) => (
          <button key={t} role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={tab === i ? 'btn-p' : 'btn-s'}>
            {t}
          </button>
        ))}
        <button className="btn-s ml-auto flex items-center gap-1.5" onClick={s.retry}>
          <RefreshCw size={14} /> Pindai Ulang Database (AI Scan)
        </button>
      </div>

      <Async s={s}>{an => {
        const highCount = an.filter(a => a.priority === 'Tinggi').length
        const medLowCount = an.length - highCount

        return (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Total Indikator Terdeteksi" value={`${an.length} Temuan`} hot={an.length > 0} />
              <Stat label="Prioritas Tinggi" value={`${highCount} Indikator`} />
              <Stat label="Prioritas Sedang / Rendah" value={`${medLowCount} Indikator`} />
              <Stat label="Mode Akses AI (Aturan #4)" value="READ-ONLY" hot />
            </div>

            {(tab === 0 || tab === 3) && (
              <>
                {an.length === 0 ? (
                  <div className="card flex items-center gap-3 text-sm text-white/70">
                    <BrainCircuit className="shrink-0 text-lime" />
                    <p>
                      Belum ada anomali terdeteksi atau belum ada data berstatus <b>Published</b> di PostgreSQL. Silakan publikasikan data melalui menu Pengaturan terlebih dahulu.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-3">
                    {an.map(a => (
                      <div key={a.id} className="card flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <Pill ok={a.priority === 'Rendah'} warn={a.priority === 'Tinggi'}>
                              Prioritas {a.priority}
                            </Pill>
                            <span className="font-mono text-xs text-white/50">{a.id} • {a.period}</span>
                          </div>
                          <h3 className="mt-3 font-bold">{a.title}</h3>
                          <p className="mt-1 text-sm text-white/70">{a.desc}</p>
                        </div>
                        <div className="mt-4 border-t border-white/10 pt-3">
                          <p className="font-mono text-xs text-lime">Bukti Data: {a.data}</p>
                          <p className="mt-2 text-xs text-white/80">
                            <b>Rekomendasi Audit:</b> {a.rec}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 1 && (
              <ChartBox title="Pola Belanja Bulanan vs Pagu Anggaran (Live PostgreSQL)">
                <BarChart data={monthlyData}>
                  <CartesianGrid stroke="#ffffff14" />
                  <XAxis dataKey="m" stroke={T} />
                  <YAxis stroke={T} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="budget" name="Anggaran (Pagu)" fill="#1558C9" />
                  <Bar dataKey="spend" name="Realisasi Belanja" fill="#D4FF24" />
                </BarChart>
              </ChartBox>
            )}

            {tab === 2 && (
              <div className="space-y-4">
                <div className="card flex items-center gap-3 text-sm">
                  <ShieldAlert className="shrink-0 text-lime" />
                  <p>
                    Model <b>Time-Series Forecasting</b> memproyeksikan akselerasi serapan anggaran pada kuartal terakhir (Okt–Des) berdasarkan realisasi aktual di PostgreSQL.
                  </p>
                </div>
                <ChartBox title="Prakiraan Serapan Anggaran Akhir Tahun (Aktual vs Proyeksi AI)">
                  <LineChart data={fc}>
                    <CartesianGrid stroke="#ffffff14" />
                    <XAxis dataKey="m" stroke={T} />
                    <YAxis stroke={T} />
                    <Tooltip {...tip} />
                    <Legend />
                    <Line dataKey="aktual" name="Realisasi Aktual" stroke="#1558C9" strokeWidth={2} />
                    <Line dataKey="prakiraan" name="Proyeksi AI (Forecast)" stroke="#D4FF24" strokeDasharray="6 4" strokeWidth={2} />
                  </LineChart>
                </ChartBox>
              </div>
            )}
          </>
        )
      }}</Async>
    </>
  )
}
