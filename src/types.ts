import type { Timestamp } from 'firebase/firestore'
import type { KodJenis, KodPeranan, KodStatus } from './lib/konstan'

// Medan jejak yang ditambah oleh lib/tulis pada setiap dokumen.
export interface Jejak {
  diciptaPada?: Timestamp
  diciptaOleh?: string
  dikemaskiniPada?: Timestamp
  dikemaskiniOleh?: string
}

export interface Bahagian extends Jejak {
  id: string
  nama: string
  susunan?: number
}

export interface Unit extends Jejak {
  id: string
  nama: string
  bahagianId: string
  susunan?: number
}

export interface Staf extends Jejak {
  id: string
  nama: string
  jawatan: string
  gred?: string
  unitId: string
  susunan?: number
}

export interface Gambar {
  url: string
  path: string
}

export type JenisPemegang = 'staf' | 'gunasama'

export interface DataAset {
  jenis: KodJenis
  jenama: string
  model: string
  noSiri: string
  noPendaftaran: string
  tarikhTerima: string // YYYY-MM-DD atau ''
  tarikhTamatWarranty: string // YYYY-MM-DD atau ''
  status: KodStatus
  pemegang: JenisPemegang
  stafId: string | null
  unitId: string | null
  bahagianId?: string | null
  indukId: string | null
  catatan: string
  gambar: Gambar[]
}

export interface Aset extends DataAset, Jejak {
  id: string
}

// Aset bersama maklumat pemegang, unit dan bahagian semasa (dikira di pelanggan).
export interface AsetPenuh extends Aset {
  _staf: Staf | null
  _nama: string
  _unit: Unit | null
  _bahagian: Bahagian | null
}

export interface Profil {
  emel: string
  nama?: string
  peranan: KodPeranan
  aktif: boolean
}

// Maklumat ringkas pengguna untuk log audit.
export interface PenggunaLog {
  emel: string
  nama: string
}

export type Perubahan = Record<string, { dari: unknown; ke: unknown }>

export type Tindakan = 'cipta' | 'kemaskini' | 'padam' | 'import'

export interface LogAudit {
  id: string
  masa?: Timestamp
  oleh: string
  namaPengguna: string
  tindakan: Tindakan
  koleksi: string
  dokId: string
  ringkasan: string
  perubahan: Perubahan
}

export interface SejarahPemegang {
  id: string
  masa?: Timestamp
  oleh: string
  dari: string | null
  ke: string
  pemegang: JenisPemegang
  stafId: string | null
  unitId: string | null
}
