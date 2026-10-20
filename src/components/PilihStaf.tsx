import { useState } from 'react'
import { useData } from '../context/Data'

// Medan carian staf, sesuai untuk telefon (tiada senarai dropdown panjang).
export default function PilihStaf({ stafId, onChange }: { stafId: string; onChange: (stafId: string) => void }) {
  const { staf, stafMap, unitMap } = useData()
  const [q, setQ] = useState('')
  const dipilih = stafId ? stafMap.get(stafId) : undefined

  if (dipilih) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
        <div className="min-w-0 text-sm">
          <div className="truncate font-medium">{dipilih.nama}</div>
          <div className="truncate text-xs text-slate-600">
            {dipilih.jawatan} · {unitMap.get(dipilih.unitId)?.nama}
          </div>
        </div>
        <button type="button" className="text-sm text-blue-800 underline" onClick={() => onChange('')}>
          Tukar
        </button>
      </div>
    )
  }

  const kata = q.toLowerCase().split(/\s+/).filter(Boolean)
  const padan = kata.length
    ? staf.filter((s) => {
        const t = `${s.nama} ${s.jawatan} ${unitMap.get(s.unitId)?.nama ?? ''}`.toLowerCase()
        return kata.every((k) => t.includes(k))
      })
    : []

  return (
    <div>
      <input className="input" type="search" placeholder="Taip nama staf..." value={q} onChange={(e) => setQ(e.target.value)} />
      {padan.length > 0 && (
        <ul className="mt-1 max-h-60 divide-y overflow-y-auto rounded-md border bg-white text-sm">
          {padan.slice(0, 20).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-blue-50"
                onClick={() => {
                  onChange(s.id)
                  setQ('')
                }}
              >
                <div className="font-medium">{s.nama}</div>
                <div className="text-xs text-slate-500">
                  {s.jawatan} · {unitMap.get(s.unitId)?.nama}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {kata.length > 0 && padan.length === 0 && <p className="mt-1 text-xs text-slate-500">Tiada staf sepadan.</p>}
    </div>
  )
}
