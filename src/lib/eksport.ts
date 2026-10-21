import type { Borders } from 'exceljs'
import { adaLajurJenis, adaLajurMonitor, lajurLaporan, namaFailLaporan, type SeksyenLaporan } from './laporan'

interface PilihanEksport {
  lajurWarranty?: boolean
}

function muatTurun(blob: Blob, namaFail: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = namaFail
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// PDF A4 landskap, tanpa logo dan tanpa ruang tandatangan. Satu seksyen satu halaman baharu.
export async function janaPdf(seksyen: SeksyenLaporan[], { lajurWarranty = false }: PilihanEksport = {}): Promise<void> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const lajur = lajurLaporan(lajurWarranty, adaLajurMonitor(seksyen), adaLajurJenis(seksyen))
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const lebarHalaman = doc.internal.pageSize.getWidth()
  const margin = 12
  const jumlahLebar = lajur.reduce((n, l) => n + l.lebar, 0)
  const skala = (lebarHalaman - margin * 2) / jumlahLebar

  seksyen.forEach((s, i) => {
    if (i > 0) doc.addPage()
    let y = 16
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(s.tajuk, lebarHalaman / 2, y, { align: 'center' })
    doc.setFontSize(11)
    for (const t of s.subtajuk) {
      y += 6
      doc.text(t, lebarHalaman / 2, y, { align: 'center' })
    }
    autoTable(doc, {
      startY: y + 6,
      margin: { left: margin, right: margin, top: 14 },
      head: [lajur.map((l) => l.tajuk)],
      body: s.baris.map((b) => lajur.map((l) => String(b[l.kunci] ?? ''))),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, textColor: 20, lineColor: 60, lineWidth: 0.2, cellPadding: 1.8, valign: 'middle' },
      headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold', halign: 'center' },
      columnStyles: Object.fromEntries(
        lajur.map((l, k) => [k, { cellWidth: l.lebar * skala, halign: l.kunci === 'bil' ? ('center' as const) : ('left' as const) }]),
      ),
      showHead: 'everyPage',
    })
  })

  const jumlahHalaman = doc.getNumberOfPages()
  for (let p = 1; p <= jumlahHalaman; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`${p} / ${jumlahHalaman}`, lebarHalaman - margin, doc.internal.pageSize.getHeight() - 6, { align: 'right' })
  }
  muatTurun(doc.output('blob'), namaFailLaporan(seksyen, 'pdf'))
}

function namaLembaran(s: SeksyenLaporan, terpakai: Set<string>): string {
  const asas = `${s.tajuk.replace(/^SENARAI ASET ICT \(|\)$/g, '')} ${s.subtajuk.at(-1)}`
    .replace(/[[\]:*?/\\]/g, '')
    .slice(0, 28)
  let nama = asas
  for (let n = 2; terpakai.has(nama); n++) nama = `${asas.slice(0, 25)} ${n}`
  terpakai.add(nama)
  return nama
}

// Excel untuk disunting: satu lembaran bagi setiap seksyen, disediakan untuk cetakan A4 landskap.
export async function janaExcel(seksyen: SeksyenLaporan[], { lajurWarranty = false }: PilihanEksport = {}): Promise<void> {
  const { default: ExcelJS } = await import('exceljs')
  const lajur = lajurLaporan(lajurWarranty, adaLajurMonitor(seksyen), adaLajurJenis(seksyen))
  const wb = new ExcelJS.Workbook()
  const terpakai = new Set<string>()
  const sempadan: Partial<Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  }

  for (const s of seksyen) {
    const ws = wb.addWorksheet(namaLembaran(s, terpakai), {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true },
    })
    ws.columns = lajur.map((l) => ({ key: l.kunci, width: l.lebar * 1.2 }))
    const tajuk = [s.tajuk, ...s.subtajuk]
    tajuk.forEach((t, i) => {
      const r = ws.getRow(i + 1)
      r.getCell(1).value = t
      ws.mergeCells(i + 1, 1, i + 1, lajur.length)
      r.getCell(1).alignment = { horizontal: 'center' }
      r.getCell(1).font = { bold: true, size: i === 0 ? 14 : 12 }
    })
    const barisKepala = tajuk.length + 2
    const kepala = ws.getRow(barisKepala)
    lajur.forEach((l, k) => {
      const c = kepala.getCell(k + 1)
      c.value = l.tajuk
      c.font = { bold: true }
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6E6' } }
      c.border = sempadan
    })
    s.baris.forEach((b, j) => {
      const r = ws.getRow(barisKepala + 1 + j)
      lajur.forEach((l, k) => {
        const c = r.getCell(k + 1)
        c.value = b[l.kunci] ?? ''
        c.border = sempadan
        c.alignment = { vertical: 'middle', wrapText: true, horizontal: l.kunci === 'bil' ? 'center' : 'left' }
      })
    })
    ws.pageSetup.printTitlesRow = `${barisKepala}:${barisKepala}`
  }

  const buffer = await wb.xlsx.writeBuffer()
  muatTurun(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    namaFailLaporan(seksyen, 'xlsx'),
  )
}
