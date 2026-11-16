export type VStatus = 'Verified' | 'Pending Review' | 'Not Verified'
export interface BudgetRow { group: string; name: string; target: number; real: number }
export interface Project { id: string; name: string; agency: string; region: string; category: string; budget: number; spent: number; progress: number; status: 'Berjalan'|'Selesai'|'Tertunda'|'Perencanaan'; period: string; source: string }
export interface BlockRec {
  id: string
  tx: string
  hash: string
  prev_hash?: string
  chain_hash?: string
  digital_signature?: string
  signature_valid?: boolean
  record_type?: string
  reference_id?: string
  reference_name?: string
  db_hash_match?: boolean
  ts: string
  status: VStatus
  source: string
  history: string[]
}

export interface ChainVerifyStatus {
  chain_intact: boolean
  total_blocks: number
  algorithm: string
  genesis_hash: string
  latest_head_hash: string
}
export interface Anomaly { id: string; title: string; desc: string; data: string; priority: 'Tinggi'|'Sedang'|'Rendah'; period: string; rec: string }
export interface ChatReply { answer: string; sources: string[] }

export interface SubmissionItem {
  id: string
  record_type: 'budget' | 'project'
  category: string
  name: string
  target: number
  real: number
  validation_status: 'draft' | 'approved' | 'rejected' | 'published'
  integrity_hash: string
  blockchain_tx_id: string
  source: string
  updated_at: string
}

export interface AuditLogItem {
  id: string
  table_name: string
  record_id: string
  action: string
  actor_name: string
  reason: string
  changed_at: string
  hash_proof: string
}

export interface UserItem {
  id: string
  username: string
  email: string
  full_name: string
  role: string
  agency: string
}
