import { Link } from 'react-router-dom'
import { useData } from '../context/Data'
import { tapisAset, susunAset } from '../lib/carian'
import { useTapisUrl } from '../lib/useTapisUrl'
import PenapisAset from '../components/PenapisAset'
import JadualAset from '../components/JadualAset'
import { TajukHalaman } from '../components/ui'

export default function SenaraiAset() {
  const { asetPenuh } = useData()
  const [tapis, setTapis] = useTapisUrl()
  const hasil = susunAset(tapisAset(asetPenuh, tapis))

  return (
    <>
      <TajukHalaman tajuk="Aset" keterangan={`${hasil.length} daripada ${asetPenuh.length} aset`}>
        <Link to="/aset/baru" className="btn-primary">
          + Tambah aset
        </Link>
      </TajukHalaman>
      <PenapisAset nilai={tapis} onChange={setTapis} />
      <JadualAset aset={hasil} />
    </>
  )
}
