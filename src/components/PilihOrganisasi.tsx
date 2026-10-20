import { useData } from '../context/Data'

// Pasangan pilihan Bahagian dan Unit; unit ditapis mengikut bahagian yang dipilih.
export interface NilaiOrganisasi {
  bahagianId: string
  unitId: string
}

interface Props extends NilaiOrganisasi {
  onChange: (nilai: NilaiOrganisasi) => void
  labelSemua?: string
  wajib?: boolean
}

export default function PilihOrganisasi({ bahagianId, unitId, onChange, labelSemua = 'Semua', wajib = false }: Props) {
  const { bahagian, unit } = useData()
  const senaraiUnit = bahagianId ? unit.filter((u) => u.bahagianId === bahagianId) : unit
  return (
    <>
      <label className="block">
        <span className="label">Bahagian</span>
        <select
          className="input"
          value={bahagianId}
          required={wajib}
          onChange={(e) => onChange({ bahagianId: e.target.value, unitId: '' })}
        >
          <option value="">{wajib ? '-- Pilih bahagian --' : labelSemua}</option>
          {bahagian.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nama}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Unit</span>
        <select
          className="input"
          value={unitId}
          required={wajib}
          onChange={(e) => {
            const u = unit.find((x) => x.id === e.target.value)
            onChange({ bahagianId: u?.bahagianId ?? bahagianId, unitId: e.target.value })
          }}
        >
          <option value="">{wajib ? '-- Pilih unit --' : labelSemua}</option>
          {senaraiUnit.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nama}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}
