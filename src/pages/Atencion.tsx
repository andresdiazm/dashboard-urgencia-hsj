import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { AlertTriangle, Download } from 'lucide-react'
import { useDataStore } from '../store/useDataStore'
import { diffMinutes, formatDateTime } from '../utils/dateUtils'
import { exportToCSV } from '../utils/exportUtils'
import EmptyState from '../components/EmptyState'
import type { ESILevel } from '../types'

const ALERT_THRESHOLD = 360

const ESI_BADGE_COLORS: Record<ESILevel, string> = {
  'ESI-1': 'bg-red-700 text-white',
  'ESI-2': 'bg-orange-500 text-white',
  'ESI-3': 'bg-yellow-400 text-gray-900',
  'ESI-4': 'bg-green-500 text-white',
  'ESI-5': 'bg-blue-400 text-white',
}

const ESI_CHART_COLORS: Record<ESILevel, string> = {
  'ESI-1': '#B91C1C',
  'ESI-2': '#F97316',
  'ESI-3': '#FACC15',
  'ESI-4': '#22C55E',
  'ESI-5': '#60A5FA',
}

const ESI_LEVELS: ESILevel[] = ['ESI-1', 'ESI-2', 'ESI-3', 'ESI-4', 'ESI-5']

function badgeColor(esi: ESILevel) {
  return ESI_BADGE_COLORS[esi] ?? 'bg-gray-200'
}

function formatHrMin(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function pct(num: number, den: number) {
  if (den === 0) return 0
  return Math.round((num / den) * 100)
}

export default function Atencion() {
  const { patients, loadTimestamp } = useDataStore()
  const [filterESI, setFilterESI] = useState<ESILevel | 'all'>('all')
  const [filterEsp, setFilterEsp] = useState('all')
  const [filterAlerta, setFilterAlerta] = useState<'all' | 'alerta' | 'ok'>('all')

  const inAtencion = useMemo(
    () => patients.filter((p) => !p.enEspera && p.atencionDateTime !== null),
    [patients]
  )

  const enriched = useMemo(() => {
    if (!loadTimestamp) return []
    return inAtencion.map((p) => {
      const tiempoAtencion =
        p.atencionDateTime ? diffMinutes(p.atencionDateTime, loadTimestamp) : null
      const alerta = tiempoAtencion !== null && tiempoAtencion > ALERT_THRESHOLD

      return { ...p, tiempoAtencion, alerta }
    })
  }, [inAtencion, loadTimestamp])

  const especialidades = useMemo(
    () => ['all', ...Array.from(new Set(enriched.map((p) => p.especialidad))).sort()],
    [enriched]
  )

  const filtered = useMemo(() => {
    return enriched
      .filter((p) => filterESI === 'all' || p.esi === filterESI)
      .filter((p) => filterEsp === 'all' || p.especialidad === filterEsp)
      .filter((p) => {
        if (filterAlerta === 'alerta') return p.alerta
        if (filterAlerta === 'ok') return !p.alerta
        return true
      })
      .sort((a, b) => (b.tiempoAtencion ?? 0) - (a.tiempoAtencion ?? 0))
  }, [enriched, filterESI, filterEsp, filterAlerta])

  const kpis = useMemo(() => {
    const total = enriched.length
    const alertCount = enriched.filter((p) => p.alerta).length
    const pctAlert = pct(alertCount, total)
    return { total, alertCount, pctAlert }
  }, [enriched])

  const esiGroups = useMemo(() => {
    const groups: Record<string, number> = {}
    enriched.forEach((p) => {
      groups[p.esi] = (groups[p.esi] ?? 0) + 1
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [enriched])

  const espGroups = useMemo(() => {
    const groups: Record<string, { total: number; alert: number; byEsi: Partial<Record<ESILevel, number>> }> = {}
    enriched.forEach((p) => {
      if (!groups[p.especialidad]) groups[p.especialidad] = { total: 0, alert: 0, byEsi: {} }
      groups[p.especialidad].total++
      if (p.alerta) {
        groups[p.especialidad].alert++
        groups[p.especialidad].byEsi[p.esi] = (groups[p.especialidad].byEsi[p.esi] ?? 0) + 1
      }
    })
    return Object.entries(groups)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 8)
  }, [enriched])

  const espAlertData = useMemo(() => {
    return espGroups.map(([name, { total, alert, byEsi }]) => ({
      name: name.slice(0, 14),
      pct: pct(alert, total),
      alert,
      total,
      'ESI-1': byEsi['ESI-1'] ?? 0,
      'ESI-2': byEsi['ESI-2'] ?? 0,
      'ESI-3': byEsi['ESI-3'] ?? 0,
      'ESI-4': byEsi['ESI-4'] ?? 0,
      'ESI-5': byEsi['ESI-5'] ?? 0,
    }))
  }, [espGroups])

  function handleExport() {
    const headers = ['N°', 'RUN', 'Nombre', 'ESI', 'Especialidad', 'Ingreso', 'Inicio Atención', 'Tiempo (hrs:min)', 'Alerta']
    const rows = filtered.map((p, i) => [
      String(i + 1),
      p.runMasked,
      p.nombre,
      p.esi,
      p.especialidad,
      formatDateTime(p.ingresoFecha, p.ingresoHora),
      formatDateTime(p.atencionFecha, p.atencionHora),
      p.tiempoAtencion !== null ? formatHrMin(p.tiempoAtencion) : '',
      p.alerta ? 'Sí' : 'No',
    ])
    exportToCSV(headers, rows, 'pacientes_atencion.csv')
  }

  if (!loadTimestamp) return <EmptyState />

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-hsj-navy">Pacientes en Atención</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pacientes con atención iniciada ({kpis.total} casos)
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total en atención</p>
          <p className="text-3xl font-bold text-hsj-teal-dark mt-1">{kpis.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alerta &gt;6 hrs</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{kpis.alertCount}</p>
          <p className="text-xs text-gray-400">{kpis.pctAlert}% del total</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 col-span-2 md:col-span-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sin alerta</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{kpis.total - kpis.alertCount}</p>
          <p className="text-xs text-gray-400">{100 - kpis.pctAlert}% del total</p>
        </div>
      </div>

      {/* ESI + Especialidad */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Por ESI</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={esiGroups.map(([name, value]) => ({ name, value }))} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={50} />
              <Tooltip formatter={(val) => [val, 'Pacientes']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {esiGroups.map(([esi], i) => (
                  <Cell key={i} fill={ESI_CHART_COLORS[esi as ESILevel] ?? '#39A8AD'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Alertas (&gt;6h) por Especialidad
          </p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={espAlertData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={95} />
              <Tooltip
                formatter={(val, name) => [val, name]}
                labelFormatter={(label) => `Especialidad: ${label}`}
              />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {ESI_LEVELS.map((esi) => (
                <Bar key={esi} dataKey={esi} stackId="a" fill={ESI_CHART_COLORS[esi]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <span className="font-semibold text-hsj-navy text-sm">Casos en atención</span>
          <div className="flex flex-wrap gap-2 flex-1">
            <select
              value={filterESI}
              onChange={(e) => setFilterESI(e.target.value as ESILevel | 'all')}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5"
            >
              <option value="all">Todos los ESI</option>
              {(['ESI-1','ESI-2','ESI-3','ESI-4','ESI-5'] as ESILevel[]).map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <select
              value={filterEsp}
              onChange={(e) => setFilterEsp(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5"
            >
              {especialidades.map((e) => (
                <option key={e} value={e}>{e === 'all' ? 'Todas las especialidades' : e}</option>
              ))}
            </select>
            <select
              value={filterAlerta}
              onChange={(e) => setFilterAlerta(e.target.value as 'all' | 'alerta' | 'ok')}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5"
            >
              <option value="all">Todas las alertas</option>
              <option value="alerta">Solo alertas (&gt;6h)</option>
              <option value="ok">Sin alerta</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-hsj-teal-dark border border-hsj-teal/30 rounded-lg hover:bg-hsj-bg transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-hsj-bg text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left w-10">N°</th>
                <th className="px-4 py-3 text-left">RUN</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">ESI</th>
                <th className="px-4 py-3 text-left">Especialidad</th>
                <th className="px-4 py-3 text-left">Ingreso</th>
                <th className="px-4 py-3 text-left">Inicio Atención</th>
                <th className="px-4 py-3 text-right">Tiempo (hrs:min)</th>
                <th className="px-4 py-3 text-center">Alerta</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-t border-gray-50 ${p.alerta ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{p.runMasked}</td>
                  <td className="px-4 py-2 font-medium">{p.nombre}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${badgeColor(p.esi)}`}>
                      {p.esi}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{p.especialidad}</td>
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                    {formatDateTime(p.ingresoFecha, p.ingresoHora)}
                  </td>
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                    {formatDateTime(p.atencionFecha, p.atencionHora)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-semibold">
                    {p.tiempoAtencion !== null ? formatHrMin(p.tiempoAtencion) : '—'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {p.alerta && (
                      <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    No hay casos que coincidan con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          Mostrando {filtered.length} de {enriched.length} casos en atención
        </div>
      </div>
    </div>
  )
}
