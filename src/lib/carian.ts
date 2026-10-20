import type { AsetPenuh } from '../types'
import { JENIS_ASET } from './konstan'

export interface TapisAset {
  q: string
  bahagianId: string
  unitId: string
  jenis: string
  status: string
}

const normal = (s: unknown) => String(s ?? '').toLowerCase()

// Menapis aset yang telah diperkaya (_nama, _unit, _bahagian) mengikut carian teks dan penapis.
export function tapisAset(aset: AsetPenuh[], tapis: Partial<TapisAset> = {}): AsetPenuh[] {
  const { q = '', bahagianId = '', unitId = '', jenis = '', status = '' } = tapis
  const kata = normal(q).split(/\s+/).filter(Boolean)
  return aset.filter((a) => {
    if (bahagianId && a._bahagian?.id !== bahagianId) return false
    if (unitId && a._unit?.id !== unitId) return false
    if (jenis && a.jenis !== jenis) return false
    if (status && a.status !== status) return false
    if (!kata.length) return true
    const teks = normal([a._nama, a.jenama, a.model, a.noSiri, a.noPendaftaran, a._unit?.nama, a.catatan].join(' '))
    return kata.every((k) => teks.includes(k))
  })
}

const susunJenis = new Map<string, number>(JENIS_ASET.map((j, i) => [j.kod, i]))

export function susunAset(aset: AsetPenuh[]): AsetPenuh[] {
  return [...aset].sort(
    (a, b) =>
      (a._bahagian?.susunan ?? 99) - (b._bahagian?.susunan ?? 99) ||
      (a._unit?.susunan ?? 99) - (b._unit?.susunan ?? 99) ||
      (a._staf ? 0 : 1) - (b._staf ? 0 : 1) ||
      (a._staf?.susunan ?? 0) - (b._staf?.susunan ?? 0) ||
      (susunJenis.get(a.jenis) ?? 99) - (susunJenis.get(b.jenis) ?? 99),
  )
}
