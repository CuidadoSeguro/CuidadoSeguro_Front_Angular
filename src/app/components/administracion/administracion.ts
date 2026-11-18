import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AdministracionService,
  Persona,
  TipoRegistro,
} from '../../services/administracion.service';
import { GeneralService } from '../../services/general.service';
import { AuthService } from '../../core/auth/auth.service';
import { SignoVital, RegistrarSignoVitalDTO } from '../../models/signo-vital';
import { finalize } from 'rxjs';

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
  guardando = false;

  //Ficha clínica PDF y envío por correo
  pacienteSeleccionado: Persona | null = null;
  mostrarEnvioCorreo = false;
  correoDestino = '';
  procesandoFicha = false;

  // Signos vitales
  signosVitales: SignoVital[] = [];
  signosVitalesPacienteId: number | null = null;
  signosVitalesPacienteNombre = '';
  cargandoSignos = false;
  mostrarPanelSignos = false;
  formularioSignoVital!: ReturnType<FormBuilder['group']>;
  procesandoSigno = false;
  sugerenciaEspecialista: string | null = null;
  mensajeSugerencia: string | null = null;
  requiereAtencion = false;
  private solicitudSignosId = 0;

  formulario!: ReturnType<FormBuilder['group']>;

  constructor(
      private readonly fb: FormBuilder,
      private readonly administracionService: AdministracionService,
      private readonly router: Router,
      private readonly generalService: GeneralService,
      private readonly authService: AuthService,
      private readonly cdr: ChangeDetectorRef,
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

    this.formularioSignoVital = this.fb.group({
      presionSistolica: [''],
      presionDiastolica: [''],
      frecuenciaCardiaca: [''],
      frecuenciaRespiratoria: [''],
      temperatura: [''],
      saturacionOxigeno: [''],
      fechaHora: [new Date().toISOString().slice(0, 16)],
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

          console.log('RESPUESTA PROFESIONALES:', respuesta);

          this.registros = respuesta;
          this.cargando = false;

          console.log('REGISTROS EN COMPONENTE:', this.registros);
          console.log('CARGANDO:', this.cargando);

          // Actualiza inmediatamente la vista
          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error('ADMIN - error al listar:', error);

          this.registros = [];
          this.cargando = false;

          this.error =
            `No fue posible cargar los ${this.titulo.toLowerCase()}. ` +
            'Revisa que Spring Boot esté ejecutándose y que la sesión de Microsoft sea válida.';

          // También actualiza la vista cuando existe un error
          this.cdr.detectChanges();
        },
      });
    }

  abrirNuevo(): void {
    // Abrir el formulario NO crea ningún registro. La creación ocurre
    // únicamente al enviar el formulario y solo una vez por operación.
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
  descargarFichaClinica(registro: Persona): void {
    if (!this.esPaciente || registro.id == null) {
      return;
    }

    this.error = '';
    this.exito = '';

    if (!registro.fechaNacimiento) {
      this.error =
        'Registra la fecha de nacimiento del paciente antes de generar su ficha clínica.';
      return;
    }

    this.procesandoFicha = true;
    this.administracionService.descargarFichaClinicaDirecta(registro.id).subscribe({
      next: (respuesta) => this.guardarFichaClinica(respuesta),
      error: () => this.mostrarErrorFicha(),
    });
  }

  abrirEnvioCorreo(registro: Persona): void {
    if (!this.esPaciente) {
      return;
    }

    this.pacienteSeleccionado = registro;
    this.correoDestino = registro.email || '';
    this.mostrarEnvioCorreo = true;
  }

  enviarFichaPorCorreo(): void {
    const paciente = this.pacienteSeleccionado;

    if (!paciente || paciente.id == null || !this.correoDestino.trim()) {
      return;
    }

    if (!paciente.fechaNacimiento) {
      this.mostrarEnvioCorreo = false;
      this.error =
        'Registra la fecha de nacimiento del paciente antes de generar su ficha clínica.';
      return;
    }

    this.procesandoFicha = true;
    this.error = '';

    this.administracionService
      .solicitarFichaClinica(paciente.id, this.correoDestino)
      .subscribe({
        next: () => {
          this.procesandoFicha = false;
          this.mostrarEnvioCorreo = false;
          this.exito =
            'La ficha clínica se está generando y será enviada al correo indicado.';
          this.ocultarMensaje();
        },
        error: () => this.mostrarErrorFicha(),
      });
  }

  // ---------- Signos vitales ----------

  abrirPanelSignosVitales(paciente: Persona): void {
    const pacienteId = Number(paciente.id);

    if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
      this.error = 'No se puede consultar signos vitales: el paciente no tiene un ID válido.';
      return;
    }

    // Invalida cualquier petición anterior para evitar que una respuesta tardía
    // de otro paciente sobrescriba la lista actualmente abierta.
    this.solicitudSignosId++;
    this.signosVitalesPacienteId = pacienteId;
    this.signosVitalesPacienteNombre = this.nombreCompleto(paciente);
    this.signosVitales = [];
    this.sugerenciaEspecialista = null;
    this.mensajeSugerencia = null;
    this.requiereAtencion = false;
    this.error = '';
    this.formularioSignoVital.reset({
      presionSistolica: '',
      presionDiastolica: '',
      frecuenciaCardiaca: '',
      frecuenciaRespiratoria: '',
      temperatura: '',
      saturacionOxigeno: '',
      fechaHora: new Date().toISOString().slice(0, 16),
    });
    this.mostrarPanelSignos = true;
    this.cargarSignosVitales();
  }

  cerrarPanelSignosVitales(): void {
    // Una respuesta que llegue después del cierre ya no debe modificar el panel.
    this.solicitudSignosId++;
    this.cargandoSignos = false;
    this.mostrarPanelSignos = false;
    this.signosVitalesPacienteId = null;
    this.signosVitales = [];
    this.sugerenciaEspecialista = null;
    this.mensajeSugerencia = null;
    this.requiereAtencion = false;
    this.formularioSignoVital.reset({
      presionSistolica: '',
      presionDiastolica: '',
      frecuenciaCardiaca: '',
      frecuenciaRespiratoria: '',
      temperatura: '',
      saturacionOxigeno: '',
      fechaHora: new Date().toISOString().slice(0, 16),
    });
  }

  cargarSignosVitales(): void {
    const pacienteId = this.signosVitalesPacienteId;

    if (pacienteId == null || !Number.isFinite(pacienteId)) {
      this.signosVitales = [];
      this.cargandoSignos = false;
      return;
    }

    // Cada consulta recibe un identificador. Una respuesta antigua nunca
    // puede reemplazar los datos del paciente que está seleccionado ahora.
    const solicitudActual = ++this.solicitudSignosId;
    this.cargandoSignos = true;
    this.error = '';

    this.administracionService
      .listarSignosVitalesPorPaciente(pacienteId)
      .pipe(
        finalize(() => {
          // finalize también se ejecuta cuando la petición termina con error.
          if (solicitudActual === this.solicitudSignosId) {
            this.cargandoSignos = false;
            this.cdr.detectChanges();
          }
        }),
      )
      .subscribe({
        next: (respuesta) => {
          // El endpoint entrega directamente un arreglo JSON: [ {...}, {...} ].
          // No se debe leer respuesta.data ni respuesta.content.
          if (
            solicitudActual !== this.solicitudSignosId ||
            this.signosVitalesPacienteId !== pacienteId
          ) {
            return;
          }

          this.signosVitales = Array.isArray(respuesta) ? respuesta : [];
          this.evaluarSugerencia();
          this.cargandoSignos = false;
          this.cdr.detectChanges();

          console.log(
            `Signos vitales cargados para paciente ${pacienteId}:`,
            this.signosVitales.length,
            this.signosVitales,
          );
        },
        error: (err) => {
          if (
            solicitudActual !== this.solicitudSignosId ||
            this.signosVitalesPacienteId !== pacienteId
          ) {
            return;
          }

          console.error(
            'Error al cargar signos vitales del paciente:',
            pacienteId,
            err,
          );
          this.signosVitales = [];
          this.error = err?.name === 'TimeoutError'
            ? 'El servidor tardó más de 15 segundos en responder. Vuelve a intentar.'
            : `No fue posible cargar los signos vitales (HTTP ${err?.status ?? 'sin respuesta'}).`;
          this.cdr.detectChanges();
        },
      });
  }

  registrarSignoVital(): void {
    if (this.procesandoSigno || this.signosVitalesPacienteId == null) {
      return;
    }

    const valores = this.formularioSignoVital.getRawValue();

    const signo: RegistrarSignoVitalDTO = {
      pacienteId: this.signosVitalesPacienteId,
      nombrePaciente: this.signosVitalesPacienteNombre,
      correoPaciente: '',
      presionSistolica: valores.presionSistolica
        ? Number(valores.presionSistolica)
        : undefined,
      presionDiastolica: valores.presionDiastolica
        ? Number(valores.presionDiastolica)
        : undefined,
      frecuenciaCardiaca: valores.frecuenciaCardiaca
        ? Number(valores.frecuenciaCardiaca)
        : undefined,
      frecuenciaRespiratoria: valores.frecuenciaRespiratoria
        ? Number(valores.frecuenciaRespiratoria)
        : undefined,
      temperatura: valores.temperatura ? Number(valores.temperatura) : undefined,
      saturacionOxigeno: valores.saturacionOxigeno
        ? Number(valores.saturacionOxigeno)
        : undefined,
      fechaHora: valores.fechaHora || undefined,
    };

    // Obtener el correo del paciente desde el listado si está disponible.
    const paciente = this.registros.find(
      (r) =>
        (typeof r.id === 'number' ? r.id : Number(r.id)) ===
        this.signosVitalesPacienteId,
    );
    if (paciente) {
      signo.correoPaciente = paciente.email || '';
    }

    this.procesandoSigno = true;
    this.error = '';

    this.administracionService
      .registrarSignoVital(this.signosVitalesPacienteId, signo)
      .subscribe({
        next: () => {
          this.procesandoSigno = false;
          this.formularioSignoVital.reset({
            presionSistolica: '',
            presionDiastolica: '',
            frecuenciaCardiaca: '',
            frecuenciaRespiratoria: '',
            temperatura: '',
            saturacionOxigeno: '',
            fechaHora: new Date().toISOString().slice(0, 16),
          });
          this.cargarSignosVitales();
        },
        error: () => {
          this.procesandoSigno = false;
          this.error =
            'No se pudo registrar el signo vital. Intenta nuevamente.';
        },
      });
  }

  get ultimosTres(): SignoVital[] {
    return this.signosVitales.slice(0, 3);
  }

  get tieneDatosSignoVital(): boolean {
    const v = this.formularioSignoVital?.getRawValue();
    if (!v) return false;

    return [
      v.presionSistolica,
      v.presionDiastolica,
      v.frecuenciaCardiaca,
      v.frecuenciaRespiratoria,
      v.temperatura,
      v.saturacionOxigeno,
    ].some((valor) => valor !== null && valor !== undefined && String(valor).trim() !== '');
  }

  private evaluarSugerencia(): void {
    const tres = this.ultimosTres;
    if (tres.length < 3) {
      this.sugerenciaEspecialista = null;
      this.mensajeSugerencia =
        'Se necesitan al menos 3 signos vitales registrados para generar una sugerencia de especialista.';
      this.requiereAtencion = false;
      return;
    }

    let anomaliasCardio = 0;
    let anomaliasResp = 0;

    for (const s of tres) {
      if (
        this.fueraDeRango(s.presionSistolica, 90, 140) ||
        this.fueraDeRango(s.presionDiastolica, 60, 90) ||
        this.fueraDeRango(s.frecuenciaCardiaca, 60, 100)
      ) {
        anomaliasCardio++;
      }
      if (
        this.fueraDeRango(s.temperatura, 36.1, 37.2) ||
        this.fueraDeRango(s.saturacionOxigeno, 95, 100) ||
        this.fueraDeRango(s.frecuenciaRespiratoria, 12, 20)
      ) {
        anomaliasResp++;
      }
    }

    if (anomaliasCardio >= 2 && anomaliasResp >= 2) {
      this.sugerenciaEspecialista = 'Cardiología y Neumología';
      this.mensajeSugerencia =
        'Tus últimos 3 signos vitales presentan valores fuera de rango tanto ' +
        'cardiovasculares como respiratorios. Se recomienda valoración integral.';
      this.requiereAtencion = true;
    } else if (anomaliasCardio >= 2) {
      this.sugerenciaEspecialista = 'Cardiología';
      this.mensajeSugerencia =
        'Tus últimos 3 signos vitales muestran valores de presión arterial o ' +
        'frecuencia cardíaca fuera de rango. Se recomienda cardiología.';
      this.requiereAtencion = true;
    } else if (anomaliasResp >= 2) {
      this.sugerenciaEspecialista = 'Neumología';
      this.mensajeSugerencia =
        'Tus últimos 3 signos vitales muestran valores de temperatura, ' +
        'saturación de oxígeno o frecuencia respiratoria fuera de rango. ' +
        'Se recomienda neumología.';
      this.requiereAtencion = true;
    } else if (anomaliasCardio === 1 || anomaliasResp === 1) {
      this.sugerenciaEspecialista = 'Medicina General';
      this.mensajeSugerencia =
        'Tus últimos 3 signos vitales presentan valores levemente fuera de rango. ' +
        'Se recomienda medicina general.';
      this.requiereAtencion = false;
    } else {
      this.sugerenciaEspecialista = 'Medicina General';
      this.mensajeSugerencia =
        'Tus últimos 3 signos vitales se encuentran dentro de rangos normales. ' +
        'Control rutinario con medicina general.';
      this.requiereAtencion = false;
    }
  }

  private fueraDeRango(valor: number | undefined, min: number, max: number): boolean {
    return valor != null && (valor < min || valor > max);
  }

  formatearFechaHora(fecha: string | undefined): string {
    if (!fecha) {
      return '—';
    }
    return fecha.replace('T', ' ');
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
    // Evita solicitudes POST duplicadas por doble clic o varios eventos submit.
    if (this.guardando) {
      return;
    }

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

    // Primera barrera: evita crear desde la UI un RUT que ya está cargado.
    // La validación definitiva también existe en Spring Boot.
    const rutNormalizado = persona.rut.replace(/[.\-\s]/g, '').toLowerCase();
    const duplicado = this.registros.some((registro) => {
      const mismoRut = registro.rut
        .replace(/[.\-\s]/g, '')
        .toLowerCase() === rutNormalizado;

      return mismoRut && registro.id !== persona.id;
    });

    if (!this.registroEditando && duplicado) {
      this.error =
        `No se pudo crear: ya existe un ${this.esPaciente ? 'paciente' : 'profesional'} con ese RUT.`;
      return;
    }

    this.guardando = true;

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
        this.guardando = false;
        this.ocultarMensaje();
      },
      error: (error) => {
        console.error('ADMIN - error al guardar:', error);

        this.guardando = false;

        if (error?.status === 409) {
          this.error =
            `No se pudo guardar: ya existe un ${this.esPaciente ? 'paciente' : 'profesional'} con ese RUT.`;
        } else {
          this.error =
            'No se pudieron guardar los cambios. ' +
            'Comprueba los datos enviados y revisa la consola de Spring Boot.';
        }
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

  private consultarDescarga(requestId: string, intento = 0): void {
    this.administracionService.descargarFichaClinica(requestId).subscribe({
      next: (respuesta) => {
        if (respuesta.status === 202 && intento < 30) {
          window.setTimeout(() => this.consultarDescarga(requestId, intento + 1), 1000);
          return;
        }

        this.guardarFichaClinica(respuesta);
      },
      error: () => this.mostrarErrorFicha(),
    });
  }

  private guardarFichaClinica(respuesta: HttpResponse<Blob>): void {
    if (respuesta.status !== 200 || !respuesta.body) {
      this.mostrarErrorFicha();
      return;
    }

    const url = URL.createObjectURL(respuesta.body);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'ficha-clinica.pdf';
    enlace.click();
    URL.revokeObjectURL(url);

    this.procesandoFicha = false;
    this.exito = 'Ficha clínica generada y descargada correctamente.';
    this.ocultarMensaje();
  }

  private mostrarErrorFicha(): void {
    this.procesandoFicha = false;
    this.mostrarEnvioCorreo = false;
    this.error =
      'No fue posible generar la ficha clínica. Revisa la conexión con el servicio de documentos.';
  }
}
