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
  let serviceMock: any;

  beforeEach(() => {
    loginSpy = vi.fn();
    routerSpy = { navigateByUrl: vi.fn() };

    serviceMock = {
      login: loginSpy,
      getLogged: vi.fn().mockReturnValue(false),
      getJwtAccess: vi.fn().mockReturnValue(null),
      getRolBack: vi.fn().mockReturnValue(null),
      setRolBack: vi.fn().mockImplementation((v: string) => {
        serviceMock.getRolBack.mockReturnValue(v);
      }),
      setLogged: vi.fn().mockImplementation((v: boolean) => {
        serviceMock.getLogged.mockReturnValue(v);
      }),
      clearSession: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LoginGuard,
        { provide: Router, useValue: routerSpy },
        { provide: GeneralService, useValue: serviceMock },
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
    serviceMock.getLogged.mockReturnValue(true);
    serviceMock.getJwtAccess.mockReturnValue('token');
    serviceMock.getRolBack.mockReturnValue('0');

    const result = await runGuard(guard, '/admin');

    expect(result).toBe(true);
  });

  it('redirige a /error cuando el usuario está logueado pero no es admin', async () => {
    serviceMock.getLogged.mockReturnValue(true);
    serviceMock.getJwtAccess.mockReturnValue('token');
    serviceMock.getRolBack.mockReturnValue('1');

    const result = await runGuard(guard, '/admin');

    expect(result).toBe(false);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/error');
  });

  it('permite entrar a /error cuando el usuario está logueado y no es admin', async () => {
    serviceMock.getLogged.mockReturnValue(true);
    serviceMock.getJwtAccess.mockReturnValue('token');
    serviceMock.getRolBack.mockReturnValue('1');

    const result = await runGuard(guard, '/error');

    expect(result).toBe(true);
  });

  it('valida contra el backend cuando falta la sesión y guarda los roles', async () => {
    serviceMock.getJwtAccess.mockReturnValue('token');
    loginSpy.mockReturnValue(of({ roles: ['0'] }));

    const result = await runGuard(guard, '/admin');

    expect(result).toBe(true);
    expect(serviceMock.setLogged).toHaveBeenCalledWith(true);
    expect(serviceMock.setRolBack).toHaveBeenCalledWith('0');
  });

  it('redirige a /login cuando el backend rechaza la sesión', async () => {
    serviceMock.getJwtAccess.mockReturnValue('token');
    loginSpy.mockReturnValue(throwError(() => new Error('unauthorized')));

    const result = await runGuard(guard, '/admin');

    expect(result).toBe(false);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
