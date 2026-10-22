import { useState, type FormEvent, type MouseEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { doc, serverTimestamp, type WriteBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { usePengguna } from '../context/Auth'
import { useData } from '../context/Data'
import { jejakOrganisasi } from '../lib/jejak'
import { JENIS_ADA_MONITOR, JENIS_ASET, STATUS_ASET, labelJenis, type KodJenis, type KodStatus } from '../lib/konstan'
import { bolehJadiInduk, jenamaModel, labelPemegang, pemegangBerubah, sirinya } from '../lib/aset'
import { dataAsal, idBaharu, simpan } from '../lib/tulis'
import PilihStaf from '../components/PilihStaf'
import PilihOrganisasi from '../components/PilihOrganisasi'
import { Kosong, Medan, Ralat, TajukHalaman, mesejRalat } from '../components/ui'
import type { AsetPenuh, DataAset, JenisPemegang, Staf } from '../types'

// Nilai borang: medan rujukan disimpan sebagai '' (bukan null) supaya sesuai untuk input HTML.
interface NilaiBorang {
  jenis: KodJenis
  jenama: string
  model: string
  noSiri: string
  noSiriMonitor: string
  noPendaftaran: string
  tarikhTerima: string
  tarikhTamatWarranty: string
  status: KodStatus
  pemegang: JenisPemegang
  stafId: string
  unitId: string
  indukId: string
  catatan: string
}

const KOSONG: NilaiBorang = {
  jenis: 'pc',
  jenama: '',
  model: '',
  noSiri: '',
  noSiriMonitor: '',
  noPendaftaran: '',
  tarikhTerima: '',
  tarikhTamatWarranty: '',
  status: 'aktif',
  pemegang: 'staf',
  stafId: '',
  unitId: '',
  indukId: '',
  catatan: '',
}

const kodJenis = (x: string | null): KodJenis | undefined => JENIS_ASET.find((j) => j.kod === x)?.kod

function nilaiAwal(asal: AsetPenuh | undefined, params: URLSearchParams, stafMap: Map<string, Staf>): NilaiBorang {
  if (asal) {
    return {
      jenis: asal.jenis,
      jenama: asal.jenama ?? '',
      model: asal.model ?? '',
      noSiri: asal.noSiri ?? '',
      noSiriMonitor: asal.noSiriMonitor ?? '',
      noPendaftaran: asal.noPendaftaran ?? '',
      tarikhTerima: asal.tarikhTerima ?? '',
      tarikhTamatWarranty: asal.tarikhTamatWarranty ?? '',
      status: asal.status,
      pemegang: asal.pemegang,
      stafId: asal.stafId ?? '',
      unitId: asal.unitId ?? '',
      indukId: asal.indukId ?? '',
      catatan: asal.catatan ?? '',
    }
  }
  const stafId = params.get('stafId') ?? ''
  const unitId = params.get('unitId') ?? ''
  return {
    ...KOSONG,
    jenis: kodJenis(params.get('jenis')) ?? KOSONG.jenis,
    pemegang: unitId && !stafId ? 'gunasama' : 'staf',
    stafId,
    unitId: unitId || stafMap.get(stafId)?.unitId || '',
    indukId: params.get('indukId') ?? '',
  }
}

export default function BorangAset() {
  const { id } = useParams()
  const { asetMap } = useData()
  const asal = id ? asetMap.get(id) : undefined
  if (id && !asal) return <Kosong>Aset tidak dijumpai.</Kosong>
  // key memastikan borang dimulakan semula bila bertukar antara aset.
  return <Borang key={id ?? 'baru'} id={id} asal={asal} />
}

function Borang({ id, asal }: { id: string | undefined; asal: AsetPenuh | undefined }) {
  const pengguna = usePengguna()
  const { stafMap, unitMap, bahagianMap, asetPenuh } = useData()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [asetId, setAsetId] = useState(() => id ?? idBaharu('aset'))
  const [f, setF] = useState<NilaiBorang>(() => nilaiAwal(asal, params, stafMap))
  const [ralat, setRalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [mesej, setMesej] = useState('')

  const set = (ubah: Partial<NilaiBorang>) => setF((x) => ({ ...x, ...ubah }))
  // Bahagian dipilih dahulu untuk menapis senarai unit aset gunasama.
  const [bahagianGunasama, setBahagianGunasama] = useState(() => unitMap.get(f.unitId)?.bahagianId ?? '')

  // Aset yang diikat kepada aset ini; boleh dipindahkan bersama bila pemegang bertukar.
  const anak = asal ? asetPenuh.filter((x) => x.indukId === asal.id) : []
  const [pindahAnak, setPindahAnak] = useState(true)
  const pemegangDiubah =
    !!asal && pemegangBerubah(asal, { pemegang: f.pemegang, stafId: f.stafId || null, unitId: f.unitId || null })

  const calonInduk = asetPenuh
    .filter((a) => a.id !== asetId && a.status !== 'dilupus' && bolehJadiInduk(a, asetId, asetPenuh))
    .filter((a) =>
      f.pemegang === 'staf' ? a.pemegang === 'staf' && a.stafId === f.stafId : a.pemegang === 'gunasama' && a.unitId === f.unitId,
    )

  // Breadcrumb: aset sedia ada menunjuk laluan pemegang asal; aset baharu ikut pemegang yang sedang dipilih.
  const stafJejak = f.pemegang === 'staf' ? stafMap.get(f.stafId) : undefined
  const unitJejak = unitMap.get(stafJejak ? stafJejak.unitId : f.unitId)
  const jejakBaru = jejakOrganisasi(unitJejak && bahagianMap.get(unitJejak.bahagianId), unitJejak, stafJejak)
  const jejak = asal
    ? [
        ...jejakOrganisasi(asal._bahagian, asal._unit, asal._staf),
        { label: `${labelJenis(asal.jenis)} ${jenamaModel(asal)}`, to: `/aset/${asal.id}` },
      ]
    : jejakBaru.length > 1
      ? jejakBaru
      : [{ label: 'Aset', to: '/aset' }]

  async function hantar(e: FormEvent | MouseEvent, tambahLagi = false) {
    e.preventDefault()
    setRalat('')
    setMesej('')
    if (f.pemegang === 'staf' && !f.stafId) return setRalat('Pilih staf pemegang.')
    if (f.pemegang === 'gunasama' && !f.unitId) return setRalat('Pilih unit bagi aset gunasama.')

    const staf = f.pemegang === 'staf' ? (stafMap.get(f.stafId) ?? null) : null
    const unitId = staf ? staf.unitId : f.unitId
    const data: DataAset = {
      jenis: f.jenis,
      jenama: f.jenama.trim(),
      model: f.model.trim(),
      noSiri: f.noSiri.trim(),
      noSiriMonitor: JENIS_ADA_MONITOR.includes(f.jenis) ? f.noSiriMonitor.trim() : '',
      noPendaftaran: f.noPendaftaran.trim().toUpperCase(),
      tarikhTerima: f.tarikhTerima,
      tarikhTamatWarranty: f.tarikhTamatWarranty,
      status: f.status,
      pemegang: f.pemegang,
      stafId: staf ? staf.id : null,
      unitId,
      bahagianId: unitMap.get(unitId)?.bahagianId ?? null,
      indukId: f.indukId || null,
      catatan: f.catatan.trim(),
    }

    const pendua = asetPenuh.filter(
      (a) =>
        a.id !== asetId &&
        (sirinya(data).some((x) => sirinya(a).includes(x)) || (data.noPendaftaran && a.noPendaftaran === data.noPendaftaran)),
    )
    if (
      pendua.length &&
      !window.confirm(
        `No. siri / no. pendaftaran ini sudah wujud pada:\n${pendua.map((a) => `- ${labelJenis(a.jenis)} ${jenamaModel(a)} (${a._nama})`).join('\n')}\n\nTeruskan simpan?`,
      )
    )
      return

    setSibuk(true)
    try {
      const berubah = pemegangBerubah(asal, data)
      const unit = unitMap.get(unitId)
      const ke = labelPemegang({ pemegang: data.pemegang, staf, unit })
      const ikutPindah = berubah && pindahAnak ? anak : []
      const rekodSejarah = (batch: WriteBatch, asetIdSejarah: string, dari: string | null) =>
        batch.set(doc(db, 'aset', asetIdSejarah, 'sejarah', idBaharu('aset')), {
          masa: serverTimestamp(),
          oleh: pengguna.emel,
          namaOleh: pengguna.nama,
          dari,
          ke,
          pemegang: data.pemegang,
          stafId: data.stafId,
          unitId,
        })
      await simpan(pengguna, {
        koleksi: 'aset',
        id: asal ? asetId : null,
        idBaru: asal ? undefined : asetId,
        data: { ...data },
        sebelum: asal ? dataAsal(asal) : null,
        ringkasan:
          `${asal ? 'Kemaskini' : 'Tambah'} ${labelJenis(data.jenis)} ${jenamaModel(data)} (${ke})` +
          (ikutPindah.length ? ` beserta ${ikutPindah.length} aset diikat` : ''),
        tambahan: berubah
          ? (batch, ref) => {
              rekodSejarah(batch, ref.id, asal ? labelPemegang({ pemegang: asal.pemegang, staf: asal._staf, unit: asal._unit }) : null)
              // Aset yang diikat (contoh: monitor kepada PC) berpindah bersama dalam batch yang sama.
              for (const c of ikutPindah) {
                batch.update(doc(db, 'aset', c.id), {
                  pemegang: data.pemegang,
                  stafId: data.stafId,
                  unitId: data.unitId,
                  bahagianId: data.bahagianId,
                  dikemaskiniPada: serverTimestamp(),
                  dikemaskiniOleh: pengguna.emel,
                })
                rekodSejarah(batch, c.id, labelPemegang({ pemegang: c.pemegang, staf: c._staf, unit: c._unit }))
              }
            }
          : undefined,
      })
      if (tambahLagi) {
        setMesej(`Disimpan: ${labelJenis(data.jenis)} ${jenamaModel(data)}. Isi aset seterusnya.`)
        setF({ ...KOSONG, pemegang: f.pemegang, stafId: f.stafId, unitId: f.unitId, jenis: f.jenis, indukId: f.indukId })
        setAsetId(idBaharu('aset'))
        window.scrollTo(0, 0)
      } else {
        navigate(`/aset/${asetId}`, { replace: true })
      }
    } catch (err) {
      setRalat(mesejRalat(err))
    } finally {
      setSibuk(false)
    }
  }

  return (
    <form onSubmit={hantar} className="mx-auto max-w-2xl space-y-4">
      <TajukHalaman jejak={jejak} tajuk={asal ? 'Kemaskini Aset' : 'Tambah Aset'} />
      <Ralat>{ralat}</Ralat>
      {mesej && <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">{mesej}</div>}

      <section className="card space-y-3">
        <h2 className="font-medium">Pemegang</h2>
        <div className="flex gap-4 text-sm">
          {(
            [
              ['staf', 'Staf'],
              ['gunasama', 'GUNASAMA (unit)'],
            ] as const
          ).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2">
              <input type="radio" name="pemegang" checked={f.pemegang === k} onChange={() => set({ pemegang: k, indukId: '' })} />
              {l}
            </label>
          ))}
        </div>
        {f.pemegang === 'staf' ? (
          <PilihStaf stafId={f.stafId} onChange={(stafId) => set({ stafId, indukId: '' })} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <PilihOrganisasi
              wajib
              bahagianId={bahagianGunasama}
              unitId={f.unitId}
              onChange={({ bahagianId, unitId }) => {
                setBahagianGunasama(bahagianId)
                set({ unitId, indukId: '' })
              }}
            />
          </div>
        )}
        {pemegangDiubah && anak.length > 0 && (
          <label className="flex items-start gap-2 rounded-md bg-blue-50 p-2 text-sm">
            <input type="checkbox" className="mt-1" checked={pindahAnak} onChange={(e) => setPindahAnak(e.target.checked)} />
            <span>
              Pindahkan juga {anak.length} aset yang diikat ({anak.map((x) => labelJenis(x.jenis)).join(', ')}) kepada pemegang baharu
            </span>
          </label>
        )}
      </section>

      <section className="card grid gap-3 sm:grid-cols-2">
        <Medan label="Jenis aset">
          <select className="input" value={f.jenis} onChange={(e) => set({ jenis: e.target.value as KodJenis })}>
            {JENIS_ASET.map((j) => (
              <option key={j.kod} value={j.kod}>
                {j.label}
              </option>
            ))}
          </select>
        </Medan>
        <Medan label="Status">
          <select className="input" value={f.status} onChange={(e) => set({ status: e.target.value as KodStatus })}>
            {STATUS_ASET.map((s) => (
              <option key={s.kod} value={s.kod}>
                {s.label}
              </option>
            ))}
          </select>
        </Medan>
        <Medan label="Jenama">
          <input className="input" value={f.jenama} onChange={(e) => set({ jenama: e.target.value })} placeholder="Contoh: Dell" />
        </Medan>
        <Medan label="Model">
          <input className="input" value={f.model} onChange={(e) => set({ model: e.target.value })} placeholder="Contoh: OptiPlex 7090" />
        </Medan>
        <Medan label="No. siri (pilihan)">
          <input className="input" value={f.noSiri} onChange={(e) => set({ noSiri: e.target.value })} autoCapitalize="characters" />
        </Medan>
        {JENIS_ADA_MONITOR.includes(f.jenis) && (
          <Medan label="No. siri monitor (pilihan)" nota="Monitor berkongsi no. pendaftaran dengan aset ini.">
            <input
              className="input"
              value={f.noSiriMonitor}
              onChange={(e) => set({ noSiriMonitor: e.target.value })}
              autoCapitalize="characters"
            />
          </Medan>
        )}
        <Medan label="No. pendaftaran harta modal (pilihan)">
          <input
            className="input"
            value={f.noPendaftaran}
            onChange={(e) => set({ noPendaftaran: e.target.value })}
            placeholder="PDTCH/12000/H/23/30"
            autoCapitalize="characters"
          />
        </Medan>
        <Medan label="Tarikh terima (pilihan)">
          <input className="input" type="date" value={f.tarikhTerima} onChange={(e) => set({ tarikhTerima: e.target.value })} />
        </Medan>
        <Medan label="Tarikh tamat warranty (pilihan)">
          <input
            className="input"
            type="date"
            value={f.tarikhTamatWarranty}
            onChange={(e) => set({ tarikhTamatWarranty: e.target.value })}
          />
        </Medan>
        <div className="sm:col-span-2">
          <Medan label="Diikat kepada aset (pilihan)" nota="Contoh: monitor diikat kepada set PC pemegang yang sama.">
            <select className="input" value={f.indukId} onChange={(e) => set({ indukId: e.target.value })}>
              <option value="">Tiada</option>
              {calonInduk.map((a) => (
                <option key={a.id} value={a.id}>
                  {labelJenis(a.jenis)} · {jenamaModel(a) || '-'} {a.noSiri ? `· ${a.noSiri}` : ''}
                </option>
              ))}
            </select>
          </Medan>
        </div>
        <div className="sm:col-span-2">
          <Medan label="Catatan (pilihan)">
            <textarea className="input" rows={2} value={f.catatan} onChange={(e) => set({ catatan: e.target.value })} />
          </Medan>
        </div>
      </section>


      <div className="flex flex-wrap gap-2 pb-8">
        <button className="btn-primary" disabled={sibuk}>
          {sibuk ? 'Menyimpan...' : 'Simpan'}
        </button>
        {!asal && (
          <button type="button" className="btn-secondary" disabled={sibuk} onClick={(e) => hantar(e, true)}>
            Simpan & tambah lagi
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          Batal
        </button>
      </div>
    </form>
  )
}
