import type { ESILevel } from '../../types'

const ESI_COLORS: Record<ESILevel, string> = {
  'ESI-1': 'bg-red-700 text-white',
  'ESI-2': 'bg-orange-500 text-white',
  'ESI-3': 'bg-yellow-400 text-gray-900',
  'ESI-4': 'bg-green-500 text-white',
  'ESI-5': 'bg-blue-400 text-white',
}

interface Props {
  esi: ESILevel
}

export default function ESIBadge({ esi }: Props) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${ESI_COLORS[esi]}`}
    >
      {esi}
    </span>
  )
}
