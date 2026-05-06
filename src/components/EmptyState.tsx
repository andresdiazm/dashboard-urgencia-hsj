import { Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  message?: string
}

export default function EmptyState({ message }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="bg-hsj-bg rounded-full p-6">
        <Upload className="w-10 h-10 text-hsj-teal" />
      </div>
      <div>
        <p className="text-lg font-semibold text-gray-600">
          {message ?? 'No hay datos cargados'}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Carga un archivo Excel para comenzar
        </p>
      </div>
      <button
        onClick={() => navigate('/carga')}
        className="mt-2 px-4 py-2 bg-hsj-teal text-white rounded-lg text-sm font-medium hover:bg-hsj-teal-dark transition-colors"
      >
        Ir a Carga de Datos
      </button>
    </div>
  )
}
