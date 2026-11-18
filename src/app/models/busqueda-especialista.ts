export interface Especialidad {
  id: string;
  nombre: string;
}

export interface TipoExamen {
  id: string;
  nombre: string;
}

export interface SolicitudBusquedaEspecialista {
  especialidadId: string;
  tipoExamenId: string;
}

export interface HorarioDisponible {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export interface EspecialistaDisponible {
  id: string;
  nombreCompleto: string;
  especialidad: string;
  centro: string;
  horarios: HorarioDisponible[];
}

export const ESPECIALIDADES_POR_DEFECTO: Especialidad[] = [
  { id: 'medicina-general', nombre: 'Medicina General' },
  { id: 'pediatria', nombre: 'Pediatría' },
  { id: 'cardiologia', nombre: 'Cardiología' },
  { id: 'traumatologia', nombre: 'Traumatología' },
  { id: 'dermatologia', nombre: 'Dermatología' },
  { id: 'ginecologia', nombre: 'Ginecología' },
  { id: 'neurologia', nombre: 'Neurología' },
  { id: 'oftalmologia', nombre: 'Oftalmología' },
  { id: 'otro', nombre: 'Otra Especialidad' },
  
];

export const TIPOS_EXAMEN_POR_DEFECTO: TipoExamen[] = [
  { id: 'consulta-general', nombre: 'Consulta general' },
  { id: 'analitica', nombre: 'Analítica / Laboratorio' },
  { id: 'radiografia', nombre: 'Radiografía' },
  { id: 'ecografia', nombre: 'Ecografía' },
  { id: 'electrocardiograma', nombre: 'Electrocardiograma' },
  { id: 'revision-medica', nombre: 'Revisión médica' },
  { id: 'otro', nombre: 'Otro tipo de examen' },

];
