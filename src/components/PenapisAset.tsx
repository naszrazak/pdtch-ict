import { JENIS_ASET, STATUS_ASET } from '../lib/konstan'
import type { TapisAset } from '../lib/carian'
import PilihOrganisasi from './PilihOrganisasi'

interface Props {
  nilai: TapisAset
  onChange: (nilai: TapisAset) => void
  tanpaStatus?: boolean
}

export default function PenapisAset({ nilai, onChange, tanpaStatus = false }: Props) {
  const set = (ubah: Partial<TapisAset>) => onChange({ ...nilai, ...ubah })
  return (
    <div className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="block sm:col-span-2 lg:col-span-1">
        <span className="label">Carian</span>
        <input
          className="input"
          type="search"
          placeholder="Nama, no. siri, no. daftar..."
          value={nilai.q}
          onChange={(e) => set({ q: e.target.value })}
        />
      </label>
      <PilihOrganisasi bahagianId={nilai.bahagianId} unitId={nilai.unitId} onChange={set} />
      <label className="block">
        <span className="label">Jenis</span>
        <select className="input" value={nilai.jenis} onChange={(e) => set({ jenis: e.target.value })}>
          <option value="">Semua</option>
          {JENIS_ASET.map((j) => (
            <option key={j.kod} value={j.kod}>
              {j.label}
            </option>
          ))}
        </select>
      </label>
      {!tanpaStatus && (
        <label className="block">
          <span className="label">Status</span>
          <select className="input" value={nilai.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="">Semua</option>
            {STATUS_ASET.map((s) => (
              <option key={s.kod} value={s.kod}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
