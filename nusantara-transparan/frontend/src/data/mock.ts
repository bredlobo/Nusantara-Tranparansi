import type { BudgetRow, Project, BlockRec, Anomaly, ChatReply } from '../types'

// Seluruh data diinisialisasi kosong (0) agar mengikuti isi database PostgreSQL secara murni.
export const LAST_UPDATED = 'Live Database PostgreSQL'
const M = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export const monthly = M.map(m => ({ m, revenue: 0, spend: 0, budget: 0 }))
export const ministries: { name: string; budget: number; real: number }[] = []
export const revenue: BudgetRow[] = []
export const expenditure: BudgetRow[] = []
export const projects: Project[] = []
export const records: BlockRec[] = []
export const anomalies: Anomaly[] = []

export function chatReply(_q: string): ChatReply {
  return {
    answer: 'Saat ini belum ada data di database atau server backend belum dijalankan.',
    sources: [],
  }
}
