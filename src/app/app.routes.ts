import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Administracion } from './components/administracion/administracion';
import { ErrorComponent } from './components/Error/error-component/error-component';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'admin', component: Administracion, canActivate: [LoginGuard] },
  { path: 'error', component: ErrorComponent, canActivate: [LoginGuard] },
  { path: '**', redirectTo: '/login' },
];