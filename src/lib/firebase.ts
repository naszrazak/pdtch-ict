import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

// Konfigurasi web app Firebase. Nilai ini bukan rahsia; keselamatan dikawal oleh
// firestore.rules dan storage.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyAmUM6m78zdvaW9VXxMa_ltPBVd5fM6Ryc',
  authDomain: 'pdtch-ict.firebaseapp.com',
  projectId: 'pdtch-ict',
  storageBucket: 'pdtch-ict.firebasestorage.app',
  messagingSenderId: '924891203644',
  appId: '1:924891203644:web:5f386573779c1b163c9b39',
}

// `npm run dev:emulator` menyambung ke Firebase Emulator tempatan untuk ujian tanpa menyentuh data sebenar.
const emulator = import.meta.env.VITE_EMULATOR === '1'

export const app = initializeApp(
  emulator ? { ...firebaseConfig, projectId: 'demo-pdtch-ict', storageBucket: 'demo-pdtch-ict.appspot.com' } : firebaseConfig,
)
export const auth = getAuth(app)
// Cache tempatan supaya sistem masih boleh dibaca bila liputan lemah semasa inventori.
export const db = initializeFirestore(app, {
  localCache: emulator ? memoryLocalCache() : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
export const storage = getStorage(app)

if (emulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}
