import { Link } from 'react-router-dom'
import { useData } from '../context/Data'
import { useAuth } from '../context/Auth'
import { JENIS_ASET, STATUS_ASET } from '../lib/konstan'
import { medanTidakLengkap } from '../lib/aset'
import { TajukHalaman } from '../components/ui'
import type { Aset } from '../types'

function Kad({ label, nilai, ke }: { label: string; nilai: number; ke?: string }) {
  const isi = (
    <>
      <div className="text-2xl font-semibold text-slate-900">{nilai}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </>
  )
  return ke ? (
    <Link to={ke} className="card block hover:ring-2 hover:ring-blue-200">
      {isi}
    </Link>
  ) : (
    <div className="card">{isi}</div>
  )
}

export default function Utama() {
  const { aset, staf, unit } = useData()
  const { isAdmin } = useAuth()
  const belumLengkap = aset.filter((a) => a.status !== 'dilupus' && medanTidakLengkap(a).length > 0).length
  const kira = (f: (a: Aset) => boolean) => aset.filter(f).length

  return (
    <div className="space-y-6">
      <TajukHalaman tajuk="Utama" keterangan="Ringkasan aset ICT PDTCH">
        <Link to="/aset/baru" className="btn-primary">
          + Tambah aset
        </Link>
      </TajukHalaman>

      {staf.length === 0 && isAdmin && (
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada data staf. Mulakan dengan <Link to="/import" className="font-medium underline">import senarai staf</Link>.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kad label="Jumlah aset" nilai={aset.length} ke="/aset" />
        <Kad label="Aset belum lengkap" nilai={belumLengkap} ke="/belum-lengkap" />
        <Kad label="Staf" nilai={staf.length} ke="/organisasi" />
        <Kad label="Unit" nilai={unit.length} ke="/organisasi" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-medium">Ikut status</h2>
          <ul className="divide-y text-sm">
            {STATUS_ASET.map((s) => (
              <li key={s.kod} className="flex justify-between py-1.5">
                <Link to={`/aset?status=${s.kod}`} className="text-blue-800 hover:underline">
                  {s.label}
                </Link>
                <span>{kira((a: Aset) => a.status === s.kod)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-2 font-medium">Ikut jenis</h2>
          <ul className="divide-y text-sm">
            {JENIS_ASET.map((j) => (
              <li key={j.kod} className="flex justify-between py-1.5">
                <Link to={`/aset?jenis=${j.kod}`} className="text-blue-800 hover:underline">
                  {j.label}
                </Link>
                <span>{kira((a: Aset) => a.jenis === j.kod)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
