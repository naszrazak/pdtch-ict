import { useState, type FormEvent } from 'react'
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Auth'
import { Medan, Ralat, mesejRalat } from '../components/ui'

// Dipaparkan bila pengguna sudah log masuk tetapi tiada profil aktif dalam sistem.
// Jika sistem belum pernah dimulakan, pengguna pertama boleh menjadikan dirinya Admin.
export default function Persediaan() {
  const { user, profil, sistemDimulakan, setSistemDimulakan, keluar } = useAuth()
  const [nama, setNama] = useState('')
  const [ralat, setRalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const emel = user?.email?.toLowerCase() ?? ''

  async function mulakan(e: FormEvent) {
    e.preventDefault()
    setSibuk(true)
    setRalat('')
    try {
      const batch = writeBatch(db)
      batch.set(doc(db, 'pengguna', emel), { nama: nama.trim(), peranan: 'admin', aktif: true, dicipta: serverTimestamp() })
      batch.set(doc(db, 'config', 'sistem'), { dimulakanOleh: emel, dimulakanPada: serverTimestamp() })
      await batch.commit()
      setSistemDimulakan(true)
    } catch (err) {
      setRalat(mesejRalat(err))
      setSibuk(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md space-y-4">
        <h1 className="text-lg font-semibold">Aset ICT PDTCH</h1>
        {!sistemDimulakan ? (
          <form onSubmit={mulakan} className="space-y-4">
            <p className="text-sm text-slate-600">
              Sistem belum dimulakan. Akaun <b>{emel}</b> akan didaftarkan sebagai <b>Admin pertama</b>. Langkah ini hanya
              boleh dibuat sekali.
            </p>
            <Ralat>{ralat}</Ralat>
            <Medan label="Nama paparan">
              <input className="input" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: FT" required />
            </Medan>
            <button className="btn-primary w-full" disabled={sibuk}>
              Mulakan sistem
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-600">
            {profil && !profil.aktif
              ? `Akaun ${emel} telah dinyahaktifkan.`
              : `Akaun ${emel} belum didaftarkan sebagai pengguna sistem.`}{' '}
            Sila hubungi Admin (FT) untuk akses.
          </p>
        )}
        <button className="btn-secondary w-full" onClick={keluar}>
          Log keluar
        </button>
      </div>
    </div>
  )
}
