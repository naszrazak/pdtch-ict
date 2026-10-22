export const JENIS_ASET = [
  { kod: 'pc', label: 'Komputer (PC)', tajuk: 'KOMPUTER' },
  { kod: 'laptop', label: 'Komputer Riba', tajuk: 'KOMPUTER RIBA' },
  { kod: 'monitor', label: 'Monitor', tajuk: 'MONITOR' },
  { kod: 'printer', label: 'Pencetak', tajuk: 'PENCETAK' },
  { kod: 'ups', label: 'UPS', tajuk: 'UPS' },
  { kod: 'scanner', label: 'Pengimbas', tajuk: 'PENGIMBAS' },
  { kod: 'projektor', label: 'Projektor', tajuk: 'PROJEKTOR' },
  { kod: 'tablet', label: 'Tablet', tajuk: 'TABLET' },
  { kod: 'lain', label: 'Lain-lain', tajuk: 'LAIN-LAIN' },
] as const

export const STATUS_ASET = [
  { kod: 'aktif', label: 'Aktif', warna: 'bg-green-100 text-green-800' },
  { kod: 'rosak', label: 'Rosak', warna: 'bg-red-100 text-red-800' },
  { kod: 'pembaikan', label: 'Dalam pembaikan', warna: 'bg-amber-100 text-amber-800' },
  { kod: 'dilupus', label: 'Dilupuskan', warna: 'bg-slate-200 text-slate-700' },
] as const

export const PERANAN = [
  { kod: 'admin', label: 'Admin', huraian: 'Akses penuh' },
  { kod: 'juruteknik', label: 'Juruteknik', huraian: 'Boleh tambah dan kemaskini, tidak boleh padam' },
] as const

export type KodJenis = (typeof JENIS_ASET)[number]['kod']
export type KodStatus = (typeof STATUS_ASET)[number]['kod']
export type KodPeranan = (typeof PERANAN)[number]['kod']

export const GUNASAMA = 'GUNASAMA'

// Maklumat warranty disembunyikan buat masa ini (data sedia ada tetap disimpan). Tukar kepada true untuk papar semula.
export const TUNJUK_WARRANTY = false

// Jenis aset yang boleh mempunyai monitor sebagai aksesori (no. siri monitor direkod dalam aset yang sama).
export const JENIS_ADA_MONITOR: readonly KodJenis[] = ['pc', 'laptop']

const cari = <T extends { kod: string }>(senarai: readonly T[], kod: string | null | undefined) =>
  senarai.find((x) => x.kod === kod)

export const labelJenis = (kod: string | null | undefined): string => cari(JENIS_ASET, kod)?.label ?? kod ?? '-'
export const tajukJenis = (kod: string | null | undefined): string =>
  cari(JENIS_ASET, kod)?.tajuk ?? String(kod ?? '').toUpperCase()
export const labelStatus = (kod: string | null | undefined): string => cari(STATUS_ASET, kod)?.label ?? kod ?? '-'
export const warnaStatus = (kod: string | null | undefined): string =>
  cari(STATUS_ASET, kod)?.warna ?? 'bg-slate-100 text-slate-700'
export const labelPeranan = (kod: string | null | undefined): string => cari(PERANAN, kod)?.label ?? kod ?? '-'
