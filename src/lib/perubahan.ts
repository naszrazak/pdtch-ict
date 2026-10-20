import type { Perubahan } from '../types'

// Fungsi tulen untuk mengira perbezaan antara dua versi dokumen (untuk log audit).

const MEDAN_DIABAIKAN = new Set(['diciptaPada', 'diciptaOleh', 'dikemaskiniPada', 'dikemaskiniOleh'])

type Dokumen = Record<string, unknown>

const normal = (v: unknown) => (v === undefined || v === '' ? null : v)

export function kiraPerubahan(sebelum: Dokumen | null = {}, selepas: Dokumen | null = {}): Perubahan {
  const perubahan: Perubahan = {}
  const kunci = new Set([...Object.keys(sebelum ?? {}), ...Object.keys(selepas ?? {})])
  for (const k of kunci) {
    if (MEDAN_DIABAIKAN.has(k)) continue
    const dari = normal(sebelum?.[k])
    const ke = normal(selepas?.[k])
    if (JSON.stringify(dari) !== JSON.stringify(ke)) perubahan[k] = { dari, ke }
  }
  return perubahan
}
