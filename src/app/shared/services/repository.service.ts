import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {
  constructor(private http: HttpClient) { }

  // Phương thức getData với generic và xử lý params
  public getData<T>(route: string, params?: { [key: string]: any }): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<T>(this.createCompleteRoute(route, environment.apiUrl), { params: httpParams });
  }

  public create = (route: string, body: any) => {
    return this.http.post(this.createCompleteRoute(route, environment.apiUrl), body, this.generateHeaders());
  };

  public createWithData = (route: string) => {
    return this.http.post(this.createCompleteRoute(route, environment.apiUrl), this.generateHeaders());
  };

  public update = (route: string, body: any) => {
    return this.http.put(this.createCompleteRoute(route, environment.apiUrl), body, this.generateHeaders());

  }
  public updateByID = (route: string, id: string,body:any) => {
    return this.http.put(`${this.createCompleteRoute(route, environment.apiUrl)}/${id}`, body, this.generateHeaders());
  }
 

  public delete = (route: string) => {
    return this.http.delete(this.createCompleteRoute(route, environment.apiUrl));
  };

  private createCompleteRoute = (route: string, envAddress: string) => {
    return `${envAddress}/${route}`;
  };

  private generateHeaders = () => {
    return {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
  };

  // Phương thức download để tải file (giữ nguyên nhưng có thể không dùng nếu dùng exportReport)
  public download(route: string): Observable<Blob> {
    return this.http.get(this.createCompleteRoute(route, environment.apiUrl), { responseType: 'blob' });
  };

  // Phương thức upload để gửi file (giữ nguyên)
  public upload(route: string, formData: FormData): Observable<any> {
    return this.http.post(this.createCompleteRoute(route, environment.apiUrl), formData);
  };

  // Phương thức mới: exportReport để tải báo cáo với tham số
  public exportReport(route: string, params?: { [key: string]: any }): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get(this.createCompleteRoute(route, environment.apiUrl), {
      params: httpParams,
      responseType: 'blob' // Đặt responseType là 'blob' để tải file
    });
  }
  public postData<T>(route: string, body: any): Observable<T> {
    return this.http.post<T>(this.createCompleteRoute(route, environment.apiUrl), body, this.generateHeaders());
  }
  public postExportReport(route: string, body: any): Observable<Blob> {
    return this.http.post(this.createCompleteRoute(route, environment.apiUrl), body, {
      responseType: 'blob',
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }
  
  
}