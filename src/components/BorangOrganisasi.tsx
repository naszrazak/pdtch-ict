import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth, usePengguna } from '../context/Auth'
import { useData } from '../context/Data'
import { dataAsal, padam, simpan } from '../lib/tulis'
import type { Bahagian, Staf, Unit } from '../types'
import { Medan, Modal, Ralat, mesejRalat } from './ui'

function useHantar(onTutup: () => void) {
  const [ralat, setRalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  async function jalankan(fn: () => Promise<unknown>) {
    setRalat('')
    setSibuk(true)
    try {
      await fn()
      onTutup()
    } catch (e) {
      setRalat(mesejRalat(e))
      setSibuk(false)
    }
  }
  return { ralat, setRalat, sibuk, jalankan }
}

function Butang({ sibuk, onPadam, onTutup }: { sibuk: boolean; onPadam: (() => void) | null; onTutup: () => void }) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <button className="btn-primary" disabled={sibuk}>
        Simpan
      </button>
      <button type="button" className="btn-secondary" onClick={onTutup}>
        Batal
      </button>
      {onPadam && (
        <button type="button" className="btn-danger ml-auto" disabled={sibuk} onClick={onPadam}>
          Padam
        </button>
      )}
    </div>
  )
}

export function BorangBahagian({ asal, onTutup }: { asal?: Bahagian; onTutup: () => void }) {
  const { isAdmin } = useAuth()
  const pengguna = usePengguna()
  const { bahagian, unit } = useData()
  const [nama, setNama] = useState(asal?.nama ?? '')
  const [susunan, setSusunan] = useState(asal?.susunan ?? bahagian.length + 1)
  const { ralat, setRalat, sibuk, jalankan } = useHantar(onTutup)

  const hantar = (e: FormEvent) => {
    e.preventDefault()
    jalankan(() =>
      simpan(pengguna, {
        koleksi: 'bahagian',
        id: asal?.id ?? null,
        data: { nama: nama.trim(), susunan: Number(susunan) },
        sebelum: asal && dataAsal(asal),
        ringkasan: `${asal ? 'Kemaskini' : 'Tambah'} bahagian ${nama.trim()}`,
      }),
    )
  }
  const padamIni = () => {
    if (!asal) return
    if (unit.some((u) => u.bahagianId === asal.id)) return setRalat('Bahagian masih mempunyai unit. Pindah atau padam unit dahulu.')
    if (!window.confirm(`Padam ${asal.nama}?`)) return
    jalankan(() => padam(pengguna, { koleksi: 'bahagian', id: asal.id, sebelum: dataAsal(asal), ringkasan: `Padam bahagian ${asal.nama}` }))
  }

  return (
    <Modal tajuk={asal ? 'Kemaskini Bahagian' : 'Tambah Bahagian'} onTutup={onTutup}>
      <form onSubmit={hantar} className="space-y-3">
        <Ralat>{ralat}</Ralat>
        <Medan label="Nama bahagian">
          <input className="input" value={nama} onChange={(e) => setNama(e.target.value)} required />
        </Medan>
        <Medan label="Susunan" nota="Nombor kecil dipaparkan dahulu.">
          <input className="input" type="number" value={susunan} onChange={(e) => setSusunan(Number(e.target.value))} required />
        </Medan>
        <Butang sibuk={sibuk} onTutup={onTutup} onPadam={asal && isAdmin ? padamIni : null} />
      </form>
    </Modal>
  )
}

export function BorangUnit({ asal, bahagianId, onTutup }: { asal?: Unit; bahagianId?: string; onTutup: () => void }) {
  const { isAdmin } = useAuth()
  const pengguna = usePengguna()
  const { bahagian, unit, staf, aset } = useData()
  const [f, setF] = useState({
    nama: asal?.nama ?? '',
    bahagianId: asal?.bahagianId ?? bahagianId ?? '',
    susunan: asal?.susunan ?? unit.length + 1,
  })
  const { ralat, setRalat, sibuk, jalankan } = useHantar(onTutup)

  const hantar = (e: FormEvent) => {
    e.preventDefault()
    jalankan(() =>
      simpan(pengguna, {
        koleksi: 'unit',
        id: asal?.id ?? null,
        data: { nama: f.nama.trim(), bahagianId: f.bahagianId, susunan: Number(f.susunan) },
        sebelum: asal && dataAsal(asal),
        ringkasan: `${asal ? 'Kemaskini' : 'Tambah'} unit ${f.nama.trim()}`,
      }),
    )
  }
  const padamIni = () => {
    if (!asal) return
    if (staf.some((s) => s.unitId === asal.id) || aset.some((a) => a.pemegang === 'gunasama' && a.unitId === asal.id))
      return setRalat('Unit masih mempunyai staf atau aset gunasama. Pindahkan dahulu.')
    if (!window.confirm(`Padam ${asal.nama}?`)) return
    jalankan(() => padam(pengguna, { koleksi: 'unit', id: asal.id, sebelum: dataAsal(asal), ringkasan: `Padam unit ${asal.nama}` }))
  }

  return (
    <Modal tajuk={asal ? 'Kemaskini Unit' : 'Tambah Unit'} onTutup={onTutup}>
      <form onSubmit={hantar} className="space-y-3">
        <Ralat>{ralat}</Ralat>
        <Medan label="Nama unit">
          <input className="input" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} required />
        </Medan>
        <Medan label="Bahagian">
          <select className="input" value={f.bahagianId} onChange={(e) => setF({ ...f, bahagianId: e.target.value })} required>
            <option value="">-- Pilih --</option>
            {bahagian.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nama}
              </option>
            ))}
          </select>
        </Medan>
        <Medan label="Susunan">
          <input className="input" type="number" value={f.susunan} onChange={(e) => setF({ ...f, susunan: Number(e.target.value) })} required />
        </Medan>
        <Butang sibuk={sibuk} onTutup={onTutup} onPadam={asal && isAdmin ? padamIni : null} />
      </form>
    </Modal>
  )
}

export function BorangStaf({
  asal,
  unitId,
  onTutup,
  onDipadam,
}: {
  asal?: Staf
  unitId?: string
  onTutup: () => void
  onDipadam?: () => void
}) {
  const { isAdmin } = useAuth()
  const pengguna = usePengguna()
  const { unit, staf, aset } = useData()
  const [f, setF] = useState({
    nama: asal?.nama ?? '',
    jawatan: asal?.jawatan ?? '',
    gred: asal?.gred ?? '',
    unitId: asal?.unitId ?? unitId ?? '',
    susunan: asal?.susunan ?? Math.max(0, ...staf.filter((s) => s.unitId === (unitId ?? asal?.unitId)).map((s) => s.susunan ?? 0)) + 1,
  })
  const { ralat, setRalat, sibuk, jalankan } = useHantar(onTutup)
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  const hantar = (e: FormEvent) => {
    e.preventDefault()
    const nama = f.nama.trim().toUpperCase()
    jalankan(() =>
      simpan(pengguna, {
        koleksi: 'staf',
        id: asal?.id ?? null,
        data: { nama, jawatan: f.jawatan.trim(), gred: f.gred.trim().toUpperCase(), unitId: f.unitId, susunan: Number(f.susunan) },
        sebelum: asal && dataAsal(asal),
        ringkasan: `${asal ? 'Kemaskini' : 'Tambah'} staf ${nama}`,
      }),
    )
  }
  const padamIni = () => {
    if (!asal) return
    if (aset.some((a) => a.pemegang === 'staf' && a.stafId === asal.id))
      return setRalat('Staf ini masih memegang aset. Pindahkan aset kepada pemegang lain dahulu.')
    if (!window.confirm(`Padam staf ${asal.nama}?`)) return
    jalankan(async () => {
      await padam(pengguna, { koleksi: 'staf', id: asal.id, sebelum: dataAsal(asal), ringkasan: `Padam staf ${asal.nama}` })
      onDipadam?.()
    })
  }

  return (
    <Modal tajuk={asal ? 'Kemaskini Staf' : 'Tambah Staf'} onTutup={onTutup}>
      <form onSubmit={hantar} className="space-y-3">
        <Ralat>{ralat}</Ralat>
        <Medan label="Nama">
          <input className="input" value={f.nama} onChange={set('nama')} autoCapitalize="characters" required />
        </Medan>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Medan label="Jawatan">
              <input className="input" value={f.jawatan} onChange={set('jawatan')} />
            </Medan>
          </div>
          <Medan label="Gred">
            <input className="input" value={f.gred} onChange={set('gred')} placeholder="N19" />
          </Medan>
        </div>
        <Medan label="Unit">
          <select className="input" value={f.unitId} onChange={set('unitId')} required>
            <option value="">-- Pilih --</option>
            {unit.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nama}
              </option>
            ))}
          </select>
        </Medan>
        <Medan label="Susunan dalam unit" nota="Menentukan susunan nama dalam laporan.">
          <input className="input" type="number" value={f.susunan} onChange={set('susunan')} required />
        </Medan>
        <Butang sibuk={sibuk} onTutup={onTutup} onPadam={asal && isAdmin ? padamIni : null} />
      </form>
    </Modal>
  )
}
