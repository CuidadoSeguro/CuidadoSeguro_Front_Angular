import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GeneralService } from '../services/general.service';

@Injectable({
  providedIn: 'root',
})
export class LoginGuard {

  constructor(
    private router: Router,
    private ser: GeneralService
  ) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    return this.validateSession(state.url);
  }

  private validateSession(
    url: string
  ): Observable<boolean> {

    const logged = this.ser.getLogged();

    const token = this.ser.getJwtAccess();

    const rolBack = this.ser.getRolBack();

    console.log(
      'GUARD:',
      {
        logged,
        tieneToken: !!token,
        rolBack
      }
    );

    /*
     * Si tenemos sesión completa,
     * podemos resolver directamente.
     */
    if (
      logged &&
      token
    ) {

      return of(
        this.resolveAccess(url)
      );
    }

    /*
     * Si no tenemos token,
     * no existe sesión.
     */
    if (!token) {

      return this.goTo('/login');
    }

    /*
     * Tenemos token pero no sesión local.
     * Validamos contra Spring Boot.
     */
    return this.ser.login(token).pipe(

      map((response: any) => {

        console.log(
          'GUARD - respuesta backend:',
          response
        );

        const isAdmin =
          LoginGuard.isAdminRole(
            response?.roles
          );

        this.ser.setRolBack(
          isAdmin ? '0' : '1'
        );

        this.ser.setLogged(true);

        return this.resolveAccess(url);
      }),

      catchError(error => {

        console.error(
          'GUARD - sesión inválida:',
          error
        );

        this.clearSession();

        return this.goTo('/login');
      })
    );
  }

  private resolveAccess(
    url: string
  ): boolean {

    const isAdmin =
      this.ser.getRolBack() === '0';

    const targetIsAdmin =
      url.startsWith('/admin');

    console.log(
      'GUARD - acceso:',
      {
        isAdmin,
        targetIsAdmin,
        url
      }
    );

    if (isAdmin) {

      if (!targetIsAdmin) {

        this.router.navigateByUrl('/admin');

      }

      return targetIsAdmin;
    }

    if (targetIsAdmin) {

      this.router.navigateByUrl('/error');

      return false;
    }

    return true;
  }

  private clearSession(): void {
    this.ser.clearSession();
  }

  private goTo(
    url: string
  ): Observable<false> {

    this.router.navigateByUrl(url);

    return of(false);
  }

  static primaryRole(
    roles: unknown
  ): string {

    if (Array.isArray(roles)) {

      return roles.length > 0
        ? String(roles[0])
        : '';
    }

    return roles == null
      ? ''
      : String(roles);
  }

  static isAdminRole(
    roles: unknown
  ): boolean {

    const list =
      Array.isArray(roles)
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