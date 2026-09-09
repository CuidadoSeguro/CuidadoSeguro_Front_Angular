import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type TipoRegistro = 'pacientes' | 'profesionales';

export interface Persona {
  id?: number | string;
  nombres: string;
  apellidos: string;
  rut: string;
  email: string;
  telefono?: string;
  estado?: 'Activo' | 'Inactivo' | string;
  fechaNacimiento?: string;
  especialidad?: string;
  numeroRegistro?: string;
}

@Injectable({ providedIn: 'root' })
export class AdministracionService {
  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(private readonly http: HttpClient) {}

  listar(tipo: TipoRegistro): Observable<Persona[] | { content?: Persona[]; data?: Persona[] }> {
    return this.http.get<Persona[] | { content?: Persona[]; data?: Persona[] }>(
      `${this.apiUrl}/${tipo}`,
      { headers: this.headers },
    );
  }

  crear(tipo: TipoRegistro, persona: Persona): Observable<Persona> {
    return this.http.post<Persona>(`${this.apiUrl}/${tipo}`, persona, { headers: this.headers });
  }

  actualizar(tipo: TipoRegistro, id: string | number, persona: Persona): Observable<Persona> {
    return this.http.put<Persona>(`${this.apiUrl}/${tipo}/${id}`, persona, { headers: this.headers });
  }

  eliminar(tipo: TipoRegistro, id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tipo}/${id}`, { headers: this.headers });
  }

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('jwtAccess');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
