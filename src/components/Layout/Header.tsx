import { useDataStore } from '../../store/useDataStore'
import { Menu } from 'lucide-react'

interface Props {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: Props) {
  const { loadTimestamp, patients } = useDataStore()

  return (
    <header
      className="text-white px-4 py-3 flex items-center gap-3 shadow-md z-10"
      style={{
        background: '#1A3A6B',
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,.03) 30px, rgba(255,255,255,.03) 60px)',
      }}
    >
      <button
        onClick={onMenuClick}
        className="md:hidden p-1 rounded hover:bg-white/10"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 flex-1">
        <div className="w-9 h-9 rounded-full bg-hsj-pal flex items-center justify-center font-bold text-sm flex-shrink-0">
          HSJ
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-hsj-pal font-medium leading-tight">
            SUBDIRECCIÓN DE GESTIÓN CLÍNICA
          </p>
          <p className="font-semibold text-sm leading-tight" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
            Dashboard Urgencia
          </p>
          <p className="text-xs text-white/60 leading-tight">Hospital San José · Santiago</p>
        </div>
      </div>

      {loadTimestamp && (
        <div className="hidden sm:flex flex-col items-end text-right">
          <span className="text-xs text-white/50">Datos cargados</span>
          <span className="text-xs font-medium text-hsj-pal">
            {loadTimestamp.toLocaleString('es-CL')} · {patients.length} registros
          </span>
        </div>
      )}
    </header>
  )
}
