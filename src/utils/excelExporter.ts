// src/utils/excelExporter.ts
import * as XLSX from 'xlsx'
import { downloadBlob } from './helpers'

interface ExportRow {
  [key: string]: string | number
}

export const exportToExcel = (data: ExportRow[], filename: string, sheetName = 'Sheet1') => {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  downloadBlob(blob, `${filename}.xlsx`)
}