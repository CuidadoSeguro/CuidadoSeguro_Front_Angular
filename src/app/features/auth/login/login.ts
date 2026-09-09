import { Component, inject, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { GeneralService } from '../../../services/general.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  private static readonly API_SCOPES = [
    'api://3912eb25-8b20-4725-9b9d-18a99c419ead/access_as_user',
  ];

  private readonly msalService = inject(MsalService);

  jwtAccess = '';
  jwtId = '';
  roles: string[] = [];

  constructor(
    private ser: GeneralService,
    private router: Router
  ) {}

  ngOnInit(): void {

    console.log('LOGIN - ngOnInit');

    // Si ya existe una sesión propia de la aplicación
    const logged = localStorage.getItem('logged');

    console.log('LOGIN - logged:', logged);

    if (logged === '1') {
      console.log('LOGIN - sesión existente');

      this.router.navigate(['/admin']);
      return;
    }

    this.handleRedirect();
  }

  /**
   * Botón "Iniciar sesión con Microsoft"
   */
  loginWithMicrosoft(): void {

    console.log('LOGIN - iniciando Microsoft');

    this.msalService.loginRedirect({
      scopes: Login.API_SCOPES
    });
  }

  /**
   * Procesa el retorno desde Microsoft
   */
  private handleRedirect(): void {

    console.log('LOGIN - procesando redirect');

    this.msalService.handleRedirectObservable().subscribe({

      next: (response) => {

        console.log('LOGIN - respuesta MSAL:', response);

        const accounts = this.msalService.instance.getAllAccounts();

        console.log('LOGIN - cuentas:', accounts);

        if (accounts.length === 0) {
          console.log('LOGIN - no hay cuentas');
          return;
        }

        // IMPORTANTE:
        // Seleccionamos la primera cuenta
        const account = accounts[0];

        this.msalService.instance.setActiveAccount(account);

        console.log(
          'LOGIN - cuenta activa:',
          this.msalService.instance.getActiveAccount()
        );

        // Si el redirect ya entregó accessToken lo usamos.
        if (response?.accessToken) {

          console.log('LOGIN - usando accessToken del redirect');

          this.processToken(response.accessToken);

          return;
        }

        // Si no viene token, solicitamos uno silenciosamente
        this.getJwt();
      },

      error: (error) => {

        console.error(
          'LOGIN - Error procesando redirect:',
          error
        );
      }
    });
  }

  /**
   * Obtiene el token desde MSAL
   */
  private getJwt(): void {

    const account =
      this.msalService.instance.getActiveAccount()
      ?? this.msalService.instance.getAllAccounts()[0];

    if (!account) {

      console.error(
        'LOGIN - No existe una cuenta activa'
      );

      return;
    }

    console.log(
      'LOGIN - solicitando token silenciosamente'
    );

    this.msalService.instance.acquireTokenSilent({

      account,

      scopes: Login.API_SCOPES

    }).then(result => {

      console.log(
        'LOGIN - accessToken obtenido'
      );

      this.processToken(result.accessToken);

    }).catch(error => {

      console.error(
        'LOGIN - Error obteniendo accessToken:',
        error
      );

      this.msalService.loginRedirect({
        scopes: Login.API_SCOPES
      });
    });
  }

  /**
   * Procesa el JWT y crea la sesión de nuestra aplicación
   */
  private processToken(accessToken: string): void {

    console.log('LOGIN - procesando token');

    if (!accessToken) {

      console.error(
        'LOGIN - accessToken vacío'
      );

      return;
    }

    this.jwtAccess = accessToken;

    // Obtener roles desde JWT
    this.roles = this.getRolesFromToken(accessToken);

    console.log(
      'LOGIN - roles del token:',
      this.roles
    );

    /*
     * Guardamos primero la información local.
     */

    const frontendRole =
      this.roles.length > 0
        ? this.roles[0]
        : '';

    const isAdmin =
      Login.isAdminRole(this.roles);

    localStorage.setItem(
      'jwtAccess',
      accessToken
    );

    localStorage.setItem(
      'rol_front',
      frontendRole
    );

    localStorage.setItem(
      'rol_back',
      isAdmin ? '0' : '1'
    );

    localStorage.setItem(
      'logged',
      '1'
    );

    console.log(
      'LOGIN - localStorage guardado'
    );

    console.log(
      'jwtAccess:',
      localStorage.getItem('jwtAccess')
    );

    console.log(
      'rol_front:',
      localStorage.getItem('rol_front')
    );

    console.log(
      'rol_back:',
      localStorage.getItem('rol_back')
    );

    console.log(
      'logged:',
      localStorage.getItem('logged')
    );

    /*
     * Ahora validamos la sesión con Spring Boot.
     */

    this.ser.login(accessToken).subscribe({

      next: (response: any) => {

        console.log(
          'LOGIN - respuesta backend:',
          response
        );

        const backendIsAdmin =
          Login.isAdminRole(response?.roles);

        localStorage.setItem(
          'rol_back',
          backendIsAdmin ? '0' : '1'
        );

        localStorage.setItem(
          'logged',
          '1'
        );

        console.log(
          'LOGIN - localStorage después del backend:',
          {
            jwtAccess: !!localStorage.getItem('jwtAccess'),
            rol_front: localStorage.getItem('rol_front'),
            rol_back: localStorage.getItem('rol_back'),
            logged: localStorage.getItem('logged')
          }
        );

        if (backendIsAdmin) {

          this.router.navigate(['/admin']);

        } else {

          this.router.navigate(['/error']);

        }
      },

      error: (error) => {

        console.error(
          'LOGIN - Error validando con Spring Boot:',
          error
        );

        /*
         * Aunque Spring falle, mantenemos la sesión
         * basada en el token.
         */

        this.router.navigate([
          isAdmin ? '/admin' : '/error'
        ]);
      }
    });
  }

  /**
   * Obtiene los roles del JWT
   */
  private getRolesFromToken(token: string): string[] {

    try {

      const parts = token.split('.');

      if (parts.length !== 3) {

        console.error(
          'LOGIN - JWT inválido'
        );

        return [];
      }

      const payload = parts[1];

      const base64 =
        payload
          .replace(/-/g, '+')
          .replace(/_/g, '/');

      const decoded = JSON.parse(
        atob(base64)
      );

      console.log(
        'LOGIN - payload JWT:',
        decoded
      );

      return Array.isArray(decoded.roles)
        ? decoded.roles
        : [];

    } catch (error) {

      console.error(
        'LOGIN - Error decodificando JWT:',
        error
      );

      return [];
    }
  }

  static primaryRole(roles: unknown): string {

    if (Array.isArray(roles)) {

      return roles.length > 0
        ? String(roles[0])
        : '';
    }

    return roles == null
      ? ''
      : String(roles);
  }

  static isAdminRole(roles: unknown): boolean {

    const list = Array.isArray(roles)
      ? roles
      : roles == null
        ? []
        : [roles];

    const values =
      list.map(role =>
        String(role).toLowerCase()
      );

    
    if (values.length === 0) {
      return false;
    }

    return values.some(value =>
      value === '0' ||
      value.includes('admin')
    );
  }
}