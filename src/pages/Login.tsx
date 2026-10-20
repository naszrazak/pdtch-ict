import { useState, type FormEvent } from 'react'
import { FirebaseError } from 'firebase/app'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { Medan, Ralat } from '../components/ui'

const MESEJ: Record<string, string> = {
  'auth/invalid-credential': 'Emel atau kata laluan salah.',
  'auth/invalid-email': 'Format emel tidak sah.',
  'auth/too-many-requests': 'Terlalu banyak cubaan. Cuba sebentar lagi.',
  'auth/network-request-failed': 'Tiada sambungan internet.',
}

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
