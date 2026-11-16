import { useState, useRef, useEffect, FormEvent } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { api } from '../services/api'
import { Head } from '../components/ui'

interface Msg {
  role: 'user' | 'ai'
  text: string
  sources?: string[]
}

const sugg = [
  'Berapa total belanja negara tahun ini?',
  'Bagaimana perkembangan penerimaan negara?',
  'Berapa realisasi anggaran Pendidikan?',
  'Berapa realisasi penerimaan Pajak?',
  'Bagaimana status proyek pemerintah yang dipantau?',
  'Apakah ada anomali yang terdeteksi oleh AI?',
  'Berapa blok yang tercatat di Blockchain?',
]

export default function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [v, setV] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => end.current?.scrollIntoView({ block: 'nearest' }), [msgs, busy])

  async function ask(q: string) {
    if (!q.trim() || busy) return
    setMsgs(m => [...m, { role: 'user', text: q }])
    setV('')
    setBusy(true)
    try {
      const r = await api.chat(q)
      setMsgs(m => [...m, { role: 'ai', text: r.answer, sources: r.sources }])
    } catch {
      setMsgs(m => [...m, { role: 'ai', text: 'Terjadi kesalahan saat menghubungi layanan RAG Backend. Coba lagi.' }])
    }
    setBusy(false)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(v)
  }

  return (
    <>
      <Head
        title="AI Financial Assistant (Live PostgreSQL RAG)"
        sub="Menjawab pertanyaan masyarakat secara Read-Only langsung dari data terpublikasi di PostgreSQL beserta bukti sumber & hash."
      />
      <div className="card flex h-[64vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/60">
              <Sparkles size={14} className="text-lime" /> Pertanyaan Cepat (Klik untuk Bertanya ke Database):
            </p>
            <div className="flex flex-wrap gap-2">
              {sugg.map(q => (
                <button key={q} className="btn-s text-left text-xs" onClick={() => ask(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {msgs.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-xl p-3.5 text-sm ${
                m.role === 'user' ? 'ml-auto bg-blue text-white' : 'border border-white/10 bg-white/5'
              }`}
            >
              <p className="leading-relaxed">{m.text}</p>
              {m.role === 'ai' && m.sources?.length ? (
                <p className="mt-2 border-t border-white/10 pt-1.5 font-mono text-xs text-lime">
                  Sumber Resmi: {m.sources.join(' | ')}
                </p>
              ) : null}
            </div>
          ))}
          {busy && (
            <p className="text-sm text-white/50" role="status">
              Menelusuri database PostgreSQL & menyusun jawaban…
            </p>
          )}
          <div ref={end} />
        </div>
        <form onSubmit={submit} className="mt-3 flex gap-2 border-t border-white/10 pt-3">
          <input
            className="inp flex-1"
            value={v}
            onChange={e => setV(e.target.value)}
            placeholder="Tanyakan nama anggaran, pajak, pendidikan, proyek, anomali, atau blockchain…"
            aria-label="Pertanyaan"
          />
          <button className="btn-p" aria-label="Kirim" disabled={busy}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  )
}
