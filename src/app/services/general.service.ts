import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from'@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {
  /* El estado vive solo en memoria. No se persiste en localStorage,
     por lo que no puede manipularse desde las DevTools. */
  private _rolFront = new BehaviorSubject<string | null>(null);
  private _rolBack = new BehaviorSubject<string | null>(null);
  private _logged = new BehaviorSubject<boolean>(false);
  private _jwtAccess = new BehaviorSubject<string | null>(null);

  public rolFront$ = this._rolFront.asObservable();
  public rolBack$ = this._rolBack.asObservable();
  public logged$ = this._logged.asObservable();
  public jwtAccess$ = this._jwtAccess.asObservable();

  constructor(private http: HttpClient) {

  }
  httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
  };
  URL = 'http://localhost:8080';
  Login = this.URL+'/api/login';

  CountProfessionals = this.URL+'/public/countProfesionales';

  getProfessionalsCount() {
    console.log('Obteniendo el número de profesionales...');
    return this.http.get<number>(this.CountProfessionals);
  }


  login(token: string){
    return this.http.get(this.Login,{
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }

  setSession(jwtAccess: string, rolFront: string, rolBack: string, logged: boolean) {
    this._jwtAccess.next(jwtAccess);
    this._rolFront.next(rolFront);
    this._rolBack.next(rolBack);
    this._logged.next(logged);
  }

  setRolBack(rolBack: string) {
    this._rolBack.next(rolBack);
  }

  setLogged(logged: boolean) {
    this._logged.next(logged);
  }

  clearSession() {
    this._jwtAccess.next(null);
    this._rolFront.next(null);
    this._rolBack.next(null);
    this._logged.next(false);
  }

  getLogged(): boolean { return this._logged.value; }
  getJwtAccess(): string | null { return this._jwtAccess.value; }
  getRolBack(): string | null { return this._rolBack.value; }
  getRolFront(): string | null { return this._rolFront.value; }
}