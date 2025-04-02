import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RepositoryService } from 'src/app/shared/services/repository.service';
// import { OrderDto, OrderLineDetailCreationDto, OrderLineDetailDto } from 'src/app/_interface/order';
import { OrderDetailDto, OrderDetailUpdateDto } from 'src/app/_interface/order-detail';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WcfDataDto, WcfDataUpdateDto } from 'src/app/_interface/wcf-data-dto';
import { SignalRService } from 'src/app/shared/services/signalr.service';
import { SensorRecordCreationDto, SensorRecordDto } from 'src/app/_interface/sensor-record';
import { OrderForManipulationDto } from 'src/app/_interface/order';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from 'src/app/shared/modals/confirm/confirm.component';
import { Subscription } from 'rxjs';
import { OrderDetailConfirmComponent } from './order-detail-confirm/order-detail-confirm.component';
import { OrderLineDetailCreationDto, OrderLineDetailDto } from 'src/app/_interface/order-line-detail';
import { TimezoneService } from 'src/app/shared/services/timezone.service';
import { LineDto } from 'src/app/_interface/line';


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
  listSensorRecords: SensorRecordDto[] = [];
  isExpanded = true;
  orderId: string | null = null;
  orderDetail: OrderDetailDto;
  selectedLine: number;
  //lines: number[] = [1, 2, 3, 4,5,6];
  lines: LineDto[] = []; // Khai báo biến lines là mảng LineDto
  isStarting: boolean = false;
  isRunning: boolean = false;
  receivedDataSensor: WcfDataDto[] = []; //Giá trị nhận dữ liệu SingnalR từ Server
  dataSensorByLine: WcfDataDto | null = null; //Giá trị lưu trữ dữ liệu Sensor theo Line
  orderLineDetails: OrderLineDetailDto[] = [];
  latestRecord: any; // Biến để lưu dòng mới nhất
  isSignalRRunning: boolean = false;
  private subscription: Subscription
  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private repoService: RepositoryService,
    private snackBar: MatSnackBar,
    private signalrService: SignalRService, //Khai báo signalrService
    private timezoneService: TimezoneService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.orderId = params.get('id'); // Lấy orderId từ URL động
      this.selectedLine = 0;
      //Sự kiện back
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          window.location.reload(); // Tải lại trang khi quay lại tab
        }
      });
      console.log("selected line khi load", this.selectedLine);
      if (this.orderId) {
        this.getListLines(); // Load danh sách Line
        this.loadOrderDetails(); // Load thông tin đơn hàng
        this.getOrderLineDetail(); // Load giá trị OrderLineDetail
        this.loadListSensorRecords(); // Load danh sách Sensor Records
        this.loadSensorRecord(); // Load dữ liệu Sensor Record
        this.checkSignalRStatus(); // Kiểm tra trạng thái SignalR
      }
    });
  }
  loadOrderDetails() {
    this.repoService.getData(`api/order-details/by-order/${this.orderId}`).subscribe(
      (res) => {
        console.log("Data received:", res);
        this.orderDetail = (res as OrderDetailDto[])[0]; // Gán dữ liệu vào biến orderDetail
      },
      (err) => {
        console.log("Error loading order details:", err);
      }
    );
  }
  getListLines() {
    this.repoService.getData(`api/lines`).subscribe(
      (res) => {
        this.lines = (res as LineDto[]); // Gán dữ liệu vào biến orderDetail
      },
      (err) => {
        console.log("Error loading lines:", err);
      }
    );
  }
  private connectToSignalR(): void {
    if (!this.selectedLine) {
      console.warn('No line selected. Cannot connect to SignalR.');
      return;
    }

    this.signalrService.startConnection().then(() => {
      console.log('SignalR connected successfully!');
      this.isSignalRRunning = true;

      // Lắng nghe dữ liệu từ SignalR
      this.subscription = this.signalrService.dataReceived$.subscribe(data => {
        this.receivedDataSensor = data;

        // Kiểm tra dữ liệu hợp lệ trước khi truy cập index
        if (Array.isArray(this.receivedDataSensor) && this.receivedDataSensor.length >= this.selectedLine) {
          this.dataSensorByLine = this.receivedDataSensor[this.selectedLine - 1];
          console.log('Data from SignalR:', this.dataSensorByLine);
        } else {
          console.warn('Invalid data or no data for the selected line.');
          this.dataSensorByLine = null; // Reset nếu dữ liệu không hợp lệ
        }
      });
    }).catch(err => {
      console.error('SignalR connection error:', err);
    });
  }
  private disconnectSignalR() {
    if (this.subscription) {
      this.subscription.unsubscribe(); // Hủy subscription
    }
    this.signalrService.stopConnection(); // Ngắt kết nối SignalR
  }
  // Ngắt kết nối SingalR khi component bị hủy
  ngOnDestroy() {
    console.log("Component destroyed - Disconnecting SignalR...");
    this.disconnectSignalR();
  }
  checkSignalRStatus() {
    this.isSignalRRunning = this.signalrService.isConnected(); // `isConnected()` trả về `true` hoặc `false`
  }
  //Hàm tính tổng giá trị đọc được từ Sensor
  calculateTotals(): void {
    this.totalUnits = this.sensorRecord.reduce((sum, item) => sum + item.sensorUnits, 0);
    this.totalWeight = this.sensorRecord.reduce((sum, item) => sum + item.sensorUnits * this.orderDetail.productInformation.weightPerUnit, 0);
  }
  //Hàm load danh sách Sensor Record để kiểm tra Status và chặn chọn Line
  loadListSensorRecords(): void {
    this.repoService.getData(`api/sensor-records`).subscribe(
      (res) => {
        this.listSensorRecords = res as SensorRecordDto[];
        console.log('List Sensor Record:', this.listSensorRecords);
      },
      (err) => {
        console.log('Error loading sensor record:', err);
        this.sensorRecord = [];
      }
    );
  }
  // Hàm load Sensor Record theo OrderID
  loadSensorRecord(): void {
    if (this.orderId) {
      this.repoService.getData(`api/sensor-records/by-order/${this.orderId}`).subscribe(
        (res) => {
          this.sensorRecord = res as SensorRecordDto[];
          this.latestRecord = this.getLatestRecord();
          console.log('Sensor Record:', this.sensorRecord);

          // Nếu latestRecord có status = 1, kết nối SignalR
          if (this.latestRecord && this.latestRecord.status === 1) {
            this.isRunning = true;
            this.selectedLine = this.latestRecord.lineId
            console.log('selectedLine', this.selectedLine);
            console.log('Latest record is in progress. Connecting to SignalR...');
            this.connectToSignalR();
          }
          this.calculateTotals(); //tính tổng các Units đếm được từ Sensor Record
        },
        (err) => {
          console.log('Error loading sensor record:', err);
          this.sensorRecord = [];
        }
      );
    }
  }

  getLatestRecord(): any {
    return this.sensorRecord?.length > 0
      ? this.sensorRecord.reduce((latest, item) => new Date(item.recordTime) > new Date(latest.recordTime) ? item : latest)
      : null;
  }


  //Hàm cập nhật dữ liệu Sensor Record
  updateSensorRecord(sensorRecord: SensorRecordDto) {
    if (!sensorRecord.id) {
      console.error('Error: Sensor Record ID is missing.');
      return;
    }
    sensorRecord.status = 0;
    sensorRecord.recordTime = this.timezoneService.getCurrentTime().toISOString(),
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
      case 3:
        return 'Cancel';
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
      case 3:
        return 'status-cancel';
      default:
        return 'status-unknown';
    }
  }
  //Sự kiện tại nút Start / Stop
  async toggleOrder() {
    if (!this.isRunning) {
      this.isStarting = false;
      this.isRunning = true;
      this.startOrder();
      // Khởi tạo kết nối SignalR
      if (this.selectedLine != 0) {
        this.signalrService.startConnection().then(() => {
          this.isSignalRRunning = true;
          this.subscription = this.signalrService.dataReceived$.subscribe(data => {
            this.receivedDataSensor = data;
            // Kiểm tra dữ liệu hợp lệ trước khi truy cập index
            if (Array.isArray(this.receivedDataSensor) && this.receivedDataSensor.length >= this.selectedLine) {
              //Trong chuỗi bắt đầu là 0, ID Line bắt đầu là 1 nên phải trừ đi 1 đơn vị để ra vị trí đúng trong chuỗi
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
    }
    else //Xử lý sự kiện STOP
    {
      let totalUnits = this.totalUnits + Number(this.receivedDataSensor[this.selectedLine - 1].value);
      console.log("Tổng giá trị từ sensorRecord và giá trị đang đọc:", totalUnits);
      // Kiểm tra điều kiện 
      if (totalUnits < this.orderDetail.requestedUnits) {
        const dialogRef = this.dialog.open(ConfirmComponent, {
          width: '450px',
          height: '130px',
          data: { message: "The count is not complete. Are you sure you want to stop?" }
        });

        dialogRef.afterClosed().subscribe(async result => {
          if (!result) {
            return; // Nếu người dùng chọn "Hủy", không tiếp tục STOP
          }

          // Chỉ khi người dùng chọn "Xác nhận" mới thực thi lệnh dừng
          this.isRunning = false;
          this.selectedLine = 0;
          if (this.sensorRecord.length > 0 && this.receivedDataSensor) {
            let lastIndex = this.sensorRecord.length - 1;
            let lastRecord = this.sensorRecord[lastIndex];

            if (this.dataSensorByLine != null) {
              lastRecord.sensorUnits = Number(this.dataSensorByLine.value);
              //lastRecord.recordTime = new Date(this.dataSensorByLine.timeStamp).toISOString();
              console.log("lastRecord:", lastRecord);
              this.updateSensorRecord(lastRecord); //Update record cuối cùng
              this.updateLastOrderLineDetail();
              this.updateWCFData();
              await this.delay(1000); // 2000ms = 2 giây
              // Reload lại trang sau khi dừng
              window.location.reload();
            }
            else {
              console.error("Data Sensor By Line null:", this.dataSensorByLine);
            }

          }

          this.signalrService.stopConnection().catch(err => {
            console.error("SignalR connection error:", err);
          });
          this.isSignalRRunning = false;
        });
      } else {
        // Nếu dữ liệu hợp lệ, vẫn tiếp tục dừng như bình thường
        this.isRunning = false;
        this.selectedLine = 0;
        if (this.sensorRecord.length > 0 && this.receivedDataSensor) {
          let lastIndex = this.sensorRecord.length - 1;
          let lastRecord = this.sensorRecord[lastIndex];

          if (this.dataSensorByLine != null) {
            lastRecord.sensorUnits = Number(this.dataSensorByLine.value);
            lastRecord.sensorWeight = lastRecord.sensorUnits * this.orderDetail.productInformation.weightPerUnit;
            //lastRecord.recordTime = new Date(this.dataSensorByLine.timeStamp).toISOString();
            console.log("lastRecord:", lastRecord);
            this.updateSensorRecord(lastRecord);
            this.updateLastOrderLineDetail();
            this.updateWCFData();
            await this.delay(1000); // 2000ms = 2 giây
            // Reload lại trang sau khi dừng
            window.location.reload();
          }
          else {
            console.error("Data Sensor By Line null:", this.dataSensorByLine);
          }
        }

        this.signalrService.stopConnection().catch(err => {
          console.error("SignalR connection error:", err);
        });
        this.isSignalRRunning = false;
      }
    }
  }
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  completeOrder() {
    this.confirmForm(this.orderDetail.id);
    console.log('Order Detail updated successfully:', this.orderDetail);
  }
  goBack(): void {
    this.router.navigate(['/ui-components/orders']);
  }
  //Hàm update OrderDetail 
  updateOrderDetail(): void {
    if (this.totalUnits > this.orderDetail.requestedUnits) {
      const orderDetailDataUpdate: OrderDetailUpdateDto = {
        orderId: this.orderDetail.orderId,
        requestedUnits: this.orderDetail.requestedUnits,
        requestedWeight: this.orderDetail.requestedWeight,
        manufactureDate: this.orderDetail.manufactureDate,
        productInformationId: this.orderDetail.productInformationId,
        defectiveUnits: this.orderDetail.defectiveUnits,
        defectiveWeight: this.orderDetail.defectiveWeight,
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
        exportDate: this.orderDetail.order.exportDate,
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
        recordTime: this.timezoneService.getCurrentTime().toISOString(),
        status: 1,
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
  confirmForm(id: number) {
    console.log("ID:", id);
    const dialogRef = this.dialog.open(OrderDetailConfirmComponent, {
      width: '500px',
      height: '400px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: {
        id,
        totalUnits: this.totalUnits,
        updateOrderDetail: this.updateOrderDetail.bind(this),
        updateOrderStatus: this.updateOrderStatus.bind(this)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateOrderDetail();
        this.updateOrderStatus(2); // update thành completed
      }
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

  //Hàm update OrderLineDetail
  updateLastOrderLineDetail(): void {
    if (this.orderLineDetails && this.orderLineDetails.length > 0) {

      // Lấy phần tử cuối cùng
      const lastOrderLineDetail = this.orderLineDetails.reduce((latest, current) =>
        current.id > latest.id ? current : latest
      );
      console.log("ID cập nhật", lastOrderLineDetail.id);
      if (lastOrderLineDetail) {
        lastOrderLineDetail.EndTime = new Date().toISOString(); // Cập nhật thời gian

        this.repoService.updateByID('api/order-line-details', lastOrderLineDetail.id.toString(), lastOrderLineDetail)
          .subscribe(
            (res) => console.log('Last Order Line Detail updated successfully:', res),
            (err) => console.error('Error updating Order Line Detail:', err)
          );
      } else {
        console.error('No valid Order Line Detail found.');
      }
    } else {
      console.error('Order Line Details list is empty.');
    }
  }
  //Hàm gọi API Write-value để reset tag trên AT
  updateWCFData(): void {
    if (!this.dataSensorByLine) {
      console.error('Error: Sensor Record is missing.');
      return;
    }
    const sensorData: WcfDataUpdateDto[] = [
      {
        name: this.dataSensorByLine.name,
        value: "0"
      }
    ];
    console.log("Write value:", sensorData);
    this.repoService.update('api/wcf/write-value', sensorData).subscribe(
      (res) => {
        console.log('Sensor Record updated successfully:', res);
      },
      (err) => {
        console.error('Error updating sensor record:', err);
      }
    );
    this.calculateTotals();
  }
  selectLine(lineId: number) {
    //console.log("selected line:", lineId);

    // Kiểm tra xem Line có đang chạy không
    const activeRecord = this.listSensorRecords.find(record => record.lineId === lineId && record.status === 1);

    if (activeRecord) {
      const dialogRef = this.dialog.open(ConfirmComponent, {
        width: '450px',
        height: '150px',
        disableClose: true,
        data: { message: `Line ${lineId} is currently in use by another order. Would you like to view its details?` }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.selectedLine = 0;
          window.location.href = `/ui-components/order-details/${activeRecord.orderId}`;
        } else {
          this.selectedLine = 0;
        }
      });

      return;
    }
    // Nếu không có record nào đang chạy, cho phép chọn Line
    this.selectedLine = lineId;
    console.log("selected line:", this.selectedLine);
  }






}

