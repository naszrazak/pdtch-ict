import { useState, type FormEvent } from 'react'
import { FirebaseError } from 'firebase/app'
import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { Medan, Ralat } from '../components/ui'

const MESEJ: Record<string, string> = {
  'auth/invalid-credential': 'Emel atau kata laluan salah.',
  'auth/invalid-email': 'Format emel tidak sah.',
  'auth/too-many-requests': 'Terlalu banyak cubaan. Cuba sebentar lagi.',
  'auth/network-request-failed': 'Tiada sambungan internet.',
  'auth/popup-blocked': 'Tetingkap Google disekat pelayar. Benarkan pop-up dan cuba lagi.',
  'auth/unauthorized-domain': 'Domain ini belum dibenarkan dalam Firebase Authentication.',
  'auth/operation-not-allowed': 'Log masuk Google belum diaktifkan dalam Firebase.',
}

// Pengguna menutup tetingkap Google sendiri; tiada ralat perlu dipaparkan.
const DIBATALKAN = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']

const mesejAuth = (err: unknown): string =>
  (err instanceof FirebaseError && MESEJ[err.code]) || (err instanceof Error ? err.message : String(err))

export default function Login() {
  const [emel, setEmel] = useState('')
  const [kataLaluan, setKataLaluan] = useState('')
  const [ralat, setRalat] = useState('')
  const [info, setInfo] = useState('')
  const [sibuk, setSibuk] = useState(false)

  async function masuk(e: FormEvent) {
    e.preventDefault()
    setRalat('')
    setSibuk(true)
    try {
      await signInWithEmailAndPassword(auth, emel.trim(), kataLaluan)
    } catch (err) {
      setRalat(mesejAuth(err))
      setSibuk(false)
    }
  }

  async function masukGoogle() {
    setRalat('')
    setSibuk(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (err) {
      if (!(err instanceof FirebaseError && DIBATALKAN.includes(err.code))) setRalat(mesejAuth(err))
      setSibuk(false)
    }
  }

  async function setSemula() {
    setRalat('')
    if (!emel.trim()) return setRalat('Masukkan emel dahulu.')
    try {
      await sendPasswordResetEmail(auth, emel.trim())
      setInfo('Pautan set semula kata laluan telah dihantar ke emel anda.')
    } catch (err) {
      setRalat(mesejAuth(err))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={masuk} className="card w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-blue-900">Aset ICT PDTCH</h1>
          <p className="text-sm text-slate-500">Sistem Senarai Aset ICT</p>
        </div>
        <Ralat>{ralat}</Ralat>
        {info && <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">{info}</div>}
        <button
          type="button"
          className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          onClick={masukGoogle}
          disabled={sibuk}
        >
          Log masuk dengan Google
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          atau guna emel
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Medan label="Emel">
          <input className="input" type="email" autoComplete="username" value={emel} onChange={(e) => setEmel(e.target.value)} required />
        </Medan>
        <Medan label="Kata laluan">
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={kataLaluan}
            onChange={(e) => setKataLaluan(e.target.value)}
            required
          />
        </Medan>
        <button className="btn-primary w-full" disabled={sibuk}>
          {sibuk ? 'Sedang log masuk...' : 'Log masuk'}
        </button>
        <button type="button" className="w-full text-center text-sm text-blue-800 underline" onClick={setSemula}>
          Lupa kata laluan?
        </button>
      </form>
    </div>
  )
}
