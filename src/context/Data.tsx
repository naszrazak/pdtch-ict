import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { bandingSusunan, namaPemegang, unitIdAset } from '../lib/aset'
import type { Aset, AsetPenuh, Bahagian, Staf, Unit } from '../types'

// Saiz data PDTCH kecil (ratusan rekod), jadi semua koleksi utama didengar secara langsung
// dan ditapis di pelanggan. Ini memudahkan carian, laporan dan kerja luar talian.
interface Koleksi {
  bahagian: Bahagian
  unit: Unit
  staf: Staf
  aset: Aset
}
type NamaKoleksi = keyof Koleksi
const KOLEKSI: NamaKoleksi[] = ['bahagian', 'unit', 'staf', 'aset']

type DataMentah = { [K in NamaKoleksi]?: Koleksi[K][] }

interface NilaiData {
  sedia: boolean
  ralat: string | null
  bahagian: Bahagian[]
  unit: Unit[]
  staf: Staf[]
  aset: Aset[]
  asetPenuh: AsetPenuh[]
  bahagianMap: Map<string, Bahagian>
  unitMap: Map<string, Unit>
  stafMap: Map<string, Staf>
  asetMap: Map<string, AsetPenuh>
}

const DataContext = createContext<NilaiData | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataMentah>({})
  const [ralat, setRalat] = useState<string | null>(null)
  const [cubaan, setCubaan] = useState(0)

  useEffect(() => {
    let pemasa: ReturnType<typeof setTimeout> | undefined
    const henti = KOLEKSI.map((k) =>
      onSnapshot(
        collection(db, k),
        (snap) => {
          setRalat(null)
          setData((d) => ({ ...d, [k]: snap.docs.map((x) => ({ id: x.id, ...x.data() })) }))
        },
        (e) => {
          // Pendengar Firestore berhenti selepas ralat; cuba semula selepas seketika.
          setRalat(e.message)
          clearTimeout(pemasa)
          pemasa = setTimeout(() => setCubaan((c) => c + 1), 5000)
        },
      ),
    )
    return () => {
      clearTimeout(pemasa)
      henti.forEach((f) => f())
    }
  }, [cubaan])

  const nilai = useMemo<NilaiData>(() => {
    const sedia = KOLEKSI.every((k) => data[k])
    const bahagian = [...(data.bahagian ?? [])].sort(bandingSusunan)
    const unit = [...(data.unit ?? [])].sort(bandingSusunan)
    const staf = [...(data.staf ?? [])].sort(bandingSusunan)
    const aset = data.aset ?? []
    const bahagianMap = new Map(bahagian.map((x) => [x.id, x]))
    const unitMap = new Map(unit.map((x) => [x.id, x]))
    const stafMap = new Map(staf.map((x) => [x.id, x]))
    // Aset bersama maklumat pemegang, unit dan bahagian semasa (untuk paparan dan carian).
    const asetPenuh: AsetPenuh[] = aset.map((a) => {
      const uId = unitIdAset(a, stafMap)
      const u = uId ? unitMap.get(uId) : undefined
      return {
        ...a,
        _staf: a.pemegang === 'staf' && a.stafId ? (stafMap.get(a.stafId) ?? null) : null,
        _nama: namaPemegang(a, stafMap),
        _unit: u ?? null,
        _bahagian: u ? (bahagianMap.get(u.bahagianId) ?? null) : null,
      }
    })
    return {
      sedia,
      ralat,
      bahagian,
      unit,
      staf,
      aset,
      asetPenuh,
      bahagianMap,
      unitMap,
      stafMap,
      asetMap: new Map(asetPenuh.map((x) => [x.id, x])),
    }
  }, [data, ralat])

  return <DataContext.Provider value={nilai}>{children}</DataContext.Provider>
}

export function useData(): NilaiData {
  const nilai = useContext(DataContext)
  if (!nilai) throw new Error('useData mesti digunakan dalam DataProvider')
  return nilai
}
