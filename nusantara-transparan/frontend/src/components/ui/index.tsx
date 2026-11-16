import { ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import { X } from 'lucide-react'

export const T = '#8b93a7'
export const tip = { contentStyle: { background: '#030407', border: '1px solid #1558C9', borderRadius: 8, fontSize: 12 } }
export const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID') + ' T'

export function Head({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <span className="rounded border border-lime/50 px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-lime">
          POSTGRESQL LIVE
        </span>
      </div>
      {sub && <p className="mt-1 text-sm text-white/60">{sub}</p>}
    </div>
  )
}

export function Stat({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${hot ? 'text-lime' : ''}`}>{value}</p>
    </div>
  )
}

export function ChartBox({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function Async<T>({ s, children }: { s: { d?: T; e: string; retry: () => void }; children: (d: T) => ReactNode }) {
  if (s.e)
    return (
      <div className="card text-sm">
        Gagal memuat data: {s.e}{' '}
        <button className="btn-s ml-3" onClick={s.retry}>
          Coba lagi
        </button>
      </div>
    )
  if (!s.d)
    return (
      <div className="card animate-pulse text-sm text-white/60" role="status">
        Memuat data…
      </div>
    )
  return <>{children(s.d)}</>
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div role="dialog" aria-modal className="card w-full max-w-lg bg-ink" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold">{title}</h3>
          <button aria-label="Tutup" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Table({ head, rows, empty = 'Tidak ada data yang cocok.' }: { head: string[]; rows: ReactNode[][]; empty?: string }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr>
            {head.map(h => (
              <th key={h} className="th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i} className="hover:bg-white/[0.03]">
                {r.map((c, j) => (
                  <td key={j} className="td">
                    {c}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="td text-white/60" colSpan={head.length}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export const Pill = ({ ok, warn, children }: { ok?: boolean; warn?: boolean; children: ReactNode }) => (
  <span
    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
      ok ? 'border-lime/60 text-lime' : warn ? 'border-white/40 text-white' : 'border-blue text-white/80'
    }`}
  >
    {children}
  </span>
)
