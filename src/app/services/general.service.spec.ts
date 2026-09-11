import { TestBed } from '@angular/core/testing';

import { GeneralService } from './general.service';

describe('GeneralService', () => {
  let service: GeneralService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeneralService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('no persiste la sesión en localStorage', () => {
    localStorage.clear();

    service.setSession('token', 'admin', '0', true);

    expect(localStorage.getItem('jwtAccess')).toBeNull();
    expect(localStorage.getItem('rol_front')).toBeNull();
    expect(localStorage.getItem('rol_back')).toBeNull();
    expect(localStorage.getItem('logged')).toBeNull();
  });

  it('expone el estado únicamente en memoria', () => {
    service.setSession('token', 'admin', '0', true);

    expect(service.getJwtAccess()).toBe('token');
    expect(service.getRolFront()).toBe('admin');
    expect(service.getRolBack()).toBe('0');
    expect(service.getLogged()).toBe(true);
  });

  it('clearSession reinicia el estado en memoria', () => {
    service.setSession('token', 'admin', '0', true);

    service.clearSession();

    expect(service.getJwtAccess()).toBeNull();
    expect(service.getRolFront()).toBeNull();
    expect(service.getRolBack()).toBeNull();
    expect(service.getLogged()).toBe(false);
  });
});