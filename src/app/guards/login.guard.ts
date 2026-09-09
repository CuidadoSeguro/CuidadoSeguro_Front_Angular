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
  constructor(private router: Router, private ser: GeneralService) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.validateSession(state.url);
  }

  private validateSession(url: string): Observable<boolean> {
    if (localStorage.getItem('logged') === '1') {
      return of(this.resolveAccess(url));
    }

    const token = localStorage.getItem('jwtAccess');
    if (!token) {
      return this.goTo('/login');
    }

    return this.ser.login(token).pipe(
      map((response: any) => {
        if (response?.roles) {
          localStorage.setItem(
            'rol_back',
            LoginGuard.primaryRole(response.roles)
          );
          localStorage.setItem('logged', '1');
        }
        return this.resolveAccess(url);
      }),
      catchError(() => this.goTo('/login'))
    );
  }

  private resolveAccess(url: string): boolean {
    const isAdmin = localStorage.getItem('rol_back') === '0';
    const targetIsAdmin = url.startsWith('/admin');

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

  private goTo(url: string): Observable<false> {
    this.router.navigateByUrl(url);
    return of(false);
  }

  static primaryRole(roles: unknown): string {
    if (Array.isArray(roles)) {
      return String(roles[0]);
    }
    return String(roles);
  }
}