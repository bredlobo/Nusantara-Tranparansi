import { ReactNode, useEffect, useRef, useState } from 'react'
import { ResponsiveContainer } from 'recharts'
import { X, Sparkles } from 'lucide-react'

export const T = '#8b93a7'
export const tip = {
  contentStyle: {
    background: 'rgba(3, 4, 7, 0.95)',
    border: '1px solid rgba(212, 255, 36, 0.45)',
    borderRadius: 12,
    boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.85)',
    fontSize: 12,
  },
}
export const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID') + ' T'

export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  once = false,
}: {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'scale'
  className?: string
  once?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) obs.unobserve(el)
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [once])

  const dirClass =
    direction === 'left'
      ? 'reveal-left'
      : direction === 'right'
      ? 'reveal-right'
      : direction === 'scale'
      ? 'reveal-scale'
      : 'reveal-up'

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal-item ${dirClass} ${visible ? 'reveal-visible' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function Head({ title, sub }: { title: string; sub?: string }) {
  return (
    <Reveal direction="left" once>
      <div className="mb-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-lime/40 bg-lime/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-lime shadow-[0_0_15px_rgba(212,255,36,0.2)]">
            <Sparkles size={11} /> POSTGRESQL LIVE
          </span>
        </div>
        {sub && <p className="mt-1.5 text-sm text-white/65">{sub}</p>}
      </div>
    </Reveal>
  )
}

export function Stat({ label, value, hot, delay = 0 }: { label: string; value: string; hot?: boolean; delay?: number }) {
  return (
    <Reveal direction="scale" delay={delay}>
      <div className="card group h-full">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/55 transition-colors group-hover:text-white/80">
          {label}
        </p>
        <p className={`mt-2.5 text-2xl font-extrabold tracking-tight md:text-3xl ${hot ? 'text-lime drop-shadow-[0_0_12px_rgba(212,255,36,0.3)]' : 'text-white'}`}>
          {value}
        </p>
      </div>
    </Reveal>
  )
}

export function ChartBox({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Reveal direction="up">
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-wide text-white/90">{title}</h3>
          <span className="h-2 w-2 rounded-full bg-lime shadow-[0_0_8px_#D4FF24]" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </div>
    </Reveal>
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal className="card w-full max-w-lg border-lime/30 bg-ink/95" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-lime">{title}</h3>
          <button aria-label="Tutup" className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white" onClick={onClose}>
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
    <Reveal direction="up">
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
                <tr key={i} className="transition-colors hover:bg-lime/[0.04]">
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
    </Reveal>
  )
}

export const Pill = ({ ok, warn, children }: { ok?: boolean; warn?: boolean; children: ReactNode }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
      ok
        ? 'border-lime/60 bg-lime/10 text-lime shadow-[0_0_10px_rgba(212,255,36,0.15)]'
        : warn
        ? 'border-amber-400/50 bg-amber-400/10 text-amber-200'
        : 'border-blue bg-blue/15 text-white/90'
    }`}
  >
    {children}
  </span>
)
