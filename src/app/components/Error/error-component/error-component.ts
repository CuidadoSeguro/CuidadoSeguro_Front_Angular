import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { GeneralService } from '../../../services/general.service';
import {
  ESPECIALIDADES_POR_DEFECTO,
  Especialidad,
  EspecialistaDisponible,
  TIPOS_EXAMEN_POR_DEFECTO,
  TipoExamen,
} from '../../../models/busqueda-especialista';

@Component({
  selector: 'app-error-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './error-component.html',
  styleUrl: './error-component.css',
})
export class ErrorComponent implements OnInit {

  professionalsCount: number = 0;

  especialidades: Especialidad[] = [...ESPECIALIDADES_POR_DEFECTO];
  tiposExamen: TipoExamen[] = [...TIPOS_EXAMEN_POR_DEFECTO];
  especialidadSeleccionada: string = '';
  tipoExamenSeleccionado: string = '';
  resultados: EspecialistaDisponible[] = [];
  buscando: boolean = false;
  busquedaRealizada: boolean = false;
  mensajeBusqueda: string = '';

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

    this.cargarCatalogos();
  }

  private cargarCatalogos(): void {
    this.ser.getEspecialidades().subscribe({
      next: (especialidades) => {
        if (especialidades?.length) {
          this.especialidades = especialidades;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.especialidades = [...ESPECIALIDADES_POR_DEFECTO];
        this.cdr.detectChanges();
      }
    });

    this.ser.getTiposExamen().subscribe({
      next: (tipos) => {
        if (tipos?.length) {
          this.tiposExamen = tipos;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.tiposExamen = [...TIPOS_EXAMEN_POR_DEFECTO];
        this.cdr.detectChanges();
      }
    });
  }

  get formularioValido(): boolean {
    return !!this.especialidadSeleccionada && !!this.tipoExamenSeleccionado;
  }

  buscarEspecialistas(): void {
    if (!this.formularioValido || this.buscando) {
      return;
    }

    this.buscando = true;
    this.busquedaRealizada = true;
    this.resultados = [];
    this.mensajeBusqueda = '';

    this.ser.buscarEspecialistas({
      especialidadId: this.especialidadSeleccionada,
      tipoExamenId: this.tipoExamenSeleccionado,
    }).subscribe({
      next: (especialistas) => {
        this.resultados = especialistas ?? [];
        this.buscando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error buscando especialistas:', error);
        this.resultados = [];
        this.buscando = false;
        this.mensajeBusqueda =
          'No se pudieron obtener especialistas. El servicio de búsqueda aún no está disponible.';
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
      postLogoutRedirectUri: '/login'
      //postLogoutRedirectUri: 'https://cuidadoseguro.github.io/CuidadoSeguro_Front_Angular/'
    });
  }
}
