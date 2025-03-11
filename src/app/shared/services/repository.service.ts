import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class RepositoryService {

  constructor(private http: HttpClient) { }

  public getData = (route: string) => {
    return this.http.get(this.createCompleteRoute(route, environment.apiUrl));
  }
 
  public create = (route: string, body:any) => {
    return this.http.post(this.createCompleteRoute(route, environment.apiUrl), body, this.generateHeaders());
  }
  public createWithData = (route: string) => {
    return this.http.post(this.createCompleteRoute(route, environment.apiUrl), this.generateHeaders());
  }
  public update = (route: string, body:any) => {
    return this.http.put(this.createCompleteRoute(route, environment.apiUrl), body, this.generateHeaders());
  }
 
  public delete = (route: string) => {
    return this.http.delete(this.createCompleteRoute(route, environment.apiUrl));
  }
 
  private createCompleteRoute = (route: string, envAddress: string) => {
    return `${envAddress}/${route}`;
  }
 
  private generateHeaders = () => {
    return {
      headers: new HttpHeaders({'Content-Type': 'application/json'})
    }
  }

  // Thêm phương thức download để tải file
  public download(route: string): Observable<Blob> {
    return this.http.get(this.createCompleteRoute(route, environment.apiUrl), { responseType: 'blob' });
  }
 // Thêm phương thức upload để gửi file
 public upload(route: string, formData: FormData): Observable<any> {
  return this.http.post(this.createCompleteRoute(route, environment.apiUrl), formData);
  }
}
