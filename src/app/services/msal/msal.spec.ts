import { TestBed } from '@angular/core/testing';

import { msalProviders, msalInstance } from './msal';

describe('Msal', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: msalProviders,
    }).compileComponents();
  });

  it('debe exponer los providers de MSAL', () => {
    expect(msalProviders.length).toBeGreaterThan(0);
  });

  it('debe crear la instancia de MSAL', () => {
    expect(msalInstance).toBeTruthy();
  });
});