export interface SignoVital {
  id?: number;
  pacienteId?: number;
  nombrePaciente?: string;
  correoPaciente?: string;
  presionSistolica?: number;
  presionDiastolica?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  temperatura?: number;
  saturacionOxigeno?: number;
  fechaHora?: string;
}

export interface RegistrarSignoVitalDTO {
  pacienteId: number;
  nombrePaciente: string;
  correoPaciente: string;
  presionSistolica?: number;
  presionDiastolica?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  temperatura?: number;
  saturacionOxigeno?: number;
  fechaHora?: string;
}
