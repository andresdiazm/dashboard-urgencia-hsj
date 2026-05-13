import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { AlertTriangle, Download } from 'lucide-react'
import { useDataStore } from '../store/useDataStore'
import { diffMinutes, median, formatDateTime } from '../utils/dateUtils'
import { exportToCSV } from '../utils/exportUtils'
import EmptyState from '../components/EmptyState'
import type { ESILevel } from '../types'

const ESI_THRESHOLDS: Partial<Record<ESILevel, number>> = {
  'ESI-2': 30,
  'ESI-3': 90,
  'ESI-4': 180,
  'ESI-5': 180,
}

const ESI_TARGETS: Partial<Record<ESILevel, number>> = {
  'ESI-2': 100,
  'ESI-3': 95,
  'ESI-4': 90,
}

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

function pct(num: number, den: number) {
  if (den === 0) return 0
  return Math.round((num / den) * 100)
}

function semaphoreColor(value: number, target: number): string {
  if (value >= target) return 'text-green-600 bg-green-50 border-green-200'
  if (value >= target * 0.8) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function badgeColor(esi: ESILevel) {
  return ESI_BADGE_COLORS[esi] ?? 'bg-gray-200'
}

export default function Espera() {
  const { patients, loadTimestamp } = useDataStore()
  const [filterESI, setFilterESI] = useState<ESILevel | 'all'>('all')
  const [filterEsp, setFilterEsp] = useState('all')
  const [filterAlerta, setFilterAlerta] = useState<'all' | 'alerta' | 'ok'>('all')

  const waitingPatients = useMemo(
    () => patients.filter((p) => p.enEspera),
    [patients]
  )

  const enriched = useMemo(() => {
    if (!loadTimestamp) return []
    return waitingPatients.map((p) => {
      const tiempoEspera =
        p.ingresoDateTime ? diffMinutes(p.ingresoDateTime, loadTimestamp) : null
      const tiempoCat =
        p.ingresoDateTime && p.categorizacionDateTime
          ? diffMinutes(p.ingresoDateTime, p.categorizacionDateTime)
          : null

      const threshold = ESI_THRESHOLDS[p.esi]
      const alerta = threshold !== undefined && tiempoEspera !== null && tiempoEspera > threshold

      return { ...p, tiempoEspera, tiempoCat, alerta }
    })
  }, [waitingPatients, loadTimestamp])

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
      .sort((a, b) => (b.tiempoEspera ?? 0) - (a.tiempoEspera ?? 0))
  }, [enriched, filterESI, filterEsp, filterAlerta])

  const kpis = useMemo(() => {
    const waitMin = enriched.map((p) => p.tiempoEspera ?? 0)
    const catMin = enriched.filter((p) => p.tiempoCat !== null).map((p) => p.tiempoCat!)
    const catUnder10 = catMin.filter((m) => m < 10).length
    const pctCat10 = pct(catUnder10, catMin.length)
    const medEspera = median(waitMin)

    return { medEspera, pctCat10, total: enriched.length }
  }, [enriched])

  const espEsiData = useMemo(() => {
    const groups: Record<string, Partial<Record<ESILevel, number>> & { total: number }> = {}
    enriched.forEach((p) => {
      if (!groups[p.especialidad]) groups[p.especialidad] = { total: 0 }
      groups[p.especialidad].total = (groups[p.especialidad].total ?? 0) + 1
      groups[p.especialidad][p.esi] = (groups[p.especialidad][p.esi] ?? 0) + 1
    })
    return Object.entries(groups)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 8)
      .map(([name, counts]) => ({
        name: name.slice(0, 14),
        'ESI-1': counts['ESI-1'] ?? 0,
        'ESI-2': counts['ESI-2'] ?? 0,
        'ESI-3': counts['ESI-3'] ?? 0,
        'ESI-4': counts['ESI-4'] ?? 0,
        'ESI-5': counts['ESI-5'] ?? 0,
      }))
  }, [enriched])

  const espMedianaData = useMemo(() => {
    const groups: Record<string, number[]> = {}
    enriched.forEach((p) => {
      if (p.tiempoEspera !== null) {
        if (!groups[p.especialidad]) groups[p.especialidad] = []
        groups[p.especialidad].push(p.tiempoEspera)
      }
    })
    return Object.entries(groups)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 8)
      .map(([name, values]) => ({
        name: name.slice(0, 10),
        mediana: median(values),
      }))
  }, [enriched])

  const compliance = useMemo(() => {
    const esiList: ESILevel[] = ['ESI-2', 'ESI-3', 'ESI-4', 'ESI-5']
    return esiList.map((esi) => {
      const group = enriched.filter((p) => p.esi === esi)
      const threshold = ESI_THRESHOLDS[esi]
      if (!threshold) return { esi, total: group.length, metric: 0, label: '', isAlert: false }
      const onTime = group.filter((p) => (p.tiempoEspera ?? Infinity) <= threshold).length
      const metric = pct(onTime, group.length)
      return { esi, total: group.length, metric, label: `% con espera <${threshold}min`, isAlert: false }
    })
  }, [enriched])

  function handleExport() {
    const headers = ['N°', 'RUN', 'Nombre', 'ESI', 'Especialidad', 'Ingreso', 'Espera (min)', 'Cat. en (min)', 'Alerta']
    const rows = filtered.map((p, i) => [
      String(i + 1),
      p.runMasked,
      p.nombre,
      p.esi,
      p.especialidad,
      formatDateTime(p.ingresoFecha, p.ingresoHora),
      String(p.tiempoEspera ?? ''),
      String(p.tiempoCat ?? ''),
      p.alerta ? 'Sí' : 'No',
    ])
    exportToCSV(headers, rows, 'sala_espera.csv')
  }

  if (!loadTimestamp) return <EmptyState />

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-hsj-navy">Sala de Espera</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pacientes que aún no han iniciado atención ({kpis.total} casos)
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total en espera</p>
          <p className="text-3xl font-bold text-hsj-teal-dark mt-1">{kpis.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mediana espera</p>
          <p className="text-3xl font-bold text-hsj-teal-dark mt-1">{kpis.medEspera}</p>
          <p className="text-xs text-gray-400">minutos</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cat. &lt;10 min</p>
          <p className="text-3xl font-bold text-hsj-teal-dark mt-1">{kpis.pctCat10}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Con alerta</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {enriched.filter((p) => p.alerta).length}
          </p>
        </div>
      </div>

      {/* Semáforo ESI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <p className="text-sm font-semibold text-hsj-navy mb-4">Cumplimiento de tiempos por ESI</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {compliance.map(({ esi, total, metric, label }) => {
            const target = ESI_TARGETS[esi as ESILevel]
            const colorClass = total === 0
              ? 'text-gray-400 bg-gray-50 border-gray-200'
              : target
              ? semaphoreColor(metric, target)
              : 'text-gray-500 bg-gray-50 border-gray-200'

            return (
              <div key={esi} className={`rounded-lg border p-4 ${colorClass}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{esi}</span>
                  <span className="text-xs opacity-70">n={total}</span>
                </div>
                {total === 0 ? (
                  <p className="text-sm font-semibold mt-1">sin casos</p>
                ) : (
                  <p className="text-2xl font-bold">{metric}%</p>
                )}
                <p className="text-xs opacity-70 mt-1">{label}</p>
                {target && total > 0 && (
                  <p className="text-xs opacity-60">Meta: {target}%</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Gráficos: Casos por especialidad + Mediana de espera */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Casos por Especialidad y ESI</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={espEsiData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={95} />
              <Tooltip labelFormatter={(label) => `Especialidad: ${label}`} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {ESI_LEVELS.map((esi) => (
                <Bar key={esi} dataKey={esi} stackId="a" fill={ESI_CHART_COLORS[esi]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Mediana de Espera por Especialidad (min)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={espMedianaData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} min`, 'Mediana']} />
              <Bar dataKey="mediana" fill="#39A8AD" radius={[4, 4, 0, 0]}>
                {espMedianaData.map((_, i) => (
                  <Cell key={i} fill="#39A8AD" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <span className="font-semibold text-hsj-navy text-sm">Casos en espera</span>
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
              <option value="alerta">Solo alertas</option>
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
                <th className="px-4 py-3 text-right">Espera (min)</th>
                <th className="px-4 py-3 text-right">Cat. (min)</th>
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
                  <td className="px-4 py-2 text-right font-mono font-semibold">
                    {p.tiempoEspera !== null ? p.tiempoEspera : '—'}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-gray-500">
                    {p.tiempoCat !== null ? p.tiempoCat : '—'}
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
          Mostrando {filtered.length} de {enriched.length} casos en espera
        </div>
      </div>
    </div>
  )
}
