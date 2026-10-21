import { useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { Ralat } from '../components/ui'

const MESEJ: Record<string, string> = {
  'auth/network-request-failed': 'Tiada sambungan internet.',
  'auth/too-many-requests': 'Terlalu banyak cubaan. Cuba sebentar lagi.',
  'auth/popup-blocked': 'Tetingkap Google disekat pelayar. Benarkan pop-up dan cuba lagi.',
  'auth/unauthorized-domain': 'Domain ini belum dibenarkan dalam Firebase Authentication.',
  'auth/operation-not-allowed': 'Log masuk Google belum diaktifkan dalam Firebase.',
  'auth/admin-restricted-operation': 'Pendaftaran akaun baharu dimatikan dalam Firebase Authentication.',
}

// Pengguna menutup tetingkap Google sendiri; tiada ralat perlu dipaparkan.
const DIBATALKAN = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']

const mesejAuth = (err: unknown): string =>
  (err instanceof FirebaseError && MESEJ[err.code]) || (err instanceof Error ? err.message : String(err))

export default function Login() {
  const [ralat, setRalat] = useState('')
  const [sibuk, setSibuk] = useState(false)

  async function masuk() {
    setRalat('')
    setSibuk(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (err) {
      if (!(err instanceof FirebaseError && DIBATALKAN.includes(err.code))) setRalat(mesejAuth(err))
      setSibuk(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-blue-900">Aset ICT PDTCH</h1>
          <p className="text-sm text-slate-500">Sistem Senarai Aset ICT</p>
        </div>
        <Ralat>{ralat}</Ralat>
        <button className="btn-primary w-full" onClick={masuk} disabled={sibuk}>
          {sibuk ? 'Sedang log masuk...' : 'Log masuk dengan Google'}
        </button>
      </div>
    </div>
  )
}
