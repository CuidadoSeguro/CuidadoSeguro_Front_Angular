import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from'@angular/common/http';
/*import { HorasReservadas } from '../interfaces/horas-reservadas';*/

@Injectable({
  providedIn: 'root'
})
export class GeneralService {
  constructor(private http: HttpClient) {

  }
  httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
  };
  URL = 'http://localhost:8080';
  Login = this.URL+'/api/login';

  login(token: String){
    return this.http.get(this.Login,{
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }
}
