import { NavLink } from 'react-router-dom'
import { Upload, Clock, Stethoscope, X, ArrowRightLeft, BookOpen, FileText } from 'lucide-react'
import { useDataStore } from '../../store/useDataStore'

const NAV_ITEMS = [
  { to: '/carga', label: 'Carga de Datos', icon: Upload },
  { to: '/espera', label: 'Sala de Espera', icon: Clock },
  { to: '/atencion', label: 'En Atención', icon: Stethoscope },
  { to: '/documentacion', label: 'Documentación', icon: FileText },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const { patients } = useDataStore()
  const waiting = patients.filter((p) => p.enEspera).length
  const attending = patients.filter((p) => !p.enEspera).length

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static top-0 left-0 h-full z-30
          flex flex-col
          w-64 bg-hsj-bay text-white
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 md:hidden">
          <span className="font-semibold text-sm">Menú</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-hsj-pal text-white font-semibold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="mx-3 my-2 border-t border-white/10" />

          <a
            href="https://andresdiazm.github.io/digera-urgencia/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />
            <span>Entrega de Turno</span>
          </a>

          <a
            href="https://andresdiazm.github.io/coursera_test/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span>GPC abreviadas</span>
          </a>
        </nav>

        {patients.length > 0 && (
          <div className="px-4 py-4 border-t border-white/10 text-xs text-white/50 space-y-1">
            <p>
              <span className="text-white/80 font-medium">{waiting}</span> en espera
            </p>
            <p>
              <span className="text-white/80 font-medium">{attending}</span> en atención
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
