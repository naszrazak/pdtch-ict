import type { LangkahJejak } from '../components/ui'
import type { Bahagian, Staf, Unit } from '../types'

// Laluan breadcrumb organisasi: Organisasi & Staf › bahagian › unit › staf.
export function jejakOrganisasi(
  bahagian: Bahagian | null | undefined,
  unit: Unit | null | undefined,
  staf?: Staf | null,
): LangkahJejak[] {
  const langkah: LangkahJejak[] = [{ label: 'Organisasi & Staf', to: '/organisasi' }]
  if (bahagian) langkah.push({ label: bahagian.nama })
  if (unit) langkah.push({ label: unit.nama, to: `/organisasi?unit=${unit.id}` })
  if (staf) langkah.push({ label: staf.nama, to: `/staf/${staf.id}` })
  return langkah
}
