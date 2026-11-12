import { useState, useRef, useEffect, FormEvent } from 'react'
import { Send } from 'lucide-react'
import { api } from '../services/api'
import { Head } from '../components/ui'
interface Msg { role: 'user' | 'ai'; text: string; sources?: string[] }
const sugg = ['Berapa total belanja negara tahun ini?', 'Berapa realisasi anggaran pendidikan?', 'Bagaimana perkembangan penerimaan pajak?', 'Kementerian mana yang memiliki realisasi anggaran tertinggi?', 'Apa arti APBN dan bagaimana cara kerjanya?']
export default function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([]), [v, setV] = useState(''), [busy, setBusy] = useState(false), end = useRef<HTMLDivElement>(null)
  useEffect(() => end.current?.scrollIntoView({ block: 'nearest' }), [msgs, busy])
  async function ask(q: string) {
    if (!q.trim() || busy) return
    setMsgs(m => [...m, { role: 'user', text: q }]); setV(''); setBusy(true)
    try { const r = await api.chat(q); setMsgs(m => [...m, { role: 'ai', text: r.answer, sources: r.sources }]) }
    catch (e) { setMsgs(m => [...m, { role: 'ai', text: 'Terjadi kesalahan saat menghubungi layanan. Coba lagi.' }]) }
    setBusy(false)
  }
  const submit = (e: FormEvent) => { e.preventDefault(); ask(v) }
  return (
    <>
      <Head title="Tanyakan tentang Keuangan Negara." sub="Jawaban demo memakai data DEMO dan tidak mengarang angka." />
      <div className="card flex h-[60vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto" aria-live="polite">
          {!msgs.length && <div><p className="mb-3 text-sm text-white/60">Pertanyaan yang disarankan:</p><div className="flex flex-wrap gap-2">{sugg.map(q => <button key={q} className="btn-s text-left" onClick={() => ask(q)}>{q}</button>)}</div></div>}
          {msgs.map((m, i) => <div key={i} className={`max-w-[85%] rounded-xl p-3 text-sm ${m.role === 'user' ? 'ml-auto bg-blue' : 'border border-white/10 bg-white/5'}`}>{m.text}
            {m.role === 'ai' && m.sources?.length ? <p className="mt-2 text-xs text-lime">Sumber: {m.sources.join('; ')}</p> : null}</div>)}
          {busy && <p className="text-sm text-white/50" role="status">Menyusun jawaban…</p>}<div ref={end} />
        </div>
        <form onSubmit={submit} className="mt-3 flex gap-2"><input className="inp flex-1" value={v} onChange={e => setV(e.target.value)} placeholder="Tulis pertanyaan…" aria-label="Pertanyaan" /><button className="btn-p" aria-label="Kirim" disabled={busy}><Send size={16} /></button></form>
      </div>
    </>
  )
}
