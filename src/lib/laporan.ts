import type { Aset, Bahagian, Staf, Unit } from '../types'
import { JENIS_ADA_MONITOR, JENIS_ASET, GUNASAMA, labelJenis, tajukJenis, type KodJenis } from './konstan'
import { bandingSusunan, formatTarikh, jawatanGred, jenamaModel, kekananan, unitIdAset } from './aset'

export const PILIHAN_STATUS_LAPORAN = [
  { kod: 'xdilupus', label: 'Semua kecuali dilupuskan' },
  { kod: 'semua', label: 'Semua status' },
  { kod: 'aktif', label: 'Aktif sahaja' },
  { kod: 'rosak', label: 'Rosak sahaja' },
  { kod: 'pembaikan', label: 'Dalam pembaikan sahaja' },
  { kod: 'dilupus', label: 'Dilupuskan sahaja' },
] as const

// Nilai tapis jenis: semua jenis dalam satu senarai (tanpa diasingkan ikut jenis).
export const JENIS_GABUNG = 'gabung'

export type TapisStatusLaporan = (typeof PILIHAN_STATUS_LAPORAN)[number]['kod']

export interface TapisLaporan {
  bahagianId?: string
  unitId?: string
  jenis?: string
  status?: TapisStatusLaporan
  ikut: 'unit' | 'bahagian'
  lajurWarranty?: boolean
}

export interface BarisLaporan {
  bil: number
  nama: string
  jawatanGred: string
  jenis: string
  jenamaModel: string
  noSiri: string
  noSiriMonitor: string
  noPendaftaran: string
  tarikhWarranty: string
  asetId: string
}

export interface SeksyenLaporan {
  /** null = semua jenis digabung dalam satu senarai */
  jenis: KodJenis | null
  tajuk: string
  subtajuk: string[]
  baris: BarisLaporan[]
}

export interface LajurLaporan {
  kunci: keyof Omit<BarisLaporan, 'asetId'>
  tajuk: string
  lebar: number
}

export interface DataLaporan {
  aset: Aset[]
  staf: Staf[]
  unit: Unit[]
  bahagian: Bahagian[]
}

// Lajur monitor hanya dipaparkan bila laporan mengandungi jenis yang boleh ada monitor.
export const adaLajurMonitor = (seksyen: SeksyenLaporan[]): boolean =>
  seksyen.some((s) => s.jenis === null || JENIS_ADA_MONITOR.includes(s.jenis))

// Lajur jenis aset hanya perlu bila semua jenis digabung dalam satu senarai.
export const adaLajurJenis = (seksyen: SeksyenLaporan[]): boolean => seksyen.some((s) => s.jenis === null)

export function lajurLaporan(lajurWarranty?: boolean, lajurMonitor?: boolean, lajurJenis?: boolean): LajurLaporan[] {
  const lajur: LajurLaporan[] = [
    { kunci: 'bil', tajuk: 'Bil', lebar: 6 },
    { kunci: 'nama', tajuk: 'Nama Pengguna', lebar: 34 },
    { kunci: 'jawatanGred', tajuk: 'Jawatan / Gred', lebar: 28 },
    ...(lajurJenis ? [{ kunci: 'jenis', tajuk: 'Jenis Aset', lebar: 16 } as const] : []),
    { kunci: 'jenamaModel', tajuk: 'Jenama / Model', lebar: 28 },
    { kunci: 'noSiri', tajuk: 'No. Siri', lebar: 22 },
    ...(lajurMonitor ? [{ kunci: 'noSiriMonitor', tajuk: 'No. Siri Monitor', lebar: 22 } as const] : []),
    { kunci: 'noPendaftaran', tajuk: 'No. Pendaftaran', lebar: 26 },
  ]
  if (lajurWarranty) lajur.push({ kunci: 'tarikhWarranty', tajuk: 'Tamat Warranty', lebar: 14 })
  return lajur
}

function lulusStatus(status: string, tapis: TapisStatusLaporan): boolean {
  if (tapis === 'semua') return true
  if (tapis === 'xdilupus') return status !== 'dilupus'
  return status === tapis
}

interface ItemSeksyen {
  a: Aset
  u: Unit
  s: Staf | null
}

interface SeksyenSementara extends Omit<SeksyenLaporan, 'baris'> {
  bahagian: Bahagian
  unit: Unit | null
  susunJenis: number
  item: ItemSeksyen[]
}

/**
 * Menyusun aset kepada seksyen laporan "SENARAI ASET ICT (JENIS)".
 * Satu seksyen bagi setiap gabungan jenis aset dan bahagian (atau unit, ikut pilihan).
 */
export function binaLaporan(data: DataLaporan, tapis: TapisLaporan): SeksyenLaporan[] {
  const { aset, staf, unit, bahagian } = data
  const stafMap = new Map(staf.map((s) => [s.id, s]))
  const unitMap = new Map(unit.map((u) => [u.id, u]))
  const bahagianMap = new Map(bahagian.map((b) => [b.id, b]))
  const ikutUnit = tapis.ikut === 'unit'
  const susunJenis = new Map<string, number>(JENIS_ASET.map((j, i) => [j.kod, i]))

  const seksyen = new Map<string, SeksyenSementara>()
  for (const a of aset) {
    const gabung = tapis.jenis === JENIS_GABUNG
    if (tapis.jenis && !gabung && a.jenis !== tapis.jenis) continue
    if (!lulusStatus(a.status, tapis.status ?? 'xdilupus')) continue
    const uId = unitIdAset(a, stafMap)
    const u = uId ? unitMap.get(uId) : undefined
    if (!u) continue
    const b = bahagianMap.get(u.bahagianId)
    if (!b) continue
    if (tapis.bahagianId && b.id !== tapis.bahagianId) continue
    if (tapis.unitId && u.id !== tapis.unitId) continue

    const kunci = `${gabung ? '' : a.jenis}|${b.id}|${ikutUnit ? u.id : ''}`
    let s = seksyen.get(kunci)
    if (!s) {
      s = {
        jenis: gabung ? null : a.jenis,
        tajuk: `SENARAI ASET ICT (${gabung ? 'SEMUA JENIS' : tajukJenis(a.jenis)})`,
        subtajuk: ikutUnit ? [b.nama.toUpperCase(), u.nama.toUpperCase()] : [b.nama.toUpperCase()],
        bahagian: b,
        unit: ikutUnit ? u : null,
        susunJenis: gabung ? 0 : (susunJenis.get(a.jenis) ?? 99),
        item: [],
      }
      seksyen.set(kunci, s)
    }
    s.item.push({ a, u, s: a.pemegang === 'staf' && a.stafId ? (stafMap.get(a.stafId) ?? null) : null })
  }

  const hasil = [...seksyen.values()].sort(
    (p, q) =>
      bandingSusunan(p.bahagian, q.bahagian) ||
      (p.unit && q.unit ? bandingSusunan(p.unit, q.unit) : 0) ||
      p.susunJenis - q.susunJenis,
  )

  return hasil.map(({ jenis, tajuk, subtajuk, item }) => {
    item.sort(
      (p, q) =>
        kekananan(p.s?.jawatan) - kekananan(q.s?.jawatan) ||
        bandingSusunan(p.u, q.u) ||
        (p.s ? 0 : 1) - (q.s ? 0 : 1) ||
        (p.s && q.s ? bandingSusunan(p.s, q.s) : 0) ||
        (susunJenis.get(p.a.jenis) ?? 99) - (susunJenis.get(q.a.jenis) ?? 99) ||
        String(p.a.noPendaftaran ?? '').localeCompare(String(q.a.noPendaftaran ?? '')),
    )
    return {
      jenis,
      tajuk,
      subtajuk,
      baris: item.map(({ a, s: st }, i) => ({
        bil: i + 1,
        nama: st ? st.nama : a.pemegang === 'staf' ? '(staf tiada)' : GUNASAMA,
        jawatanGred: jawatanGred(st),
        jenis: labelJenis(a.jenis),
        jenamaModel: jenamaModel(a),
        noSiri: a.noSiri ?? '',
        noSiriMonitor: a.noSiriMonitor ?? '',
        noPendaftaran: a.noPendaftaran ?? '',
        tarikhWarranty: formatTarikh(a.tarikhTamatWarranty),
        asetId: a.id,
      })),
    }
  })
}

export function namaFailLaporan(seksyen: SeksyenLaporan[], sambungan: string): string {
  const pertama = seksyen[0]
  const asas = seksyen.length === 1 && pertama ? `${pertama.tajuk} ${pertama.subtajuk.at(-1)}` : 'SENARAI ASET ICT'
  return `${asas
    .replace(/[()]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')}.${sambungan}`
}
