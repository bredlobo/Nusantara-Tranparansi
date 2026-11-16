import { useState, useEffect, FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageSquarePlus, Send, Star } from 'lucide-react'
import { api } from '../services/api'
import { useData } from '../hooks/useData'
import { Head, Async, Table, Modal, Pill, fmt } from '../components/ui'
import type { Project } from '../types'

const PER = 5

export default function Projects() {
  const s = useData(api.projects)
  const [sp, setSp] = useSearchParams()
  const [cat, setCat] = useState('')
  const [reg, setReg] = useState('')
  const [st, setSt] = useState('')
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState<Project>()

  // State Tahap 6: Umpan Balik Publik (Pilot APBN Nasional)
  const [fbName, setFbName] = useState('')
  const [fbCat, setFbCat] = useState('Pemantauan Proyek Lapangan')
  const [fbTarget, setFbTarget] = useState('')
  const [fbRating, setFbRating] = useState(5)
  const [fbMsg, setFbMsg] = useState('')
  const [fbStatus, setFbStatus] = useState('')
  const [feedbacks, setFeedbacks] = useState<any[]>([])

  function loadFeedbacks() {
    api.pilotEvaluation().then(res => setFeedbacks(res.feedbacks ?? [])).catch(() => {})
  }

  useEffect(() => {
    loadFeedbacks()
  }, [])

  async function onFeedbackSubmit(e: FormEvent) {
    e.preventDefault()
    if (!fbMsg.trim()) return
    try {
      await api.submitFeedback({
        citizen_name: fbName,
        category: fbCat,
        target_item: fbTarget || 'APBN & Proyek Nasional',
        rating: fbRating,
        message: fbMsg,
      })
      setFbStatus('✅ Terima kasih! Masukan Anda telah disimpan di PostgreSQL (Nama disamarkan sesuai UU PDP No. 27/2022).')
      setFbName('')
      setFbTarget('')
      setFbMsg('')
      loadFeedbacks()
    } catch {
      setFbStatus('❌ Gagal mengirim umpan balik.')
    }
  }

  const q = sp.get('q') ?? ''

  return (
    <>
      <Head
        title="Monitoring Proyek & Partisipasi Publik (Pilot APBN Nasional)"
        sub="Pantau progres fisik, serapan anggaran proyek strategis, dan kirimkan umpan balik pengawasan masyarakat."
      />
      <Async s={s}>{all => {
        const opt = (k: keyof Project) => [...new Set(all.map(p => String(p[k])))]
        const list = all.filter(
          p =>
            (!q || (p.name + p.agency + p.region).toLowerCase().includes(q.toLowerCase())) &&
            (!cat || p.category === cat) &&
            (!reg || p.region === reg) &&
            (!st || p.status === st),
        )
        const pages = Math.max(1, Math.ceil(list.length / PER))
        const cur = Math.min(page, pages)
        const sel2 = (v: string, set: (x: string) => void, label: string, o: string[]) => (
          <select
            className="inp"
            value={v}
            onChange={e => {
              set(e.target.value)
              setPage(1)
            }}
            aria-label={label}
          >
            <option value="">{label}</option>
            {o.map(x => (
              <option key={x}>{x}</option>
            ))}
          </select>
        )

        return (
          <>
            <div className="mb-4 flex flex-wrap gap-3">
              <input
                className="inp flex-1 min-w-[180px]"
                placeholder="Cari nama proyek, instansi, atau wilayah…"
                aria-label="Cari proyek"
                value={q}
                onChange={e => {
                  setSp(e.target.value ? { q: e.target.value } : {})
                  setPage(1)
                }}
              />
              {sel2(cat, setCat, 'Semua Kategori', opt('category'))}
              {sel2(reg, setReg, 'Semua Wilayah', opt('region'))}
              {sel2(st, setSt, 'Semua Status', opt('status'))}
            </div>

            <Table
              head={['Proyek', 'Instansi', 'Wilayah', 'Pagu Anggaran', 'Terpakai', 'Progres', 'Status', '']}
              empty="Belum ada proyek berstatus Published yang cocok dengan filter."
              rows={list.slice((cur - 1) * PER, cur * PER).map(p => [
                p.name,
                p.agency,
                p.region,
                fmt(p.budget),
                fmt(p.spent),
                p.progress + '%',
                <Pill ok={p.status === 'Selesai'} warn={p.status === 'Tertunda'}>
                  {p.status}
                </Pill>,
                <button className="btn-s py-1.5" onClick={() => setSel(p)}>
                  Detail
                </button>,
              ])}
            />

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-white/60">{list.length} proyek ditemukan</span>
              <div className="flex items-center gap-2">
                <button className="btn-s" disabled={cur === 1} onClick={() => setPage(cur - 1)}>
                  Sebelumnya
                </button>
                <span>
                  {cur}/{pages}
                </span>
                <button className="btn-s" disabled={cur === pages} onClick={() => setPage(cur + 1)}>
                  Berikutnya
                </button>
              </div>
            </div>

            {sel && (
              <Modal title={sel.name} onClose={() => setSel(undefined)}>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {(
                    [
                      ['ID Proyek', sel.id],
                      ['Instansi Pelaksana', sel.agency],
                      ['Lokasi Wilayah', sel.region],
                      ['Periode Tahun', sel.period],
                      ['Pagu Anggaran', fmt(sel.budget)],
                      ['Realisasi Terpakai', fmt(sel.spent)],
                      ['Progres Fisik', sel.progress + '%'],
                      ['Status Proyek', sel.status],
                    ] as string[][]
                  ).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-white/50">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 h-2 rounded bg-white/10">
                  <div className="h-2 rounded bg-lime" style={{ width: sel.progress + '%' }} />
                </div>
                <p className="mt-4 text-xs text-white/60">Sumber data: {sel.source}</p>
              </Modal>
            )}
          </>
        )
      }}</Async>

      {/* TAHAP 6: FORMULIR UMPAN BALIK & PENGAWASAN MASYARAKAT */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <form onSubmit={onFeedbackSubmit} className="card space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <MessageSquarePlus className="text-lime" size={20} /> Kirim Umpan Balik / Laporan Masyarakat (Pilot APBN)
          </h3>
          <p className="text-xs text-white/60">
            Identitas pelapor otomatis disamarkan menggunakan fitur <b>MaskPII</b> sesuai kepatuhan <b>UU PDP No. 27/2022</b>.
          </p>
          {fbStatus && <p className="rounded border border-lime/40 bg-lime/10 p-2 text-xs text-lime">{fbStatus}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-white/60">Nama Anda (Otomatis Disamarkan)</label>
              <input className="inp mt-1 w-full" value={fbName} onChange={e => setFbName(e.target.value)} placeholder="Contoh: Budi Santoso" />
            </div>
            <div>
              <label className="text-xs text-white/60">Kategori Masukan</label>
              <select className="inp mt-1 w-full" value={fbCat} onChange={e => setFbCat(e.target.value)}>
                <option>Pemantauan Proyek Lapangan</option>
                <option>Evaluasi Transparansi Data APBN</option>
                <option>Laporan Kendala / Keterlambatan</option>
                <option>Apresiasi Keterbukaan Publik</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-white/60">Proyek / Pos Anggaran Terkait</label>
              <input className="inp mt-1 w-full" value={fbTarget} onChange={e => setFbTarget(e.target.value)} placeholder="Contoh: Bendungan Jawa Barat / Pajak" />
            </div>
            <div>
              <label className="text-xs text-white/60">Skor Evaluasi Portal (1–5)</label>
              <select className="inp mt-1 w-full" value={fbRating} onChange={e => setFbRating(+e.target.value)}>
                {[5, 4, 3, 2, 1].map(n => (
                  <option key={n} value={n}>
                    {'★'.repeat(n)} ({n}/5)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60">Isi Umpan Balik / Temuan Lapangan</label>
            <textarea
              className="inp mt-1 w-full"
              rows={3}
              required
              value={fbMsg}
              onChange={e => setFbMsg(e.target.value)}
              placeholder="Tuliskan hasil pengamatan atau masukan Anda terhadap transparansi anggaran/proyek…"
            />
          </div>
          <button type="submit" className="btn-p w-full justify-center">
            <Send size={16} /> Kirim Umpan Balik ke PostgreSQL
          </button>
        </form>

        <div className="card space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Star className="text-lime" size={20} /> Suara & Evaluasi Masyarakat Terbaru
          </h3>
          {feedbacks.length === 0 ? (
            <p className="text-sm text-white/50">Belum ada umpan balik masyarakat yang masuk.</p>
          ) : (
            <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
              {feedbacks.map((f: any) => (
                <div key={f.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lime">{f.citizen_name}</span>
                    <span className="text-white/50">{'★'.repeat(f.rating || 5)}</span>
                  </div>
                  <p className="mt-1 font-semibold text-white/90">
                    [{f.category}] — {f.target_item}
                  </p>
                  <p className="mt-1 text-white/70">{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
