export function parseDateTime(fecha: string, hora: string): Date | null {
  if (!fecha || !hora) return null
  if (fecha === '--/--/----' || hora === '--:--') return null

  const [day, month, year] = fecha.split('/')
  const [hh, mm] = hora.split(':')

  if (!day || !month || !year || !hh || !mm) return null

  const d = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hh),
    parseInt(mm),
    0,
    0
  )

  return isNaN(d.getTime()) ? null : d
}

export function diffMinutes(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 60000)
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60)
  const m = Math.abs(minutes) % 60
  const sign = minutes < 0 ? '-' : ''
  return h > 0 ? `${sign}${h}h ${m}min` : `${sign}${m}min`
}

export function formatHrMin(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatDateTime(fecha: string, hora: string): string {
  if (!fecha || !hora || fecha === '--/--/----') return '—'
  return `${fecha} ${hora}`
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}
