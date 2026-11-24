import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUserSession,
  ICognitoUserPoolData,
  ICognitoUserData,
} from 'amazon-cognito-identity-js';

export interface CognitoUserAttrs {
  sub: string;
  email: string;
  nombre?: string;
}

@Injectable({ providedIn: 'root' })
export class CognitoService {
  private readonly poolData: ICognitoUserPoolData = {
    UserPoolId: environment.cognito.userPoolId,
    ClientId: environment.cognito.userPoolClientId,
  };

  private readonly userPool: CognitoUserPool;

  private currentUser: CognitoUser | null = null;
  private accessToken: string | null = null;
  private idToken: string | null = null;

  constructor() {
    this.userPool = new CognitoUserPool(this.poolData);
  }

  private getCognitoUser(username: string): CognitoUser {
    const userData: ICognitoUserData = {
      Username: username,
      Pool: this.userPool,
    };
    return new CognitoUser(userData);
  }

  /**
   * Registra un nuevo usuario en el User Pool de Cognito.
   */
  signUp(
    email: string,
    password: string,
    atributos: Record<string, string> = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const userAttributes: CognitoUserAttribute[] = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        ...Object.entries(atributos).map(
          ([name, value]) => new CognitoUserAttribute({ Name: name, Value: value })
        ),
      ];

      this.userPool.signUp(email, password, userAttributes, [], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        this.currentUser = result?.user ?? null;
        resolve();
      });
    });
  }

  /**
   * Confirma el registro con el código enviado al correo.
   */
  confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = this.getCognitoUser(email);
      user.confirmRegistration(confirmationCode, true, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Inicia sesión con email y contraseña. Devuelve los atributos del usuario
   * y el access token (JWT) para usar contra el backend.
   */
  signIn(email: string, password: string): Promise<{
    user: CognitoUserAttrs;
    accessToken: string;
    idToken: string;
  }> {
    return new Promise((resolve, reject) => {
      const user = this.getCognitoUser(email);
      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      user.authenticateUser(authDetails, {
        onSuccess: (session: CognitoUserSession) => {
          this.currentUser = user;
          const accessToken = session.getAccessToken().getJwtToken();
          const idToken = session.getIdToken().getJwtToken();
          this.accessToken = accessToken;
          this.idToken = idToken;

          this.getUserAttributes(email).then((userAttrs) => {
            resolve({ user: userAttrs, accessToken, idToken });
          }, reject);
        },
        onFailure: (err) => reject(err),
        mfaRequired: (challengeName, challengeParams) =>
          reject(new Error(`MFA requerido: ${challengeName}`)),
      });
    });
  }

  /**
   * Obtiene los atributos del usuario autenticado (sub, email, etc.).
   */
  getUserAttributes(username?: string): Promise<CognitoUserAttrs> {
    return new Promise((resolve, reject) => {
      const user = this.getCognitoUser(username ?? this.currentUser?.getUsername() ?? '');

      user.getUserAttributes((err, attributes) => {
        if (err) {
          reject(err);
          return;
        }

        const attrs: Record<string, string> = {};
        (attributes ?? []).forEach((attr) => {
          attrs[attr.getName()] = attr.getValue();
        });

        resolve({
          sub: attrs['sub'] ?? '',
          email: attrs['email'] ?? '',
          nombre: attrs['name'] ?? attrs['given_name'] ?? '',
        });
      });
    });
  }

  /**
   * Devuelve el access token (JWT) de la sesión actual, si existe.
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Indica si hay una sesión de Cognito activa y válida.
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Cierra la sesión de Cognito.
   */
  signOut(): void {
    const user = this.currentUser ?? this.userPool.getCurrentUser();
    if (user) {
      user.signOut();
    }
    this.currentUser = null;
    this.accessToken = null;
    this.idToken = null;
  }

  /**
   * Obtiene el usuario de Cognito en sesión (para leer atributos).
   */
  getCurrentUser(): CognitoUser | null {
    return this.currentUser ?? this.userPool.getCurrentUser();
  }
}
