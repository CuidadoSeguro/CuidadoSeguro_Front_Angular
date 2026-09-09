import { Component, inject, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { GeneralService } from '../../../services/general.service';
import { Router } from '@angular/router';
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  jwtAccess: string | undefined;
  jwtId: string | undefined;
  roles: string[] = [];
  constructor(private ser: GeneralService, private router: Router) { }

  ngOnInit(): void {
    if (localStorage.getItem('logged') === '1') {
      this.router.navigate(['/admin']);
      return;
    }
    this.handleRedirect();
  }

  loginWithMicrosoft(): void {
    this.msalService.loginRedirect({ scopes: Login.API_SCOPES });
  }

  handleRedirect(): void {
    this.msalService.handleRedirectObservable().subscribe({
      next: (response) => {
        const accounts = this.msalService.instance.getAllAccounts();
        if (!response && accounts.length === 0) {
          return;
        }
        this.msalService.instance.setActiveAccount(accounts[0]);
        this.getJwt(response?.accessToken);
      },
      error: (error) => console.error('Error al procesar el redirect:', error),
    });
  }

  getJwt(preToken?: string): void {
    const account = this.msalService.instance.getActiveAccount()
      ?? this.msalService.instance.getAllAccounts()[0];

    if (!account) {
      console.error('No hay ninguna cuenta activa. Inicia sesión primero.');
      return;
    }

    const useToken = (accessToken: string): void => {
      this.jwtAccess = accessToken;
      this.roles = this.getRolesFromToken(this.jwtAccess);

      localStorage.setItem('rol_front', this.roles[0] ?? '');
      localStorage.setItem('jwtAccess', this.jwtAccess);

      const tokenAdmin = Login.isAdminRole(this.roles);
      localStorage.setItem('rol_back', tokenAdmin ? '0' : '1');
      localStorage.setItem('logged', '1');

      this.ser.login(this.jwtAccess).subscribe({
        next: (response: any) => {
          const backendAdmin = Login.isAdminRole(response?.roles);
          localStorage.setItem('rol_back', backendAdmin ? '0' : '1');
          localStorage.setItem('logged', '1');
          this.router.navigate([backendAdmin ? '/admin' : '/error']);
        },
        error: (error) => {
          console.error(
            'No se pudo validar con el backend; se usa el rol del token:',
            error
          );
          this.router.navigate([tokenAdmin ? '/admin' : '/error']);
        },
      });
    };

    if (preToken) {
      useToken(preToken);
      return;
    }

    this.msalService.instance.acquireTokenSilent({
      account,
      scopes: Login.API_SCOPES,
    }).then(result => {
      useToken(result.accessToken);
    }).catch(error => {
      console.error('Error al obtener el token:', error);
      this.msalService.loginRedirect({ scopes: Login.API_SCOPES });
    });
  }

  private getRolesFromToken(token: string): string[] {
    try {
      const payload = token.split('.')[1];//Se separa el token en sus partes y se toma la segunda parte (payload)
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');//El JWT usa base64url
      const decoded = JSON.parse(atob(base64));
      return decoded.roles ?? [];//Aquí se obtienen los roles del payload decodificado, si no existen se retorna un arreglo vacío
    } catch {
      console.error('Error al decodificar el token JWT');
=======

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

>>>>>>> Stashed changes
      return [];
    }
  }

  static primaryRole(roles: unknown): string {
<<<<<<< Updated upstream
    if (Array.isArray(roles)) {
      return String(roles[0]);
    }
    return String(roles);
  }

  static isAdminRole(roles: unknown): boolean {
    const list = Array.isArray(roles) ? roles : roles == null ? [] : [roles];
    const values = list.map((role) => String(role).toLowerCase());
    if (values.length === 0 || values.every((value) => value === '' || value === 'undefined')) {
      return true;
    }
    return values.some((value) => value === '0' || value.includes('admin'));
=======

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
>>>>>>> Stashed changes
  }
}