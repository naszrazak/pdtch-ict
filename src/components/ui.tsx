import { useEffect, type ReactNode } from 'react'
import { labelStatus, warnaStatus } from '../lib/konstan'

export function Memuat({ penuh = false, teks = 'Memuatkan...' }: { penuh?: boolean; teks?: string }) {
  return (
    <div className={`flex items-center justify-center text-sm text-slate-500 ${penuh ? 'min-h-screen' : 'py-12'}`}>
      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-800" />
      {teks}
    </div>
  )
}

export function LencanaStatus({ status }: { status: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${warnaStatus(status)}`}>
      {labelStatus(status)}
    </span>
  )
}

export function Kosong({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{children}</div>
}

export function Ralat({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{children}</div>
}

export function TajukHalaman({ tajuk, keterangan, children }: { tajuk: string; keterangan?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{tajuk}</h1>
        {keterangan && <p className="text-sm text-slate-500">{keterangan}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function Modal({ tajuk, onTutup, children }: { tajuk: string; onTutup: () => void; children: ReactNode }) {
  useEffect(() => {
    const kekunci = (e: KeyboardEvent) => e.key === 'Escape' && onTutup()
    window.addEventListener('keydown', kekunci)
    return () => window.removeEventListener('keydown', kekunci)
  }, [onTutup])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onTutup}>
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-xl bg-white p-4 shadow-xl sm:max-w-lg sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{tajuk}</h2>
          <button className="rounded p-1 text-2xl leading-none text-slate-400 hover:text-slate-700" onClick={onTutup} aria-label="Tutup">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Medan({ label, children, nota }: { label: string; children: ReactNode; nota?: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {nota && <span className="mt-1 block text-xs text-slate-500">{nota}</span>}
    </label>
  )
}

export function mesejRalat(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e && e.code === 'permission-denied') return 'Anda tiada kebenaran untuk tindakan ini.'
  return e instanceof Error ? e.message : String(e)
}
