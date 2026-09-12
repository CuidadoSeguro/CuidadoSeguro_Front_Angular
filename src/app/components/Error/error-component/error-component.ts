import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { GeneralService } from '../../../services/general.service';

@Component({
  selector: 'app-error-component',
  imports: [],
  templateUrl: './error-component.html',
  styleUrl: './error-component.css',
})
export class ErrorComponent {

  constructor(
    private router: Router,
    private msalService: MsalService,
    private ser: GeneralService
  ) {}

  logout(): void {

    console.log('Cerrando sesión...');

    // Limpiar la sesión de la aplicación
    this.ser.clearSession();

    // Limpiar datos guardados en localStorage
    localStorage.removeItem('logged');
    localStorage.removeItem('jwtAccess');
    localStorage.removeItem('rol_back');
    localStorage.removeItem('rol_front');

    // Cerrar sesión de Microsoft
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: '/login'
    });
  }
}