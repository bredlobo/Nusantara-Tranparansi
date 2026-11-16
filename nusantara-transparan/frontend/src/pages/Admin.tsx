import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import {
  UploadCloud,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Send,
  Globe,
  UserPlus,
  RefreshCw,
  PlusCircle,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react'
import { Head, Table, Pill, fmt } from '../components/ui'
import { api } from '../services/api'
import type { SubmissionItem, AuditLogItem, UserItem } from '../types'

type Role = 'Data Manager' | 'Auditor / Reviewer' | 'Administrator'

interface AuthSession {
  username: string
  full_name: string
  role: string
  ui_role: Role
  agency: string
  token: string
  mfa_code: string
}

export default function Admin() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [tab, setTab] = useState('')
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // State khusus Data Manager
  const [recType, setRecType] = useState<'budget' | 'project'>('budget')
  const [bType, setBType] = useState<'revenue' | 'expenditure'>('revenue')
  const [category, setCategory] = useState('Penerimaan')
  const [name, setName] = useState('')
  const [agency, setAgency] = useState('Kemenkeu RI')
  const [region, setRegion] = useState('Nasional')
  const [target, setTarget] = useState('')
  const [real, setReal] = useState('')
  const [source, setSource] = useState('Kemenkeu RI (APBN 2026)')
  const [parsedItems, setParsedItems] = useState<any[]>([])
  const [fileName, setFileName] = useState('')

  // State khusus Administrator (Tambah Pengguna + Validasi Password Kuat)
  const [uUsername, setUUsername] = useState('')
  const [uPassword, setUPassword] = useState('')
  const [showNewUserPass, setShowNewUserPass] = useState(false)
  const [uEmail, setUEmail] = useState('')
  const [uFullName, setUFullName] = useState('')
  const [uRole, setURole] = useState('data_manager')
  const [uAgency, setUAgency] = useState('')

  // Evaluasi kekuatan password secara real-time (Minimal 10 karakter, Huruf Besar, Huruf Kecil, Angka, Simbol)
  const passRules = [
    { label: 'Minimal 10 karakter', ok: uPassword.length >= 10 },
    { label: 'Huruf besar (A-Z)', ok: /[A-Z]/.test(uPassword) },
    { label: 'Huruf kecil (a-z)', ok: /[a-z]/.test(uPassword) },
    { label: 'Angka (0-9)', ok: /[0-9]/.test(uPassword) },
    { label: 'Simbol (!@#$%^&* dll.)', ok: /[^A-Za-z0-9\s]/.test(uPassword) },
  ]
  const isNewUserPassStrong = passRules.every(r => r.ok)

  async function refreshAll() {
    setLoading(true)
    try {
      const [subData, logData, usrData] = await Promise.all([
        api.submissions(),
        api.auditLogs(),
        api.users(),
      ])
      setSubmissions(subData ?? [])
      setLogs(logData ?? [])
      setUsers(usrData ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) refreshAll()
  }, [session])

  async function performLogin(usernameInput: string, passwordInput: string) {
    setLoginError('')
    try {
      const res = await api.login(usernameInput, passwordInput)
      const uiRole: Role =
        res.role === 'admin'
          ? 'Administrator'
          : res.role === 'auditor'
          ? 'Auditor / Reviewer'
          : 'Data Manager'

      const defaultTab =
        uiRole === 'Data Manager'
          ? 'Input & Unggah Data'
          : uiRole === 'Auditor / Reviewer'
          ? 'Antrean Verifikasi Auditor'
          : 'Publikasi Data Resmi'

      setSession({
        username: res.username,
        full_name: res.full_name,
        role: res.role,
        ui_role: uiRole,
        agency: res.agency,
        token: res.token,
        mfa_code: res.mfa_code,
      })
      setTab(defaultTab)
      setStatusMsg('')
    } catch (err: any) {
      setLoginError(err.message || 'Login gagal')
    }
  }

  function onLoginFormSubmit(e: FormEvent) {
    e.preventDefault()
    performLogin(loginUser, loginPass)
  }

  if (!session) {
    return (
      <>
        <Head
          title="Autentikasi Staf & Otorisasi Berjenjang (RBAC + Anti-Brute Force)"
          sub="Dilengkapi kebijakan password ketat (Min. 10 karakter, Huruf Besar, Kecil, Angka, Simbol) dan penguncian otomatis jika 5x salah password."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Login Resmi PostgreSQL */}
          <form onSubmit={onLoginFormSubmit} className="card space-y-4 border-lime/40">
            <h3 className="flex items-center gap-2 text-lg font-extrabold">
              <Lock className="text-lime" size={20} /> Login Portal Internal
            </h3>
            {loginError && (
              <div className="rounded border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-300">
                ⚠️ {loginError}
              </div>
            )}
            <div>
              <label className="text-xs text-white/60">Username</label>
              <input
                className="inp mt-1 w-full"
                required
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                placeholder="datamanager / auditor / admin"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Password</label>
              <div className="relative mt-1">
                <input
                  className="inp w-full pr-10"
                  type={showLoginPass ? 'text' : 'password'}
                  required
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  placeholder="Minimal 10 karakter (Huruf, Angka, Simbol)"
                />
                <button
                  type="button"
                  aria-label={showLoginPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  className="absolute right-3 top-2.5 text-white/50 hover:text-lime"
                >
                  {showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-p w-full justify-center">
              <KeyRound size={16} /> Masuk dengan Kredensial Database
            </button>
            <div className="rounded border border-white/10 bg-white/[0.02] p-2.5 text-[11px] text-white/60">
              <p className="flex items-center gap-1 font-bold text-lime">
                <ShieldCheck size={14} /> Proteksi Anti-Brute Force Aktif:
              </p>
              <p className="mt-0.5">
                Maksimal <b>5x percobaan gagal</b> berturut-turut. Percobaan ke-5 yang gagal akan mengunci akun selama <b>5 menit</b> dan mencatat IP ke Audit Log.
              </p>
            </div>
          </form>

          {/* 3 Kartu Akses Cepat (1-Klik Login Sesuai Role) */}
          <div className="space-y-4 lg:col-span-2">
            <div className="card">
              <h3 className="text-sm font-bold text-lime">Akses Cepat Staf Resmi (1-Klik Login Otomatis ke PostgreSQL)</h3>
              <p className="mt-1 text-xs text-white/60">
                Seluruh akun staf di bawah ini telah menggunakan standar password tinggi (Huruf Besar, Kecil, Angka, & Simbol &ge; 10 karakter):
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/15 bg-white/[0.02] p-3.5 flex flex-col justify-between">
                  <div>
                    <span className="rounded bg-blue/30 px-2 py-0.5 text-[10px] font-bold text-lime">TAHAP 1 — INPUT</span>
                    <h4 className="mt-2 font-bold">1. Data Manager</h4>
                    <p className="mt-1 font-mono text-xs text-white/60">User: datamanager</p>
                    <p className="font-mono text-xs text-lime">Pass: Manager#2026!</p>
                  </div>
                  <button
                    type="button"
                    className="btn-p mt-4 w-full justify-center text-xs"
                    onClick={() => performLogin('datamanager', 'Manager#2026!')}
                  >
                    Login Data Manager
                  </button>
                </div>

                <div className="rounded-lg border border-white/15 bg-white/[0.02] p-3.5 flex flex-col justify-between">
                  <div>
                    <span className="rounded bg-blue/30 px-2 py-0.5 text-[10px] font-bold text-lime">TAHAP 2 — AUDIT</span>
                    <h4 className="mt-2 font-bold">2. Auditor BPK</h4>
                    <p className="mt-1 font-mono text-xs text-white/60">User: auditor</p>
                    <p className="font-mono text-xs text-lime">Pass: Auditor#2026!</p>
                  </div>
                  <button
                    type="button"
                    className="btn-p mt-4 w-full justify-center text-xs"
                    onClick={() => performLogin('auditor', 'Auditor#2026!')}
                  >
                    Login Auditor
                  </button>
                </div>

                <div className="rounded-lg border border-white/15 bg-white/[0.02] p-3.5 flex flex-col justify-between">
                  <div>
                    <span className="rounded bg-blue/30 px-2 py-0.5 text-[10px] font-bold text-lime">TAHAP 3 — PUBLISH</span>
                    <h4 className="mt-2 font-bold">3. Administrator</h4>
                    <p className="mt-1 font-mono text-xs text-white/60">User: admin</p>
                    <p className="font-mono text-xs text-lime">Pass: Admin#2026!</p>
                  </div>
                  <button
                    type="button"
                    className="btn-p mt-4 w-full justify-center text-xs"
                    onClick={() => performLogin('admin', 'Admin#2026!')}
                  >
                    Login Administrator
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const role = session.ui_role

  const tabsByRole: Record<Role, string[]> = {
    'Data Manager': ['Input & Unggah Data', 'Daftar Draf Saya', 'Audit Log'],
    'Auditor / Reviewer': ['Antrean Verifikasi Auditor', 'Audit Log'],
    Administrator: ['Publikasi Data Resmi', 'Manajemen Pengguna', 'Audit Log'],
  }

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name || !target || !session) return
    try {
      setStatusMsg('Menyimpan draf ke PostgreSQL...')
      const item = {
        record_type: recType,
        type: bType,
        category: recType === 'budget' ? (bType === 'revenue' ? 'Penerimaan' : category) : category,
        name,
        agency,
        region,
        target: parseFloat(target) || 0,
        real: parseFloat(real) || 0,
        status: 'Berjalan',
        period: '2026',
        source,
      }
      const res = await api.importData(session.full_name, [item], session.role)
      setStatusMsg(`✅ ${res.message}`)
      setName('')
      setTarget('')
      setReal('')
      await refreshAll()
    } catch (err: any) {
      setStatusMsg(`❌ Gagal: ${err.message}`)
    }
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    setParsedItems([])
    setStatusMsg('')

    const ext = f.name.split('.').pop()?.toLowerCase()
    try {
      const text = await f.text()
      if (ext === 'json') {
        const j = JSON.parse(text)
        const arr = Array.isArray(j) ? j : j.items ?? [j]
        setParsedItems(arr)
        setStatusMsg(`File JSON valid: ${arr.length} baris siap diajukan sebagai Draf.`)
      } else if (ext === 'csv') {
        const lines = text.trim().split(/\r?\n/)
        if (lines.length < 2) {
          setStatusMsg('File CSV kosong atau tidak memiliki baris data.')
          return
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const items = lines.slice(1).map(line => {
          const cols = line.split(',').map(c => c.trim())
          const obj: any = {}
          headers.forEach((h, i) => {
            obj[h] = cols[i] ?? ''
          })
          return {
            record_type: obj.record_type || 'budget',
            type: obj.type || 'revenue',
            category: obj.category || 'Penerimaan',
            name: obj.name || 'Item Anggaran',
            agency: obj.agency || 'Kemenkeu RI',
            region: obj.region || 'Nasional',
            target: parseFloat(obj.target) || 0,
            real: parseFloat(obj.real) || 0,
            source: obj.source || `CSV Upload (${f.name})`,
          }
        })
        setParsedItems(items)
        setStatusMsg(`File CSV valid: ${items.length} baris siap diajukan sebagai Draf.`)
      } else {
        setStatusMsg('Gunakan file format .json atau .csv.')
      }
    } catch {
      setStatusMsg('Gagal membaca format file.')
    }
  }

  async function submitParsedFile() {
    if (parsedItems.length === 0 || !session) return
    try {
      setStatusMsg('Mengunggah dataset ke PostgreSQL...')
      const res = await api.importData(session.full_name, parsedItems, session.role)
      setStatusMsg(`✅ ${res.message}`)
      setParsedItems([])
      setFileName('')
      await refreshAll()
    } catch (err: any) {
      setStatusMsg(`❌ Gagal: ${err.message}`)
    }
  }

  async function handleAuditorDecision(item: SubmissionItem, decision: 'approve' | 'reject') {
    if (!session) return
    try {
      const reason = decision === 'reject' ? 'Data memerlukan kelengkapan dokumen pendukung' : 'Hash cocok & data valid'
      const res = await api.reviewItem(item.id, item.record_type, decision, session.full_name, reason, session.role)
      setStatusMsg(`✅ ${res.message}`)
      await refreshAll()
    } catch (err: any) {
      setStatusMsg(`❌ ${err.message}`)
    }
  }

  async function handleAdminPublish(item?: SubmissionItem, publishAll = false) {
    if (!session) return
    try {
      const res = await api.publishItem(item?.id ?? 'ALL', item?.record_type ?? 'budget', publishAll, session.full_name, session.role)
      setStatusMsg(`✅ ${res.message}`)
      await refreshAll()
    } catch (err: any) {
      setStatusMsg(`❌ ${err.message}`)
    }
  }

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault()
    if (!uUsername || !uFullName || !isNewUserPassStrong || !session) return
    try {
      await api.createUser(
        {
          username: uUsername,
          password: uPassword,
          email: uEmail || `${uUsername}@transparan.go.id`,
          full_name: uFullName,
          role: uRole,
          agency: uAgency || 'Kemenkeu RI',
        },
        session.role,
      )
      setStatusMsg(`✅ Pengguna ${uFullName} berhasil ditambahkan ke PostgreSQL dengan password terenkripsi!`)
      setUUsername('')
      setUPassword('')
      setUEmail('')
      setUFullName('')
      setUAgency('')
      await refreshAll()
    } catch (err: any) {
      setStatusMsg(`❌ ${err.message}`)
    }
  }

  const statusBadge = (st: string) => {
    if (st === 'published') return <Pill ok>Published (Tayang di Publik)</Pill>
    if (st === 'approved') return <Pill ok>Approved (Disetujui Auditor)</Pill>
    if (st === 'rejected') return <Pill>Rejected (Perlu Revisi)</Pill>
    return <Pill warn>Draft (Menunggu Auditor)</Pill>
  }

  return (
    <>
      <Head
        title={`Workspace: ${role}`}
        sub={`Login aktif: ${session.full_name} (${session.agency}) • Kode TOTP MFA Aktif: ${session.mfa_code}`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {tabsByRole[role].map(t => (
          <button key={t} className={tab === t ? 'btn-p' : 'btn-s'} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
        <button className="btn-s flex items-center gap-1.5" onClick={refreshAll} title="Muat ulang dari PostgreSQL">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Segarkan Data
        </button>
        <button className="btn-s ml-auto" onClick={() => setSession(null)}>
          Keluar / Ganti Akun ({session.username})
        </button>
      </div>

      {statusMsg && (
        <div className="card mb-6 border-lime/40 bg-lime/10 text-sm text-lime" role="status">
          {statusMsg}
        </div>
      )}

      {/* SCREEN 1: DATA MANAGER */}
      {role === 'Data Manager' && tab === 'Input & Unggah Data' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleManualSubmit} className="card space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <PlusCircle className="text-lime" size={20} /> Form Input Draf Baru ke PostgreSQL
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-white/60">Jenis Data</label>
                <select className="inp mt-1 w-full" value={recType} onChange={e => setRecType(e.target.value as any)}>
                  <option value="budget">Anggaran & Realisasi (APBN)</option>
                  <option value="project">Proyek Pembangunan</option>
                </select>
              </div>
              {recType === 'budget' ? (
                <div>
                  <label className="text-xs text-white/60">Tipe Anggaran</label>
                  <select
                    className="inp mt-1 w-full"
                    value={bType}
                    onChange={e => {
                      const val = e.target.value as 'revenue' | 'expenditure'
                      setBType(val)
                      setCategory(val === 'revenue' ? 'Penerimaan' : 'Jenis Belanja')
                    }}
                  >
                    <option value="revenue">Penerimaan Negara (Revenue)</option>
                    <option value="expenditure">Belanja Negara (Expenditure)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-white/60">Wilayah Proyek</label>
                  <input className="inp mt-1 w-full" value={region} onChange={e => setRegion(e.target.value)} placeholder="Contoh: Jawa Barat" />
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-white/60">Kelompok / Kategori</label>
                {recType === 'budget' && bType === 'expenditure' ? (
                  <select className="inp mt-1 w-full" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Jenis Belanja">Jenis Belanja</option>
                    <option value="Fungsi">Fungsi (Kementerian/Sektor)</option>
                  </select>
                ) : (
                  <input className="inp mt-1 w-full" value={category} onChange={e => setCategory(e.target.value)} placeholder="Contoh: Infrastruktur / Penerimaan" />
                )}
              </div>
              <div>
                <label className="text-xs text-white/60">Nama Kategori / Proyek</label>
                <input
                  className="inp mt-1 w-full"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={recType === 'budget' ? 'Contoh: Pajak / Pendidikan' : 'Contoh: Bendungan Nasional'}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-white/60">Target / Pagu Anggaran (Rp Triliun)</label>
                <input className="inp mt-1 w-full" type="number" step="0.01" required value={target} onChange={e => setTarget(e.target.value)} placeholder="Contoh: 2000" />
              </div>
              <div>
                <label className="text-xs text-white/60">Realisasi / Terpakai (Rp Triliun)</label>
                <input className="inp mt-1 w-full" type="number" step="0.01" required value={real} onChange={e => setReal(e.target.value)} placeholder="Contoh: 1480" />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60">Sumber Dokumen Resmi</label>
              <input className="inp mt-1 w-full" value={source} onChange={e => setSource(e.target.value)} />
            </div>

            <button type="submit" className="btn-p w-full justify-center">
              <Send size={16} /> Simpan sebagai Draf & Ajukan ke Auditor
            </button>
          </form>

          <div className="card space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <UploadCloud className="text-lime" size={20} /> Unggah Dataset Massal (CSV / JSON)
            </h3>
            <p className="text-xs text-white/60">
              Unggah file CSV atau JSON berisi daftar anggaran/proyek. Seluruh baris akan diberi hash SHA-256 otomatis dan masuk ke antrean Auditor.
            </p>
            <label className="card flex cursor-pointer flex-col items-center gap-2 border-dashed py-10 text-sm hover:border-lime/60">
              <UploadCloud className="text-lime" size={28} />
              <span>Klik untuk memilih file <b>.CSV</b> atau <b>.JSON</b></span>
              <input type="file" accept=".csv,.json" className="sr-only" onChange={handleFileUpload} />
            </label>
            {fileName && <p className="text-xs text-white/70">File dipilih: <b>{fileName}</b> ({parsedItems.length} item)</p>}
            {parsedItems.length > 0 && (
              <button onClick={submitParsedFile} className="btn-p w-full justify-center">
                <Send size={16} /> Kirim {parsedItems.length} Baris ke Database sebagai Draf
              </button>
            )}
          </div>
        </div>
      )}

      {role === 'Data Manager' && tab === 'Daftar Draf Saya' && (
        <Table
          head={['ID', 'Jenis', 'Kategori', 'Nama', 'Pagu', 'Realisasi', 'Hash SHA-256', 'Status Validasi']}
          empty="Belum ada data yang diinput. Gunakan tab Input & Unggah Data."
          rows={submissions.map(s => [
            s.id,
            s.record_type.toUpperCase(),
            s.category,
            s.name,
            fmt(s.target),
            fmt(s.real),
            <span className="font-mono text-xs">{s.integrity_hash?.slice(0, 14)}…</span>,
            statusBadge(s.validation_status),
          ])}
        />
      )}

      {/* SCREEN 2: AUDITOR / REVIEWER */}
      {role === 'Auditor / Reviewer' && tab === 'Antrean Verifikasi Auditor' && (
        <div className="space-y-4">
          <div className="card flex items-center gap-3 text-sm">
            <ShieldAlert className="shrink-0 text-lime" />
            <p>
              Sebagai <b>Auditor Independen ({session.full_name})</b>, periksa kecocokan nilai dan hash SHA-256 di bawah ini. Hanya data yang Anda <b>Setujui (Approve)</b> yang dapat dipublikasikan oleh Administrator.
            </p>
          </div>
          <Table
            head={['ID', 'Kategori', 'Nama Item', 'Pagu', 'Realisasi', 'Bukti Hash SHA-256', 'Status', 'Tindakan Auditor']}
            empty="Tidak ada antrean data di PostgreSQL saat ini."
            rows={submissions.map(s => [
              s.id,
              s.category,
              s.name,
              fmt(s.target),
              fmt(s.real),
              <span className="font-mono text-xs" title={s.integrity_hash}>{s.integrity_hash?.slice(0, 16)}…</span>,
              statusBadge(s.validation_status),
              <div className="flex gap-2">
                {s.validation_status === 'draft' || s.validation_status === 'rejected' ? (
                  <>
                    <button
                      className="btn-p px-2.5 py-1 text-xs"
                      onClick={() => handleAuditorDecision(s, 'approve')}
                    >
                      <CheckCircle2 size={14} /> Setujui
                    </button>
                    <button
                      className="btn-s px-2.5 py-1 text-xs"
                      onClick={() => handleAuditorDecision(s, 'reject')}
                    >
                      <XCircle size={14} /> Tolak
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-white/50">Selesai ditinjau</span>
                )}
              </div>,
            ])}
          />
        </div>
      )}

      {/* SCREEN 3: ADMINISTRATOR */}
      {role === 'Administrator' && tab === 'Publikasi Data Resmi' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-bold">Panel Pengesahan & Publikasi Portal Publik ({session.full_name})</p>
              <p className="text-white/60">
                Data dengan status <b>Approved (Disetujui Auditor)</b> siap dipublikasikan agar langsung tampil di Dashboard Publik.
              </p>
            </div>
            {submissions.some(s => s.validation_status === 'approved') && (
              <button className="btn-p" onClick={() => handleAdminPublish(undefined, true)}>
                <Globe size={16} /> Publikasikan Semua yang Disetujui Auditor
              </button>
            )}
          </div>

          <Table
            head={['ID', 'Kategori', 'Nama Item', 'Pagu', 'Realisasi', 'Status Saat Ini', 'Tindakan Publikasi']}
            empty="Belum ada data di PostgreSQL."
            rows={submissions.map(s => [
              s.id,
              s.category,
              s.name,
              fmt(s.target),
              fmt(s.real),
              statusBadge(s.validation_status),
              s.validation_status === 'approved' ? (
                <button className="btn-p px-3 py-1 text-xs" onClick={() => handleAdminPublish(s, false)}>
                  <Globe size={14} /> Publikasikan ke Publik
                </button>
              ) : s.validation_status === 'published' ? (
                <span className="text-xs text-lime">✓ Sudah Tayang di Publik</span>
              ) : (
                <span className="text-xs text-white/40">Menunggu Persetujuan Auditor</span>
              ),
            ])}
          />
        </div>
      )}

      {role === 'Administrator' && tab === 'Manajemen Pengguna' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleCreateUser} className="card space-y-3">
            <h3 className="flex items-center gap-2 font-bold">
              <UserPlus className="text-lime" size={18} /> Tambah Pengguna Baru
            </h3>
            <div>
              <label className="text-xs text-white/60">Username</label>
              <input className="inp mt-1 w-full" required value={uUsername} onChange={e => setUUsername(e.target.value)} placeholder="Contoh: rina_auditor" />
            </div>
            <div>
              <label className="text-xs text-white/60">Password Staf Baru</label>
              <div className="relative mt-1">
                <input
                  className="inp w-full pr-10"
                  type={showNewUserPass ? 'text' : 'password'}
                  required
                  value={uPassword}
                  onChange={e => setUPassword(e.target.value)}
                  placeholder="Contoh: Rina#2026!Bpk"
                />
                <button
                  type="button"
                  aria-label={showNewUserPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  onClick={() => setShowNewUserPass(!showNewUserPass)}
                  className="absolute right-3 top-2.5 text-white/50 hover:text-lime"
                >
                  {showNewUserPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2 space-y-1 rounded border border-white/10 bg-white/[0.02] p-2.5 text-[11px]">
                <p className="font-semibold text-white/70">Syarat Keamanan Password:</p>
                {passRules.map(r => (
                  <p key={r.label} className={r.ok ? 'text-lime' : 'text-white/40'}>
                    {r.ok ? '✓' : '○'} {r.label}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/60">Nama Lengkap</label>
              <input className="inp mt-1 w-full" required value={uFullName} onChange={e => setUFullName(e.target.value)} placeholder="Contoh: Rina Wijaya" />
            </div>
            <div>
              <label className="text-xs text-white/60">Email</label>
              <input className="inp mt-1 w-full" type="email" value={uEmail} onChange={e => setUEmail(e.target.value)} placeholder="rina@bpk.go.id" />
            </div>
            <div>
              <label className="text-xs text-white/60">Peran (Role RBAC)</label>
              <select className="inp mt-1 w-full" value={uRole} onChange={e => setURole(e.target.value)}>
                <option value="data_manager">Data Manager</option>
                <option value="auditor">Auditor / Reviewer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60">Instansi</label>
              <input className="inp mt-1 w-full" value={uAgency} onChange={e => setUAgency(e.target.value)} placeholder="Contoh: BPK RI / Kemenkeu" />
            </div>
            <button
              type="submit"
              disabled={!isNewUserPassStrong}
              className="btn-p w-full justify-center disabled:opacity-40"
            >
              Simpan Pengguna ke PostgreSQL
            </button>
          </form>

          <div className="lg:col-span-2">
            <Table
              head={['ID', 'Username', 'Nama Lengkap', 'Instansi', 'Peran RBAC']}
              empty="Belum ada pengguna terdaftar di tabel users PostgreSQL."
              rows={users.map(u => [u.id, u.username, u.full_name, u.agency, <Pill ok>{u.role}</Pill>])}
            />
          </div>
        </div>
      )}

      {/* SHARED TAB: AUDIT LOG */}
      {tab === 'Audit Log' && (
        <Table
          head={['Waktu', 'Aktor / Peran', 'Aksi', 'Target ID', 'Keterangan Audit']}
          empty="Belum ada riwayat aktivitas di tabel audit_logs PostgreSQL."
          rows={logs.map(l => [
            new Date(l.changed_at).toLocaleString('id-ID'),
            l.actor_name,
            <Pill ok={l.action.includes('APPROVED') || l.action.includes('PUBLISHED')}>{l.action}</Pill>,
            l.record_id,
            l.reason,
          ])}
        />
      )}
    </>
  )
}
