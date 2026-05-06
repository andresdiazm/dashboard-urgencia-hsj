import { useRef, useState } from 'react'
import { Upload, Trash2, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDataStore } from '../store/useDataStore'
import { parseExcel } from '../utils/excelParser'
import type { Patient } from '../types'

const PAGE_SIZE = 25

export default function Carga() {
  const { patients, loadTimestamp, setData, clearData } = useDataStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const fileRef = useRef<HTMLInputElement>(null)

  const totalPages = Math.ceil(patients.length / PAGE_SIZE)
  const pageRows = patients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseExcel(buffer)
      if (parsed.length === 0) throw new Error('El archivo no contiene datos válidos.')
      setData(parsed, new Date())
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo.')
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleClear() {
    clearData()
    setPage(1)
    setError(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-hsj-navy">Carga de Datos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sube el archivo Excel exportado del sistema de gestión de urgencias.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-hsj-teal/40 rounded-xl p-10 cursor-pointer hover:border-hsj-teal hover:bg-hsj-bg transition-colors">
          <FileSpreadsheet className="w-10 h-10 text-hsj-teal" />
          <span className="text-sm font-medium text-gray-600">
            Haz clic o arrastra aquí tu archivo <span className="text-hsj-teal">.xlsx / .xls</span>
          </span>
          <span className="text-xs text-gray-400">Solo archivos Excel del sistema de urgencias</span>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFile}
            disabled={loading}
          />
        </label>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
        )}

        {loading && (
          <p className="mt-3 text-sm text-hsj-teal text-center animate-pulse">
            Procesando archivo...
          </p>
        )}
      </div>

      {patients.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-hsj-navy">{patients.length} registros cargados</span>
              {loadTimestamp && (
                <span className="ml-3 text-xs text-gray-400">
                  {loadTimestamp.toLocaleString('es-CL')}
                </span>
              )}
            </div>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar datos
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-hsj-bg text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">RUN</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Sexo</th>
                  <th className="px-4 py-3 text-left">ESI</th>
                  <th className="px-4 py-3 text-left">Especialidad</th>
                  <th className="px-4 py-3 text-left">Ingreso Fecha</th>
                  <th className="px-4 py-3 text-left">Ingreso Hora</th>
                  <th className="px-4 py-3 text-left">En Atención</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p: Patient) => (
                  <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-gray-500">{p.runMasked}</td>
                    <td className="px-4 py-2 font-medium">{p.nombre}</td>
                    <td className="px-4 py-2">{p.sexo}</td>
                    <td className="px-4 py-2">
                      <ESIBadgeInline esi={p.esi} />
                    </td>
                    <td className="px-4 py-2 text-gray-600">{p.especialidad}</td>
                    <td className="px-4 py-2 text-gray-500">{p.ingresoFecha}</td>
                    <td className="px-4 py-2 text-gray-500">{p.ingresoHora}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {p.enAtencion === '--:--' ? (
                        <span className="text-amber-600">—</span>
                      ) : (
                        <span className="text-green-600">{p.enAtencion}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {patients.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <Upload className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Sube un archivo Excel para ver los datos aquí</p>
        </div>
      )}
    </div>
  )
}

const ESI_COLORS: Record<string, string> = {
  'ESI-1': 'bg-red-700 text-white',
  'ESI-2': 'bg-orange-500 text-white',
  'ESI-3': 'bg-yellow-400 text-gray-900',
  'ESI-4': 'bg-green-500 text-white',
  'ESI-5': 'bg-blue-400 text-white',
}

function ESIBadgeInline({ esi }: { esi: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${ESI_COLORS[esi] ?? 'bg-gray-200'}`}>
      {esi}
    </span>
  )
}
