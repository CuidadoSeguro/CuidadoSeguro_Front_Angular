import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { GeneralService } from '../../../services/general.service';
import { CognitoService } from '../../../services/cognito/cognito.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private readonly cognito = inject(CognitoService);
  private readonly ser = inject(GeneralService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  confirmPassword = '';
  nombres = '';
  apellidos = '';
  mensaje = '';
  cargando = false;
  paso: 'registro' | 'confirmacion' = 'registro';
  codigoConfirmacion = '';

  ngOnInit(): void {
    if (this.ser.getLogged()) {
      this.router.navigate(['/error']);
    }
  }

  async registrarse(): Promise<void> {
    if (!this.email || !this.password) {
      this.mensaje = 'Ingresa correo y contraseña.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.mensaje = 'Las contraseñas no coinciden.';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    try {
      await this.cognito.signUp(this.email, this.password, {
        given_name: this.nombres,
        family_name: this.apellidos,
        email: this.email,
      });

      this.paso = 'confirmacion';
      this.mensaje =
        'Te enviamos un código de confirmación a tu correo. Ingrésalo aquí.';
    } catch (error: any) {
      console.error('REGISTER - error:', error);
      this.mensaje =
        error?.message || 'No se pudo completar el registro.';
    } finally {
      this.cargando = false;
    }
  }

  async confirmarRegistro(): Promise<void> {
    if (!this.codigoConfirmacion) {
      this.mensaje = 'Ingresa el código de confirmación.';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    try {
      await this.cognito.confirmSignUp(this.email, this.codigoConfirmacion);
      this.mensaje =
        'Cuenta confirmada correctamente. Ya puedes iniciar sesión.';
      this.paso = 'registro';
    } catch (error: any) {
      console.error('REGISTER - error confirmando:', error);
      this.mensaje =
        error?.message || 'Código inválido o expirado.';
    } finally {
      this.cargando = false;
    }
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
