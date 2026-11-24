import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from'@angular/common/http';
import { BehaviorSubject, Observable, timeout } from 'rxjs';
import { environment } from '../environments/environment';
import {
  Especialidad,
  EspecialistaDisponible,
  SolicitudBusquedaEspecialista,
  TipoExamen,
} from '../models/busqueda-especialista';
import { SignoVital } from '../models/signo-vital';

export interface PacientePublico {
  id: number;
  nombreCompleto: string;
  email: string;
  rut: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeneralService {
  /* El estado vive solo en memoria. No se persiste en localStorage,
     por lo que no puede manipularse desde las DevTools. */
  private _rolFront = new BehaviorSubject<string | null>(null);
  private _rolBack = new BehaviorSubject<string | null>(null);
  private _logged = new BehaviorSubject<boolean>(false);
  private _jwtAccess = new BehaviorSubject<string | null>(null);
  // Correo confirmado durante el inicio de sesión; el Access Token de Cognito
  // normalmente no incluye el atributo email.
  private _patientEmail = new BehaviorSubject<string | null>(null);

  public rolFront$ = this._rolFront.asObservable();
  public rolBack$ = this._rolBack.asObservable();
  public logged$ = this._logged.asObservable();
  public jwtAccess$ = this._jwtAccess.asObservable();
  public patientEmail$ = this._patientEmail.asObservable();

  constructor(private http: HttpClient) {

  }
  httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
  };
  //URL = 'https://i412mkzzqd.execute-api.us-east-1.amazonaws.com';
  URL = environment.apiUrl.replace(/\/+$/, '');
  Login = this.URL+'/api/login';

  CountProfessionals = this.URL+'/public/countProfesionales';
  Especialidades = this.URL+'/public/especialidades';
  TiposExamen = this.URL+'/public/tipos-examen';
  BuscarEspecialistas = this.URL+'/public/buscar-especialistas';
  PacientesPorEmail = this.URL+'/public/pacientes/email';

  getProfessionalsCount() {
    console.log('Obteniendo el número de profesionales...');
    return this.http.get<number>(this.CountProfessionals);
  }


  getEspecialidades(): Observable<Especialidad[]> {
    return this.http.get<Especialidad[]>(this.Especialidades);
  }

  getTiposExamen(): Observable<TipoExamen[]> {
    return this.http.get<TipoExamen[]>(this.TiposExamen);
  }

  buscarEspecialistas(
    solicitud: SolicitudBusquedaEspecialista
  ): Observable<EspecialistaDisponible[]> {
    return this.http.post<EspecialistaDisponible[]>(
      this.BuscarEspecialistas,
      solicitud
    );
  }

  /**
   * Resuelve el paciente autenticado a partir del correo del token.
   * Endpoint público de CuidadoSeguro_Admin: GET /public/pacientes/email/{email}
   */
  getPacientePorEmail(email: string): Observable<PacientePublico> {
    return this.http.get<PacientePublico>(
      `${this.PacientesPorEmail}/${encodeURIComponent(email)}`,
    ).pipe(
      timeout({ first: 15000 }),
    );
  }

  /**
   * Historial de signos vitales del paciente.
   * Endpoint autenticado de CuidadoSeguro_Admin:
   * GET /api/pacientes/{id}/signos-vitales
   */
  getSignosVitales(pacienteId: number): Observable<SignoVital[]> {
    return this.http.get<SignoVital[]>(
      `${this.URL}/api/pacientes/${pacienteId}/signos-vitales`,
      { headers: this.authHeaders },
    ).pipe(
      timeout({ first: 15000 }),
    );
  }

  private get authHeaders(): HttpHeaders {
    const token = this._jwtAccess.value;

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  login(token: string){
    return this.http.get(this.Login,{
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }

  setSession(
    jwtAccess: string,
    rolFront: string,
    rolBack: string,
    logged: boolean,
    patientEmail?: string | null,
  ) {
    this._jwtAccess.next(jwtAccess);
    this._patientEmail.next(patientEmail?.trim().toLowerCase() || null);
    this._rolFront.next(rolFront);
    this._rolBack.next(rolBack);
    this._logged.next(logged);
  }

  getPatientEmail(): string | null {
    return this._patientEmail.value;
  }

  setRolBack(rolBack: string) {
    this._rolBack.next(rolBack);
  }

  setLogged(logged: boolean) {
    this._logged.next(logged);
  }

  clearSession() {
    this._jwtAccess.next(null);
    this._patientEmail.next(null);
    this._rolFront.next(null);
    this._rolBack.next(null);
    this._logged.next(false);
  }

  /**
   * Revoca la sesión emitida por Amazon Cognito (GlobalSignOut). El token
   * debe obtenerse antes de llamar a clearSession().
   */
  async revocarSesionCognito(accessToken: string): Promise<void> {
    const { region } = environment.cognito;

    try {
      await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.GlobalSignOut',
        },
        body: JSON.stringify({ AccessToken: accessToken }),
      });
    } catch (error) {
      console.error('COGNITO - error al revocar la sesión:', error);
    }
  }

  getLogged(): boolean { return this._logged.value; }
  getJwtAccess(): string | null { return this._jwtAccess.value; }
  getRolBack(): string | null { return this._rolBack.value; }
  getRolFront(): string | null { return this._rolFront.value; }
}