import type { BudgetRow, Project, BlockRec, Anomaly, ChatReply } from '../types'
// SEMUA DATA DI FILE INI ADALAH DEMO (Rp triliun) — bukan data resmi pemerintah.
export const LAST_UPDATED = '12 Nov 2026 (DEMO)'
const M = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
export const monthly = M.map((m, i) => ({ m, revenue: 150 + i * 9 + (i % 3) * 11, spend: 160 + i * 8 + (i % 4) * 9, budget: 190 + i * 7 }))
export const ministries = [
  { name: 'Pendidikan', budget: 720, real: 510 }, { name: 'Pertahanan', budget: 330, real: 262 },
  { name: 'Kesehatan', budget: 210, real: 148 }, { name: 'PUPR', budget: 140, real: 96 }, { name: 'Sosial', budget: 90, real: 71 }]
export const revenue: BudgetRow[] = [
  { group: 'Penerimaan', name: 'Pajak', target: 2000, real: 1480 }, { group: 'Penerimaan', name: 'Bea dan Cukai', target: 300, real: 231 },
  { group: 'Penerimaan', name: 'PNBP', target: 480, real: 402 }, { group: 'Penerimaan', name: 'Hibah', target: 5, real: 3 }]
export const expenditure: BudgetRow[] = [
  { group: 'Jenis Belanja', name: 'Belanja Pemerintah Pusat', target: 3100, real: 2210 }, { group: 'Jenis Belanja', name: 'Belanja Kementerian/Lembaga', target: 1250, real: 905 },
  { group: 'Jenis Belanja', name: 'Transfer ke Daerah', target: 880, real: 702 }, { group: 'Fungsi', name: 'Pendidikan', target: 720, real: 510 },
  { group: 'Fungsi', name: 'Kesehatan', target: 210, real: 148 }, { group: 'Fungsi', name: 'Perlindungan Sosial', target: 90, real: 71 }]
const A = ['Kemen PUPR','Kemenkes','Kemendikdasmen','Kemenhub','Kemensos']
const R = ['Jawa Barat','Sumatera Utara','Kalimantan Timur','Sulawesi Selatan','NTT','Papua']
const C = ['Infrastruktur','Kesehatan','Pendidikan','Transportasi']
const S: Project['status'][] = ['Berjalan','Selesai','Tertunda','Perencanaan']
export const projects: Project[] = Array.from({ length: 14 }, (_, i) => {
  const budget = 20 + i * 13, st = S[i % 4]
  return { id: `PRJ-${100 + i}`, name: `Proyek Demo ${C[i % 4]} ${R[i % 6]}`, agency: A[i % 5], region: R[i % 6], category: C[i % 4], budget,
    spent: st === 'Perencanaan' ? 0 : Math.round(budget * (st === 'Selesai' ? 0.97 : 0.3 + (i % 5) * 0.1)),
    progress: st === 'Selesai' ? 100 : st === 'Perencanaan' ? 0 : 25 + (i * 11) % 60, status: st, period: `2026 – ${2027 + (i % 2)}`,
    source: st === 'Perencanaan' ? 'Rencana pengadaan (DEMO) — bukan realisasi' : 'Laporan realisasi (DEMO)' }
})
const H = (n: number) => Array.from({ length: 6 }, (_, k) => ((n * 2654435761 + k * 40503) >>> 0).toString(16).padStart(8, '0')).join('')
const VS: BlockRec['status'][] = ['Verified','Verified','Pending Review','Verified','Not Verified','Verified']
export const records: BlockRec[] = VS.map((status, i) => ({ id: `REC-${2000 + i}`, tx: `TX-${(9000 + i * 37).toString(16).toUpperCase()}`, hash: '0x' + H(i + 1),
  ts: `2026-11-0${i + 1} 09:${10 + i * 7}:00`, status, source: 'Dataset DEMO — ' + A[i % 5],
  history: ['Dibuat oleh Data Manager', status === 'Verified' ? 'Ditinjau Auditor — hash cocok' : 'Menunggu tinjauan Auditor'] }))
export const anomalies: Anomaly[] = [
  { id: 'AN-1', title: 'Realisasi anggaran meningkat dibanding periode sebelumnya', desc: 'Realisasi belanja bulan ini 18% lebih tinggi dari periode sebelumnya.', data: 'Okt: Rp 237 T vs Sep: Rp 201 T (DEMO)', priority: 'Sedang', period: 'Okt 2026', rec: 'Periksa apakah pembayaran menumpuk di akhir periode.' },
  { id: 'AN-2', title: 'Pola pengeluaran tidak biasa pada kategori Infrastruktur', desc: 'Anomali terdeteksi — memerlukan pemeriksaan lebih lanjut.', data: '3 transaksi bernilai mirip dalam 2 hari (DEMO)', priority: 'Tinggi', period: 'Sep–Okt 2026', rec: 'Cocokkan dengan dokumen kontrak dan berita acara.' },
  { id: 'AN-3', title: 'Selisih signifikan antara anggaran dan realisasi', desc: 'Realisasi Kesehatan baru 70% dari pagu pada kuartal ketiga.', data: 'Pagu 210 T, realisasi 148 T (DEMO)', priority: 'Rendah', period: 'Q3 2026', rec: 'Tanyakan hambatan serapan ke instansi terkait.' }]
export function chatReply(q: string): ChatReply {
  const s = q.toLowerCase(), src = ['Data DEMO Nusantara Transparan — bukan data resmi']
  if (s.includes('apbn')) return { answer: 'APBN adalah rencana keuangan tahunan pemerintah yang memuat penerimaan, belanja, dan pembiayaan, ditetapkan bersama DPR. (Penjelasan umum, tanpa angka.)', sources: [] }
  if (s.includes('pendidikan')) return { answer: '[DEMO] Realisasi anggaran pendidikan Rp 510 T dari pagu Rp 720 T (70,8%).', sources: src }
  if (s.includes('pajak')) return { answer: '[DEMO] Realisasi pajak Rp 1.480 T dari target Rp 2.000 T (74%).', sources: src }
  if (s.includes('belanja')) return { answer: '[DEMO] Total realisasi belanja Rp 3.817 T dari pagu Rp 5.230 T.', sources: src }
  if (s.includes('kementerian')) return { answer: '[DEMO] Realisasi tertinggi: Pendidikan (Rp 510 T), lalu Pertahanan (Rp 262 T).', sources: src }
  return { answer: 'Saya belum punya data untuk pertanyaan itu dan tidak akan mengarang angka. Coba salah satu pertanyaan yang disarankan.', sources: [] }
}
