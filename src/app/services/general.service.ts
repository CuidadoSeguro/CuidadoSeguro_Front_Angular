import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from'@angular/common/http';
/*import { HorasReservadas } from '../interfaces/horas-reservadas';*/

@Injectable({
  providedIn: 'root'
})
export class GeneralService {
  constructor(private http: HttpClient) {

  }
  
  
  URL = 'http://localhost:8080';
  Login = this.URL+'/api/login/';
  Admin = this.URL+'/api/isAdmin/';
  Register = this.URL+'/api/RegistroUsuarios/';
  UserExists = this.URL+'/api/checkUser/';
  ObtHoras = this.URL+'/api/ObtenerTodasPeticionesNoAceptadas/';
  ObtHorasAcep = this.URL+'/api/ObtenerTodasPeticionesAceptadas/';
  AcpHoras = this.URL+'/api/AceptarHora/';
  IngPet = this.URL+'/api/IngresarPeticiones/';
  HoraExiste = this.URL+'/api/ObtenerHora/';

  httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
  };

  horaExiste(hora:number,dia:number,mes:number,anio:number){
    return this.http.get(this.HoraExiste+`${hora}/${dia}/${mes}/${anio}`,this.httpOptions);
  }
  
  ingresarHora(correo: String,dia: number, mes: number, anio: number, hora:number,seleccion:number,servicio_contratacion:number,servicio_actualizacion:number){
    return this.http.get(this.IngPet+`${correo}/${dia}/${mes}/${anio}/${hora}/${seleccion}/${servicio_contratacion}/${servicio_actualizacion}`,this.httpOptions);
  }

  register(nombre:String,correo: String,telefono: String, pass: String){
    return this.http.post(this.Register+`${nombre}/${correo}/${telefono}/${pass}`,this.httpOptions);
  }

  aceptarHora(hora:number,dia: number,mes: number, anio: number){
    return this.http.put(this.AcpHoras+`${hora}/${dia}/${mes}/${anio}`,this.httpOptions);
  }

  checkUser(correo: String){
    return this.http.get(this.UserExists+`${correo}`,this.httpOptions);
  }

  login(correo: String, pass: String){
    return this.http.get(this.Login+`${correo}/${pass}`,this.httpOptions);
  }

  isAdmin(correo: String, pass: String){
    return this.http.get(this.Admin+`${correo}/${pass}`,this.httpOptions);
  }

  obtenerHoras(){
    //return this.http.get<HorasReservadas[]>(this.ObtHoras,this.httpOptions)
  }

  obtenerHorasAceptadas(){
    //return this.http.get<HorasReservadas[]>(this.ObtHorasAcep,this.httpOptions)
  }
}
