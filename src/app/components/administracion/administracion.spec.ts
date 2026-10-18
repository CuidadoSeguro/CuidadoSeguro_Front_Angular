import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Administracion } from './administracion';
import { AuthService } from '../../core/auth/auth.service';
import { AdministracionService, Persona } from '../../services/administracion.service';

describe('Administracion', () => {
  let component: Administracion;
  let fixture: ComponentFixture<Administracion>;
  let administracionService: {
    listar: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
    actualizar: ReturnType<typeof vi.fn>;
    eliminar: ReturnType<typeof vi.fn>;
    solicitarFichaClinica: ReturnType<typeof vi.fn>;
    descargarFichaClinica: ReturnType<typeof vi.fn>;
    descargarFichaClinicaDirecta: ReturnType<typeof vi.fn>;
  };

  const paciente: Persona = {
    id: 1,
    nombres: 'María',
    apellidos: 'González',
    nombreCompleto: 'María González',
    rut: '12.345.678-9',
    email: 'paciente@example.com',
    fechaNacimiento: '2000-01-01',
    estado: 'Activo',
  };

  beforeEach(async () => {
    administracionService = {
      listar: vi.fn().mockReturnValue(of([])),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
      solicitarFichaClinica: vi.fn(),
      descargarFichaClinica: vi.fn(),
      descargarFichaClinicaDirecta: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Administracion],
      providers: [
        {
          provide: AuthService,
          useValue: { logout: () => of(undefined) },
        },
        {
          provide: AdministracionService,
          useValue: administracionService,
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

  it('descargarFichaClinica muestra error sin fecha de nacimiento', () => {
    component.tipoActivo = 'pacientes';

    component.descargarFichaClinica({ ...paciente, fechaNacimiento: '' });

    expect(component.error).toContain('fecha de nacimiento');
    expect(administracionService.descargarFichaClinicaDirecta).not.toHaveBeenCalled();
  });

  it('descargarFichaClinica descarga el PDF directamente', () => {
    component.tipoActivo = 'pacientes';
    administracionService.descargarFichaClinicaDirecta.mockReturnValue(
      of({ status: 200, body: new Blob(['pdf']) }),
    );

    component.descargarFichaClinica(paciente);

    expect(administracionService.descargarFichaClinicaDirecta)
      .toHaveBeenCalledWith(paciente.id);
    expect(component.procesandoFicha).toBe(false);
  });

  it('descargarFichaClinica muestra error si el servicio falla', () => {
    component.tipoActivo = 'pacientes';
    administracionService.descargarFichaClinicaDirecta.mockReturnValue(
      throwError(() => new Error('sin conexion')),
    );

    component.descargarFichaClinica(paciente);

    expect(component.procesandoFicha).toBe(false);
    expect(component.error).toContain('No fue posible generar la ficha clínica');
  });

  it('enviarFichaPorCorreo envía el correo destino al servicio', () => {
    component.tipoActivo = 'pacientes';
    component.pacienteSeleccionado = paciente;
    component.correoDestino = 'otro@example.com';
    administracionService.solicitarFichaClinica.mockReturnValue(
      of({ requestId: 'req-2', estado: 'PROCESANDO' }),
    );

    component.enviarFichaPorCorreo();

    expect(administracionService.solicitarFichaClinica)
      .toHaveBeenCalledWith(paciente.id, 'otro@example.com');
    expect(component.mostrarEnvioCorreo).toBe(false);
    expect(component.exito).toContain('La ficha clínica');
  });

  it('enviarFichaPorCorreo muestra error sin fecha de nacimiento', () => {
    component.tipoActivo = 'pacientes';
    component.pacienteSeleccionado = { ...paciente, fechaNacimiento: '' };
    component.correoDestino = 'otro@example.com';
    component.mostrarEnvioCorreo = true;

    component.enviarFichaPorCorreo();

    expect(component.error).toContain('fecha de nacimiento');
    expect(administracionService.solicitarFichaClinica).not.toHaveBeenCalled();
  });
});
