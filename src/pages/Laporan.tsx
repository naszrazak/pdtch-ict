import { useState } from 'react'
import { useData } from '../context/Data'
import { JENIS_ASET } from '../lib/konstan'
import { JENIS_GABUNG, PILIHAN_STATUS_LAPORAN, adaLajurJenis, adaLajurMonitor, binaLaporan, lajurLaporan, type TapisLaporan, type TapisStatusLaporan } from '../lib/laporan'
import PilihOrganisasi from '../components/PilihOrganisasi'
import { Kosong, Ralat, TajukHalaman, mesejRalat } from '../components/ui'

type NilaiTapis = Required<TapisLaporan>

export default function Laporan() {
  const data = useData()
  const [t, setT] = useState<NilaiTapis>({ bahagianId: '', unitId: '', jenis: 'pc', status: 'xdilupus', ikut: 'unit', lajurWarranty: false })
  const [sibuk, setSibuk] = useState<'' | 'pdf' | 'excel'>('')
  const [ralat, setRalat] = useState('')
  const set = (ubah: Partial<NilaiTapis>) => setT((x) => ({ ...x, ...ubah }))

  const seksyen = binaLaporan(data, t)
  const lajur = lajurLaporan(t.lajurWarranty, adaLajurMonitor(seksyen), adaLajurJenis(seksyen))
  const jumlah = seksyen.reduce((n, s) => n + s.baris.length, 0)

  async function eksport(jenis: 'pdf' | 'excel') {
    setSibuk(jenis)
    setRalat('')
    try {
      const { janaPdf, janaExcel } = await import('../lib/eksport')
      await (jenis === 'pdf' ? janaPdf : janaExcel)(seksyen, { lajurWarranty: t.lajurWarranty })
    } catch (e) {
      setRalat(`Gagal menjana fail: ${mesejRalat(e)}`)
    } finally {
      setSibuk('')
    }
  }

  return (
    <>
      <TajukHalaman tajuk="Laporan Senarai Aset ICT" keterangan={`${seksyen.length} senarai · ${jumlah} aset`}>
        <button className="btn-primary" disabled={!jumlah || !!sibuk} onClick={() => eksport('pdf')}>
          {sibuk === 'pdf' ? 'Menjana...' : 'Muat turun PDF'}
        </button>
        <button className="btn-secondary" disabled={!jumlah || !!sibuk} onClick={() => eksport('excel')}>
          {sibuk === 'excel' ? 'Menjana...' : 'Muat turun Excel'}
        </button>
      </TajukHalaman>
      <Ralat>{ralat}</Ralat>

      <div className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <PilihOrganisasi
          bahagianId={t.bahagianId}
          unitId={t.unitId}
          onChange={(x) => set({ ...x, ...(x.unitId ? { ikut: 'unit' } : {}) })}
        />
        <label className="block">
          <span className="label">Jenis aset</span>
          <select className="input" value={t.jenis} onChange={(e) => set({ jenis: e.target.value })}>
            <option value="">Semua jenis (satu senarai bagi setiap jenis)</option>
            <option value={JENIS_GABUNG}>Semua jenis (satu senarai, tanpa diasingkan)</option>
            {JENIS_ASET.map((j) => (
              <option key={j.kod} value={j.kod}>
                {j.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Status</span>
          <select className="input" value={t.status} onChange={(e) => set({ status: e.target.value as TapisStatusLaporan })}>
            {PILIHAN_STATUS_LAPORAN.map((s) => (
              <option key={s.kod} value={s.kod}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Jana ikut</span>
          <select className="input" value={t.ikut} disabled={!!t.unitId} onChange={(e) => set({ ikut: e.target.value as NilaiTapis['ikut'] })}>
            <option value="unit">Unit (satu senarai bagi setiap unit)</option>
            <option value="bahagian">Bahagian (gabung semua unit)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={t.lajurWarranty} onChange={(e) => set({ lajurWarranty: e.target.checked })} />
          Tambah lajur tarikh tamat warranty
        </label>
      </div>

      {seksyen.length === 0 ? (
        <Kosong>Tiada aset untuk pilihan ini.</Kosong>
      ) : (
        <div className="space-y-4">
          {seksyen.map((s) => (
            <section key={`${s.tajuk}|${s.subtajuk.join('|')}`} className="card overflow-x-auto">
              <div className="mb-3 text-center font-semibold">
                <div>{s.tajuk}</div>
                {s.subtajuk.map((x) => (
                  <div key={x} className="text-sm">
                    {x}
                  </div>
                ))}
              </div>
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    {lajur.map((l) => (
                      <th key={l.kunci} className="border border-slate-400 bg-slate-100 px-2 py-1 text-center">
                        {l.tajuk}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.baris.map((b) => (
                    <tr key={b.asetId}>
                      {lajur.map((l) => (
                        <td key={l.kunci} className={`border border-slate-400 px-2 py-1 ${l.kunci === 'bil' ? 'text-center' : ''}`}>
                          {b[l.kunci]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
