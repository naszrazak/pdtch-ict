import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useData } from '../context/Data'
import { susunAset } from '../lib/carian'
import { BorangStaf } from '../components/BorangOrganisasi'
import JadualAset from '../components/JadualAset'
import { Kosong, TajukHalaman } from '../components/ui'
import { jejakOrganisasi } from '../lib/jejak'
import { jawatanGred } from '../lib/aset'

export default function ButiranStaf() {
  const id = useParams().id ?? ''
  const { stafMap, unitMap, bahagianMap, asetPenuh } = useData()
  const { bolehTulis } = useAuth()
  const [ubah, setUbah] = useState(false)
  const navigate = useNavigate()
  const s = stafMap.get(id)
  if (!s) return <Kosong>Staf tidak dijumpai.</Kosong>
  const u = unitMap.get(s.unitId)
  const aset = susunAset(asetPenuh.filter((a) => a.pemegang === 'staf' && a.stafId === id))

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <TajukHalaman
        jejak={jejakOrganisasi(u && bahagianMap.get(u.bahagianId), u)}
        tajuk={s.nama}
        keterangan={jawatanGred(s) || 'Jawatan / gred belum diisi'}>
        {bolehTulis && (
          <>
            <button className="btn-secondary" onClick={() => setUbah(true)}>
              Kemaskini staf
            </button>
            <Link to="/aset/baru" className="btn-primary">
              + Tambah aset
            </Link>
          </>
        )}
      </TajukHalaman>
      <div className="card text-sm">
        <div>
          <span className="text-slate-500">Unit: </span>
          {u?.nama ?? '-'}
        </div>
        <div>
          <span className="text-slate-500">Bahagian: </span>
          {(u && bahagianMap.get(u.bahagianId)?.nama) || '-'}
        </div>
      </div>
      <h2 className="font-medium">Aset dipegang ({aset.length})</h2>
      <JadualAset aset={aset} tunjukPemegang={false} />
      {ubah && <BorangStaf asal={s} onTutup={() => setUbah(false)} onDipadam={() => navigate('/organisasi', { replace: true })} />}
    </div>
  )
}
