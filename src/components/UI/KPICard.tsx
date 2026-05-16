interface Props {
  title: string
  value: string | number
  subtitle?: string
  color?: string
  icon?: React.ReactNode
}

export default function KPICard({ title, value, subtitle, color = 'text-hsj-bay', icon }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(26,58,107,.12)] border border-gray-100 p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">{title}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
  )
}
