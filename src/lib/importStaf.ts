// Menghurai senarai staf daripada fail Excel berformat "senarai penerima" PDTCH:
// baris tajuk BAHAGIAN ..., diikuti tajuk unit, baris "BIL. | NAMA | JAWATAN", kemudian baris staf.

const KATA_KECIL = new Set(['dan', 'di', 'ke', 'dari', 'bagi', 'untuk', 'serta'])

export interface StafExcel {
  bil: number
  nama: string
  jawatan: string
}
export interface UnitExcel {
  nama: string
  staf: StafExcel[]
}
export interface BahagianExcel {
  nama: string
  unit: UnitExcel[]
}
export interface KumpulanDikecualikan {
  nama: string
  bilStaf: number
}
export interface HasilHuraian {
  bahagian: BahagianExcel[]
  dikecualikan: KumpulanDikecualikan[]
  amaran: string[]
}

export const BAHAGIAN_DIKECUALIKAN_LALAI = ['WARGA KERJA UE']

export function hurufTajuk(teks: unknown): string {
  return String(teks ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((p, i) => {
      if (i > 0 && KATA_KECIL.has(p)) return p
      // Singkatan pendek seperti "UE" dikekalkan huruf besar.
      if (p.length <= 2 && i > 0) return p.toUpperCase()
      return p.charAt(0).toUpperCase() + p.slice(1)
    })
    .join(' ')
}

// Nilai sel exceljs boleh jadi teks, nombor, rich text atau formula.
const bersih = (v: unknown): string => {
  if (v == null) return ''
  if (typeof v === 'object' && 'richText' in v)
    return (v as { richText: { text: string }[] }).richText.map((r) => r.text).join('').trim()
  if (typeof v === 'object' && 'result' in v) return String((v as { result?: unknown }).result ?? '').trim()
  return String(v).replace(/\s+/g, ' ').trim()
}

export const kunciNama = (teks: unknown): string => bersih(teks).toUpperCase()

/** @param baris setiap baris sebagai [A, B, C, ...] */
export function huraiSenaraiStaf(baris: unknown[][], pilihan: { dikecualikan?: string[] } = {}): HasilHuraian {
  const kecuali = new Set((pilihan.dikecualikan ?? BAHAGIAN_DIKECUALIKAN_LALAI).map(kunciNama))
  const hasil: HasilHuraian = { bahagian: [], dikecualikan: [], amaran: [] }
  let bahagian: BahagianExcel | null = null
  let unit: UnitExcel | null = null
  let kumpulanDikecualikan: KumpulanDikecualikan | null = null

  for (const [i, row] of baris.entries()) {
    const [a, b, c] = [bersih(row?.[0]), bersih(row?.[1]), bersih(row?.[2])]
    if (!a && !b && !c) continue

    const bil = Number(a)
    if (a && Number.isFinite(bil) && b) {
      if (kumpulanDikecualikan) {
        kumpulanDikecualikan.bilStaf++
      } else if (!unit) {
        hasil.amaran.push(`Baris ${i + 1}: staf "${b}" tiada unit, diabaikan`)
      } else {
        unit.staf.push({ bil, nama: kunciNama(b), jawatan: c })
      }
      continue
    }

    if (!a || b || /^BIL\.?$/i.test(a) || /^SENARAI\b/i.test(a)) continue

    const tajuk = kunciNama(a)
    if (kecuali.has(tajuk)) {
      kumpulanDikecualikan = { nama: hurufTajuk(tajuk), bilStaf: 0 }
      hasil.dikecualikan.push(kumpulanDikecualikan)
      bahagian = null
      unit = null
    } else if (tajuk.startsWith('BAHAGIAN')) {
      kumpulanDikecualikan = null
      bahagian = { nama: hurufTajuk(tajuk), unit: [] }
      unit = null
      hasil.bahagian.push(bahagian)
    } else if (kumpulanDikecualikan) {
      // Sub-tajuk dalam kumpulan yang dikecualikan.
    } else if (bahagian) {
      unit = { nama: hurufTajuk(tajuk), staf: [] }
      bahagian.unit.push(unit)
    } else {
      hasil.amaran.push(`Baris ${i + 1}: tajuk "${a}" tiada bahagian, diabaikan`)
    }
  }
  return hasil
}

export const jumlahStaf = (hasil: HasilHuraian): number =>
  hasil.bahagian.reduce((n, b) => n + b.unit.reduce((m, u) => m + u.staf.length, 0), 0)

// Membaca fail .xlsx (ArrayBuffer) menggunakan exceljs dan memulangkan baris lembaran pertama.
export async function bacaBarisExcel(buffer: ArrayBuffer): Promise<unknown[][]> {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const ws = wb.worksheets[0]
  if (!ws) return []
  const baris: unknown[][] = []
  ws.eachRow({ includeEmpty: true }, (row, n) => {
    baris[n - 1] = [1, 2, 3, 4].map((c) => row.getCell(c).value)
  })
  return Array.from(baris, (r) => r ?? [])
}
