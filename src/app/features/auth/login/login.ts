import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';
import { GeneralService } from '../../../services/general.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly msalService = inject(MsalService);
  private readonly generalService = inject(GeneralService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loadingCognito = false;
  loadingMicrosoft = false;
  errorMessage = '';

  // Estado del desafío NEW_PASSWORD_REQUIRED de Cognito.
  requiresNewPassword = false;
  newPassword = '';
  confirmNewPassword = '';
  private cognitoChallengeSession = '';
  private cognitoChallengeUsername = '';
  private cognitoRequiredAttributes: string[] = [];

  private readonly apiScopes = environment.msal.scopes;

  ngOnInit(): void {
    // El retorno interactivo de Microsoft se procesa una sola vez aquí.
    // No ejecutar acquireTokenSilent desde esta misma ruta: podría cargar
    // /login dentro de un iframe y provocar block_iframe_reload.
    this.msalService.handleRedirectObservable().subscribe({
      next: (result: AuthenticationResult | null) => {
        const account =
          result?.account ??
          this.msalService.instance.getActiveAccount() ??
          this.msalService.instance.getAllAccounts()[0];

        if (!account) {
          return;
        }

        this.msalService.instance.setActiveAccount(account);

        if (result?.accessToken) {
          this.loadingMicrosoft = true;
          this.completeApplicationLogin(result.accessToken);
        }
      },
      error: (error: unknown) => {
        console.error('LOGIN - error procesando retorno de Microsoft:', error);
        this.loadingMicrosoft = false;
        this.errorMessage =
          'No fue posible completar el inicio de sesión con Microsoft Entra ID.';
      },
    });
  }

  loginWithMicrosoft(): void {
    this.errorMessage = '';
    this.loadingMicrosoft = true;

    this.msalService.loginRedirect({
      scopes: this.apiScopes,
    }).subscribe({
      error: error => {
        this.loadingMicrosoft = false;
        this.showError(error, 'No fue posible iniciar sesión con Microsoft Entra ID.');
      },
    });
  }

  async loginWithCognito(): Promise<void> {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Ingresa tu correo y contraseña.';
      return;
    }

    const { region, userPoolClientId, authFlow } = environment.cognito;

    if (!userPoolClientId || userPoolClientId.startsWith('REEMPLAZAR_')) {
      this.errorMessage = 'Falta configurar el App Client público de Amazon Cognito en environment.ts.';
      return;
    }

    this.loadingCognito = true;

    try {
      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        },
        body: JSON.stringify({
          AuthFlow: authFlow,
          ClientId: userPoolClientId,
          AuthParameters: {
            USERNAME: this.email.trim(),
            PASSWORD: this.password,
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || payload?.Message || 'Amazon Cognito rechazó las credenciales.');
      }

      const accessToken = payload?.AuthenticationResult?.AccessToken;
      if (accessToken) {
        // Para llamar a una API protegida se envía el AccessToken de Cognito.
        await this.completeApplicationLogin(accessToken, this.email.trim());
        return;
      }

      if (payload?.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        this.requiresNewPassword = true;
        this.cognitoChallengeSession = payload?.Session || '';
        this.cognitoChallengeUsername =
          payload?.ChallengeParameters?.USER_ID_FOR_CHALLENGE ||
          payload?.ChallengeParameters?.USERNAME ||
          this.email.trim();

        // Cognito entrega requiredAttributes como una cadena JSON.
        const required = payload?.ChallengeParameters?.requiredAttributes;
        try {
          this.cognitoRequiredAttributes = Array.isArray(required)
            ? required
            : required
              ? JSON.parse(required)
              : [];
        } catch {
          this.cognitoRequiredAttributes = [];
        }

        this.password = '';
        this.errorMessage = 'Tu cuenta tiene una contraseña temporal. Define una contraseña nueva para continuar.';
        return;
      }

      if (payload?.ChallengeName) {
        throw new Error(`Cognito requiere un desafío adicional (${payload.ChallengeName}) que todavía no está implementado.`);
      }
      throw new Error('Cognito no devolvió un AccessToken. Verifica el flujo de autenticación del App Client.');
    } catch (error) {
      this.showError(error, 'No fue posible iniciar sesión con Amazon Cognito.');
    } finally {
      this.loadingCognito = false;
      this.password = '';
    }
  }

  async completeNewPasswordChallenge(): Promise<void> {
    this.errorMessage = '';

    if (!this.newPassword || !this.confirmNewPassword) {
      this.errorMessage = 'Ingresa y confirma tu nueva contraseña.';
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.errorMessage = 'Las contraseñas nuevas no coinciden.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (!this.cognitoChallengeSession || !this.cognitoChallengeUsername) {
      this.errorMessage = 'La sesión del cambio de contraseña expiró. Vuelve a iniciar sesión.';
      this.cancelNewPasswordChallenge();
      return;
    }

    const { region, userPoolClientId } = environment.cognito;
    this.loadingCognito = true;

    try {
      const challengeResponses: Record<string, string> = {
        USERNAME: this.cognitoChallengeUsername,
        NEW_PASSWORD: this.newPassword,
      };

      // Cognito exige devolver los atributos que falten en el desafío.
      // El correo ya fue ingresado en el formulario de inicio de sesión.
      for (const attribute of this.cognitoRequiredAttributes) {
        const normalized = String(attribute).replace(/^userAttributes\./, '');
        if (normalized === 'email') {
          challengeResponses['userAttributes.email'] = this.email.trim();
        } else if (normalized === 'email_verified') {
          challengeResponses['userAttributes.email_verified'] = 'true';
        } else {
          throw new Error(
            `Cognito requiere el atributo "${normalized}". Debe completarse en el perfil del usuario o añadirse al formulario.`
          );
        }
      }

      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
        },
        body: JSON.stringify({
          ClientId: userPoolClientId,
          ChallengeName: 'NEW_PASSWORD_REQUIRED',
          Session: this.cognitoChallengeSession,
          ChallengeResponses: challengeResponses,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || payload?.Message || 'Cognito no pudo actualizar la contraseña.');
      }

      const accessToken = payload?.AuthenticationResult?.AccessToken;
      if (!accessToken) {
        if (payload?.ChallengeName) {
          throw new Error(`Cognito solicitó otro desafío (${payload.ChallengeName}).`);
        }
        throw new Error('Cognito no devolvió un AccessToken después de cambiar la contraseña.');
      }

      this.requiresNewPassword = false;
      this.cognitoChallengeSession = '';
      this.cognitoChallengeUsername = '';
      this.cognitoRequiredAttributes = [];
      this.newPassword = '';
      this.confirmNewPassword = '';
      await this.completeApplicationLogin(accessToken, this.email.trim());
    } catch (error) {
      this.showError(error, 'No fue posible establecer la nueva contraseña.');
    } finally {
      this.loadingCognito = false;
      this.newPassword = '';
      this.confirmNewPassword = '';
    }
  }

  cancelNewPasswordChallenge(): void {
    this.requiresNewPassword = false;
    this.cognitoChallengeSession = '';
    this.cognitoChallengeUsername = '';
    this.cognitoRequiredAttributes = [];
    this.newPassword = '';
    this.confirmNewPassword = '';
    this.password = '';
    this.errorMessage = '';
  }

  private async completeApplicationLogin(token: string, emailHint?: string): Promise<void> {
    if (!token) {
      this.errorMessage = 'El proveedor de identidad no entregó un token válido.';
      return;
    }

    const claims = this.decodeJwt(token);
    const emailFromToken =
      claims?.['email'] ??
      claims?.['preferred_username'] ??
      claims?.['upn'] ??
      claims?.['unique_name'] ??
      null;
    const emailForSession =
      emailHint?.trim() ||
      (typeof emailFromToken === 'string' ? emailFromToken : null);

    // Diagnóstico seguro: se registran metadatos del JWT, nunca el token completo.
    console.info('LOGIN - metadatos del token:', {
      issuer: claims?.['iss'] ?? 'no disponible',
      audience: claims?.['aud'] ?? 'no disponible',
      clientId: claims?.['client_id'] ?? 'no disponible',
      tokenUse: claims?.['token_use'] ?? 'no disponible',
      scopes: claims?.['scp'] ?? claims?.['scope'] ?? 'no disponible',
    });

    const providerRoles = Array.isArray(claims?.['roles'])
      ? claims['roles']
      : Array.isArray(claims?.['cognito:groups'])
        ? claims['cognito:groups']
        : [];

    const isProviderAdmin = Login.isAdminRole(providerRoles);
    this.generalService.setSession(
      token,
      Login.primaryRole(providerRoles),
      isProviderAdmin ? '0' : '1',
      false,
      emailForSession,
    );

    // El backend es la fuente definitiva de autorización/roles cuando valida
    // ambos emisores (Entra ID y Cognito).
    this.generalService.login(token).subscribe({
      next: (response: any) => {
        const backendIsAdmin = Login.isAdminRole(response?.['roles']);
        this.generalService.setRolBack(backendIsAdmin ? '0' : '1');
        this.generalService.setLogged(true);
        this.router.navigateByUrl(backendIsAdmin ? '/admin' : '/error');
      },
      error: (error: HttpErrorResponse) => {
        console.error('LOGIN - backend no pudo validar el token:', {
          status: error.status,
          url: error.url,
          message: error.message,
          providerIssuer: claims?.['iss'] ?? 'no disponible',
          providerAudience: claims?.['aud'] ?? 'no disponible',
          cognitoTokenUse: claims?.['token_use'] ?? 'no disponible',
        });

        // No se crea sesión local ni se concede acceso si Spring Boot rechaza el JWT.
        this.generalService.clearSession();

        if (error.status === 401) {
          this.errorMessage =
            'El proveedor de identidad autenticó al usuario, pero Spring Boot rechazó el token (401). El backend debe confiar en el emisor y validar la audiencia/client ID del proveedor utilizado. Revisa la guía BACKEND_JWT_401.md incluida en el ZIP.';
        } else if (error.status === 403) {
          this.errorMessage =
            'Spring Boot reconoció la solicitud, pero el usuario no tiene permisos suficientes (403). Revisa los roles y autoridades configurados en el backend.';
        } else {
          this.errorMessage =
            `No se pudo validar la sesión en Spring Boot (HTTP ${error.status || 'desconocido'}). Revisa el backend y vuelve a intentarlo.`;
        }
      },
    });
  }

  private decodeJwt(token: string): Record<string, any> | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      return JSON.parse(decodeURIComponent(
        Array.from(atob(padded))
          .map(char => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      ));
    } catch {
      return null;
    }
  }

  private showError(error: unknown, fallback: string): void {
    console.error('LOGIN - error:', error);
    const message = error instanceof Error ? error.message : fallback;
    this.errorMessage = message || fallback;
  }

  static primaryRole(roles: unknown): string {
    if (Array.isArray(roles)) return roles.length ? String(roles[0]) : '';
    return roles == null ? '' : String(roles);
  }

  static isAdminRole(roles: unknown): boolean {
    const list = Array.isArray(roles) ? roles : roles == null ? [] : [roles];
    return list.some(role => {
      const value = String(role).toLowerCase();
      return value === '0' || value.includes('admin');
    });
  }
}
