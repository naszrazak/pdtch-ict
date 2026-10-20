import { useSearchParams } from 'react-router-dom'
import type { TapisAset } from './carian'

const KUNCI = ['q', 'bahagianId', 'unitId', 'jenis', 'status'] as const

// Simpan penapis dalam URL supaya kekal bila kembali dari halaman butiran.
export function useTapisUrl(): [TapisAset, (baru: TapisAset) => void] {
  const [params, setParams] = useSearchParams()
  const nilai = Object.fromEntries(KUNCI.map((k) => [k, params.get(k) ?? ''])) as unknown as TapisAset
  const tetapkan = (baru: TapisAset) =>
    setParams(Object.fromEntries(KUNCI.filter((k) => baru[k]).map((k) => [k, baru[k]])), { replace: true })
  return [nilai, tetapkan]
}
