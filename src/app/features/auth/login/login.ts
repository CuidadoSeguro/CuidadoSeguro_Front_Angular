import { Component, inject, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  private readonly msalService = inject(MsalService);
  jwtAccess: string | undefined;

  jwtId: string | undefined;
  
  ngOnInit(): void {
    this.handleRedirect();
  }

  loginWithMicrosoft(): void {
    this.msalService.loginRedirect();
  }

  handleRedirect(): void {
    this.msalService.handleRedirectObservable().subscribe({
      next: (response) => {
        if (!response) {
          return;
        }
        this.msalService.instance.setActiveAccount(
          this.msalService.instance.getAllAccounts()[0]
        );
        this.getJwt();
      },
      error: (error) => console.error('Error al procesar el redirect:', error),
    });
  }

  getJwt(): void {
    const account = this.msalService.instance.getActiveAccount()
      ?? this.msalService.instance.getAllAccounts()[0];

    if (!account) {
      console.error('No hay ninguna cuenta activa. Inicia sesión primero.');
      return;
    }

    this.msalService.instance.acquireTokenSilent({
      account,
      scopes: ['api://3912eb25-8b20-4725-9b9d-18a99c419ead/access_as_user'],
    }).then(result => {
      this.jwtAccess = result.accessToken;
      //this.jwtId = (result.idTokenClaims as { sub?: string }).sub;
      this.jwtId= result.idToken;
      

      console.log('JWT:', this.jwtAccess);
      console.log('JWT ID:', this.jwtId);
    }).catch(error => {
      console.error('Error al obtener el token:', error);
    });
  }
}