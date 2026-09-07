import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Msal } from './msal';

describe('Msal', () => {
  let component: Msal;
  let fixture: ComponentFixture<Msal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Msal],
    }).compileComponents();

    fixture = TestBed.createComponent(Msal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
