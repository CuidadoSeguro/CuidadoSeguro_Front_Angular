import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MsalService } from '@azure/msal-angular';

import { ErrorComponent } from './error-component';
import { GeneralService } from '../../../services/general.service';

describe('ErrorComponent', () => {
  let component: ErrorComponent;
  let fixture: ComponentFixture<ErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorComponent],
      providers: [
        provideRouter([]),
        {
          provide: MsalService,
          useValue: { logoutRedirect: () => of(null) },
        },
        {
          provide: GeneralService,
          useValue: {
            getProfessionalsCount: () => of(0),
            clearSession: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
