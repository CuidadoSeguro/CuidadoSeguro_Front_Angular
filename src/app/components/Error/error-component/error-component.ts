import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { GeneralService } from '../../../services/general.service';

@Component({
  selector: 'app-error-component',
  imports: [],
  templateUrl: './error-component.html',
  styleUrl: './error-component.css',
})
export class ErrorComponent implements OnInit {

  professionalsCount: number = 0;

  constructor(
    private router: Router,
    private msalService: MsalService,
    private ser: GeneralService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    console.log('Obteniendo el número de profesionales...');

    this.ser.getProfessionalsCount().subscribe({
      next: (count: number) => {

        console.log('RESPUESTA:', count);

        this.professionalsCount = count;

        console.log('DESPUÉS:', this.professionalsCount);

        // Fuerza la actualización visual del componente
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Error obteniendo número de profesionales:',
          error
        );

        // Siempre mantener un número visible
        this.professionalsCount = 0;

        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {

    console.log('Cerrando sesión...');

    this.ser.clearSession();

    localStorage.removeItem('logged');
    localStorage.removeItem('jwtAccess');
    localStorage.removeItem('rol_back');
    localStorage.removeItem('rol_front');

    this.msalService.logoutRedirect({
      //postLogoutRedirectUri: '/login'
      postLogoutRedirectUri: 'https://cuidadoseguro.github.io/CuidadoSeguro_Front_Angular/'
    });
  }
}