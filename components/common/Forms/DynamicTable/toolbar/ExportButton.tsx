'use client'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faFilePdf, faFileExcel, faFileCsv } from '@fortawesome/free-solid-svg-icons'
import { useTableContext } from '../core/TableContext'
import type { ColumnDef } from '../core/types'

/** Resolve the plain-text export value for a single cell */
function resolveCell<T>(col: ColumnDef<T>, item: T): string {
  if (col.exportValue) {
    const v = col.exportValue(item)
    return v != null ? String(v) : ''
  }
  if (col.sortValue) return String(col.sortValue(item))
  const raw = (item as Record<string, unknown>)[col.key]
  if (raw == null) return ''
  if (typeof raw === 'object') return ''
  return String(raw)
}

function ExportButton() {
  const { t } = useTranslation()
  const { data, visibleColumns } = useTableContext()

  const buildRows = useCallback((): string[][] => {
    return data.map((item) =>
      visibleColumns.map((col) => resolveCell(col, item as Record<string, unknown>))
    )
  }, [data, visibleColumns])

  const exportCSV = useCallback(() => {
    const headers = visibleColumns.map((col) => t(col.header))
    const rows = buildRows()
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    triggerDownload(blob, 'export.csv')
  }, [visibleColumns, buildRows, t])

  const exportXLSX = useCallback(async () => {
    const ExcelJS = await import('exceljs')
    const headers = visibleColumns.map((col) => t(col.header))
    const rows = buildRows()
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Export')
    ws.addRows([headers, ...rows])
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    triggerDownload(blob, 'export.xlsx')
  }, [visibleColumns, buildRows, t])

  const exportPDF = useCallback(async () => {
    const { default: JsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const headers = visibleColumns.map((col) => t(col.header))
    const rows = buildRows()
    const doc = new JsPDF({ orientation: 'landscape' })
    autoTable(doc, {
      head: [headers],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] },
    })
    doc.save('export.pdf')
  }, [visibleColumns, buildRows, t])

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        className="btn btn-sm btn-ghost"
        title={t('common.export')}
        disabled={data.length === 0}
      >
        <FontAwesomeIcon icon={faDownload} />
        <span className="hidden sm:inline ml-1">{t('common.export')}</span>
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content z-10 menu p-1 shadow-lg bg-base-100 border border-base-300 rounded-box w-40 mt-1"
      >
        <li>
          <button className="flex items-center gap-2 py-2" onClick={exportPDF}>
            <FontAwesomeIcon icon={faFilePdf} className="text-red-500 w-4" />
            <span className="text-sm">PDF</span>
          </button>
        </li>
        <li>
          <button className="flex items-center gap-2 py-2" onClick={exportXLSX}>
            <FontAwesomeIcon icon={faFileExcel} className="text-green-600 w-4" />
            <span className="text-sm">XLSX</span>
          </button>
        </li>
        <li>
          <button className="flex items-center gap-2 py-2" onClick={exportCSV}>
            <FontAwesomeIcon icon={faFileCsv} className="text-blue-500 w-4" />
            <span className="text-sm">CSV</span>
          </button>
        </li>
      </ul>
    </div>
  )
}

export default ExportButton

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
