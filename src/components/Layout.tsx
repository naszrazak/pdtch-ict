import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useData } from '../context/Data'
import { labelPeranan } from '../lib/konstan'
import { Memuat, Ralat } from './ui'

export default function Layout() {
  const { profil, isAdmin, keluar } = useAuth()
  const { sedia, ralat } = useData()
  const [buka, setBuka] = useState(false)
  const lokasi = useLocation()
  const [lokasiTerakhir, setLokasiTerakhir] = useState(lokasi.pathname)
  if (lokasi.pathname !== lokasiTerakhir) {
    setLokasiTerakhir(lokasi.pathname)
    setBuka(false)
  }

  const menu = [
    { ke: '/', label: 'Utama', tepat: true },
    { ke: '/aset', label: 'Aset' },
    { ke: '/belum-lengkap', label: 'Belum Lengkap' },
    { ke: '/organisasi', label: 'Organisasi & Staf' },
    { ke: '/laporan', label: 'Laporan' },
    ...(isAdmin
      ? [
          { ke: '/import', label: 'Import Staf' },
          { ke: '/pengguna', label: 'Pengguna' },
          { ke: '/log', label: 'Log Audit' },
        ]
      : []),
  ]

  const pautan = (m: { ke: string; label: string; tepat?: boolean }) => (
    <NavLink
      key={m.ke}
      to={m.ke}
      end={m.tepat}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-700'}`
      }
    >
      {m.label}
    </NavLink>
  )

  return (
    <div className="min-h-screen md:flex">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-blue-800 px-4 py-3 text-white md:hidden">
        <span className="font-semibold">Aset ICT PDTCH</span>
        <button className="rounded px-2 py-1 text-sm ring-1 ring-blue-400" onClick={() => setBuka((b) => !b)}>
          {buka ? 'Tutup' : 'Menu'}
        </button>
      </header>

      <aside
        className={`${buka ? 'block' : 'hidden'} fixed inset-x-0 top-[52px] z-30 bg-blue-800 p-3 shadow-lg md:static md:block md:min-h-screen md:w-56 md:shrink-0 md:shadow-none`}
      >
        <div className="mb-4 hidden px-3 pt-2 md:block">
          <div className="text-lg font-semibold text-white">Aset ICT PDTCH</div>
        </div>
        <nav className="space-y-1">{menu.map(pautan)}</nav>
        <div className="mt-6 border-t border-blue-700 px-3 pt-3 text-xs text-blue-200">
          <div className="truncate font-medium text-white">{profil?.nama || profil?.emel}</div>
          <div className="truncate">{profil?.emel}</div>
          <div>{labelPeranan(profil?.peranan)}</div>
          <button className="mt-2 text-blue-100 underline" onClick={keluar}>
            Log keluar
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-6">
        <Ralat>{ralat && `Ralat memuatkan data: ${ralat}`}</Ralat>
        {sedia ? <Outlet /> : !ralat && <Memuat />}
      </main>
    </div>
  )
}
