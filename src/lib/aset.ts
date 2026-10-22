import type { Aset, DataAset, JenisPemegang, Staf, Unit } from '../types'
import { GUNASAMA, TUNJUK_WARRANTY } from './konstan'

// Medan pilihan yang menjadikan aset "belum lengkap" jika kosong.
export const MEDAN_WAJIB_LENGKAP = [
  { medan: 'noSiri', label: 'No. siri' },
  { medan: 'noPendaftaran', label: 'No. pendaftaran' },
  { medan: 'tempohWarranty', label: 'Tempoh warranty' },
] as const satisfies readonly { medan: keyof DataAset; label: string }[]

const MEDAN_DISEMAK = MEDAN_WAJIB_LENGKAP.filter((m) => TUNJUK_WARRANTY || m.medan !== 'tempohWarranty')

export function medanTidakLengkap(aset: Partial<DataAset>): string[] {
  // Rekod lama yang hanya ada tarikh tamat dikira sudah ada maklumat warranty.
  const ada = (medan: keyof DataAset) =>
    !!String(aset[medan] ?? '').trim() || (medan === 'tempohWarranty' && !!aset.tarikhTamatWarranty)
  return MEDAN_DISEMAK.filter(({ medan }) => !ada(medan)).map((m) => m.label)
}

// Semua no. siri pada aset (termasuk monitor), huruf besar, untuk semakan pendua.
export function sirinya(aset: Pick<DataAset, 'noSiri' | 'noSiriMonitor'>): string[] {
  return [aset.noSiri, aset.noSiriMonitor].map((x) => String(x ?? '').trim().toUpperCase()).filter(Boolean)
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
    .join(' ')
}

export function jenamaModel(aset: Partial<Pick<DataAset, 'jenama' | 'model'>>): string {
  return [aset.jenama, aset.model]
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
    .join(' ')
}

export function tambahTahun(iso: string, tahun: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  const t = new Date(Date.UTC(y + tahun, m - 1, d))
  return t.toISOString().slice(0, 10)
}

// Tempoh (tahun penuh) bagi rekod lama yang hanya menyimpan tarikh terima dan tarikh tamat.
export function tempohDariTarikh(terima: string, tamat: string): number | null {
  if (!terima || !tamat) return null
  const tahun = Number(tamat.slice(0, 4)) - Number(terima.slice(0, 4))
  return tahun > 0 && tambahTahun(terima, tahun) === tamat ? tahun : null
}

export function labelWarranty(aset: Pick<DataAset, 'tempohWarranty' | 'tarikhTamatWarranty'>): string {
  const tamat = formatTarikh(aset.tarikhTamatWarranty)
  if (!aset.tempohWarranty) return tamat
  return `${aset.tempohWarranty} tahun${tamat ? ` (tamat ${tamat})` : ''}`
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

// Kekananan jawatan: DO, CADO, kemudian ADO disenaraikan dahulu; jawatan lain ikut susunan biasa.
const KEKANANAN = [/^PEGAWAI DAERAH\b/, /^KETUA PENOLONG PEGAWAI DAERAH\b/, /^PENOLONG PEGAWAI DAERAH\b/]

export function kekananan(jawatan: string | null | undefined): number {
  const j = String(jawatan ?? '')
    .toUpperCase()
    .replace(/\./g, ' ')
    .replace(/\bPEN\b/g, 'PENOLONG')
    .replace(/\bPEG\b/g, 'PEGAWAI')
    .replace(/\s+/g, ' ')
    .trim()
  const i = KEKANANAN.findIndex((r) => r.test(j))
  return i < 0 ? KEKANANAN.length : i
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
