export type VStatus = 'Verified' | 'Pending Review' | 'Not Verified'
export interface BudgetRow { group: string; name: string; target: number; real: number }
export interface Project { id: string; name: string; agency: string; region: string; category: string; budget: number; spent: number; progress: number; status: 'Berjalan'|'Selesai'|'Tertunda'|'Perencanaan'; period: string; source: string }
export interface BlockRec { id: string; tx: string; hash: string; ts: string; status: VStatus; source: string; history: string[] }
export interface Anomaly { id: string; title: string; desc: string; data: string; priority: 'Tinggi'|'Sedang'|'Rendah'; period: string; rec: string }
export interface ChatReply { answer: string; sources: string[] }
