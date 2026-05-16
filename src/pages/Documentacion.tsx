import { Clock, Stethoscope, AlertTriangle, Database, Shield, BarChart2 } from 'lucide-react'

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-hsj-pal" />
        <h2 className="text-base font-bold text-hsj-bay">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-hsj-bg text-gray-500 uppercase text-xs">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-gray-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${color}`}>{label}</span>
  )
}

export default function Documentacion() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-hsj-bay">Documentación Técnica</h1>
        <p className="text-sm text-gray-500 mt-1">
          Indicadores calculados y reglas operacionales del Dashboard de Urgencia
        </p>
      </div>

      {/* Fuente de datos */}
      <Section icon={Database} title="Fuente de Datos">
        <p className="text-sm text-gray-600 mb-4">
          El dashboard opera sobre un archivo Excel (<code className="bg-gray-100 px-1 rounded">.xlsx / .xls</code>) exportado
          del sistema de gestión de urgencias. El archivo debe contener una hoja con las siguientes columnas:
        </p>
        <Table
          headers={['Columna', 'Descripción']}
          rows={[
            ['RUN', 'Identificador del paciente (se anonimiza al cargar)'],
            ['Nombre', 'Nombre completo del paciente'],
            ['Sexo', 'Sexo registrado en el sistema'],
            ['Ingreso Fecha', 'Fecha de ingreso al servicio de urgencia (DD/MM/AAAA)'],
            ['Ingreso Hora', 'Hora de ingreso (HH:MM)'],
            ['Categorización Fecha', 'Fecha en que se asignó el nivel ESI (DD/MM/AAAA)'],
            ['Categorización Hora', 'Hora de categorización (HH:MM)'],
            ['Atención Fecha', 'Fecha de inicio de atención médica (DD/MM/AAAA)'],
            ['Atención Hora', 'Hora de inicio de atención (HH:MM)'],
            ['En Atención', 'Hora de atención o \'--:--\' si el paciente aún espera'],
            ['ESI', 'Nivel de triage: ESI-1 a ESI-5 (o número 1–5)'],
            ['Especialidad', 'Especialidad médica asignada'],
            ['Comuna', 'Comuna de residencia del paciente'],
            ['Procedencia', 'Origen de la derivación'],
          ]}
        />
      </Section>

      {/* Reglas de clasificación */}
      <Section icon={Shield} title="Reglas de Clasificación">
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <p className="font-semibold text-hsj-bay mb-1">Estado del paciente</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-semibold text-amber-700">En Espera</p>
                <p className="text-xs mt-1 text-amber-600">Campo "En Atención" = <code>--:--</code></p>
                <p className="text-xs text-gray-600 mt-1">El paciente ingresó pero aún no ha iniciado atención médica.</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="font-semibold text-green-700">En Atención</p>
                <p className="text-xs mt-1 text-green-600">Campo "En Atención" tiene hora registrada</p>
                <p className="text-xs text-gray-600 mt-1">El paciente ya inició atención médica.</p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-semibold text-hsj-bay mb-1">Anonimización del RUN</p>
            <p>El RUN se enmascara al momento de la carga: solo se muestran los últimos 4 dígitos numéricos
            (<code className="bg-gray-100 px-1 rounded">****XXXX</code>). El RUN original nunca se almacena en el navegador.</p>
          </div>

          <div>
            <p className="font-semibold text-hsj-bay mb-1">Referencia temporal</p>
            <p>El instante de referencia para todos los cálculos de tiempo transcurrido es la <strong>fecha y hora de carga del archivo</strong>.
            Esto permite obtener tiempos actualizados al momento del análisis sin requerir una conexión al sistema clínico.</p>
          </div>
        </div>
      </Section>

      {/* Tiempos calculados */}
      <Section icon={Clock} title="Tiempos Calculados">
        <Table
          headers={['Indicador', 'Fórmula', 'Unidad']}
          rows={[
            [
              'Tiempo de espera',
              'Hora de carga − Hora de ingreso',
              'Minutos',
            ],
            [
              'Tiempo de categorización',
              'Hora de categorización − Hora de ingreso',
              'Minutos',
            ],
            [
              'Tiempo en atención',
              'Hora de carga − Hora de inicio de atención',
              'Minutos',
            ],
          ]}
        />
        <p className="text-xs text-gray-400 mt-3">
          Todos los tiempos se redondean al minuto más cercano.
          Los campos con valor <code>--/--/----</code> o <code>--:--</code> se tratan como nulos y se excluyen del cálculo.
        </p>
      </Section>

      {/* Niveles ESI */}
      <Section icon={BarChart2} title="Niveles ESI y Umbrales de Alerta">
        <p className="text-sm text-gray-600 mb-4">
          El sistema Emergency Severity Index (ESI) clasifica a los pacientes en 5 niveles de prioridad.
          El dashboard aplica umbrales de alerta sobre el tiempo de espera para cada nivel:
        </p>
        <Table
          headers={['Nivel', 'Color', 'Descripción', 'Umbral de alerta (espera)', 'Meta de cumplimiento']}
          rows={[
            [
              'ESI-1',
              <Badge color="bg-red-700 text-white" label="ESI-1" />,
              'Resucitación — atención inmediata',
              'Sin umbral automático',
              '—',
            ],
            [
              'ESI-2',
              <Badge color="bg-orange-500 text-white" label="ESI-2" />,
              'Emergencia',
              '> 30 min → alerta',
              '100% en < 30 min',
            ],
            [
              'ESI-3',
              <Badge color="bg-yellow-400 text-gray-900" label="ESI-3" />,
              'Urgencia',
              '> 90 min → alerta',
              '95% en < 90 min',
            ],
            [
              'ESI-4',
              <Badge color="bg-green-500 text-white" label="ESI-4" />,
              'Menos urgente',
              '> 180 min → alerta',
              '90% en < 180 min',
            ],
            [
              'ESI-5',
              <Badge color="bg-blue-400 text-white" label="ESI-5" />,
              'No urgente',
              '> 180 min → alerta',
              'Sin meta definida',
            ],
          ]}
        />
      </Section>

      {/* Sala de Espera */}
      <Section icon={Clock} title="Sección: Sala de Espera">
        <div className="space-y-5 text-sm">
          <div>
            <p className="font-semibold text-hsj-bay mb-2">Indicadores KPI</p>
            <Table
              headers={['Indicador', 'Definición']}
              rows={[
                ['Total en espera', 'Número de pacientes con estado "En Espera" en el archivo cargado.'],
                ['Mediana de espera', 'Mediana del tiempo de espera (min) de todos los pacientes en espera. Se usa mediana en lugar de promedio para reducir el efecto de valores extremos.'],
                ['Cat. <10 min', '% de pacientes en espera cuyo tiempo de categorización fue menor a 10 minutos.'],
                ['Con alerta', 'Número de pacientes cuyo tiempo de espera supera el umbral definido para su nivel ESI.'],
              ]}
            />
          </div>

          <div>
            <p className="font-semibold text-hsj-bay mb-2">Cumplimiento de tiempos por ESI</p>
            <p className="text-gray-600 mb-2">
              Para ESI-2, ESI-3, ESI-4 y ESI-5 se calcula el porcentaje de pacientes en espera
              cuyo tiempo de espera es menor al umbral del nivel. El semáforo se interpreta así:
            </p>
            <div className="grid md:grid-cols-3 gap-2">
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <p className="font-semibold text-green-700 text-xs">Verde</p>
                <p className="text-xs text-gray-600">Cumplimiento ≥ meta</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <p className="font-semibold text-yellow-700 text-xs">Amarillo</p>
                <p className="text-xs text-gray-600">Cumplimiento ≥ 80% de la meta</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="font-semibold text-red-700 text-xs">Rojo</p>
                <p className="text-xs text-gray-600">Cumplimiento &lt; 80% de la meta</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Si no hay casos para un nivel ESI, la tarjeta muestra "sin casos" en lugar de porcentaje.
            </p>
          </div>
        </div>
      </Section>

      {/* En Atención */}
      <Section icon={Stethoscope} title="Sección: En Atención">
        <div className="space-y-5 text-sm">
          <div>
            <p className="font-semibold text-hsj-bay mb-2">Indicadores KPI</p>
            <Table
              headers={['Indicador', 'Definición']}
              rows={[
                ['Total en atención', 'Número de pacientes con atención iniciada (campo "En Atención" con hora registrada).'],
                ['Alerta >6 hrs', 'Número y porcentaje de pacientes cuyo tiempo en atención supera las 6 horas (360 minutos). Indica posibles casos de prolongada permanencia.'],
                ['Sin alerta', 'Número y porcentaje de pacientes con tiempo en atención ≤ 360 minutos.'],
              ]}
            />
          </div>

          <div>
            <p className="font-semibold text-hsj-bay mb-2">Gráfico: Alertas por Especialidad</p>
            <p className="text-gray-600">
              Muestra el número de pacientes con alerta (&gt;6h) para cada especialidad, desglosado en
              barras apiladas por nivel ESI. Permite identificar qué especialidades concentran mayor
              cantidad de pacientes con permanencia prolongada y qué perfil de gravedad los compone.
            </p>
          </div>
        </div>
      </Section>

      {/* Alertas */}
      <Section icon={AlertTriangle} title="Lógica de Alertas Visuales">
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Alerta en Sala de Espera</p>
              <p className="text-xs text-gray-600 mt-1">
                Se activa cuando el tiempo de espera supera el umbral ESI del paciente (ESI-2: 30 min,
                ESI-3: 90 min, ESI-4/5: 180 min). Las filas en alerta se destacan en fondo rojo en la tabla.
                ESI-1 no tiene umbral automático ya que requiere atención inmediata.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Alerta en Atención</p>
              <p className="text-xs text-gray-600 mt-1">
                Se activa cuando el tiempo en atención supera 360 minutos (6 horas), independiente del nivel ESI.
                Las filas en alerta se destacan en fondo rojo en la tabla.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <div className="text-xs text-gray-400 pb-2">
        Dashboard de Urgencia · Hospital San José · v1.0 · Los datos no se almacenan en servidores: todo el procesamiento ocurre en el navegador del usuario.
      </div>
    </div>
  )
}
