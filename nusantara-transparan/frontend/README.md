# Nusantara Transparan (frontend)
Vite + React + TypeScript + Tailwind + Recharts + Lucide. Semua angka adalah **DEMO**, bukan data resmi.

## Menjalankan
    npm install
    npm run dev      # http://localhost:5173
    npm run build

## Struktur
- `src/components/fingerprint/Fingerprint.tsx` — sidik jari SVG animasi (pulse, scan, titik, glow; menghormati reduced-motion)
- `src/components/layout/Shell.tsx` — sidebar, top bar, navigasi mobile
- `src/components/ui/` — Card/Table/Modal/Async/ChartBox (loading, error, empty)
- `src/pages/` — Home, Dashboard, Budget (penerimaan & pengeluaran), Projects, Blockchain, Intelligence, Assistant, Admin
- `src/data/mock.ts` — mock data berlabel DEMO
- `src/services/api.ts` — layer service; set `VITE_USE_API=true` (lihat `.env.example`) untuk beralih ke backend Go
  (`/dashboard /revenue /expenditure /projects /blockchain/records /ai/anomalies /ai/chat`; belum dianggap tersedia)
- Router: HashRouter. `/app/admin` tidak ada di navigasi publik dan memakai gerbang peran simulasi (autentikasi sungguhan harus di backend).
