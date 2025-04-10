import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RepositoryService } from 'src/app/shared/services/repository.service';
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
export class OrderDetailsComponent implements OnInit, OnDestroy {
  totalUnits: number = 0;
  totalWeight: number = 0;
  replacedUnits: number = 0;
  replacedWeight: number = 0;
  isSensorExpanded = true; // Thêm biến mới cho Sensor Record
  sensorRecord: SensorRecordDto[] = [];
  listSensorRecords: SensorRecordDto[] = [];
  isExpanded = true;
  orderId: string | null = null;
  orderDetail: OrderDetailDto;
  selectedLine: number = 0;
  lines: LineDto[] = [];
  isStarting: boolean = false;
  isRunning: boolean = false;
  receivedDataSensor: WcfDataDto[] = [];
  dataSensorByLine: WcfDataDto | null = null;
  orderLineDetails: OrderLineDetailDto[] = [];
  latestRecord: any;
  isSignalRRunning: boolean = false;
  isLoading: boolean = false; // Thêm biến loading
  private subscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private repoService: RepositoryService,
    private snackBar: MatSnackBar,
    private signalrService: SignalRService,
    private timezoneService: TimezoneService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.orderId = params.get('id');
      this.selectedLine = 0;

      // Thay reload bằng refresh khi quay lại tab
      // Chỉ refresh khi order đang chạy
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && this.isRunning) {
          this.refreshChangedData();
        }
      });

      console.log("selected line khi load", this.selectedLine);
      if (this.orderId) {
        this.getListLines();
        this.loadOrderDetails();
        this.getOrderLineDetail();
        this.loadListSensorRecords();
        this.loadSensorRecord();
        this.checkSignalRStatus();
      }
    });
  }
  toggleSensorExpand(): void {
    this.isSensorExpanded = !this.isSensorExpanded;
  }
  ngOnDestroy(): void {
    console.log("Component destroyed - Disconnecting SignalR...");
    this.disconnectSignalR();
  }

  // API Calls
  loadOrderDetails(): void {
    this.repoService.getData(`api/order-details/by-order/${this.orderId}`).subscribe(
      (res) => {
        this.orderDetail = (res as OrderDetailDto[])[0];
        console.log("Data received:", res);
      },
      (err) => console.error("Error loading order details:", err)
    );
  }

  getListLines(): void {
    this.repoService.getData(`api/lines`).subscribe(
      (res) => this.lines = res as LineDto[],
      (err) => console.error("Error loading lines:", err)
    );
  }

  getOrderLineDetail(): void {
    if (this.orderId) {
      this.repoService.getData(`api/order-line-details/${this.orderId}`).subscribe(
        (res) => {
          this.orderLineDetails = res as OrderLineDetailDto[];
          console.log('Order line details:', this.orderLineDetails);
        },
        (err) => {
          console.error('Error loading order line details:', err);
          this.orderLineDetails = [];
        }
      );
    }
  }

  loadListSensorRecords(): void {
    this.repoService.getData(`api/sensor-records`).subscribe(
      (res) => {
        this.listSensorRecords = res as SensorRecordDto[];
        console.log('List Sensor Record:', this.listSensorRecords);
      },
      (err) => {
        console.error('Error loading sensor record:', err);
        this.sensorRecord = [];
      }
    );
  }

  loadSensorRecord(): void {
    if (this.orderId) {
      this.repoService.getData(`api/sensor-records/by-order/${this.orderId}`).subscribe(
        (res) => {
          this.sensorRecord = res as SensorRecordDto[];
          this.latestRecord = this.getLatestRecord();
          console.log('Sensor Record:', this.sensorRecord);
          if (this.latestRecord && this.latestRecord.status === 1) {
            this.isRunning = true;
            this.selectedLine = this.latestRecord.lineId;
            console.log('selectedLine', this.selectedLine);
            console.log('Latest record is in progress. Connecting to SignalR...');
            this.connectToSignalR();
          }
          this.calculateTotals();
        },
        (err) => {
          console.error('Error loading sensor record:', err);
          this.sensorRecord = [];
        }
      );
    }
  }

  // SignalR Management
  private connectToSignalR(): void {
    if (!this.selectedLine) {
      console.warn('No line selected. Cannot connect to SignalR.');
      return;
    }
    if (this.isSignalRRunning) {
      console.log('SignalR already running.');
      return;
    }

    this.signalrService.startConnection().then(() => {
      console.log('SignalR connected successfully!');
      this.isSignalRRunning = true;
      this.subscription = this.signalrService.dataReceived$.subscribe(data => {
        this.receivedDataSensor = data;
        if (Array.isArray(this.receivedDataSensor) && this.receivedDataSensor.length >= this.selectedLine) {
          this.dataSensorByLine = this.receivedDataSensor[this.selectedLine - 1];
          console.log('Data from SignalR:', this.dataSensorByLine);
          
        } else {
          console.warn('Invalid or no data for the selected line.');
          this.dataSensorByLine = null;
        }
      });
    }).catch(err => console.error('SignalR connection error:', err));
  }

  private disconnectSignalR(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.signalrService.stopConnection();
    this.isSignalRRunning = false;
  }

  checkSignalRStatus(): void {
    this.isSignalRRunning = this.signalrService.isConnected();
  }

  // Utility Methods
  calculateTotals(): void {
    this.totalUnits = this.sensorRecord.reduce((sum, item) => sum + item.sensorUnits, 0);
    this.totalWeight = this.sensorRecord.reduce((sum, item) => sum + item.sensorUnits * (this.orderDetail?.productInformation?.weightPerUnit || 0), 0);
  }

  getLatestRecord(): any {
    return this.sensorRecord?.length > 0
      ? this.sensorRecord.reduce((latest, item) => new Date(item.recordTime) > new Date(latest.recordTime) ? item : latest)
      : null;
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  hasAssignedLine(): boolean {
    return this.orderLineDetails !== null;
  }

  getStatusText(status: number): string {
    switch (status) {
      case 0: return 'Not Completed';
      case 1: return 'In Progress';
      case 2: return 'Completed';
      case 3: return 'Cancel';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'status-not-completed';
      case 1: return 'status-in-progress';
      case 2: return 'status-completed';
      case 3: return 'status-cancel';
      default: return 'status-unknown';
    }
  }

  // Core Logic
  toggleOrder(): void {
    if (!this.isRunning) {
      this.isStarting = false;
      this.isRunning = true;
      this.startOrder();
      if (this.selectedLine !== 0) {
        this.connectToSignalR();
      }
    } else {
      this.isLoading = true;
      let totalUnits = this.totalUnits + Number(this.receivedDataSensor[this.selectedLine - 1]?.value || 0);
      console.log("Tổng giá trị từ sensorRecord và giá trị đang đọc:", totalUnits);

      const stopOrder = () => {
        this.isRunning = false;
        this.selectedLine = 0;

        if (this.sensorRecord.length > 0 && this.receivedDataSensor) {
          const lastIndex = this.sensorRecord.length - 1;
          const lastRecord = this.sensorRecord[lastIndex];

          if (this.dataSensorByLine) {
            lastRecord.sensorUnits = Number(this.dataSensorByLine.value);
            lastRecord.sensorWeight = lastRecord.sensorUnits * (this.orderDetail?.productInformation?.weightPerUnit || 0);
            console.log("lastRecord:", lastRecord);

            this.updateSensorRecord(lastRecord);
            this.updateLastOrderLineDetail();
            this.updateWCFData();

            // Thay reload bằng refresh
            setTimeout(() => {
              this.refreshChangedData();
              this.isLoading = false;
            }, 500); // Delay nhẹ để đảm bảo API hoàn tất
          } else {
            console.error("Data Sensor By Line null:", this.dataSensorByLine);
            this.snackBar.open('Error: No sensor data available.', 'Close', { duration: 3000 });
            this.isLoading = false;
          }
        } else {
          this.isLoading = false;
        }

        this.disconnectSignalR();
      };

      if (totalUnits < this.orderDetail?.requestedUnits) {
        const dialogRef = this.dialog.open(ConfirmComponent, {
          width: '450px',
          height: '130px',
          data: { message: "The count is not complete. Are you sure you want to stop?" }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) stopOrder();
          else this.isLoading = false;
        });
      } else {
        stopOrder();
      }
    }
  }

  refreshChangedData(): void {
    this.loadSensorRecord();
    this.getOrderLineDetail();
    this.loadOrderDetails();
  }

  // Update Methods
  updateSensorRecord(sensorRecord: SensorRecordDto): void {
    if (!sensorRecord.id) {
      console.error('Error: Sensor Record ID is missing.');
      return;
    }
    sensorRecord.status = 0;
    sensorRecord.recordTime = this.timezoneService.getCurrentTime().toISOString();
    this.repoService.updateByID('api/sensor-records', sensorRecord.id.toString(), sensorRecord).subscribe(
      (res) => console.log('Sensor Record updated successfully:', res),
      (err) => console.error('Error updating sensor record:', err)
    );
    this.calculateTotals();
  }

  updateOrderDetail(): void {
    if (this.totalUnits > this.orderDetail?.requestedUnits) {
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
        (res) => console.log('Order Detail updated successfully:', res),
        (err) => console.error('Error updating order detail:', err)
      );
    }
  }

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
          this.refreshChangedData();
        },
        (err) => console.error('Error updating order status:', err)
      );
    }
  }

  updateLastOrderLineDetail(): void {
    if (this.orderLineDetails && this.orderLineDetails.length > 0) {
      const lastOrderLineDetail = this.orderLineDetails.reduce((latest, current) =>
        current.id > latest.id ? current : latest
      );
      console.log("ID cập nhật", lastOrderLineDetail.id);
      if (lastOrderLineDetail) {
        lastOrderLineDetail.EndTime = new Date().toISOString();
        this.repoService.updateByID('api/order-line-details', lastOrderLineDetail.id.toString(), lastOrderLineDetail).subscribe(
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

  updateWCFData(): void {
    if (!this.dataSensorByLine) {
      console.error('Error: Sensor Record is missing.');
      return;
    }
    const sensorData: WcfDataUpdateDto[] = [{
      name: this.dataSensorByLine.name,
      value: "0"
    }];
    console.log("Write value:", sensorData);
    this.repoService.update('api/wcf/write-value', sensorData).subscribe(
      (res) => console.log('Sensor Record updated successfully:', res),
      (err) => console.error('Error updating sensor record:', err)
    );
    this.calculateTotals();
  }

  // Action Methods
  startOrder(): void {
    if (!this.selectedLine) {
      this.snackBar.open('Please select a Line before starting.', 'Close', { duration: 3000 });
      return;
    }
    if (this.selectedLine && this.orderId) {
      this.isLoading = true;
      this.updateOrderStatus(1);
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
      this.createOrderLineDetail();
      this.repoService.create('api/sensor-records', sensorRecordData).subscribe(
        (res) => {
          console.log('Sensor Record created successfully:', res);
          this.loadSensorRecord();
          this.isLoading = false;
        },
        (err) => {
          console.error('Error creating sensor record:', err);
          this.isLoading = false;
        }
      );
    }
  }

  createOrderLineDetail(): void {
    if (this.orderLineDetails && this.orderId) {
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
          console.error(err);
        }
      );
    }
  }

  confirmForm(id: number): void {
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
        this.isLoading = true;
        this.updateOrderDetail();
        this.updateOrderStatus(2);
        setTimeout(() => {
          this.refreshChangedData();
          this.isLoading = false;
        }, 500);
      }
    });
  }

  completeOrder(): void {
    this.confirmForm(this.orderDetail?.id);
    console.log('Order Detail updated successfully:', this.orderDetail);
  }

  goBack(): void {
    this.router.navigate(['/ui-components/orders']);
  }

  selectLine(lineId: number): void {
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
    } else {
      this.selectedLine = lineId;
      console.log("selected line:", this.selectedLine);
    }
  }

  calculateWeight(item: SensorRecordDto): number {
    const weightPerUnit = this.orderDetail?.productInformation?.weightPerUnit || 0;
    const units = item === this.latestRecord && this.dataSensorByLine?.value ? Number(this.dataSensorByLine.value) : item.sensorUnits;
    console.log('Calculating weight:', { itemId: item.id, units, weightPerUnit });
    return units * weightPerUnit;
  }
}