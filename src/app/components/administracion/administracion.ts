import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AdministracionService,
  Persona,
  TipoRegistro,
} from '../../services/administracion.service';

@Component({
  selector: 'app-administracion',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './administracion.html',
  styleUrl: './administracion.css',
})
export class Administracion implements OnInit {
  tipoActivo: TipoRegistro = 'pacientes';
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
  ) {
    this.formulario = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      rut: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      estado: ['Activo', Validators.required],
      fechaNacimiento: [''],
      especialidad: [''],
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
    if (!termino) return this.registros;
    return this.registros.filter((registro) =>
      [registro.nombres, registro.apellidos, registro.rut, registro.email, registro.especialidad]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(termino),
    );
  }

  cambiarTipo(tipo: TipoRegistro): void {
    if (this.tipoActivo === tipo) return;
    this.tipoActivo = tipo;
    this.buscando = '';
    this.cargarRegistros();
  }

  cargarRegistros(): void {
    this.cargando = true;
    this.error = '';
    this.administracionService.listar(this.tipoActivo).subscribe({
      next: (respuesta) => {
        this.registros = Array.isArray(respuesta)
          ? respuesta
          : (respuesta.content ?? respuesta.data ?? []);
        this.cargando = false;
      },
      error: () => {
        this.registros = [];
        this.cargando = false;
        this.error = `No fue posible cargar los ${this.titulo.toLowerCase()}. Revisa la conexión con el servidor.`;
      },
    });
  }

  abrirNuevo(): void {
    this.registroEditando = null;
    this.formulario.reset({ estado: 'Activo' });
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
      fechaNacimiento: registro.fechaNacimiento ?? '',
      especialidad: registro.especialidad ?? '',
      numeroRegistro: registro.numeroRegistro ?? '',
    });
    this.mostrarFormulario = true;
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const persona = this.formulario.getRawValue() as Persona;
    const solicitud = this.registroEditando?.id != null
      ? this.administracionService.actualizar(this.tipoActivo, this.registroEditando.id, persona)
      : this.administracionService.crear(this.tipoActivo, persona);

    solicitud.subscribe({
      next: () => {
        this.mostrarFormulario = false;
        this.exito = this.registroEditando ? 'Registro actualizado correctamente.' : 'Registro creado correctamente.';
        this.cargarRegistros();
        this.ocultarMensaje();
      },
      error: () => this.error = 'No se pudieron guardar los cambios. Intenta nuevamente.',
    });
  }

  confirmarEliminacion(registro: Persona): void {
    this.registroAEliminar = registro;
  }

  eliminar(): void {
    if (!this.registroAEliminar?.id) return;
    this.administracionService.eliminar(this.tipoActivo, this.registroAEliminar.id).subscribe({
      next: () => {
        this.registroAEliminar = null;
        this.exito = 'Registro eliminado correctamente.';
        this.cargarRegistros();
        this.ocultarMensaje();
      },
      error: () => {
        this.registroAEliminar = null;
        this.error = 'No se pudo eliminar el registro. Intenta nuevamente.';
      },
    });
  }

  cerrarSesion(): void {
    localStorage.removeItem('jwtAccess');
    localStorage.removeItem('rol_front');
    localStorage.removeItem('rol_back');
    localStorage.removeItem('logged');
    this.router.navigateByUrl('/login');
  }

  nombreCompleto(registro: Persona): string {
    return `${registro.nombres} ${registro.apellidos}`.trim();
  }

  private ocultarMensaje(): void {
    window.setTimeout(() => this.exito = '', 3500);
  }
}
