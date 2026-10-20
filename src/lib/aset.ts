import type { Aset, DataAset, JenisPemegang, Staf, Unit } from '../types'
import { GUNASAMA } from './konstan'

// Medan pilihan yang menjadikan aset "belum lengkap" jika kosong.
export const MEDAN_WAJIB_LENGKAP = [
  { medan: 'noSiri', label: 'No. siri' },
  { medan: 'noPendaftaran', label: 'No. pendaftaran' },
  { medan: 'tarikhTamatWarranty', label: 'Tarikh warranty' },
] as const satisfies readonly { medan: keyof DataAset; label: string }[]

export function medanTidakLengkap(aset: Partial<DataAset>): string[] {
  return MEDAN_WAJIB_LENGKAP.filter(({ medan }) => !String(aset[medan] ?? '').trim()).map((m) => m.label)
}

type RujukanPemegang = Pick<Aset, 'pemegang' | 'stafId' | 'unitId'>

// Unit aset dikira daripada staf pemegang supaya kekal betul bila staf bertukar unit.
export function unitIdAset(aset: RujukanPemegang, stafMap: Map<string, Staf>): string | null {
  if (aset.pemegang === 'staf') return (aset.stafId && stafMap.get(aset.stafId)?.unitId) || aset.unitId || null
  return aset.unitId ?? null
}

export function namaPemegang(aset: RujukanPemegang, stafMap: Map<string, Staf>): string {
  if (aset.pemegang === 'staf') return (aset.stafId && stafMap.get(aset.stafId)?.nama) || '(staf tiada)'
  return GUNASAMA
}

export function jawatanGred(staf: Pick<Staf, 'jawatan' | 'gred'> | null | undefined): string {
  if (!staf) return ''
  return [staf.jawatan, staf.gred]
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
    .join(' / ')
}

export function jenamaModel(aset: Partial<Pick<DataAset, 'jenama' | 'model'>>): string {
  return [aset.jenama, aset.model]
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
    .join(' / ')
}

export function formatTarikh(iso: string | null | undefined): string {
  if (!iso) return ''
  const [y, m, d] = String(iso).split('-')
  if (!y || !m || !d) return String(iso)
  return `${d}/${m}/${y}`
}

// Nilai banding untuk mengisih ikut nama dengan susunan bahasa Melayu.
export const bandingNama = (a: unknown, b: unknown): number =>
  String(a ?? '').localeCompare(String(b ?? ''), 'ms', { sensitivity: 'base' })

interface BolehSusun {
  nama: string
  susunan?: number
}

export function bandingSusunan(a: BolehSusun, b: BolehSusun): number {
  const sa = a.susunan ?? Number.MAX_SAFE_INTEGER
  const sb = b.susunan ?? Number.MAX_SAFE_INTEGER
  return sa - sb || bandingNama(a.nama, b.nama)
}

// Label pemegang untuk sejarah (disimpan sebagai teks supaya kekal walaupun staf dipadam kemudian).
export function labelPemegang({
  pemegang,
  staf,
  unit,
}: {
  pemegang: JenisPemegang
  staf: Staf | null | undefined
  unit: Unit | null | undefined
}): string {
  const namaUnit = unit?.nama ? ` (${unit.nama})` : ''
  return pemegang === 'staf' ? `${staf?.nama ?? '(staf tiada)'}${namaUnit}` : `${GUNASAMA}${namaUnit}`
}

export function pemegangBerubah(lama: RujukanPemegang | null | undefined, baru: RujukanPemegang): boolean {
  if (!lama) return true
  if (lama.pemegang !== baru.pemegang) return true
  return baru.pemegang === 'staf' ? lama.stafId !== baru.stafId : lama.unitId !== baru.unitId
}

// Aset yang boleh dijadikan induk: bukan diri sendiri dan bukan aset yang sudah terikat di bawahnya.
export function bolehJadiInduk(calon: Aset, asetId: string | undefined, asetSemua: Aset[]): boolean {
  if (!asetId) return true
  let semasa: Aset | undefined = calon
  for (let langkah = 0; semasa && langkah < 50; langkah++) {
    if (semasa.id === asetId) return false
    const indukId: string | null = semasa.indukId
    semasa = asetSemua.find((x) => x.id === indukId)
  }
  return true
}
