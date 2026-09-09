import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { GeneralService } from '../services/general.service';
import { LoginGuard } from './login.guard';

function runGuard(guard: LoginGuard, url: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const result = guard.canActivate(
      {} as never,
      { url } as never
    ) as Observable<boolean>;
    result.subscribe(resolve);
  });
}

describe('LoginGuard', () => {
  let guard: LoginGuard;
  let loginSpy: ReturnType<typeof vi.fn>;
  let routerSpy: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    //localStorage.clear();
    loginSpy = vi.fn();
    routerSpy = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        LoginGuard,
        { provide: Router, useValue: routerSpy },
        { provide: GeneralService, useValue: { login: loginSpy } },
      ],
    });

    guard = TestBed.inject(LoginGuard);
  });

  it('debe existir', () => {
    expect(guard).toBeTruthy();
  });

  it('redirige a /login cuando no hay sesión ni token', async () => {
    const result = await runGuard(guard, '/admin');

    expect(result).toBe(false);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('permite entrar a /admin cuando el usuario está logueado y es admin', async () => {
    localStorage.setItem('logged', '1');
    localStorage.setItem('rol_back', '0');

    const result = await runGuard(guard, '/admin');

    expect(result).toBe(true);
  });

  it('redirige a /error cuando el usuario está logueado pero no es admin', async () => {
    localStorage.setItem('logged', '1');
    localStorage.setItem('rol_back', '1');

    const result = await runGuard(guard, '/admin');

    expect(result).toBe(false);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/error');
  });

  it('permite entrar a /error cuando el usuario está logueado y no es admin', async () => {
    localStorage.setItem('logged', '1');
    localStorage.setItem('rol_back', '1');

    const result = await runGuard(guard, '/error');

    expect(result).toBe(true);
  });

  it('valida contra el backend cuando falta la sesión y guarda los roles', async () => {
    localStorage.setItem('jwtAccess', 'token');
    loginSpy.mockReturnValue(of({ roles: ['0'] }));

    const result = await runGuard(guard, '/admin');

    expect(result).toBe(true);
    expect(localStorage.getItem('logged')).toBe('1');
    expect(localStorage.getItem('rol_back')).toBe('0');
  });

  it('redirige a /login cuando el backend rechaza la sesión', async () => {
    localStorage.setItem('jwtAccess', 'token');
    loginSpy.mockReturnValue(throwError(() => new Error('unauthorized')));

    const result = await runGuard(guard, '/admin');

    expect(result).toBe(false);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});