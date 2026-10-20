import { useEffect, useState, type FormEvent } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth, usePengguna } from '../context/Auth'
import { PERANAN, labelPeranan, type KodPeranan } from '../lib/konstan'
import { dataAsal, padam, simpan } from '../lib/tulis'
import type { Profil } from '../types'

// Dokumen /pengguna/{emel}: id ialah emel.
type RekodPengguna = Omit<Profil, 'emel'> & { id: string }
import { Medan, Modal, Ralat, TajukHalaman, mesejRalat } from '../components/ui'

function BorangPengguna({ asal, onTutup }: { asal?: RekodPengguna; onTutup: () => void }) {
  const { profil } = useAuth()
  const pengguna = usePengguna()
  const [f, setF] = useState<{ emel: string; nama: string; peranan: KodPeranan; aktif: boolean }>({
    emel: asal?.id ?? '',
    nama: asal?.nama ?? '',
    peranan: asal?.peranan ?? 'juruteknik',
    aktif: asal?.aktif ?? true,
  })
  const [ralat, setRalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const diriSendiri = asal?.id === profil?.emel

  async function jalankan(fn: () => Promise<unknown>) {
    setSibuk(true)
    setRalat('')
    try {
      await fn()
      onTutup()
    } catch (e) {
      setRalat(mesejRalat(e))
      setSibuk(false)
    }
  }

  const hantar = (e: FormEvent) => {
    e.preventDefault()
    const emel = f.emel.trim().toLowerCase()
    jalankan(() =>
      simpan(pengguna, {
        koleksi: 'pengguna',
        id: asal ? emel : null,
        idBaru: emel,
        data: { nama: f.nama.trim(), peranan: f.peranan, aktif: f.aktif },
        sebelum: asal ? dataAsal(asal) : null,
        ringkasan: `${asal ? 'Kemaskini' : 'Tambah'} pengguna ${emel} (${labelPeranan(f.peranan)})`,
      }),
    )
  }

  const padamIni = () => {
    if (!asal || !window.confirm(`Buang akses ${asal.id}?`)) return
    jalankan(() => padam(pengguna, { koleksi: 'pengguna', id: asal.id, sebelum: dataAsal(asal), ringkasan: `Buang pengguna ${asal.id}` }))
  }

  return (
    <Modal tajuk={asal ? 'Kemaskini Pengguna' : 'Tambah Pengguna'} onTutup={onTutup}>
      <form onSubmit={hantar} className="space-y-3">
        <Ralat>{ralat}</Ralat>
        <Medan label="Emel" nota={!asal && 'Mesti sama dengan emel akaun log masuk yang dicipta dalam Firebase Authentication.'}>
          <input className="input" type="email" value={f.emel} disabled={!!asal} onChange={(e) => setF({ ...f, emel: e.target.value })} required />
        </Medan>
        <Medan label="Nama paparan">
          <input className="input" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} placeholder="Contoh: PPTM" />
        </Medan>
        <Medan label="Peranan">
          <select className="input" value={f.peranan} disabled={diriSendiri} onChange={(e) => setF({ ...f, peranan: e.target.value as KodPeranan })}>
            {PERANAN.map((p) => (
              <option key={p.kod} value={p.kod}>
                {p.label} ({p.huraian})
              </option>
            ))}
          </select>
        </Medan>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.aktif} disabled={diriSendiri} onChange={(e) => setF({ ...f, aktif: e.target.checked })} />
          Aktif
        </label>
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="btn-primary" disabled={sibuk}>
            Simpan
          </button>
          <button type="button" className="btn-secondary" onClick={onTutup}>
            Batal
          </button>
          {asal && !diriSendiri && (
            <button type="button" className="btn-danger ml-auto" disabled={sibuk} onClick={padamIni}>
              Buang akses
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default function Pengguna() {
  const [senarai, setSenarai] = useState<RekodPengguna[]>([])
  const [borang, setBorang] = useState<{ asal?: RekodPengguna } | null>(null)

  useEffect(
    () => onSnapshot(collection(db, 'pengguna'), (s) => setSenarai(s.docs.map((d) => ({ id: d.id, ...d.data() }) as RekodPengguna))),
    [],
  )

  return (
    <div className="mx-auto max-w-3xl">
      <TajukHalaman tajuk="Pengguna Sistem" keterangan="Personel IT yang boleh log masuk ke sistem">
        <button className="btn-primary" onClick={() => setBorang({})}>
          + Tambah pengguna
        </button>
      </TajukHalaman>
      <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
        Untuk menambah pengguna: (1) cipta akaun emel/kata laluan di Firebase Console → Authentication → Users, kemudian (2) tambah
        emel yang sama di sini dan pilih peranan.
      </div>
      <ul className="space-y-2">
        {senarai.map((p) => (
          <li key={p.id}>
            <button className="card flex w-full items-center justify-between text-left hover:ring-2 hover:ring-blue-200" onClick={() => setBorang({ asal: p })}>
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.nama || p.id}</span>
                <span className="block truncate text-sm text-slate-500">{p.id}</span>
              </span>
              <span className="shrink-0 text-right text-sm">
                {labelPeranan(p.peranan)}
                {!p.aktif && <span className="block text-xs text-red-600">Tidak aktif</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {borang && <BorangPengguna asal={borang.asal} onTutup={() => setBorang(null)} />}
    </div>
  )
}
