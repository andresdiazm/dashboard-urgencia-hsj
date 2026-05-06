import * as XLSX from 'xlsx'
import type { Patient, RawPatient, ESILevel } from '../types'
import { parseDateTime } from './dateUtils'

function maskRun(run: string): string {
  if (!run) return '****'
  const clean = run.replace(/\D/g, '')
  if (clean.length <= 4) return `****${clean}`
  const last4 = clean.slice(-4)
  return `****${last4}`
}

function normalizeESI(raw: string): ESILevel {
  const s = String(raw).trim().toUpperCase()
  if (s === 'ESI-1' || s === '1') return 'ESI-1'
  if (s === 'ESI-2' || s === '2') return 'ESI-2'
  if (s === 'ESI-3' || s === '3') return 'ESI-3'
  if (s === 'ESI-4' || s === '4') return 'ESI-4'
  return 'ESI-5'
}

function cellToString(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

export function parseExcel(buffer: ArrayBuffer): Patient[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<RawPatient>(sheet, {
    defval: '',
    raw: false,
  })

  return rows
    .map((row, idx): Patient => {
      const ingresoFecha = cellToString(row['Ingreso Fecha'])
      const ingresoHora = cellToString(row['Ingreso Hora'])
      const catFecha = cellToString(row['Categorización Fecha'])
      const catHora = cellToString(row['Categorización Hora'])
      const atenFecha = cellToString(row['Atención Fecha'])
      const atenHora = cellToString(row['Atención Hora'])
      const enAtencion = cellToString(row['En Atención'])

      const run = cellToString(row['RUN'])

      return {
        id: idx + 1,
        run,
        runMasked: maskRun(run),
        nombre: cellToString(row['Nombre']),
        sexo: cellToString(row['Sexo']),
        ingresoFecha,
        ingresoHora,
        ingresoDateTime: parseDateTime(ingresoFecha, ingresoHora),
        categorizacionFecha: catFecha,
        categorizacionHora: catHora,
        categorizacionDateTime: parseDateTime(catFecha, catHora),
        atencionFecha: atenFecha,
        atencionHora: atenHora,
        atencionDateTime: parseDateTime(atenFecha, atenHora),
        enAtencion,
        esi: normalizeESI(cellToString(row['ESI'])),
        especialidad: cellToString(row['Especialidad']) || 'Sin especialidad',
        comuna: cellToString(row['Comuna']),
        procedencia: cellToString(row['Procedencia']),
        enEspera: enAtencion === '--:--',
      }
    })
    .filter((p) => p.nombre !== '')
}
