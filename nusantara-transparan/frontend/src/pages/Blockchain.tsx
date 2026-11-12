import { useState } from 'react'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { api } from '../services/api'
import { useData } from '../hooks/useData'
import { Head, Async, Table, Modal, Pill } from '../components/ui'
import type { BlockRec } from '../types'
const tone = (s: string) => s === 'Verified' ? 'border-lime text-lime' : s === 'Pending Review' ? 'border-white/50 text-white' : 'border-blue text-blue'
export default function Blockchain() {
  const s = useData(api.records), [sel, setSel] = useState<BlockRec>()
  return (
    <>
      <Head title="Blockchain Explorer" sub="Visualisasi verifikasi integritas data." />
      <div className="card mb-6 flex gap-3 text-sm"><ShieldCheck className="shrink-0 text-lime" /><p>Kecocokan hash membuktikan bahwa <b>isi data tidak berubah</b> terhadap hash yang tercatat. Ini <b>tidak</b> membuktikan bahwa transaksi awal benar secara faktual.</p></div>
      <Async s={s}>{recs => <>
        <div className="mb-6 flex items-center gap-1 overflow-x-auto pb-2" aria-label="Rangkaian block">{recs.map((r, i) => <div key={r.id} className="flex items-center">
          <button onClick={() => setSel(r)} className={`w-40 shrink-0 rounded-lg border p-3 text-left text-xs ${tone(r.status)} hover:bg-white/5`}><p className="font-bold">Block #{i + 1}</p><p className="mt-1 truncate font-mono text-white/60">{r.hash}</p><p className="mt-1">{r.status}</p></button>
          {i < recs.length - 1 && <ChevronRight className="shrink-0 text-blue" />}</div>)}</div>
        <Table head={['Record ID', 'Transaction ID', 'Hash', 'Timestamp', 'Status', '']} rows={recs.map(r => [r.id, r.tx, <span className="font-mono text-xs">{r.hash.slice(0, 18)}…</span>, r.ts, <Pill ok={r.status === 'Verified'} warn={r.status === 'Pending Review'}>{r.status}</Pill>, <button className="btn-s py-1.5" onClick={() => setSel(r)}>Detail</button>])} />
      </>}</Async>
      {sel && <Modal title={sel.id} onClose={() => setSel(undefined)}>
        <dl className="space-y-2 text-sm"><div><dt className="text-white/50">Transaction ID</dt><dd>{sel.tx}</dd></div><div><dt className="text-white/50">Hash</dt><dd className="break-all font-mono text-xs">{sel.hash}</dd></div>
          <div><dt className="text-white/50">Timestamp</dt><dd>{sel.ts}</dd></div><div><dt className="text-white/50">Status verifikasi</dt><dd>{sel.status}</dd></div><div><dt className="text-white/50">Sumber data</dt><dd>{sel.source}</dd></div></dl>
        <h4 className="mb-1 mt-4 text-sm font-bold">Riwayat perubahan</h4><ul className="list-disc pl-5 text-sm text-white/70">{sel.history.map(h => <li key={h}>{h}</li>)}</ul></Modal>}
    </>
  )
}
