// Dijalankan melalui `npm run test:rules` (emulator Firestore).
import { test, before, after, beforeEach } from 'node:test'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, collection } from 'firebase/firestore'

let env: RulesTestEnvironment
const ADMIN = 'ft@pdtch.gov.my'
const JT = 'jt@pdtch.gov.my'

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-pdtch-ict',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})
after(() => env.cleanup())
beforeEach(() => env.clearFirestore())

const db = (emel: string) => env.authenticatedContext(emel.replace(/\W/g, ''), { email: emel }).firestore()
const jejak = (emel: string) => ({ dikemaskiniOleh: emel, dikemaskiniPada: serverTimestamp() })

async function sediakan() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore()
    await setDoc(doc(d, 'config/sistem'), { dimulakanOleh: ADMIN })
    await setDoc(doc(d, `pengguna/${ADMIN}`), { peranan: 'admin', aktif: true })
    await setDoc(doc(d, `pengguna/${JT}`), { peranan: 'juruteknik', aktif: true })
    await setDoc(doc(d, 'aset/a1'), { jenis: 'pc' })
  })
}

test('persediaan: pengguna pertama boleh jadi admin sekali sahaja', async () => {
  const d = db(ADMIN)
  const b = writeBatch(d)
  b.set(doc(d, `pengguna/${ADMIN}`), { peranan: 'admin', aktif: true, nama: 'FT' })
  b.set(doc(d, 'config/sistem'), { dimulakanOleh: ADMIN, dimulakanPada: serverTimestamp() })
  await assertSucceeds(b.commit())

  const lain = db('orang@luar.com')
  const b2 = writeBatch(lain)
  b2.set(doc(lain, 'pengguna/orang@luar.com'), { peranan: 'admin', aktif: true })
  await assertFails(b2.commit())
  await assertFails(setDoc(doc(lain, 'pengguna/orang@luar.com'), { peranan: 'admin', aktif: true }))
})

test('orang tidak berdaftar tidak boleh baca data', async () => {
  await sediakan()
  await assertFails(getDoc(doc(db('orang@luar.com'), 'aset/a1')))
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'aset/a1')))
})

test('juruteknik boleh tambah dan kemaskini aset tetapi tidak boleh padam', async () => {
  await sediakan()
  const d = db(JT)
  await assertSucceeds(setDoc(doc(d, 'aset/a2'), { jenis: 'ups', ...jejak(JT) }))
  await assertSucceeds(updateDoc(doc(d, 'aset/a1'), { jenama: 'Dell', ...jejak(JT) }))
  await assertFails(updateDoc(doc(d, 'aset/a1'), { jenama: 'HP', ...jejak(ADMIN) }))
  await assertFails(deleteDoc(doc(d, 'aset/a1')))
  await assertFails(setDoc(doc(d, 'bahagian/b1'), { nama: 'X', ...jejak(JT) }))
  await assertFails(getDoc(doc(d, 'logAudit/x')))
})

test('admin boleh padam; log audit tidak boleh diubah atau dipalsukan', async () => {
  await sediakan()
  const d = db(ADMIN)
  await assertSucceeds(deleteDoc(doc(d, 'aset/a1')))
  const ref = doc(collection(d, 'logAudit'))
  await assertSucceeds(setDoc(ref, { oleh: ADMIN, masa: serverTimestamp(), tindakan: 'cipta' }))
  await assertFails(setDoc(doc(collection(d, 'logAudit')), { oleh: JT, masa: serverTimestamp() }))
  await assertFails(updateDoc(ref, { tindakan: 'lain' }))
  await assertFails(deleteDoc(ref))
})

test('admin tidak boleh turunkan peranan sendiri; pengguna nyahaktif hilang akses', async () => {
  await sediakan()
  const d = db(ADMIN)
  await assertFails(updateDoc(doc(d, `pengguna/${ADMIN}`), { peranan: 'juruteknik' }))
  await assertSucceeds(updateDoc(doc(d, `pengguna/${JT}`), { aktif: false }))
  await assertFails(getDoc(doc(db(JT), 'aset/a1')))
  await assertSucceeds(getDoc(doc(db(JT), `pengguna/${JT}`)))
})
