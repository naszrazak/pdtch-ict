import { test } from 'node:test'
import assert from 'node:assert/strict'
import { huraiSenaraiStaf, jumlahStaf, hurufTajuk } from '../src/lib/importStaf'

const contoh = [
  [],
  ['SENARAI PENERIMA CORPORATE GIFT TAHUN 2026'],
  [],
  ['BAHAGIAN PENGURUSAN DAERAH '],
  ['PEJABAT PEGAWAI DAERAH '],
  ['BIL.', 'NAMA', 'JAWATAN ', 'TANDATANGAN'],
  [1, 'ALI BIN ABU', 'PEGAWAI DAERAH '],
  [2, 'siti binti  ahmad', 'PEM. TADBIR (PO)'],
  [],
  ['UNIT PENTADBIRAN DAN KEWANGAN '],
  ['BIL.', 'NAMA', 'JAWATAN '],
  [1, 'AHMAD BIN ALI', 'PEN. PEG. DAERAH '],
  ['BAHAGIAN PENGURUSAN TANAH'],
  ['UNIT PELUPUSAN TANAH'],
  ['BIL.', 'NAMA', 'JAWATAN '],
  [1, 'CHONG AH KOW', 'PENOLONG PEGAWAI TANAH'],
  ['WARGA KERJA UE'],
  ['BIL.', 'NAMA', 'JAWATAN '],
  [1, 'X', 'Y'],
  [2, 'Z', 'W'],
]

test('hurufTajuk mengekalkan kata hubung huruf kecil', () => {
  assert.equal(hurufTajuk('UNIT PENTADBIRAN DAN KEWANGAN '), 'Unit Pentadbiran dan Kewangan')
})

test('menghurai bahagian, unit dan staf serta mengecualikan Warga Kerja UE', () => {
  const h = huraiSenaraiStaf(contoh)
  assert.deepEqual(h.bahagian.map((b) => b.nama), ['Bahagian Pengurusan Daerah', 'Bahagian Pengurusan Tanah'])
  assert.deepEqual(h.bahagian[0].unit.map((u) => u.nama), ['Pejabat Pegawai Daerah', 'Unit Pentadbiran dan Kewangan'])
  assert.deepEqual(h.bahagian[0].unit[0].staf[1], { bil: 2, nama: 'SITI BINTI AHMAD', jawatan: 'PEM. TADBIR (PO)' })
  assert.equal(jumlahStaf(h), 4)
  assert.deepEqual(h.dikecualikan, [{ nama: 'Warga Kerja UE', bilStaf: 2 }])
  assert.deepEqual(h.amaran, [])
})

test('kumpulan dikecualikan boleh dimasukkan semula', () => {
  const h = huraiSenaraiStaf(contoh, { dikecualikan: [] })
  // "WARGA KERJA UE" tanpa awalan BAHAGIAN dianggap unit di bawah bahagian terakhir.
  assert.equal(jumlahStaf(h), 6)
})
