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
      return [];
    }
  }

  static primaryRole(roles: unknown): string {
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
  }
}