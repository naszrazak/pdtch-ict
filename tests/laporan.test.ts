import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JENIS_GABUNG, binaLaporan, type DataLaporan } from '../src/lib/laporan'
import type { Aset } from '../src/types'

const aset = (a: Partial<Aset> & Pick<Aset, 'id' | 'jenis' | 'status' | 'pemegang'>): Aset => ({
  jenama: '',
  model: '',
  noSiri: '',
  noPendaftaran: '',
  tarikhTerima: '',
  tarikhTamatWarranty: '',
  stafId: null,
  unitId: null,
  indukId: null,
  catatan: '',
  ...a,
})

const data: DataLaporan = {
  bahagian: [
    { id: 'b2', nama: 'Bahagian Pengurusan Tanah', susunan: 2 },
    { id: 'b1', nama: 'Bahagian Pengurusan Daerah', susunan: 1 },
  ],
  unit: [
    { id: 'u1', nama: 'Pejabat Pegawai Daerah', bahagianId: 'b1', susunan: 1 },
    { id: 'u2', nama: 'Unit Teknologi Maklumat', bahagianId: 'b1', susunan: 2 },
    { id: 'u3', nama: 'Unit Pelupusan Tanah', bahagianId: 'b2', susunan: 1 },
  ],
  staf: [
    { id: 's1', nama: 'ALI', jawatan: 'PEGAWAI DAERAH', gred: 'M48', unitId: 'u1', susunan: 1 },
    { id: 's2', nama: 'BAKAR', jawatan: 'PEM. TADBIR', gred: '', unitId: 'u2', susunan: 1 },
    { id: 's3', nama: 'CHONG', jawatan: 'PPT', unitId: 'u3', susunan: 1 },
  ],
  aset: [
    aset({ id: 'a1', jenis: 'pc', jenama: 'Dell', model: 'OptiPlex', noSiri: 'S1', noPendaftaran: 'P1', status: 'aktif', pemegang: 'staf', stafId: 's2', unitId: 'lama' }),
    aset({ id: 'a2', jenis: 'pc', jenama: 'HP', model: 'ProDesk', status: 'aktif', pemegang: 'gunasama', unitId: 'u1' }),
    aset({ id: 'a3', jenis: 'pc', jenama: 'Acer', status: 'aktif', pemegang: 'staf', stafId: 's1' }),
    aset({ id: 'a4', jenis: 'printer', jenama: 'Epson', status: 'dilupus', pemegang: 'staf', stafId: 's1' }),
    aset({ id: 'a5', jenis: 'monitor', jenama: 'Dell', status: 'rosak', pemegang: 'staf', stafId: 's3', tarikhTamatWarranty: '2027-01-31' }),
  ],
}

test('ikut bahagian: gabung unit, staf dulu kemudian gunasama, dilupus dikecualikan', () => {
  const s = binaLaporan(data, { ikut: 'bahagian', status: 'xdilupus' })
  assert.deepEqual(
    s.map((x) => [x.tajuk, x.subtajuk]),
    [
      ['SENARAI ASET ICT (KOMPUTER)', ['BAHAGIAN PENGURUSAN DAERAH']],
      ['SENARAI ASET ICT (MONITOR)', ['BAHAGIAN PENGURUSAN TANAH']],
    ],
  )
  assert.deepEqual(
    s[0].baris.map((b) => [b.bil, b.nama, b.jawatanGred, b.jenamaModel]),
    [
      [1, 'ALI', 'PEGAWAI DAERAH / M48', 'Acer'],
      [2, 'GUNASAMA', '', 'HP / ProDesk'],
      [3, 'BAKAR', 'PEM. TADBIR', 'Dell / OptiPlex'],
    ],
  )
  assert.equal(s[1].baris[0].tarikhWarranty, '31/01/2027')
})

test('ikut unit dengan tapisan bahagian, jenis dan status', () => {
  const s = binaLaporan(data, { ikut: 'unit', bahagianId: 'b1', jenis: 'pc', status: 'aktif' })
  assert.deepEqual(s.map((x) => x.subtajuk), [
    ['BAHAGIAN PENGURUSAN DAERAH', 'PEJABAT PEGAWAI DAERAH'],
    ['BAHAGIAN PENGURUSAN DAERAH', 'UNIT TEKNOLOGI MAKLUMAT'],
  ])
  assert.equal(binaLaporan(data, { ikut: 'unit', status: 'dilupus' })[0].tajuk, 'SENARAI ASET ICT (PENCETAK)')
})

test('semua jenis digabung: satu senarai bagi setiap bahagian, staf yang sama disusun ikut jenis', () => {
  const s = binaLaporan(data, { ikut: 'bahagian', status: 'semua', jenis: JENIS_GABUNG })
  assert.deepEqual(
    s.map((x) => [x.jenis, x.tajuk, x.subtajuk]),
    [
      [null, 'SENARAI ASET ICT (SEMUA JENIS)', ['BAHAGIAN PENGURUSAN DAERAH']],
      [null, 'SENARAI ASET ICT (SEMUA JENIS)', ['BAHAGIAN PENGURUSAN TANAH']],
    ],
  )
  assert.deepEqual(
    s[0].baris.map((b) => [b.nama, b.jenis]),
    [
      ['ALI', 'Komputer (PC)'],
      ['ALI', 'Pencetak'],
      ['GUNASAMA', 'Komputer (PC)'],
      ['BAKAR', 'Komputer (PC)'],
    ],
  )
})
