import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query, type Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth, usePengguna } from '../context/Auth'
import { useData } from '../context/Data'
import { labelJenis } from '../lib/konstan'
import { formatTarikh, jenamaModel, labelWarranty, medanTidakLengkap } from '../lib/aset'
import { dataAsal, padam } from '../lib/tulis'
import type { SejarahPemegang } from '../types'
import JadualAset, { type NavigasiAset } from '../components/JadualAset'
import { susunAset } from '../lib/carian'
import { Kosong, LencanaStatus, Ralat, TajukHalaman, mesejRalat } from '../components/ui'
import { jejakOrganisasi } from '../lib/jejak'

function Baris({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="col-span-2 break-words">{children || <span className="text-slate-400">-</span>}</dd>
    </div>
  )
}

const formatMasa = (ts: Timestamp | undefined) =>
  ts?.toDate?.().toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' }) ?? 'baru sahaja'

export default function ButiranAset() {
  const id = useParams().id ?? ''
  const { asetMap, asetPenuh } = useData()
  const { isAdmin, bolehTulis } = useAuth()
  const pengguna = usePengguna()
  const navigate = useNavigate()
  const navigasi = useLocation().state as NavigasiAset | null
  const [sejarah, setSejarah] = useState<SejarahPemegang[]>([])
  const [namaPengguna, setNamaPengguna] = useState(() => new Map<string, string>())
  const [ralat, setRalat] = useState('')
  const a = asetMap.get(id)

  useEffect(
    () =>
      onSnapshot(query(collection(db, 'aset', id, 'sejarah'), orderBy('masa', 'desc')), (s) =>
        setSejarah(s.docs.map((d) => ({ id: d.id, ...d.data() }) as SejarahPemegang)),
      ),
    [id],
  )

  // Rekod lama hanya menyimpan emel; nama paparan dicari daripada senarai pengguna.
  useEffect(
    () =>
      onSnapshot(
        collection(db, 'pengguna'),
        (s) => setNamaPengguna(new Map(s.docs.map((d) => [d.id, String(d.data().nama || d.id)]))),
        () => {},
      ),
    [],
  )

  if (!a) return <Kosong>Aset tidak dijumpai.</Kosong>
  const induk = a.indukId ? asetMap.get(a.indukId) : undefined
  const anak = asetPenuh.filter((x) => x.indukId === a.id)
  const kurang = medanTidakLengkap(a)

  // Sebelum / Seterusnya ikut senarai asal (dengan tapisan); jika dibuka terus, ikut semua aset.
  const senarai = navigasi?.senarai?.includes(a.id) ? navigasi.senarai : susunAset(asetPenuh).map((x) => x.id)
  const kedudukan = senarai.indexOf(a.id)
  const sebelum = senarai[kedudukan - 1]
  const seterusnya = senarai[kedudukan + 1]
  const stateSenarai: NavigasiAset = { senarai }

  const padamAset = async () => {
    if (anak.length) return setRalat('Aset ini mempunyai aset yang diikat kepadanya. Lepaskan ikatan itu dahulu.')
    if (!window.confirm(`Padam ${labelJenis(a.jenis)} ${jenamaModel(a)}? Tindakan ini tidak boleh dibatalkan.`)) return
    try {
      await padam(pengguna, {
        koleksi: 'aset',
        id: a.id,
        sebelum: dataAsal(a),
        ringkasan: `Padam ${labelJenis(a.jenis)} ${jenamaModel(a)} (${a._nama})`,
      })
      navigate('/aset', { replace: true })
    } catch (err) {
      setRalat(mesejRalat(err))
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <TajukHalaman
        jejak={jejakOrganisasi(a._bahagian, a._unit, a._staf)}
        tajuk={`${labelJenis(a.jenis)} ${jenamaModel(a)}`}
        keterangan={a._nama}
      >
        <div className="flex items-center gap-1">
          <Link
            to={sebelum ? `/aset/${sebelum}` : '#'}
            state={stateSenarai}
            className={`btn-secondary ${sebelum ? '' : 'pointer-events-none opacity-40'}`}
            aria-disabled={!sebelum}
          >
            ‹ Sebelum
          </Link>
          <span className="px-1 text-sm text-slate-500">
            {kedudukan + 1} / {senarai.length}
          </span>
          <Link
            to={seterusnya ? `/aset/${seterusnya}` : '#'}
            state={stateSenarai}
            className={`btn-secondary ${seterusnya ? '' : 'pointer-events-none opacity-40'}`}
            aria-disabled={!seterusnya}
          >
            Seterusnya ›
          </Link>
        </div>
        {bolehTulis && (
          <Link to={`/aset/${a.id}/kemaskini`} className="btn-primary">
            Kemaskini
          </Link>
        )}
        {isAdmin && (
          <button className="btn-danger" onClick={padamAset}>
            Padam
          </button>
        )}
        {bolehTulis && (
          <Link
            to={a.pemegang === 'staf' && a.stafId ? `/aset/baru?stafId=${a.stafId}` : `/aset/baru?unitId=${a.unitId ?? ''}`}
            className="btn-secondary"
          >
            + Tambah aset
          </Link>
        )}
      </TajukHalaman>
      <Ralat>{ralat}</Ralat>
      {kurang.length > 0 && a.status !== 'dilupus' && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">Belum lengkap: {kurang.join(', ')}</div>
      )}

      <dl className="card divide-y">
        <Baris label="Status">
          <LencanaStatus status={a.status} />
        </Baris>
        <Baris label="Pemegang">
          {a._staf ? (
            <Link to={`/staf/${a._staf.id}`} className="text-blue-800 underline">
              {a._staf.nama}
            </Link>
          ) : (
            a._nama
          )}
          {a._staf?.jawatan && <div className="text-xs text-slate-500">{a._staf.jawatan}</div>}
        </Baris>
        <Baris label="Unit">{a._unit?.nama}</Baris>
        <Baris label="Bahagian">{a._bahagian?.nama}</Baris>
        <Baris label="Jenis">{labelJenis(a.jenis)}</Baris>
        <Baris label="Jenama / Model">{jenamaModel(a)}</Baris>
        <Baris label="No. siri">{a.noSiri}</Baris>
        {a.noSiriMonitor && <Baris label="No. siri monitor">{a.noSiriMonitor}</Baris>}
        <Baris label="No. pendaftaran">{a.noPendaftaran}</Baris>
        <Baris label="Tarikh terima">{formatTarikh(a.tarikhTerima)}</Baris>
        <Baris label="Tempoh warranty">{labelWarranty(a)}</Baris>
        <Baris label="Diikat kepada">
          {induk && (
            <Link to={`/aset/${induk.id}`} className="text-blue-800 underline">
              {labelJenis(induk.jenis)} {jenamaModel(induk)}
            </Link>
          )}
        </Baris>
        <Baris label="Catatan">{a.catatan}</Baris>
      </dl>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium">Aset diikat ({anak.length})</h2>
          {bolehTulis && a.status !== 'dilupus' && (
            <Link
              to={`/aset/baru?indukId=${a.id}&${a.pemegang === 'staf' ? `stafId=${a.stafId}` : `unitId=${a.unitId}`}&jenis=monitor`}
              className="text-sm text-blue-800 underline"
            >
              + Tambah aset diikat
            </Link>
          )}
        </div>
        {anak.length > 0 ? <JadualAset aset={anak} tunjukPemegang={false} /> : <Kosong>Tiada aset diikat.</Kosong>}
      </section>

      <section className="card">
        <h2 className="mb-2 font-medium">Sejarah pemegang</h2>
        {sejarah.length === 0 ? (
          <p className="text-sm text-slate-500">Tiada rekod.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {sejarah.map((s) => (
              <li key={s.id} className="border-l-2 border-blue-200 pl-3">
                <div>
                  {s.dari ? (
                    <>
                      {s.dari} → <b>{s.ke}</b>
                    </>
                  ) : (
                    <>
                      Didaftarkan kepada <b>{s.ke}</b>
                    </>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {formatMasa(s.masa)} · {s.namaOleh || namaPengguna.get(s.oleh?.toLowerCase()) || s.oleh}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
