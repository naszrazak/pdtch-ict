import { collection, doc, serverTimestamp, writeBatch, type DocumentReference, type WriteBatch } from 'firebase/firestore'
import type { PenggunaLog, Perubahan, Tindakan } from '../types'
import { db } from './firebase'
import { kiraPerubahan } from './perubahan'

// Semua tulisan data melalui modul ini supaya setiap perubahan direkod dalam logAudit
// dalam batch yang sama (siapa, apa, bila).

type Dokumen = Record<string, unknown>

interface MaklumatLog {
  tindakan: Tindakan
  koleksi: string
  dokId: string
  ringkasan?: string
  perubahan?: Perubahan
}

function tambahLog(batch: WriteBatch, pengguna: PenggunaLog, { tindakan, koleksi, dokId, ringkasan, perubahan }: MaklumatLog) {
  batch.set(doc(collection(db, 'logAudit')), {
    masa: serverTimestamp(),
    oleh: pengguna.emel,
    namaPengguna: pengguna.nama ?? pengguna.emel,
    tindakan,
    koleksi,
    dokId,
    ringkasan: ringkasan ?? '',
    perubahan: perubahan ?? {},
  })
}

export interface PilihanSimpan {
  koleksi: string
  /** null untuk dokumen baharu */
  id: string | null
  /** id yang telah dijana untuk dokumen baharu (contoh: untuk "Simpan & tambah lagi") */
  idBaru?: string
  data: Dokumen
  /** data asal (untuk kemaskini) */
  sebelum?: Dokumen | null
  /** huraian ringkas untuk log */
  ringkasan: string
  /** operasi tambahan dalam batch yang sama */
  tambahan?: (batch: WriteBatch, ref: DocumentReference) => void
}

/** Cipta atau kemaskini satu dokumen beserta log audit. Memulangkan id dokumen. */
export async function simpan(
  pengguna: PenggunaLog,
  { koleksi, id, idBaru, data, sebelum = null, ringkasan, tambahan }: PilihanSimpan,
): Promise<string> {
  const batch = writeBatch(db)
  const ref = id ? doc(db, koleksi, id) : idBaru ? doc(db, koleksi, idBaru) : doc(collection(db, koleksi))
  const jejak = { dikemaskiniPada: serverTimestamp(), dikemaskiniOleh: pengguna.emel }
  if (id) {
    batch.update(ref, { ...data, ...jejak })
  } else {
    batch.set(ref, { ...data, ...jejak, diciptaPada: serverTimestamp(), diciptaOleh: pengguna.emel })
  }
  const perubahan = kiraPerubahan(sebelum, id ? { ...sebelum, ...data } : data)
  tambahan?.(batch, ref)
  tambahLog(batch, pengguna, { tindakan: id ? 'kemaskini' : 'cipta', koleksi, dokId: ref.id, ringkasan, perubahan })
  await batch.commit()
  return ref.id
}

export async function padam(
  pengguna: PenggunaLog,
  { koleksi, id, sebelum, ringkasan }: { koleksi: string; id: string; sebelum: Dokumen; ringkasan: string },
): Promise<void> {
  const batch = writeBatch(db)
  batch.delete(doc(db, koleksi, id))
  tambahLog(batch, pengguna, {
    tindakan: 'padam',
    koleksi,
    dokId: id,
    ringkasan,
    perubahan: kiraPerubahan(sebelum, {}),
  })
  await batch.commit()
}

export interface OperasiCipta {
  koleksi: string
  id: string
  data: Dokumen
}

/** Tulis banyak dokumen baharu sekali gus (contoh: import staf), dipecah ikut had batch Firestore. */
export async function ciptaPukal(pengguna: PenggunaLog, senarai: OperasiCipta[], ringkasan: string): Promise<void> {
  const HAD = 400
  for (let i = 0; i < senarai.length; i += HAD) {
    const batch = writeBatch(db)
    const potongan = senarai.slice(i, i + HAD)
    for (const { koleksi, id, data } of potongan) {
      batch.set(doc(db, koleksi, id), {
        ...data,
        diciptaPada: serverTimestamp(),
        diciptaOleh: pengguna.emel,
        dikemaskiniPada: serverTimestamp(),
        dikemaskiniOleh: pengguna.emel,
      })
    }
    tambahLog(batch, pengguna, {
      tindakan: 'import',
      koleksi: 'pelbagai',
      dokId: '',
      ringkasan: `${ringkasan} (${potongan.length} rekod)`,
    })
    await batch.commit()
  }
}

export const idBaharu = (koleksi: string): string => doc(collection(db, koleksi)).id

// Buang id dan medan paparan (_nama, _unit, ...) sebelum dibandingkan untuk log audit.
export function dataAsal(x: object): Dokumen {
  return Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith('_') && k !== 'id'))
}
