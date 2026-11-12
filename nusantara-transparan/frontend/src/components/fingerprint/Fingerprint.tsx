import { useEffect, useState } from 'react'
const rings = Array.from({ length: 24 }, (_, i) => ({ i, rx: 8 + i * 7.6, ry: 12 + i * 9.8, cy: 250 - i * 1.1 }))
const loop = (r: typeof rings[0]) => `M${200 - r.rx},${r.cy} A${r.rx},${r.ry} 0 1 1 ${200 + r.rx},${r.cy} A${r.rx},${r.ry} 0 1 1 ${200 - r.rx},${r.cy}`
export default function Fingerprint({ className = '' }: { className?: string }) {
  const [still, setStill] = useState(false)
  useEffect(() => setStill(matchMedia('(prefers-reduced-motion: reduce)').matches), [])
  return (
    <svg viewBox="0 0 400 500" className={className} role="img" aria-label="Sidik jari digital Nusantara Transparan">
      <defs>
        <clipPath id="fpc"><ellipse cx="200" cy="250" rx="185" ry="238" /></clipPath>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#D4FF24" stopOpacity="0" /><stop offset="1" stopColor="#D4FF24" stopOpacity=".4" /></linearGradient>
      </defs>
      <g clipPath="url(#fpc)">
        <g className={still ? '' : 'fp-pulse'} filter="url(#glow)" fill="none" strokeLinecap="round">
          {rings.map(r => (
            <ellipse key={r.i} cx="200" cy={r.cy} rx={r.rx} ry={r.ry} pathLength={100}
              transform={`rotate(${(r.i % 2 ? 1 : -1) * r.i * 0.9} 200 ${r.cy})`}
              stroke={r.i % 7 === 3 ? '#D4FF24' : '#1558C9'} strokeWidth={r.i % 7 === 3 ? 1.4 : 1.2}
              strokeDasharray={`${58 + (r.i * 7) % 30} ${4 + (r.i * 5) % 7} ${14 + (r.i % 4) * 6} ${5 + (r.i % 5)}`}
              strokeDashoffset={r.i * 13} className={still ? '' : 'fp-flick'} style={{ animationDelay: `${r.i * -0.35}s`, opacity: 0.55 + (r.i % 4) * 0.12 }} />
          ))}
        </g>
        <g className={still ? '' : 'fp-scan'}><rect x="0" y="0" width="400" height="60" fill="url(#sg)" /><rect x="0" y="59" width="400" height="2" fill="#D4FF24" /></g>
        {!still && [4, 9, 14, 19].map((k, n) => (
          <circle key={k} r="3.2" fill="#D4FF24" filter="url(#glow)"><animateMotion dur={`${16 + n * 5}s`} repeatCount="indefinite" path={loop(rings[k])} /></circle>
        ))}
      </g>
    </svg>
  )
}
