import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, PopupRequest } from '@azure/msal-browser';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly msal: MsalService) {}

  get isAuthenticated(): boolean {
    return this.currentAccount !== null;
  }

  get currentAccount(): AccountInfo | null {
    const accounts = this.msal.instance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  loginWithMicrosoft(): Observable<unknown> {
    const request: PopupRequest = {
      scopes: environment.msal.scopes,
    };
    return this.msal.loginPopup(request);
  }

  logout(): Observable<void> {
    return this.msal.logoutRedirect({
      postLogoutRedirectUri: 'https://cuidadoseguro.github.io/CuidadoSeguro_Front_Angular/',
    });
  }
}