import { Component } from '@angular/core';
import { Login } from '../app/features/auth/login/login';

@Component({
  selector: 'app-root',
  imports: [Login],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {}