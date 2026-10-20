import { useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { usePengguna } from '../context/Auth'
import { useData } from '../context/Data'
import { bacaBarisExcel, huraiSenaraiStaf, jumlahStaf, kunciNama, type HasilHuraian } from '../lib/importStaf'
import { ciptaPukal, idBaharu, type OperasiCipta } from '../lib/tulis'
import type { Bahagian, Staf, Unit } from '../types'
import { Ralat, TajukHalaman, mesejRalat } from '../components/ui'

interface RingkasanUnit {
  bahagian: string
  unit: string
  unitBaru: boolean
  jumlah: number
  baru: number
}

interface DataSedia {
  bahagian: Bahagian[]
  unit: Unit[]
  staf: Staf[]
}

// Padankan hasil Excel dengan data sedia ada supaya import boleh diulang tanpa pendua.
function rancangImport(hasil: HasilHuraian, sedia: DataSedia): { operasi: OperasiCipta[]; ringkasan: RingkasanUnit[] } {
  const operasi: OperasiCipta[] = []
  const ringkasan: RingkasanUnit[] = []
  let susunanBahagian = Math.max(0, ...sedia.bahagian.map((b) => b.susunan ?? 0))
  let susunanUnit = Math.max(0, ...sedia.unit.map((u) => u.susunan ?? 0))

  for (const b of hasil.bahagian) {
    let bId = sedia.bahagian.find((x) => kunciNama(x.nama) === kunciNama(b.nama))?.id
    const bBaru = !bId
    if (bBaru) {
      bId = idBaharu('bahagian')
      operasi.push({ koleksi: 'bahagian', id: bId, data: { nama: b.nama, susunan: ++susunanBahagian } })
    }
    for (const u of b.unit) {
      let uId = sedia.unit.find((x) => x.bahagianId === bId && kunciNama(x.nama) === kunciNama(u.nama))?.id
      const uBaru = !uId
      if (uBaru) {
        uId = idBaharu('unit')
        operasi.push({ koleksi: 'unit', id: uId, data: { nama: u.nama, bahagianId: bId, susunan: ++susunanUnit } })
      }
      const adaNama = new Set(sedia.staf.filter((s) => s.unitId === uId).map((s) => kunciNama(s.nama)))
      let baru = 0
      for (const s of u.staf) {
        if (adaNama.has(s.nama)) continue
        adaNama.add(s.nama)
        baru++
        operasi.push({
          koleksi: 'staf',
          id: idBaharu('staf'),
          data: { nama: s.nama, jawatan: s.jawatan, gred: '', unitId: uId, susunan: s.bil },
        })
      }
      ringkasan.push({ bahagian: b.nama, unit: u.nama, unitBaru: uBaru || bBaru, jumlah: u.staf.length, baru })
    }
  }
  return { operasi, ringkasan }
}

export default function ImportStaf() {
  const pengguna = usePengguna()
  const data = useData()
  const [hasil, setHasil] = useState<HasilHuraian | null>(null)
  const [namaFail, setNamaFail] = useState('')
  const [ralat, setRalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [selesai, setSelesai] = useState('')

  async function pilihFail(e: ChangeEvent<HTMLInputElement>) {
    const fail = e.target.files?.[0]
    e.target.value = ''
    if (!fail) return
    setRalat('')
    setSelesai('')
    setNamaFail(fail.name)
    try {
      const h = huraiSenaraiStaf(await bacaBarisExcel(await fail.arrayBuffer()))
      if (jumlahStaf(h) === 0) throw new Error('Tiada staf dikesan. Pastikan format fail sama seperti senarai staf PDTCH.')
      setHasil(h)
    } catch (err) {
      setHasil(null)
      setRalat(mesejRalat(err))
    }
  }

  const rancangan = hasil && rancangImport(hasil, data)
  const bilBaru = rancangan?.operasi.filter((o) => o.koleksi === 'staf').length ?? 0

  async function jalankan() {
    if (!rancangan) return
    setSibuk(true)
    setRalat('')
    try {
      await ciptaPukal(pengguna, rancangan.operasi, `Import staf dari ${namaFail}`)
      setSelesai(`${bilBaru} staf berjaya diimport.`)
      setHasil(null)
    } catch (err) {
      setRalat(mesejRalat(err))
    } finally {
      setSibuk(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <TajukHalaman
        tajuk="Import Staf"
        keterangan="Muat naik fail Excel senarai staf (format: tajuk BAHAGIAN, tajuk unit, kemudian BIL. | NAMA | JAWATAN)."
      />
      <Ralat>{ralat}</Ralat>
      {selesai && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          {selesai}{' '}
          <Link to="/organisasi" className="underline">
            Lihat organisasi
          </Link>
        </div>
      )}

      <div className="card">
        <label className="btn-secondary cursor-pointer">
          Pilih fail Excel (.xlsx)
          <input type="file" accept=".xlsx" className="hidden" onChange={pilihFail} />
        </label>
        {namaFail && <span className="ml-3 text-sm text-slate-600">{namaFail}</span>}
        <p className="mt-2 text-xs text-slate-500">
          Fail hanya dibaca dalam pelayar; ia tidak disimpan. Staf yang namanya sudah wujud dalam unit yang sama akan dilangkau, jadi
          import boleh diulang dengan selamat. Gred dibiarkan kosong untuk dilengkapkan kemudian.
        </p>
      </div>

      {rancangan && (
        <div className="card space-y-3">
          <h2 className="font-medium">Pratonton</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-1">Bahagian / Unit</th>
                <th className="py-1 text-right">Dalam fail</th>
                <th className="py-1 text-right">Baharu</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rancangan.ringkasan.map((r) => (
                <tr key={`${r.bahagian}|${r.unit}`}>
                  <td className="py-1.5">
                    <div className="text-xs text-slate-500">{r.bahagian}</div>
                    {r.unit} {r.unitBaru && <span className="ml-1 rounded bg-blue-100 px-1 text-xs text-blue-800">unit baharu</span>}
                  </td>
                  <td className="py-1.5 text-right">{r.jumlah}</td>
                  <td className="py-1.5 text-right font-medium">{r.baru}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-medium">
              <tr>
                <td className="py-1.5">Jumlah</td>
                <td className="py-1.5 text-right">{jumlahStaf(hasil)}</td>
                <td className="py-1.5 text-right">{bilBaru}</td>
              </tr>
            </tfoot>
          </table>
          {hasil.dikecualikan.length > 0 && (
            <p className="text-sm text-slate-600">
              Dikecualikan: {hasil.dikecualikan.map((d) => `${d.nama} (${d.bilStaf} orang)`).join(', ')}. Mereka boleh ditambah
              secara manual kemudian jika perlu.
            </p>
          )}
          {hasil.amaran.length > 0 && <Ralat>{hasil.amaran.join('\n')}</Ralat>}
          <button className="btn-primary" disabled={sibuk || rancangan.operasi.length === 0} onClick={jalankan}>
            {sibuk ? 'Mengimport...' : rancangan.operasi.length ? `Import ${bilBaru} staf` : 'Tiada data baharu'}
          </button>
        </div>
      )}
    </div>
  )
}
