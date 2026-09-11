import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly msalService = inject(MsalService);

  ngOnInit(): void {
    /*
     * Procesa un redirect pendiente y limpia un flag de
     * interacción MSAL estancado en sessionStorage, evitando
     * el error "interaction_in_progress" al intentar login.
     */
    this.msalService.handleRedirectObservable().subscribe({
      error: (error) =>
        console.warn('MSAL - sin redirect pendiente:', error),
    });
  }
}