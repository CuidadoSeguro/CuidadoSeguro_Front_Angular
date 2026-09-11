import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AdministracionService,
  Persona,
  TipoRegistro,
} from '../../services/administracion.service';
import { GeneralService } from '../../services/general.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-administracion',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './administracion.html',
  styleUrl: './administracion.css',
})
export class Administracion implements OnInit {
  tipoActivo: TipoRegistro = 'profesionales';
  registros: Persona[] = [];
  buscando = '';
  cargando = false;
  error = '';
  exito = '';
  mostrarFormulario = false;
  registroEditando: Persona | null = null;
  registroAEliminar: Persona | null = null;

  formulario!: ReturnType<FormBuilder['group']>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly administracionService: AdministracionService,
    private readonly router: Router,
    private readonly generalService: GeneralService,
    private readonly authService: AuthService,
  ) {
    this.formulario = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      rut: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      estado: ['Activo', Validators.required],
      diagnostico: [''],
      especialidad: [''],
      // Estos campos se mantienen en el modelo de pantalla,
      // pero el backend actual no los persiste.
      fechaNacimiento: [''],
      numeroRegistro: [''],
    });
  }

  ngOnInit(): void {
    this.cargarRegistros();
  }

  get esPaciente(): boolean {
    return this.tipoActivo === 'pacientes';
  }

  get titulo(): string {
    return this.esPaciente ? 'Pacientes' : 'Profesionales';
  }

  get filtrados(): Persona[] {
    const termino = this.buscando.trim().toLowerCase();

    if (!termino) {
      return this.registros;
    }

    return this.registros.filter((registro) =>
      [
        registro.nombres,
        registro.apellidos,
        registro.nombreCompleto,
        registro.rut,
        registro.email,
        registro.especialidad,
        registro.diagnostico,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(termino),
    );
  }

  cambiarTipo(tipo: TipoRegistro): void {
    if (this.tipoActivo === tipo) {
      return;
    }

    this.tipoActivo = tipo;
    this.buscando = '';
    this.cargarRegistros();
  }

  cargarRegistros(): void {
    this.cargando = true;
    this.error = '';

    this.administracionService.listar(this.tipoActivo).subscribe({
      next: (respuesta) => {
        this.registros = respuesta;
        this.cargando = false;
      },
      error: (error) => {
        console.error('ADMIN - error al listar:', error);
        this.registros = [];
        this.cargando = false;
        this.error =
          `No fue posible cargar los ${this.titulo.toLowerCase()}. ` +
          'Revisa que Spring Boot esté ejecutándose y que la sesión de Microsoft sea válida.';
      },
    });
  }

  abrirNuevo(): void {
    this.registroEditando = null;

    this.formulario.reset({
      nombres: '',
      apellidos: '',
      rut: '',
      email: '',
      telefono: '',
      estado: 'Activo',
      diagnostico: '',
      especialidad: '',
      fechaNacimiento: '',
      numeroRegistro: '',
    });

    this.mostrarFormulario = true;
  }

  abrirEdicion(registro: Persona): void {
    this.registroEditando = registro;

    this.formulario.reset({
      nombres: registro.nombres,
      apellidos: registro.apellidos,
      rut: registro.rut,
      email: registro.email,
      telefono: registro.telefono ?? '',
      estado: registro.estado ?? 'Activo',
      diagnostico: registro.diagnostico ?? '',
      especialidad: registro.especialidad ?? '',
      fechaNacimiento: registro.fechaNacimiento ?? '',
      numeroRegistro: registro.numeroRegistro ?? '',
    });

    this.mostrarFormulario = true;
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();

    const persona: Persona = {
      id: this.registroEditando?.id,
      nombres: String(valores.nombres ?? '').trim(),
      apellidos: String(valores.apellidos ?? '').trim(),
      rut: String(valores.rut ?? '').trim(),
      email: String(valores.email ?? '').trim(),
      telefono: String(valores.telefono ?? '').trim(),
      estado: String(valores.estado ?? 'Activo'),
      diagnostico: String(valores.diagnostico ?? '').trim(),
      especialidad: String(valores.especialidad ?? '').trim(),
      fechaNacimiento: String(valores.fechaNacimiento ?? ''),
      numeroRegistro: String(valores.numeroRegistro ?? ''),
    };

    const solicitud = this.registroEditando?.id != null
      ? this.administracionService.actualizar(
          this.tipoActivo,
          this.registroEditando.id,
          persona,
        )
      : this.administracionService.crear(
          this.tipoActivo,
          persona,
        );

    solicitud.subscribe({
      next: () => {
        const editando = this.registroEditando !== null;

        this.mostrarFormulario = false;
        this.registroEditando = null;

        this.exito = editando
          ? 'Registro actualizado correctamente.'
          : 'Registro creado correctamente.';

        this.cargarRegistros();
        this.ocultarMensaje();
      },
      error: (error) => {
        console.error('ADMIN - error al guardar:', error);

        this.error =
          'No se pudieron guardar los cambios. ' +
          'Comprueba los datos enviados y revisa la consola de Spring Boot.';
      },
    });
  }

  confirmarEliminacion(registro: Persona): void {
    this.registroAEliminar = registro;
  }

  eliminar(): void {
    if (!this.registroAEliminar?.id) {
      return;
    }

    const id = this.registroAEliminar.id;

    this.administracionService
      .eliminar(this.tipoActivo, id)
      .subscribe({
        next: () => {
          this.registroAEliminar = null;
          this.exito = 'Registro eliminado correctamente.';
          this.cargarRegistros();
          this.ocultarMensaje();
        },
        error: (error) => {
          console.error('ADMIN - error al eliminar:', error);
          this.registroAEliminar = null;
          this.error =
            'No se pudo eliminar el registro. Revisa la conexión con el servidor.';
        },
      });
  }

  cerrarSesion(): void {
    this.generalService.clearSession();

    this.authService.logout().subscribe({
      error: (error) => {
        console.error(
          'ADMIN - error al cerrar sesión:',
          error,
        );

        this.router.navigateByUrl('/login');
      },
    });
  }

  nombreCompleto(registro: Persona): string {
    return (
      registro.nombreCompleto ||
      `${registro.nombres} ${registro.apellidos}`
    ).trim();
  }

  private ocultarMensaje(): void {
    window.setTimeout(() => {
      this.exito = '';
    }, 3500);
  }
}
