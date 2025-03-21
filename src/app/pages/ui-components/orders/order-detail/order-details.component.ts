

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RepositoryService } from 'src/app/shared/services/repository.service';
// import { OrderDto, OrderLineDetailCreationDto, OrderLineDetailDto } from 'src/app/_interface/order';
import { OrderLineDetailDto, OrderLineDetailCreationDto, OrderDetailDto, OrderDetailUpdatenDto } from 'src/app/_interface/order-detail';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WcfDataDto } from 'src/app/_interface/wcf-data-dto';
import { SignalRService } from 'src/app/shared/services/signalr.service';
import { SensorRecordCreationDto, SensorRecordDto } from 'src/app/_interface/sensor-record';
import { OrderForManipulationDto } from 'src/app/_interface/order';
import { ConfirmDeleteComponent } from 'src/app/shared/modals/confirm-delete/confirm-delete.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from 'src/app/shared/modals/confirm/confirm.component';
import { OrderDetailReplaceComponent } from './order-detail-replace/order-detail-replace.component';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
  totalUnits: number = 0;
  totalWeight: number = 0;
  replacedUnits: number = 0;
  replacedWeight: number = 0;

  sensorRecord: SensorRecordDto[] = [];
  isExpanded = false;
  orderId: string | null = null;
  orderDetail: OrderDetailDto;
  selectedLine: number;
  lines: number[] = [1, 2, 3, 4];

  isStarting: boolean = false;
  isRunning: boolean = false;
  receivedDataSensor: WcfDataDto[] = []; //Giá trị nhận dữ liệu SingnalR từ Server
  dataSensorByLine: WcfDataDto | null = null; //Giá trị lưu trữ dữ liệu Sensor theo Line
  orderLineDetails: OrderLineDetailDto[] = [];

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private repoService: RepositoryService,
    private snackBar: MatSnackBar,
    private signalrService: SignalRService //Khai báo signalrService
  ) { }

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');

    if (this.orderId) {
      // Load thông tin OrderDetail theo OrderId
      this.repoService.getData(`api/order-details/by-order/${this.orderId}`).subscribe(
        (res) => {
          console.log("Data received:", res);
          this.orderDetail = (res as OrderDetailDto[])[0];
        },
        (err) => {
          console.log(err);
        }
      );
      this.getOrderLineDetail(); //Lấy giá trị OrderLineDetail
      this.loadSensorRecord();
    }
  }
  //Hàm tính tổng giá trị đọc được từ Sensor
  calculateTotals(): void {
    this.totalUnits = this.sensorRecord.reduce((sum, item) => sum + item.sensorUnits, 0);
    this.totalWeight = this.sensorRecord.reduce((sum, item) => sum + item.sensorUnits * this.orderDetail.productInformation.weightPerUnit, 0);
  }
  // Hàm load Sensor Record
  loadSensorRecord(): void {
    if (this.orderId) {
      this.repoService.getData(`api/sensor-records/by-order/${this.orderId}`).subscribe(
        (res) => {
          this.sensorRecord = res as SensorRecordDto[];
          console.log('Sensor Record:', this.sensorRecord);
          this.calculateTotals();
        },
        (err) => {
          console.log('Error loading sensor record:', err);
          this.sensorRecord = [];
        }
      );
    }
  }
  //Hàm tạo và update dữ liệu Sensor Record
  createSensorRecord(): void {
    if (this.orderId) {
      const sensorRecordData: SensorRecordCreationDto = {
        orderId: this.orderId,
        orderDetailId: this.orderDetail.id,
        lineId: 0,
        sensorUnits: 0,
        sensorWeight: 0,
        recordTime: new Date().toISOString()
      };

      this.repoService.create('api/sensor-records', sensorRecordData).subscribe(
        (res) => {
          console.log('Sensor Record created successfully:', res);
          this.loadSensorRecord();
        },
        (err) => {
          console.log('Error creating sensor record:', err);
        }
      );
    }
  }
  //Hàm cập nhật dữ liệu Sensor Record
  updateSensorRecord(sensorRecord: SensorRecordDto): void {
    if (!sensorRecord.id) {
      console.error('Error: Sensor Record ID is missing.');
      return;
    }

    this.repoService.updateByID('api/sensor-records', sensorRecord.id.toString(), sensorRecord).subscribe(
      (res) => {
        console.log('Sensor Record updated successfully:', res);
      },
      (err) => {
        console.error('Error updating sensor record:', err);
      }
    );
    this.calculateTotals();
  }
  //   if (this.orderId) {
  //     this.repoService.getData(`api/OrderLineDetails/${this.orderId}`).subscribe(
  //       (res) => {
  //         this.orderLineDetails = res as OrderLineDetailDto;
  //         console.log('Order line details:', this.orderLineDetails);
  //         if (this.orderLineDetails) {
  //           this.selectedLine = this.orderLineDetails.line;
  //         }
  //       },
  //       (err) => {
  //         console.log('Error loading order line details:', err);
  //         this.orderLineDetails = null;
  //       }
  //     );
  //   }
  // }
  //Hàm thu nhỏ/phóng lớn thông tin các bảng
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }
  // Kiểm tra xem Order đã được gán Line chưa
  hasAssignedLine(): boolean {
    return this.orderLineDetails !== null;
  }

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

  toggleOrder() {
    if (!this.isRunning) {
      this.isStarting = true;
      setTimeout(() => {
        this.isStarting = false;
        this.isRunning = true;
        this.startOrder();
        // Khởi tạo kết nối SignalR
        if (this.selectedLine != 0) {
          this.signalrService.startConnection().then(() => {
            console.log("SignalR connected successfully!");
            this.signalrService.dataReceived$.subscribe(data => {
              this.receivedDataSensor = data;

              // Kiểm tra dữ liệu hợp lệ trước khi truy cập index
              if (Array.isArray(this.receivedDataSensor) && this.receivedDataSensor.length >= this.selectedLine) {
                this.dataSensorByLine = this.receivedDataSensor[this.selectedLine - 1];
              } else {
                console.warn("Dữ liệu không hợp lệ hoặc không có phần tử tại vị trí này.");
                this.dataSensorByLine = null; // Reset nếu dữ liệu không hợp lệ
              }
            });
          }).catch(err => {
            console.error("SignalR connection error:", err);
          });
        }
      }, 2000); // Giả lập quá trình khởi động 2 giây
    }
    else //Xử lý sự kiện STOP
    {
      let totalUnits = this.totalUnits + Number(this.receivedDataSensor[this.selectedLine - 1].value);
      console.log("Tổng giá trị từ sensorRecord và giá trị đang đọc:", totalUnits);
      // Kiểm tra điều kiện (Ví dụ: Dữ liệu có hợp lệ không?)
      if (totalUnits < this.orderDetail.requestedUnits) {
        const dialogRef = this.dialog.open(ConfirmComponent, {
          width: '450px',
          data: { message: "Số lượng bao chưa đủ. Bạn có chắc chắn muốn dừng?" }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (!result) {
            return; // Nếu người dùng chọn "Hủy", không tiếp tục STOP
          }

          // Chỉ khi người dùng chọn "Xác nhận" mới thực thi lệnh dừng
          this.isRunning = false;

          if (this.sensorRecord.length > 0 && this.receivedDataSensor) {
            let lastIndex = this.sensorRecord.length - 1;
            let lastRecord = this.sensorRecord[lastIndex];

            if (this.dataSensorByLine != null) {
              lastRecord.sensorUnits = Number(this.dataSensorByLine.value);
              lastRecord.recordTime = new Date(this.dataSensorByLine.timeStamp).toISOString();
              console.log("lastRecord:", lastRecord);
              this.updateSensorRecord(lastRecord);
            } else {
              console.error("Data Sensor By Line null:", this.dataSensorByLine);
            }
          }

          this.signalrService.stopConnection().catch(err => {
            console.error("SignalR connection error:", err);
          });
        });
      } else {
        // Nếu dữ liệu hợp lệ, vẫn tiếp tục dừng như bình thường
        this.isRunning = false;

        if (this.sensorRecord.length > 0 && this.receivedDataSensor) {
          let lastIndex = this.sensorRecord.length - 1;
          let lastRecord = this.sensorRecord[lastIndex];

          if (this.dataSensorByLine != null) {
            lastRecord.sensorUnits = Number(this.dataSensorByLine.value);
            lastRecord.sensorWeight = lastRecord.sensorUnits * this.orderDetail.productInformation.weightPerUnit;
            lastRecord.recordTime = new Date(this.dataSensorByLine.timeStamp).toISOString();
            console.log("lastRecord:", lastRecord);
            this.updateSensorRecord(lastRecord);
          } else {
            console.error("Data Sensor By Line null:", this.dataSensorByLine);
          }
        }

        this.signalrService.stopConnection().catch(err => {
          console.error("SignalR connection error:", err);
        });
      }
    }
  }

  completeOrder() {
    this.updateOrderDetail();
    this.updateOrderStatus(2); //update thành completed
    console.log('Order Detail updated successfully:', this.orderDetail);
  }
  goBack(): void {
    this.router.navigate(['/ui-components/orders']);
  }
  //Hàm update OrderDetail 
  updateOrderDetail(): void {
    if (this.totalUnits > this.orderDetail.requestedUnits) {
      const orderDetailDataUpdate: OrderDetailUpdatenDto = {
        orderId: this.orderDetail.orderId,
        requestedUnits: this.orderDetail.requestedUnits,
        requestedWeight: this.orderDetail.requestedWeight,
        manufactureDate: this.orderDetail.manufactureDate,
        productInformationId: this.orderDetail.productInformationId,
        defectiveUnits: this.totalUnits,
        defectiveWeight: this.totalWeight,
        replacedUnits: this.orderDetail.replacedUnits,
        replacedWeight: this.orderDetail.replacedWeight,
      };
      this.repoService.updateByID('api/order-details', this.orderDetail.id.toString(), orderDetailDataUpdate).subscribe(
        (res) => {
          console.log('Order Detail updated successfully:', res);
        },
        (err) => {
          console.error('Error updating order detail:', err);
        }
      );
    }
  }
  //Hàm update status cho Order
  updateOrderStatus(status: number): void {
    if (this.orderId) {
      const orderData: OrderForManipulationDto = {
        id: this.orderId,
        status: status,
        orderCode: this.orderDetail.order.orderCode,
        vehicleNumber: this.orderDetail.order.vehicleNumber,
        driverNumber: this.orderDetail.order.driverNumber,
        driverName: this.orderDetail.order.driverName,
        driverPhoneNumber: this.orderDetail.order.driverPhoneNumber,
        distributorId: this.orderDetail.order.distributorId,
      };

      this.repoService.updateByID('api/orders', this.orderId, orderData).subscribe(
        (res) => {
          console.log('Order status updated successfully:', res);
          this.ngOnInit();
        },
        (err) => {
          console.error('Error updating order status:', err);
        }
      );
    }
  }

  startOrder(): void {
    if (!this.selectedLine) {
      this.snackBar.open('Please select a Line before starting.', 'Close', { duration: 3000 });
      return;
    }
    if (this.selectedLine && this.orderId) {
      this.updateOrderStatus(1); //update thành running
      const sensorRecordData: SensorRecordCreationDto = {
        orderId: this.orderId,
        orderDetailId: this.orderDetail.id,
        lineId: this.selectedLine,
        sensorUnits: 0,
        sensorWeight: 0,
        recordTime: new Date().toISOString()
      };
      console.log('data:', sensorRecordData);
      this.createOrderLineDetail(); //Tạo OrderLineDetail
      this.repoService.create('api/sensor-records', sensorRecordData).subscribe(
        (res) => {
          console.log('Sensor Record created successfully:', res);
          this.loadSensorRecord();
        },
        (err) => {
          console.log('Error creating sensor record:', err);
        }
      );
    }
   
  }
  //Hàm mở modal AddLine
  addReplaceUnit(id: number) {
    console.log("ID:", id);
    this.dialog.open(OrderDetailReplaceComponent, {
      width: '500px',
      height: '450px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { id }
    });
  }
  //Hàm lấy dữ liệu OrderLineDetail theo orderID
  getOrderLineDetail(): void {
    if (this.orderId) {
      this.repoService.getData(`api/order-line-details/${this.orderId}`).subscribe(
        (res) => {
          this.orderLineDetails = res as OrderLineDetailDto[];
          console.log('Order line details:', this.orderLineDetails);
        },
        (err) => {
          console.log('Error loading order line details:', err);
          this.orderLineDetails = [];
        }
      );
    }
  }
  //Hàm tạo OrderLineDetail
  createOrderLineDetail(): void {
    if (this.orderLineDetails != null && this.orderId != null) {
      let sequenceNumber = this.orderLineDetails.length + 1;
      console.log("Hàm tạo OrderLineDetail:", sequenceNumber);
      console.log("Hàm tạo OrderLineDetail:", this.selectedLine);
      const orderLineDetailData: OrderLineDetailCreationDto = {
        orderId: this.orderId,
        LineId: this.selectedLine,
        SequenceNumber: sequenceNumber,
        StartTime: new Date().toISOString(),
        EndTime: new Date().toISOString()
      };

      this.repoService.create('api/order-line-details', orderLineDetailData).subscribe(
        (res) => {
          this.isStarting = false;
          this.snackBar.open('Order started successfully.', 'Close', { duration: 3000 });
        },
        (err) => {
          this.isStarting = false;
          this.snackBar.open('Failed to start order.', 'Close', { duration: 3000 });
          console.log(err);
        }
      );
    }
  }
}

