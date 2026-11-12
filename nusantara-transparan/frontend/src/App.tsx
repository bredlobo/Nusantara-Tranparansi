import { Routes, Route, Navigate } from 'react-router-dom'
import Shell from './components/layout/Shell'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Projects from './pages/Projects'
import Blockchain from './pages/Blockchain'
import Intelligence from './pages/Intelligence'
import Assistant from './pages/Assistant'
import Admin from './pages/Admin'
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="penerimaan" element={<Budget kind="revenue" />} />
        <Route path="pengeluaran" element={<Budget kind="expenditure" />} />
        <Route path="proyek" element={<Projects />} />
        <Route path="blockchain" element={<Blockchain />} />
        <Route path="ai" element={<Intelligence />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
