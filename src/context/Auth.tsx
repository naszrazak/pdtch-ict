import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { PenggunaLog, Profil } from '../types'

interface NilaiAuth {
  /** undefined = belum diketahui, null = belum log masuk */
  user: User | null | undefined
  /** undefined = sedang dimuat, null = tiada profil dalam sistem */
  profil: Profil | null | undefined
  sistemDimulakan: boolean | undefined
  setSistemDimulakan: (v: boolean) => void
  memuat: boolean
  sah: boolean
  isAdmin: boolean
  bolehTulis: boolean
  pengguna: PenggunaLog | null
  keluar: () => Promise<void>
}

const AuthContext = createContext<NilaiAuth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined)
  const [sistemDimulakan, setSistemDimulakan] = useState<boolean | undefined>(undefined)

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    if (!user?.email) return
    const emel = user.email.toLowerCase()
    let aktif = true
    const henti = onSnapshot(
      doc(db, 'pengguna', emel),
      { includeMetadataChanges: true },
      (snap) => {
        // Tunggu pengesahan pelayan; jika tidak, data lain dibaca sebelum profil wujud di pelayan dan ditolak.
        if (snap.metadata.hasPendingWrites) return
        setProfil(snap.exists() ? ({ emel, ...snap.data() } as Profil) : null)
      },
      () => setProfil(null),
    )
    getDoc(doc(db, 'config', 'sistem'))
      .then((s) => aktif && setSistemDimulakan(s.exists()))
      .catch(() => aktif && setSistemDimulakan(true))
    return () => {
      aktif = false
      henti()
      setProfil(undefined)
      setSistemDimulakan(undefined)
    }
  }, [user])

  const nilai = useMemo<NilaiAuth>(() => {
    const sah = profil?.aktif === true
    return {
      user,
      profil,
      sistemDimulakan,
      setSistemDimulakan,
      memuat: user === undefined || (!!user && (profil === undefined || sistemDimulakan === undefined)),
      sah,
      isAdmin: sah && profil?.peranan === 'admin',
      bolehTulis: sah && (profil?.peranan === 'admin' || profil?.peranan === 'juruteknik'),
      pengguna: profil ? { emel: profil.emel, nama: profil.nama || profil.emel } : null,
      keluar: () => signOut(auth),
    }
  }, [user, profil, sistemDimulakan])

  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>
}

export function useAuth(): NilaiAuth {
  const nilai = useContext(AuthContext)
  if (!nilai) throw new Error('useAuth mesti digunakan dalam AuthProvider')
  return nilai
}

/** Untuk halaman yang hanya dipaparkan selepas log masuk dan profil sah. */
export function usePengguna(): PenggunaLog {
  const { pengguna } = useAuth()
  if (!pengguna) throw new Error('Pengguna belum log masuk')
  return pengguna
}
