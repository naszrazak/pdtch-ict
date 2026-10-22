import { Link } from 'react-router-dom'
import { labelJenis } from '../lib/konstan'
import { jenamaModel, medanTidakLengkap } from '../lib/aset'
import type { AsetPenuh } from '../types'
import { Kosong, LencanaStatus } from './ui'

export interface NavigasiAset {
  senarai: string[]
}

// Senarai aset: jadual pada skrin lebar, kad pada telefon.
interface Props {
  aset: AsetPenuh[]
  tunjukKurang?: boolean
  tunjukPemegang?: boolean
}

export default function JadualAset({ aset, tunjukKurang = false, tunjukPemegang = true }: Props) {
  if (aset.length === 0) return <Kosong>Tiada aset.</Kosong>
  // Susunan senarai ini dibawa ke halaman butiran untuk butang Sebelum / Seterusnya.
  const state: NavigasiAset = { senarai: aset.map((a) => a.id) }
  return (
    <>
      <ul className="space-y-2 md:hidden">
        {aset.map((a) => (
          <li key={a.id}>
            <Link to={`/aset/${a.id}`} state={state} className="card block">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">
                    {labelJenis(a.jenis)} · {jenamaModel(a) || '-'}
                  </div>
                  {tunjukPemegang && <div className="truncate text-sm text-slate-600">{a._nama}</div>}
                  <div className="truncate text-xs text-slate-500">{a._unit?.nama ?? '-'}</div>
                </div>
                <LencanaStatus status={a.status} />
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-2 text-xs text-slate-500">
                <span className="truncate">Siri: {a.noSiri || '-'}</span>
                <span className="truncate">Daftar: {a.noPendaftaran || '-'}</span>
              </div>
              {tunjukKurang && <div className="mt-1 text-xs text-amber-700">Tiada: {medanTidakLengkap(a).join(', ')}</div>}
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Jenis</th>
              <th className="px-3 py-2">Jenama / Model</th>
              {tunjukPemegang && <th className="px-3 py-2">Pemegang</th>}
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">No. Siri</th>
              <th className="px-3 py-2">No. Pendaftaran</th>
              {tunjukKurang ? <th className="px-3 py-2">Belum diisi</th> : <th className="px-3 py-2">Status</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {aset.map((a) => (
              <tr key={a.id} className="hover:bg-blue-50">
                <td className="px-3 py-2">
                  <Link to={`/aset/${a.id}`} state={state} className="font-medium text-blue-800 hover:underline">
                    {labelJenis(a.jenis)}
                  </Link>
                </td>
                <td className="px-3 py-2">{jenamaModel(a) || '-'}</td>
                {tunjukPemegang && <td className="px-3 py-2">{a._nama}</td>}
                <td className="px-3 py-2 text-slate-600">{a._unit?.nama ?? '-'}</td>
                <td className="px-3 py-2">{a.noSiri || '-'}</td>
                <td className="px-3 py-2">{a.noPendaftaran || '-'}</td>
                {tunjukKurang ? (
                  <td className="px-3 py-2 text-amber-700">{medanTidakLengkap(a).join(', ')}</td>
                ) : (
                  <td className="px-3 py-2">
                    <LencanaStatus status={a.status} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
