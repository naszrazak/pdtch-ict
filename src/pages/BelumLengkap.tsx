import { useData } from '../context/Data'
import { medanTidakLengkap } from '../lib/aset'
import { TUNJUK_WARRANTY } from '../lib/konstan'
import { tapisAset, susunAset } from '../lib/carian'
import { useTapisUrl } from '../lib/useTapisUrl'
import PenapisAset from '../components/PenapisAset'
import JadualAset from '../components/JadualAset'
import { TajukHalaman } from '../components/ui'

export default function BelumLengkap() {
  const { asetPenuh } = useData()
  const [tapis, setTapis] = useTapisUrl()
  const belum = asetPenuh.filter((a) => a.status !== 'dilupus' && medanTidakLengkap(a).length > 0)
  const hasil = susunAset(tapisAset(belum, { ...tapis, status: '' }))

  return (
    <>
      <TajukHalaman
        tajuk="Aset Belum Lengkap"
        keterangan={`${hasil.length} aset tanpa no. siri, no. pendaftaran${TUNJUK_WARRANTY ? ' atau tempoh warranty' : ''} (tidak termasuk dilupuskan)`}
      />
      <PenapisAset nilai={tapis} onChange={setTapis} tanpaStatus />
      <JadualAset aset={hasil} tunjukKurang />
    </>
  )
}
