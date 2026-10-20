import { useCallback, useEffect, useState } from 'react'
import { collection, getDocs, limit, orderBy, query, startAfter, type QueryDocumentSnapshot, type QuerySnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Kosong, Memuat, Ralat, TajukHalaman, mesejRalat } from '../components/ui'
import type { LogAudit as Log, Tindakan } from '../types'

const SAIZ = 100
const WARNA: Record<Tindakan, string> = {
  cipta: 'bg-green-100 text-green-800',
  kemaskini: 'bg-blue-100 text-blue-800',
  padam: 'bg-red-100 text-red-800',
  import: 'bg-purple-100 text-purple-800',
}

type Kursor = QueryDocumentSnapshot | null

const ambil = (selepas: Kursor) =>
  getDocs(query(collection(db, 'logAudit'), orderBy('masa', 'desc'), ...(selepas ? [startAfter(selepas)] : []), limit(SAIZ)))

const papar = (v: unknown) => (v == null ? '(kosong)' : typeof v === 'object' ? JSON.stringify(v) : String(v))

export default function LogAudit() {
  const [log, setLog] = useState<Log[]>([])
  const [akhir, setAkhir] = useState<Kursor>(null)
  const [habis, setHabis] = useState(false)
  const [memuat, setMemuat] = useState(true)
  const [ralat, setRalat] = useState('')
  const [buka, setBuka] = useState<string | null>(null)

  const terap = useCallback((s: QuerySnapshot, selepas: Kursor) => {
    setLog((l) => [...(selepas ? l : []), ...s.docs.map((d) => ({ id: d.id, ...d.data() }) as Log)])
    setAkhir(s.docs.at(-1) ?? null)
    setHabis(s.docs.length < SAIZ)
    setMemuat(false)
  }, [])
  const gagal = useCallback((e: unknown) => {
    setRalat(mesejRalat(e))
    setMemuat(false)
  }, [])

  useEffect(() => {
    ambil(null).then((s) => terap(s, null), gagal)
  }, [terap, gagal])

  function muat(selepas: Kursor) {
    setMemuat(true)
    ambil(selepas).then((s) => terap(s, selepas), gagal)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <TajukHalaman tajuk="Log Audit" keterangan="Setiap perubahan data: siapa, apa dan bila">
        <button
          className="btn-secondary"
onClick={() => muat(null)}>
          Muat semula
        </button>
      </TajukHalaman>
      <Ralat>{ralat}</Ralat>
      {!memuat && log.length === 0 && <Kosong>Tiada log.</Kosong>}
      <ul className="space-y-2">
        {log.map((l) => {
          const medan = Object.entries(l.perubahan ?? {})
          return (
            <li key={l.id} className="card text-sm">
              <button className="w-full text-left" onClick={() => setBuka(buka === l.id ? null : l.id)} disabled={!medan.length}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${WARNA[l.tindakan] ?? 'bg-slate-100'}`}>{l.tindakan}</span>
                  <span className="font-medium">{l.ringkasan}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {l.masa?.toDate().toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' })} · {l.namaPengguna} ({l.oleh})
                  {medan.length > 0 && ` · ${medan.length} medan ${buka === l.id ? '▾' : '▸'}`}
                </div>
              </button>
              {buka === l.id && (
                <table className="mt-2 w-full text-xs">
                  <tbody className="divide-y">
                    {medan.map(([k, { dari, ke }]) => (
                      <tr key={k}>
                        <td className="py-1 pr-2 font-medium text-slate-600">{k}</td>
                        <td className="break-all py-1 pr-2 text-red-700">{papar(dari)}</td>
                        <td className="break-all py-1 text-green-700">{papar(ke)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </li>
          )
        })}
      </ul>
      {memuat && <Memuat />}
      {!memuat && !habis && log.length > 0 && (
        <button className="btn-secondary mt-4 w-full" onClick={() => muat(akhir)}>
          Muat lagi
        </button>
      )}
    </div>
  )
}
