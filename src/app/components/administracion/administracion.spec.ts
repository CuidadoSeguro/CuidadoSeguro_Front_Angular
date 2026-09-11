import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Administracion } from './administracion';
import { AuthService } from '../../core/auth/auth.service';

describe('Administracion', () => {
  let component: Administracion;
  let fixture: ComponentFixture<Administracion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Administracion],
      providers: [
        {
          provide: AuthService,
          useValue: { logout: () => of(undefined) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Administracion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});