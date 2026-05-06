export type ESILevel = 'ESI-1' | 'ESI-2' | 'ESI-3' | 'ESI-4' | 'ESI-5'

export interface RawPatient {
  RUN: string
  Nombre: string
  Sexo: string
  'Ingreso Fecha': string
  'Ingreso Hora': string
  'Categorización Fecha': string
  'Categorización Hora': string
  'Atención Fecha': string
  'Atención Hora': string
  'Cat → Ate.': string
  'Tiempo desde la categorización': string
  'En Atención': string
  ESI: ESILevel
  Especialidad: string
  Comuna: string
  Procedencia: string
  'Detalle Procedencia': string
  'Tipo Ambulancia': string
  'Llega en': string
}

export interface Patient {
  id: number
  run: string
  runMasked: string
  nombre: string
  sexo: string
  ingresoFecha: string
  ingresoHora: string
  ingresoDateTime: Date | null
  categorizacionFecha: string
  categorizacionHora: string
  categorizacionDateTime: Date | null
  atencionFecha: string
  atencionHora: string
  atencionDateTime: Date | null
  enAtencion: string
  esi: ESILevel
  especialidad: string
  comuna: string
  procedencia: string
  enEspera: boolean
}

export interface DataStore {
  patients: Patient[]
  loadTimestamp: Date | null
  setData: (patients: Patient[], timestamp: Date) => void
  clearData: () => void
}
