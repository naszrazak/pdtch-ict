import { test } from 'node:test'
import assert from 'node:assert/strict'
import { kiraPerubahan } from '../src/lib/perubahan'

test('hanya medan yang berubah direkod; kosong dan undefined dianggap sama', () => {
  const p = kiraPerubahan(
    { jenama: 'Dell', model: 'X', noSiri: '', dikemaskiniPada: 1 },
    { jenama: 'HP', model: 'X', noSiri: undefined, status: 'aktif', dikemaskiniPada: 2 },
  )
  assert.deepEqual(p, { jenama: { dari: 'Dell', ke: 'HP' }, status: { dari: null, ke: 'aktif' } })
})

test('cipta baharu: semua medan dari null', () => {
  assert.deepEqual(kiraPerubahan(null, { nama: 'A' }), { nama: { dari: null, ke: 'A' } })
})
