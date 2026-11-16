import { useState, useEffect, FormEvent } from 'react'
import { ChevronRight, ShieldCheck, Search, CheckCircle2, AlertTriangle, Lock, Cpu } from 'lucide-react'
import { api } from '../services/api'
import { useData } from '../hooks/useData'
import { Head, Async, Table, Modal, Pill, Stat } from '../components/ui'
import type { BlockRec, ChainVerifyStatus } from '../types'

const tone = (s: string) =>
  s === 'Verified' ? 'border-lime text-lime' : s === 'Pending Review' ? 'border-white/50 text-white' : 'border-blue text-blue'

export default function Blockchain() {
  const s = useData(api.records)
  const [sel, setSel] = useState<BlockRec>()
  const [chainStatus, setChainStatus] = useState<ChainVerifyStatus | null>(null)
  const [verifyQuery, setVerifyQuery] = useState('')
  const [verifyResult, setVerifyResult] = useState<any>(null)

  useEffect(() => {
    api.verifyChain().then(setChainStatus).catch(() => {})
  }, [])

  async function onVerifySubmit(e: FormEvent) {
    e.preventDefault()
    if (!verifyQuery.trim()) return
    try {
      const res = await api.verifyRecord(verifyQuery.trim())
      setVerifyResult(res)
    } catch {
      setVerifyResult({ found: false, message: 'Gagal menghubungi node verifikasi blockchain.' })
    }
  }

  return (
    <>
      <Head
        title="Blockchain Explorer & Hash Chain Verifier"
        sub="Verifikasi keutuhan rantai hash (SHA-256) dan tanda tangan digital (ECDSA P-256) Hyperledger Fabric."
      />

      {/* 1. Ringkasan Status Keutuhan Rantai Blockchain */}
      {chainStatus && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Status Rantai Blok (Hash Chain)"
            value={chainStatus.chain_intact ? 'VALID & UTUH' : 'TERDETEKSI ANOMALI'}
            hot={chainStatus.chain_intact}
          />
          <Stat label="Total Blok Tercatat" value={`${chainStatus.total_blocks} Blok`} />
          <Stat label="Algoritma Kriptografi" value="SHA-256 + ECDSA" />
          <div className="card">
            <p className="text-xs uppercase tracking-wide text-white/60">Head Block Hash Terbaru</p>
            <p className="mt-2 truncate font-mono text-xs text-lime" title={chainStatus.latest_head_hash}>
              {chainStatus.latest_head_hash}
            </p>
          </div>
        </div>
      )}

      {/* 2. Alat Cek & Verifikasi Keaslian Hash Interaktif */}
      <div className="card mb-6 space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Lock className="text-lime" size={16} /> Alat Uji Keaslian Data & Bukti Hash (Live Cryptographic Verifier)
        </h3>
        <form onSubmit={onVerifySubmit} className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-3 text-white/50" />
            <input
              className="inp w-full pl-9 font-mono text-xs"
              placeholder="Masukkan Record ID (misal REC-...), Transaction ID (TX-...), atau Hash SHA-256 (0x...)"
              value={verifyQuery}
              onChange={e => setVerifyQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-p">
            Verifikasi Keaslian Blok
          </button>
          {verifyResult && (
            <button type="button" className="btn-s" onClick={() => setVerifyResult(null)}>
              Reset
            </button>
          )}
        </form>

        {verifyResult && (
          <div
            className={`mt-3 rounded-lg border p-4 text-sm ${
              verifyResult.found && verifyResult.db_hash_match
                ? 'border-lime/50 bg-lime/10'
                : 'border-red-500/50 bg-red-500/10'
            }`}
          >
            {verifyResult.found ? (
              <div className="space-y-1.5">
                <p className="flex items-center gap-2 font-bold text-lime">
                  <CheckCircle2 size={18} /> {verifyResult.message}
                </p>
                <p className="text-xs text-white/80">
                  <b>Record ID:</b> {verifyResult.record_id} | <b>TX ID:</b> {verifyResult.tx_id} | <b>Status:</b> {verifyResult.status}
                </p>
                <p className="break-all font-mono text-xs text-white/70">
                  <b>SHA-256 Data Hash:</b> {verifyResult.data_hash}
                </p>
                <p className="break-all font-mono text-xs text-white/70">
                  <b>ECDSA P-256 Signature:</b> {verifyResult.digital_signature}
                </p>
              </div>
            ) : (
              <p className="flex items-center gap-2 font-bold text-red-400">
                <AlertTriangle size={18} /> {verifyResult.message}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card mb-6 flex gap-3 text-sm">
        <ShieldCheck className="shrink-0 text-lime" />
        <p>
          Sesuai <b>Aturan Arsitektur #3</b>, Blockchain hanya menyimpan <b>Cryptographic Hash (SHA-256)</b>, ID transaksi, dan tanda tangan digital (bukan dokumen mentah). Kecocokan hash membuktikan data di PostgreSQL tidak mengalami perubahan ilegal sejak dicatat.
        </p>
      </div>

      {/* 3. Visualisasi Rantai Blok & Tabel Ledger */}
      <Async s={s}>{recs => (
        <>
          <div className="mb-6 flex items-center gap-1 overflow-x-auto pb-2" aria-label="Rangkaian block">
            <div className="flex items-center">
              <div className="w-40 shrink-0 rounded-lg border border-white/20 bg-white/5 p-3 text-left text-xs">
                <p className="flex items-center gap-1 font-bold text-white/80">
                  <Cpu size={13} className="text-lime" /> Genesis Block #0
                </p>
                <p className="mt-1 truncate font-mono text-white/50">0x0000000000000000…</p>
                <p className="mt-1 text-lime">Origin</p>
              </div>
              {recs.length > 0 && <ChevronRight className="shrink-0 text-blue" />}
            </div>

            {recs.map((r, i) => (
              <div key={r.id} className="flex items-center">
                <button
                  onClick={() => setSel(r)}
                  className={`w-48 shrink-0 rounded-lg border p-3 text-left text-xs ${tone(r.status)} hover:bg-white/5`}
                >
                  <p className="font-bold">Block #{i + 1} ({r.id})</p>
                  <p className="mt-0.5 truncate text-white/80">{r.reference_name || r.reference_id}</p>
                  <p className="mt-1 truncate font-mono text-white/60">{r.chain_hash || r.hash}</p>
                  <p className="mt-1">{r.status}</p>
                </button>
                {i < recs.length - 1 && <ChevronRight className="shrink-0 text-blue" />}
              </div>
            ))}
          </div>

          <Table
            head={['Record ID', 'Tx ID', 'Item Data', 'Data Hash (SHA-256)', 'Kecocokan DB', 'Status', '']}
            empty="Belum ada blok transaksi yang tercatat di Ledger Blockchain."
            rows={recs.map(r => [
              r.id,
              r.tx,
              r.reference_name || r.reference_id || '-',
              <span className="font-mono text-xs">{r.hash.slice(0, 18)}…</span>,
              r.db_hash_match !== false ? (
                <Pill ok>100% Cocok</Pill>
              ) : (
                <Pill>Tidak Cocok!</Pill>
              ),
              <Pill ok={r.status === 'Verified'} warn={r.status === 'Pending Review'}>
                {r.status}
              </Pill>,
              <button className="btn-s py-1.5" onClick={() => setSel(r)}>
                Bukti Kriptografi
              </button>,
            ])}
          />
        </>
      )}</Async>

      {/* 4. Modal Detail Bukti Kriptografi Blok */}
      {sel && (
        <Modal title={`Bukti Kriptografi Blok — ${sel.id}`} onClose={() => setSel(undefined)}>
          <dl className="space-y-2.5 text-sm">
            <div>
              <dt className="text-xs text-white/50">Entitas Data yang Dijamin</dt>
              <dd className="font-bold text-lime">
                {sel.reference_name || sel.reference_id} ({sel.record_type?.toUpperCase()})
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/50">Transaction ID (Hyperledger Fabric)</dt>
              <dd className="font-mono text-xs">{sel.tx}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/50">Data Payload Hash (SHA-256)</dt>
              <dd className="break-all font-mono text-xs text-lime">{sel.hash}</dd>
            </div>
            {sel.prev_hash && (
              <div>
                <dt className="text-xs text-white/50">Previous Block Hash (Rantai Sebelumnya)</dt>
                <dd className="break-all font-mono text-xs text-white/70">{sel.prev_hash}</dd>
              </div>
            )}
            {sel.chain_hash && (
              <div>
                <dt className="text-xs text-white/50">Chained Block Hash (SHA-256 Berantai)</dt>
                <dd className="break-all font-mono text-xs text-white">{sel.chain_hash}</dd>
              </div>
            )}
            {sel.digital_signature && (
              <div>
                <dt className="text-xs text-white/50">Digital Signature (ECDSA P-256)</dt>
                <dd className="break-all font-mono text-xs text-white/70">{sel.digital_signature}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <dt className="text-xs text-white/50">Timestamp</dt>
                <dd className="text-xs">{sel.ts}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/50">Sumber Instansi</dt>
                <dd className="text-xs">{sel.source}</dd>
              </div>
            </div>
          </dl>
          <h4 className="mb-1.5 mt-4 text-sm font-bold">Jejak Audit & Riwayat Verifikasi (Immutable History)</h4>
          <ul className="list-disc space-y-1 pl-5 text-xs text-white/80">
            {sel.history.map((h, idx) => (
              <li key={idx}>{h}</li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  )
}
