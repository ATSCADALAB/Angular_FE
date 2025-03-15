import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { OrderDto, OrderLineDetailCreationDto } from 'src/app/_interface/order';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WcfDataDto } from 'src/app/_interface/wcf-data-dto';
import { SignalRService } from 'src/app/shared/services/signalr.service';
interface SensorData {
  value: number;
  status: string;
  line: number;
  time: Date;
}

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  isRunning: boolean = false;
  isCollapsed: boolean = true;
  receivedData = [
    { value: 120, status: 'Completed', line: 2, time: new Date('2025-03-14T11:05:00') },
    { value: 130, status: 'Completed', line: 5, time: new Date('2025-03-14T10:45:00') },
    { value: 150, status: 'Is Running', line: 5, time: new Date() } // Sensor đang chạy
  ];
  completedSensors: SensorData[] = [];  // Định nghĩa kiểu dữ liệu rõ ràng
  runningSensor: SensorData | undefined; // Có thể là undefined nếu không tìm thấy


  currentTime: string = '';
  private timer: any;
  //receivedData: WcfDataDto[] = [];
  orderId: string | null = null;
  order: OrderDto | null = null;
  selectedLine: number | null = null; // Biến lưu giá trị Line được chọn
  lines: number[] = [1, 2, 3, 4]; // Danh sách Line từ 1 đến 4
  isStarting: boolean = false; // Trạng thái khi đang gọi API

  constructor(
    private signalrService: SignalRService,
    private route: ActivatedRoute,
    private router: Router,
    private repoService: RepositoryService,
    private snackBar: MatSnackBar // Thêm MatSnackBar để hiển thị thông báo
  ) {}

  ngOnInit(): void {
     // Lọc danh sách sensor đã hoàn thành
     this.completedSensors = this.receivedData.filter(d => d.status === 'Completed');

     // Lấy sensor đang chạy
     this.runningSensor = this.receivedData.find(d => d.status === 'Is Running');

    //this.ConnectSingalR();
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.repoService.getData(`api/orders/${this.orderId}`).subscribe(
        (res) => {
          this.order = res as OrderDto;
        },
        (err) => {
          console.log(err);
        }
      );
    }
    this.updateTime();
    this.timer = setInterval(() => {
      this.updateTime();
    }, 1000); // Cập nhật mỗi giây
  }
  // public ConnectSingalR(){
  //   this.signalrService.startConnection().then(() => {
  //     console.log("SignalR connected successfully!");
  //     this.signalrService.dataReceived$.subscribe(data => {
  //       this.receivedData = data;
  //     });
  //   }).catch(err => {
  //     console.error("SignalR connection error:", err);
  //   });
  // }
  getStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Not Completed';
      case 1:
        return 'In Progress';
      case 2:
        return 'Completed';
      default:
        return 'Unknown';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0:
        return 'status-not-completed';
      case 1:
        return 'status-in-progress';
      case 2:
        return 'status-completed';
      default:
        return 'status-unknown';
    }
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }
  completeOrder() {
    this.isRunning = false;
    console.log('Order Completed!');
  }
  startOrder(): void {
    if (!this.selectedLine) {
      this.snackBar.open('Please select a Line before starting.', 'Close', { duration: 3000 });
      return;
    }

    if (this.order && this.orderId) {
      this.isStarting = true;
      const orderLineDetailData: OrderLineDetailCreationDto = {
        OrderId: this.orderId!,
        Line: this.selectedLine!
      };

      this.repoService.create('api/OrderLineDetails', orderLineDetailData).subscribe(
        (res) => {
          this.isStarting = false;
          this.snackBar.open('Order started successfully.', 'Close', { duration: 3000 });
        },
        (err) => {
          this.isStarting = false;
          this.snackBar.open('Failed to start order.', 'Close', { duration: 3000 });
        }
      );
    }
  }
  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer); // Xóa interval khi component bị hủy
    }
  }

  private updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString(); // Lấy thời gian dưới dạng HH:mm:ss
  }
  toggleOrder() {
    if (!this.isRunning) {
      this.isStarting = true;
      setTimeout(() => {
        this.isStarting = false;
        this.isRunning = true;
      }, 2000); // Giả lập quá trình khởi động 2 giây
    } else {
      this.isRunning = false;
    }
  }
}