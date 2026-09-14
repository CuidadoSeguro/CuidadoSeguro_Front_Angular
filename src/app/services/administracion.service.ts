import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GeneralService } from './general.service';

export type TipoRegistro = 'pacientes' | 'profesionales';

export interface Persona {
  id?: number | string;

  // Campos usados por la pantalla
  nombres: string;
  apellidos: string;
  rut: string;
  email: string;
  telefono?: string;
  estado?: 'Activo' | 'Inactivo' | string;
  fechaNacimiento?: string;
  especialidad?: string;
  numeroRegistro?: string;

  // Campos del backend
  diagnostico?: string;
  nombreCompleto?: string;
  activo?: boolean;
}

/**
 * DTO real del backend para Profesional.
 */
interface ProfesionalDto {
  id?: number;
  nombreCompleto: string;
  rut: string;
  especialidad: string;
  email: string;
  telefono?: string;
  activo?: boolean;
}

/**
 * DTO real del backend para Paciente.
 */
interface PacienteDto {
  id?: number;
  nombreCompleto: string;
  rut: string;
  email: string;
  telefono?: string;
  diagnostico?: string;
  estado?: string;
}

@Injectable({ providedIn: 'root' })
export class AdministracionService {
  //private readonly apiUrl = 'http://localhost:8080/api';
  private readonly apiUrl = 'https://8k5lqq2fia.execute-api.us-east-1.amazonaws.com/api';
  constructor(
    private readonly http: HttpClient,
    private readonly generalService: GeneralService,
  ) {}

  listar(tipo: TipoRegistro): Observable<Persona[]> {
    return this.http.get<ProfesionalDto[] | PacienteDto[]>(
      `${this.apiUrl}/${tipo}`,
      { headers: this.headers },
    ).pipe(
      map((respuesta) =>
        respuesta.map((registro) =>
          tipo === 'profesionales'
            ? this.profesionalToPersona(registro as ProfesionalDto)
            : this.pacienteToPersona(registro as PacienteDto),
        ),
      ),
    );
  }

  crear(tipo: TipoRegistro, persona: Persona): Observable<Persona> {
    const body =
      tipo === 'profesionales'
        ? this.personaToProfesional(persona)
        : this.personaToPaciente(persona);

    return this.http
      .post<ProfesionalDto | PacienteDto>(
        `${this.apiUrl}/${tipo}`,
        body,
        { headers: this.headers },
      )
      .pipe(
        map((respuesta) =>
          tipo === 'profesionales'
            ? this.profesionalToPersona(respuesta as ProfesionalDto)
            : this.pacienteToPersona(respuesta as PacienteDto),
        ),
      );
  }

  actualizar(
    tipo: TipoRegistro,
    id: string | number,
    persona: Persona,
  ): Observable<Persona> {
    const body =
      tipo === 'profesionales'
        ? this.personaToProfesional(persona)
        : this.personaToPaciente(persona);

    return this.http
      .put<ProfesionalDto | PacienteDto>(
        `${this.apiUrl}/${tipo}/${id}`,
        body,
        { headers: this.headers },
      )
      .pipe(
        map((respuesta) =>
          tipo === 'profesionales'
            ? this.profesionalToPersona(respuesta as ProfesionalDto)
            : this.pacienteToPersona(respuesta as PacienteDto),
        ),
      );
  }

  eliminar(tipo: TipoRegistro, id: string | number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${tipo}/${id}`,
      { headers: this.headers },
    );
  }

  private personaToProfesional(persona: Persona): ProfesionalDto {
    return {
      id: this.toNumberOrUndefined(persona.id),
      nombreCompleto: this.combinarNombre(persona),
      rut: persona.rut,
      especialidad: persona.especialidad ?? '',
      email: persona.email,
      telefono: persona.telefono ?? '',
      activo: (persona.estado ?? 'Activo') === 'Activo',
    };
  }

  private personaToPaciente(persona: Persona): PacienteDto {
    return {
      id: this.toNumberOrUndefined(persona.id),
      nombreCompleto: this.combinarNombre(persona),
      rut: persona.rut,
      email: persona.email,
      telefono: persona.telefono ?? '',
      diagnostico: persona.diagnostico ?? '',
      estado: persona.estado ?? 'Activo',
    };
  }

  private profesionalToPersona(dto: ProfesionalDto): Persona {
    const partes = this.separarNombre(dto.nombreCompleto);

    return {
      id: dto.id,
      nombres: partes.nombres,
      apellidos: partes.apellidos,
      nombreCompleto: dto.nombreCompleto,
      rut: dto.rut,
      especialidad: dto.especialidad ?? '',
      email: dto.email,
      telefono: dto.telefono ?? '',
      estado: dto.activo === false ? 'Inactivo' : 'Activo',
      activo: dto.activo !== false,
    };
  }

  private pacienteToPersona(dto: PacienteDto): Persona {
    const partes = this.separarNombre(dto.nombreCompleto);

    return {
      id: dto.id,
      nombres: partes.nombres,
      apellidos: partes.apellidos,
      nombreCompleto: dto.nombreCompleto,
      rut: dto.rut,
      email: dto.email,
      telefono: dto.telefono ?? '',
      diagnostico: dto.diagnostico ?? '',
      estado: dto.estado ?? 'Activo',
    };
  }

  private combinarNombre(persona: Persona): string {
    if (persona.nombreCompleto?.trim()) {
      return persona.nombreCompleto.trim();
    }

    return `${persona.nombres ?? ''} ${persona.apellidos ?? ''}`.trim();
  }

  private separarNombre(nombreCompleto: string | undefined): {
    nombres: string;
    apellidos: string;
  } {
    const nombre = (nombreCompleto ?? '').trim();

    if (!nombre) {
      return { nombres: '', apellidos: '' };
    }

    const palabras = nombre.split(/\s+/);

    if (palabras.length === 1) {
      return {
        nombres: palabras[0],
        apellidos: '',
      };
    }

    // Para mantener la interfaz actual:
    // primera mitad = nombres, segunda mitad = apellidos.
    const puntoCorte = Math.ceil(palabras.length / 2);

    return {
      nombres: palabras.slice(0, puntoCorte).join(' '),
      apellidos: palabras.slice(puntoCorte).join(' '),
    };
  }

  private toNumberOrUndefined(
    id: string | number | undefined,
  ): number | undefined {
    if (id === undefined || id === null || id === '') {
      return undefined;
    }

    const value = Number(id);
    return Number.isFinite(value) ? value : undefined;
  }

  private get headers(): HttpHeaders {
    const token = this.generalService.getJwtAccess();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }
}
