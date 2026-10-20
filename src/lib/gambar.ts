import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import type { Gambar } from '../types'
import { storage } from './firebase'

// Gambar dari kamera telefon biasanya besar; kecilkan sebelum dimuat naik.
export async function mampatGambar(fail: Blob, dimensiMaks = 1600, kualiti = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(fail)
  const skala = Math.min(1, dimensiMaks / Math.max(bitmap.width, bitmap.height))
  const kanvas = document.createElement('canvas')
  kanvas.width = Math.round(bitmap.width * skala)
  kanvas.height = Math.round(bitmap.height * skala)
  const ctx = kanvas.getContext('2d')
  if (!ctx) throw new Error('Pelayar tidak menyokong pemprosesan gambar')
  ctx.drawImage(bitmap, 0, 0, kanvas.width, kanvas.height)
  bitmap.close()
  return new Promise<Blob>((selesai, gagal) =>
    kanvas.toBlob((b) => (b ? selesai(b) : gagal(new Error('Gagal memproses gambar'))), 'image/jpeg', kualiti),
  )
}

export async function muatNaikGambarAset(asetId: string, fail: Blob): Promise<Gambar> {
  const blob = await mampatGambar(fail)
  const path = `aset/${asetId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const r = ref(storage, path)
  await uploadBytes(r, blob, { contentType: 'image/jpeg' })
  return { path, url: await getDownloadURL(r) }
}

// Padam fail; abaikan ralat (contoh: juruteknik tiada kebenaran padam, atau fail sudah tiada).
export async function cubaPadamGambar(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path))
  } catch {
    // dibiarkan
  }
}
