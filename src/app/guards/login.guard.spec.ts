import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginGuard } from './login.guard';

describe('LoginGuard', () => {
  let component: LoginGuard;
  let fixture: ComponentFixture<LoginGuard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginGuard],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginGuard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
