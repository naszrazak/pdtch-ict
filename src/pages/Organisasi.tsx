import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useData } from '../context/Data'
import { BorangBahagian, BorangStaf, BorangUnit } from '../components/BorangOrganisasi'
import { Kosong, TajukHalaman } from '../components/ui'
import { jawatanGred } from '../lib/aset'
import type { Bahagian, Staf, Unit } from '../types'

type BorangTerbuka =
  | { jenis: 'bahagian'; asal?: Bahagian }
  | { jenis: 'unit'; asal?: Unit; bahagianId?: string }
  | { jenis: 'staf'; unitId: string }

export default function Organisasi() {
  const { isAdmin, bolehTulis } = useAuth()
  const { bahagian, unit, staf, asetPenuh } = useData()
  const [borang, setBorang] = useState<BorangTerbuka | null>(null)
  // ?unit=ID (dari breadcrumb) membuka unit itu terus.
  const unitDipilih = useSearchParams()[0].get('unit')
  const [terbuka, setTerbuka] = useState(() => new Set<string>(unitDipilih ? [unitDipilih] : []))
  useEffect(() => {
    if (unitDipilih) document.getElementById(`unit-${unitDipilih}`)?.scrollIntoView({ block: 'start' })
  }, [unitDipilih])
  const [q, setQ] = useState('')
  const tutup = () => setBorang(null)

  const bilAset = new Map<string, number>()
  for (const a of asetPenuh) {
    if (a.status === 'dilupus') continue
    const k = a._staf ? `s:${a._staf.id}` : `u:${a.unitId}`
    bilAset.set(k, (bilAset.get(k) ?? 0) + 1)
  }

  const kata = q.toLowerCase().trim()
  const padanStaf = (s: Staf) => !kata || `${s.nama} ${s.jawatan} ${s.gred ?? ''}`.toLowerCase().includes(kata)
  const togol = (id: string) =>
    setTerbuka((t) => {
      const n = new Set(t)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <>
      <TajukHalaman tajuk="Organisasi & Staf" keterangan={`${bahagian.length} bahagian · ${unit.length} unit · ${staf.length} staf`}>
        {isAdmin && (
          <button className="btn-secondary" onClick={() => setBorang({ jenis: 'bahagian' })}>
            + Bahagian
          </button>
        )}
      </TajukHalaman>

      <input
        className="input mb-4"
        type="search"
        placeholder="Cari staf (nama / jawatan)..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {bahagian.length === 0 && (
        <Kosong>
          Tiada data organisasi.{' '}
          {isAdmin && (
            <Link to="/import" className="text-blue-800 underline">
              Import senarai staf
            </Link>
          )}
        </Kosong>
      )}

      <div className="space-y-4">
        {bahagian.map((b) => (
          <section key={b.id} className="card">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-blue-900">{b.nama}</h2>
              {isAdmin && (
                <div className="flex gap-3 text-sm">
                  <button className="text-blue-800 underline" onClick={() => setBorang({ jenis: 'unit', bahagianId: b.id })}>
                    + Unit
                  </button>
                  <button className="text-slate-600 underline" onClick={() => setBorang({ jenis: 'bahagian', asal: b })}>
                    Ubah
                  </button>
                </div>
              )}
            </div>
            <ul className="divide-y">
              {unit
                .filter((u) => u.bahagianId === b.id)
                .map((u) => {
                  const ahli = staf.filter((s) => s.unitId === u.id)
                  const tapis = ahli.filter(padanStaf)
                  if (kata && tapis.length === 0) return null
                  const buka = kata || terbuka.has(u.id)
                  return (
                    <li key={u.id} id={`unit-${u.id}`} className="scroll-mt-4 py-2">
                      <button className="flex w-full items-center justify-between text-left" onClick={() => togol(u.id)}>
                        <span className="font-medium">
                          <span className="mr-1 inline-block w-4 text-slate-400">{buka ? '▾' : '▸'}</span>
                          {u.nama}
                        </span>
                        <span className="text-xs text-slate-500">{ahli.length} staf</span>
                      </button>
                      {buka && (
                        <div className="mt-2 pl-5">
                          <ul className="divide-y text-sm">
                            {tapis.map((s) => (
                              <li key={s.id}>
                                <Link to={`/staf/${s.id}`} className="flex items-center justify-between gap-2 py-1.5 hover:bg-blue-50">
                                  <span className="min-w-0">
                                    <span className="block truncate">{s.nama}</span>
                                    <span className="block truncate text-xs text-slate-500">
                                      {jawatanGred(s) || '-'}
                                    </span>
                                  </span>
                                  <span className="shrink-0 text-xs text-slate-500">{bilAset.get(`s:${s.id}`) ?? 0} aset</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            <Link to={`/aset?unitId=${u.id}`} className="text-blue-800 underline">
                              Semua aset unit
                            </Link>
                            <span className="text-slate-500">GUNASAMA: {bilAset.get(`u:${u.id}`) ?? 0}</span>
                            {bolehTulis && (
                              <>
                                <button className="text-blue-800 underline" onClick={() => setBorang({ jenis: 'staf', unitId: u.id })}>
                                  + Staf
                                </button>
                                <Link to={`/aset/baru?unitId=${u.id}`} className="text-blue-800 underline">
                                  + Aset gunasama
                                </Link>
                              </>
                            )}
                            {isAdmin && (
                              <button className="text-slate-600 underline" onClick={() => setBorang({ jenis: 'unit', asal: u })}>
                                Ubah unit
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
            </ul>
          </section>
        ))}
      </div>

      {borang?.jenis === 'bahagian' && <BorangBahagian asal={borang.asal} onTutup={tutup} />}
      {borang?.jenis === 'unit' && <BorangUnit asal={borang.asal} bahagianId={borang.bahagianId} onTutup={tutup} />}
      {borang?.jenis === 'staf' && <BorangStaf unitId={borang.unitId} onTutup={tutup} />}
    </>
  )
}
