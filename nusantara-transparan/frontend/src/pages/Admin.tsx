import { useState, ChangeEvent } from 'react'
import { UploadCloud, ShieldAlert } from 'lucide-react'
import { Head, Table, Pill } from '../components/ui'
type Role = 'Administrator' | 'Data Manager' | 'Auditor / Reviewer'
const users = [['Dewi A.', 'Administrator'], ['Raka P.', 'Data Manager'], ['Sinta M.', 'Auditor / Reviewer']]
const log = [['2026-11-10 09:12', 'Raka P.', 'Unggah dataset penerimaan_q3.csv'], ['2026-11-10 10:40', 'Sinta M.', 'Meninjau REC-2002'], ['2026-11-11 08:05', 'Dewi A.', 'Mengubah peran pengguna']]
export default function Admin() {
  const [role, setRole] = useState<Role | ''>(''), [tab, setTab] = useState('Dataset'), [rows, setRows] = useState<string[][]>([]), [msg, setMsg] = useState(''), [file, setFile] = useState('')
  if (!role) return <><Head title="Area Administrasi" /><div className="card max-w-md"><ShieldAlert className="text-lime" /><p className="my-3 text-sm text-white/70">Area terbatas. Ini simulasi login frontend; autentikasi sesungguhnya harus dilakukan di backend.</p>
    <div className="flex flex-col gap-2">{(['Administrator', 'Data Manager', 'Auditor / Reviewer'] as Role[]).map(r => <button key={r} className="btn-s" onClick={() => { setRole(r); setTab(r === 'Auditor / Reviewer' ? 'Audit Log' : 'Dataset') }}>Masuk sebagai {r}</button>)}</div></div></>
  const allowed = role === 'Administrator' ? ['Dataset', 'Pengguna', 'Audit Log'] : role === 'Data Manager' ? ['Dataset', 'Audit Log'] : ['Audit Log']
  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return; setFile(f.name); setRows([]); setMsg('')
    const ext = f.name.split('.').pop()?.toLowerCase()
    try {
      if (ext === 'csv') { const l = (await f.text()).trim().split(/\r?\n/).map(x => x.split(',')); const w = l[0].length; setRows(l.slice(0, 6)); setMsg(l.every(r => r.length === w) ? `Valid: ${l.length - 1} baris, ${w} kolom.` : 'Tidak valid: jumlah kolom tidak konsisten.') }
      else if (ext === 'json') { const j = JSON.parse(await f.text()); const a = Array.isArray(j) ? j : [j]; const k = Object.keys(a[0] ?? {}); setRows([k, ...a.slice(0, 5).map(o => k.map(x => String(o[x] ?? '')))]); setMsg(`Valid: ${a.length} rekaman.`) }
      else if (ext === 'xlsx' || ext === 'xls') setMsg('File Excel diterima (' + (f.size / 1024).toFixed(1) + ' KB). Pratinjau isi belum tersedia di prototipe ini.')
      else setMsg('Format tidak didukung. Gunakan CSV, Excel, atau JSON.')
    } catch { setMsg('Tidak valid: file tidak dapat dibaca.') }
  }
  return <>
    <Head title="Admin Dashboard" sub={`Peran aktif: ${role}`} />
    <div className="mb-6 flex flex-wrap gap-2">{allowed.map(t => <button key={t} className={tab === t ? 'btn-p' : 'btn-s'} onClick={() => setTab(t)}>{t}</button>)}<button className="btn-s ml-auto" onClick={() => setRole('')}>Keluar</button></div>
    {tab === 'Dataset' && <div className="space-y-4"><label className="card flex cursor-pointer flex-col items-center gap-2 border-dashed py-10 text-sm"><UploadCloud className="text-lime" />Pilih file CSV, Excel, atau JSON<input type="file" accept=".csv,.json,.xlsx,.xls" className="sr-only" onChange={onFile} /></label>
      {msg && <p className="text-sm" role="status">{file}: {msg}</p>}{rows.length > 0 && <Table head={rows[0]} rows={rows.slice(1)} />}
      <div className="flex items-center gap-3 text-sm">Status publikasi: <Pill warn>Draf</Pill><button className="btn-p" disabled={!msg.startsWith('Valid')} onClick={() => setMsg('Dikirim untuk tinjauan Auditor (simulasi).')}>Ajukan publikasi</button></div></div>}
    {tab === 'Pengguna' && <Table head={['Nama', 'Peran']} rows={users.map(u => [u[0], <Pill>{u[1]}</Pill>])} />}
    {tab === 'Audit Log' && <Table head={['Waktu', 'Pengguna', 'Aktivitas']} rows={log} />}
  </>
}
