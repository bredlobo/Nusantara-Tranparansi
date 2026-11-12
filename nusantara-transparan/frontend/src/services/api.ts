import * as m from '../data/mock'
import type { ChatReply } from '../types'
// Switch: VITE_USE_API=true -> Go REST backend (endpoint belum dianggap tersedia); otherwise mock data.
const USE_API = import.meta.env.VITE_USE_API === 'true'
const BASE: string = import.meta.env.VITE_API_URL ?? '/api/v1'
async function get<T>(path: string, mock: T): Promise<T> {
  if (USE_API) { const r = await fetch(BASE + path); if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json() }
  await new Promise(r => setTimeout(r, 350)); return mock
}
export const api = {
  dashboard: () => get('/dashboard', { monthly: m.monthly, ministries: m.ministries }),
  revenue: () => get('/revenue', m.revenue), expenditure: () => get('/expenditure', m.expenditure),
  projects: () => get('/projects', m.projects), records: () => get('/blockchain/records', m.records), anomalies: () => get('/ai/anomalies', m.anomalies),
  async chat(question: string): Promise<ChatReply> {
    if (USE_API) { const r = await fetch(BASE + '/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) }); if (!r.ok) throw new Error('chat ' + r.status); return r.json() }
    await new Promise(r => setTimeout(r, 700)); return m.chatReply(question)
  },
}
