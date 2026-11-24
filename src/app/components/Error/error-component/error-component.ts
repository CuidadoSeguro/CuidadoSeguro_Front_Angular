import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { GeneralService } from '../../../services/general.service';
import { SignoVital } from '../../../models/signo-vital';

@Component({
  selector: 'app-error-component',
  imports: [CommonModule],
  templateUrl: './error-component.html',
  styleUrl: './error-component.css',
})
export class ErrorComponent implements OnInit {

  professionalsCount: number = 0;

  // Signos vitales del paciente autenticado
  pacienteId: number | null = null;
  pacienteNombre: string = '';
  signosVitales: SignoVital[] = [];
  cargandoSignos: boolean = false;
  mensajeSignos: string = '';
  private solicitudSignosId = 0;

  constructor(
    private router: Router,
    private msalService: MsalService,
    private ser: GeneralService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProfesionales();
    this.cargarSignosVitales();
  }

  private cargarProfesionales(): void {

    console.log('Obteniendo el número de profesionales...');

    this.ser.getProfessionalsCount().subscribe({
      next: (count: number) => {

        console.log('RESPUESTA:', count);

        this.professionalsCount = count;

        // Fuerza la actualización visual del componente
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Error obteniendo número de profesionales:',
          error
        );

        // Siempre mantener un número visible
        this.professionalsCount = 0;

        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Identifica al paciente autenticado por el correo del token y carga
   * sus signos vitales desde CuidadoSeguro_Admin.
   */
  cargarSignosVitales(): void {
    const correo = this.correoPaciente;

    if (!correo) {
      this.mensajeSignos =
        'No fue posible identificar tu correo en la sesión actual para consultar tus signos vitales.';
      return;
    }

    // Invalida respuestas tardías de una consulta anterior.
    const solicitudActual = ++this.solicitudSignosId;

    this.cargandoSignos = true;
    this.mensajeSignos = '';
    this.pacienteId = null;
    this.pacienteNombre = '';

    this.ser.getPacientePorEmail(correo).subscribe({
      next: (paciente) => {
        if (solicitudActual !== this.solicitudSignosId) {
          return;
        }

        this.pacienteId = paciente.id;
        this.pacienteNombre = paciente.nombreCompleto;
        this.cargarHistorial(paciente.id, solicitudActual);
      },
      error: (error) => {
        if (solicitudActual !== this.solicitudSignosId) {
          return;
        }

        console.error('Error obteniendo el paciente autenticado:', error);

        this.cargandoSignos = false;
        this.signosVitales = [];
        this.mensajeSignos =
          error?.status === 404
            ? 'No encontramos una ficha de paciente asociada a tu correo.'
            : 'No fue posible consultar tus signos vitales. Intenta nuevamente.';

        this.cdr.detectChanges();
      }
    });
  }

  private cargarHistorial(pacienteId: number, solicitudActual: number): void {
    this.ser.getSignosVitales(pacienteId).subscribe({
      next: (signos) => {
        if (solicitudActual !== this.solicitudSignosId) {
          return;
        }

        this.signosVitales = Array.isArray(signos) ? signos : [];
        this.cargandoSignos = false;

        if (!this.signosVitales.length) {
          this.mensajeSignos =
            'Aún no tienes signos vitales registrados.';
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        if (solicitudActual !== this.solicitudSignosId) {
          return;
        }

        console.error('Error cargando signos vitales:', error);

        this.signosVitales = [];
        this.cargandoSignos = false;
        this.mensajeSignos =
          error?.name === 'TimeoutError'
            ? 'El servidor tardó demasiado en responder. Vuelve a intentar.'
            : `No fue posible cargar tus signos vitales (HTTP ${error?.status ?? 'sin respuesta'}).`;

        this.cdr.detectChanges();
      }
    });
  }

  get ultimoSigno(): SignoVital | null {
    return this.signosVitales.length ? this.signosVitales[0] : null;
  }

  formatearFechaHora(fecha: string | undefined): string {
    if (!fecha) {
      return '—';
    }
    return fecha.replace('T', ' ');
  }

  /**
   * Extrae el correo del JWT almacenado en memoria. Se usan varios claims
   * porque Cognito y Entra ID no exponen siempre el mismo.
   */
  private get correoPaciente(): string {
    // Cognito Access Tokens no incluyen necesariamente el claim email.
    // Primero usamos el correo ingresado durante el login; luego claims de Entra/otros tokens.
    const correoSesion = this.ser.getPatientEmail();
    if (correoSesion) {
      return correoSesion;
    }

    const claims = this.decodificarJwt(this.ser.getJwtAccess());

    if (!claims) {
      return '';
    }

    const candidatos = [
      claims['email'],
      claims['preferred_username'],
      claims['username'],
      claims['upn'],
      claims['unique_name'],
    ];

    const correo = candidatos.find(
      (valor) => typeof valor === 'string' && valor.includes('@'),
    );

    return correo ? String(correo) : '';
  }

  private decodificarJwt(token: string | null): Record<string, any> | null {
    if (!token) {
      return null;
    }

    try {
      const part = token.split('.')[1];
      if (!part) return null;

      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

      return JSON.parse(decodeURIComponent(
        Array.from(atob(padded))
          .map(char => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      ));
    } catch {
      return null;
    }
  }

  logout(): void {

    console.log('Cerrando sesión...');

    // Se lee el token antes de limpiar el estado para saber qué proveedor
    // de identidad emitió la sesión (Cognito o Microsoft Entra ID).
    const token = this.ser.getJwtAccess();
    const esCognito = this.esSesionCognito(token);

    this.ser.clearSession();

    localStorage.removeItem('logged');
    localStorage.removeItem('jwtAccess');
    localStorage.removeItem('rol_back');
    localStorage.removeItem('rol_front');

    if (!token) {
      this.router.navigateByUrl('/login');
      return;
    }

    if (esCognito) {
      // Cognito: revoca los tokens y vuelve al login local.
      this.ser
        .revocarSesionCognito(token)
        .finally(() => this.router.navigateByUrl('/login'));
      return;
    }

    // Microsoft Entra ID: cierra la sesión de MSAL y vuelve al login.
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: '/login'
      //postLogoutRedirectUri: 'https://cuidadoseguro.github.io/CuidadoSeguro_Front_Angular/'
    });
  }

  private esSesionCognito(token: string | null): boolean {
    const claims = this.decodificarJwt(token);
    const issuer = String(claims?.['iss'] ?? '').toLowerCase();

    return issuer.includes('cognito-idp');
  }
}
