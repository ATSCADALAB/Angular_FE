import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { WcfDataDto } from 'src/app/_interface/wcf-data-dto';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: HubConnection;
  private dataReceived = new Subject<WcfDataDto[]>(); // Subject để phát tín hiệu khi nhận dữ liệu
  dataReceived$ = this.dataReceived.asObservable();

  constructor() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/dataHub`, {
        accessTokenFactory: () => localStorage.getItem('token') || '', // Gửi token JWT để xác thực
        withCredentials: true // Hỗ trợ CORS với credentials
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    // Lắng nghe dữ liệu từ hub với method 'ReceiveData'
    this.hubConnection.on('ReceiveData', (data: WcfDataDto[]) => {
      console.log('Data received from SignalR:', data);
      this.dataReceived.next(data);
    });

    // Xử lý khi mất kết nối
    this.hubConnection.onclose((error) => {
      console.error('SignalR connection closed:', error);
    });
  }

  // Khởi động kết nối SignalR
  startConnection(): Promise<void> {
    return this.hubConnection.start()
      .then(() => {
        console.log('SignalR connection started');
      })
      .catch(err => {
        console.error('Error while starting SignalR connection:', err);
        throw err;
      });
  }

  // Ngắt kết nối SignalR
  stopConnection(): Promise<void> {
    return this.hubConnection.stop()
      .then(() => console.log('SignalR connection stopped'))
      .catch(err => console.error('Error while stopping SignalR connection:', err));
  }

  // Gửi dữ liệu tới hub (nếu cần)
  sendData(data: WcfDataDto[]): void {
    this.hubConnection.invoke('SendData', data)
      .catch(err => console.error('Error while sending data to SignalR hub:', err));
  }
  // hàm isConnected để kiểm tra trạng thái kết nối
  isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}