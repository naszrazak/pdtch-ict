import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/Auth'
import { DataProvider } from './context/Data'
import Layout from './components/Layout'
import { Memuat } from './components/ui'
import Login from './pages/Login'
import Persediaan from './pages/Persediaan'
import Utama from './pages/Utama'
import SenaraiAset from './pages/SenaraiAset'
import BorangAset from './pages/BorangAset'
import ButiranAset from './pages/ButiranAset'
import BelumLengkap from './pages/BelumLengkap'
import Organisasi from './pages/Organisasi'
import ButiranStaf from './pages/ButiranStaf'
import ImportStaf from './pages/ImportStaf'
import Laporan from './pages/Laporan'
import Pengguna from './pages/Pengguna'
import LogAudit from './pages/LogAudit'

export default function App() {
  const { user, memuat, sah, isAdmin } = useAuth()

  if (memuat) return <Memuat penuh />
  if (!user) return <Login />
  if (!sah) return <Persediaan />

  return (
    <DataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Utama />} />
          <Route path="aset" element={<SenaraiAset />} />
          <Route path="aset/baru" element={<BorangAset />} />
          <Route path="aset/:id" element={<ButiranAset />} />
          <Route path="aset/:id/kemaskini" element={<BorangAset />} />
          <Route path="belum-lengkap" element={<BelumLengkap />} />
          <Route path="organisasi" element={<Organisasi />} />
          <Route path="staf/:id" element={<ButiranStaf />} />
          <Route path="laporan" element={<Laporan />} />
          {isAdmin && <Route path="import" element={<ImportStaf />} />}
          {isAdmin && <Route path="pengguna" element={<Pengguna />} />}
          {isAdmin && <Route path="log" element={<LogAudit />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  )
}
