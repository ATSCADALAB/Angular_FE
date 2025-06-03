import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  styleUrls: ['./order-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  totalUnits: number = 0;
  totalWeight: number = 0;
  replacedUnits: number = 0;
  replacedWeight: number = 0;
  isSensorExpanded = true;
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
  isLoading: boolean = false;
  isAssigned: boolean = false;
  private subscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private repoService: RepositoryService,
    private snackBar: MatSnackBar,
    private signalrService: SignalRService,
    private timezoneService: TimezoneService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.orderId = params.get('id');
      this.selectedLine = 0;
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && this.isRunning) {
          this.refreshChangedData();
        }
      });

      if (this.orderId) {
        this.getListLines();
        this.loadOrderDetails();
        this.getOrderLineDetail();
        this.loadListSensorRecords();
        this.loadSensorRecord();
        this.checkSignalRStatus();
      }
      this.cdr.detectChanges();
    });
  }

  toggleSensorExpand(): void {
    this.isSensorExpanded = !this.isSensorExpanded;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.disconnectSignalR();
    this.cdr.detach();
  }

  // API Calls
  loadOrderDetails(): void {
    this.repoService.getData(`api/order-details/by-order/${this.orderId}`).subscribe(
      (res) => {
        this.orderDetail = (res as OrderDetailDto[])[0];
        this.cdr.detectChanges();
      },
      (err) => {
        this.cdr.detectChanges();
      }
    );
  }

  getListLines(): void {
    this.repoService.getData(`api/lines`).subscribe(
      (res) => {
        this.lines = res as LineDto[];
        this.cdr.detectChanges();
      },
      (err) => {
        this.cdr.detectChanges();
      }
    );
  }

  getOrderLineDetail(): void {
    if (this.orderId) {
      this.repoService.getData(`api/order-line-details/${this.orderId}`).subscribe(
        (res) => {
          this.orderLineDetails = res as OrderLineDetailDto[];
          const assignedLine = this.orderLineDetails.find(detail => detail.orderId === this.orderId && detail.EndTime == undefined);
          if (assignedLine) {
            this.isAssigned = true;
            this.selectedLine = assignedLine.lineId;
          } else {
            this.isAssigned = false;
            this.selectedLine = 0;
          }
          this.cdr.detectChanges();
        },
        (err) => {
          this.orderLineDetails = [];
          this.isAssigned = false;
          this.cdr.detectChanges();
        }
      );
    }
  }

  loadListSensorRecords(): void {
    this.repoService.getData(`api/sensor-records`).subscribe(
      (res) => {
        this.listSensorRecords = res as SensorRecordDto[];
        this.cdr.detectChanges();
      },
      (err) => {
        this.sensorRecord = [];
        this.cdr.detectChanges();
      }
    );
  }

  loadSensorRecord(): void {
    if (this.orderId) {
      this.repoService.getData(`api/sensor-records/by-order/${this.orderId}`).subscribe(
        (res) => {
          this.sensorRecord = res as SensorRecordDto[];
          this.latestRecord = this.getLatestRecord();
          if (this.latestRecord && this.latestRecord.status === 1) {
            this.isRunning = true;
            this.selectedLine = this.latestRecord.lineId;
            this.connectToSignalR();
          }
          this.calculateTotals();
          this.cdr.detectChanges();
        },
        (err) => {
          this.sensorRecord = [];
          this.cdr.detectChanges();
        }
      );
    }
  }

  // SignalR Management
  private connectToSignalR(): void {
    if (!this.selectedLine) {
      return;
    }
    if (this.isSignalRRunning) {
      return;
    }

    this.signalrService.startConnection().then(() => {
      this.isSignalRRunning = true;
      this.subscription = this.signalrService.dataReceived$.subscribe(data => {
        this.receivedDataSensor = data;
        if (Array.isArray(this.receivedDataSensor) && this.receivedDataSensor.length >= this.selectedLine) {
          this.dataSensorByLine = this.receivedDataSensor[this.selectedLine - 1];
          this.cdr.detectChanges();
        } else {
          this.dataSensorByLine = null;
          this.cdr.detectChanges();
        }
      });
    }).catch(err => {
      this.cdr.detectChanges();
    });
  }

  private disconnectSignalR(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.signalrService.stopConnection();
    this.isSignalRRunning = false;
    this.cdr.detectChanges();
  }

  checkSignalRStatus(): void {
    this.isSignalRRunning = this.signalrService.isConnected();
    this.cdr.detectChanges();
  }

  // Utility Methods
  calculateTotals(): void {
    this.totalUnits = this.sensorRecord.reduce((sum, item) => sum + item.sensorUnits, 0);
    this.totalWeight = this.sensorRecord.reduce((sum, item) => sum + item.sensorUnits * (this.orderDetail?.productInformation?.weightPerUnit || 0), 0);
    this.cdr.detectChanges();
  }

  getLatestRecord(): any {
    return this.sensorRecord?.length > 0
      ? this.sensorRecord.reduce((latest, item) => new Date(item.recordTime) > new Date(latest.recordTime) ? item : latest)
      : null;
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    this.cdr.detectChanges();
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
      const activeRecord = this.listSensorRecords.find(record => record.lineId === this.selectedLine && record.status === 1);
      if (activeRecord) {
        const dialogRef = this.dialog.open(ConfirmComponent, {
          width: '450px',
          height: '150px',
          disableClose: true,
          data: { message: `Line ${this.selectedLine} is currently in use by order ${activeRecord.orderId}. Would you like to view its details?` }
        });

        dialogRef.afterClosed().subscribe(result => {
          this.isStarting = false;
          this.isRunning = false;
          if (result) {
            this.router.navigate(['/ui-components/order-details', activeRecord.orderId]);
          } else {
            this.selectedLine = 0;
            this.snackBar.open('Please select another Line.', 'Close', { duration: 3000 });
            this.cdr.detectChanges();
          }
        });
        return;
      }
      this.isStarting = false;
      this.isRunning = true;
      this.startOrder();
      if (this.selectedLine !== 0) {
        this.connectToSignalR();
      }
      console.log(this.selectLine.toString())
      const settings: WcfDataUpdateDto[] = [{
      name: this.selectedLine.toString(),
      valueToWrite: this.orderDetail.order.vehicleNumber+"/"+this.orderDetail.productInformation.productCode+"/"+this.orderDetail.requestedUnits+"/"+this.orderDetail.productInformation.weightPerUnit
    }];
    this.repoService.update('api/wcf/write-setting', settings).subscribe(
      (res) => {
        this.cdr.detectChanges();
      },
      (err) => {
        this.cdr.detectChanges();
      }
    );
    } else {
      this.isLoading = true;
      let totalUnits = this.totalUnits + Number(this.receivedDataSensor[this.selectedLine - 1]?.value || 0);

      const stopOrder = () => {
        this.isRunning = false;
        this.selectedLine = 0;

        if (this.sensorRecord.length > 0 && this.receivedDataSensor) {
          const lastIndex = this.sensorRecord.length - 1;
          const lastRecord = this.sensorRecord[lastIndex];

          if (this.dataSensorByLine) {
            lastRecord.sensorUnits = Number(this.dataSensorByLine.value);
            lastRecord.sensorWeight = lastRecord.sensorUnits * (this.orderDetail?.productInformation?.weightPerUnit || 0);

            this.updateSensorRecord(lastRecord);
            this.updateLastOrderLineDetail();
            this.updateWCFData();

            setTimeout(() => {
              this.refreshChangedData();
              this.isLoading = false;
              this.cdr.detectChanges();
            }, 500);
          } else {
            this.snackBar.open('Error: No sensor data available.', 'Close', { duration: 3000 });
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
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
          else {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
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
    this.cdr.detectChanges();
  }

  // Update Methods
  updateSensorRecord(sensorRecord: SensorRecordDto): void {
    if (!sensorRecord.id) {
      return;
    }
    sensorRecord.status = 0;
    sensorRecord.recordTime = this.timezoneService.getCurrentTime().toISOString();
    this.repoService.updateByID('api/sensor-records', sensorRecord.id.toString(), sensorRecord).subscribe(
      (res) => {
        this.cdr.detectChanges();
      },
      (err) => {
        this.cdr.detectChanges();
      }
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
        (res) => {
          this.cdr.detectChanges();
        },
        (err) => {
          this.cdr.detectChanges();
        }
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
          this.refreshChangedData();
          this.cdr.detectChanges();
        },
        (err) => {
          this.cdr.detectChanges();
        }
      );
    }
  }

  updateLastOrderLineDetail(): void {
    if (this.orderLineDetails && this.orderLineDetails.length > 0) {
      const lastOrderLineDetail = this.orderLineDetails.reduce((latest, current) =>
        current.id > latest.id ? current : latest
      );
      if (lastOrderLineDetail) {
        lastOrderLineDetail.EndTime = new Date().toISOString();
        this.repoService.updateByID('api/order-line-details', lastOrderLineDetail.id.toString(), lastOrderLineDetail).subscribe(
          (res) => {
            this.cdr.detectChanges();
          },
          (err) => {
            this.cdr.detectChanges();
          }
        );
      }
    }
  }

  updateWCFData(): void {
    if (!this.dataSensorByLine) {
      return;
    }
    const sensorData: WcfDataUpdateDto[] = [{
      name: this.dataSensorByLine.name,
      valueToWrite: "0"
    }
    ];
    this.repoService.update('api/wcf/write-value', sensorData).subscribe(
      (res) => {
        this.cdr.detectChanges();
      },
      (err) => {
        this.cdr.detectChanges();
      }
    );
    this.calculateTotals();
  }

  // Action Methods
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
          this.cdr.detectChanges();
        },
        (err) => {
          this.isStarting = false;
          this.snackBar.open('Failed to start order.', 'Close', { duration: 3000 });
          this.cdr.detectChanges();
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
        this.updateLastOrderLineDetail();
        setTimeout(() => {
          this.refreshChangedData();
          this.isLoading = false;
          this.cdr.detectChanges();
        }, 500);
      }
    });
  }

  completeOrder(): void {
    this.confirmForm(this.orderDetail?.id);
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.router.navigate(['/ui-components/orders']);
    this.cdr.detectChanges();
  }

  selectLine(lineId: number): void {
    if (!this.lines.some(line => line.id === lineId)) {
      this.snackBar.open('Invalid Line selected.', 'Close', { duration: 3000 });
      this.selectedLine = 0;
      this.cdr.detectChanges();
      return;
    }
    this.selectedLine = lineId;
    this.cdr.detectChanges();
  }

  calculateWeight(item: SensorRecordDto): number {
    const weightPerUnit = this.orderDetail?.productInformation?.weightPerUnit || 0;
    const units = item === this.latestRecord && this.dataSensorByLine?.value ? Number(this.dataSensorByLine.value) : item.sensorUnits;
    return units * weightPerUnit;
  }
  calculateRemainingUnits(item: SensorRecordDto): number {
  if (!this.orderDetail || !this.sensorRecord) {
    return 0;
  }

  // Tìm chỉ số của bản ghi hiện tại
  const currentIndex = this.sensorRecord.findIndex(record => record.id === item.id);
  if (currentIndex === -1) {
    return this.orderDetail.requestedUnits;
  }

  // Tính tổng số units đã đếm đến bản ghi hiện tại
  let totalUnitsCounted = 0;
  for (let i = 0; i <= currentIndex; i++) {
    const record = this.sensorRecord[i];
    // Nếu là bản ghi mới nhất và có dữ liệu SignalR, sử dụng dataSensorByLine.value
    totalUnitsCounted += (record === this.latestRecord && this.dataSensorByLine?.value)
      ? Number(this.dataSensorByLine.value)
      : record.sensorUnits;
  }

  // Trả về số lượng còn lại
  const remainingUnits = this.orderDetail.requestedUnits - totalUnitsCounted;
  return remainingUnits >= 0 ? remainingUnits : 0; // Đảm bảo không trả về số âm
}

  assignLine(): void {
    if (!this.selectedLine || !this.orderId) {
      this.snackBar.open('Please select a Line to assign.', 'Close', { duration: 3000 });
      this.cdr.detectChanges();
      return;
    }

    const alreadyAssigned = this.orderLineDetails.some(detail => detail.lineId === this.selectedLine);
    if (alreadyAssigned) {
      this.snackBar.open('This line has already been assigned.', 'Close', { duration: 3000 });
      this.cdr.detectChanges();
      return;
    }

    const orderLineDetail: OrderLineDetailCreationDto = {
      orderId: this.orderId,
      LineId: this.selectedLine,
      SequenceNumber: this.orderLineDetails.length + 1,
      StartTime: new Date().toISOString(),
      EndTime: new Date().toISOString()
    };

    this.repoService.create('api/order-line-details', orderLineDetail).subscribe(
      () => {
        this.snackBar.open('Line assigned successfully.', 'Close', { duration: 3000 });
        this.getOrderLineDetail();
        this.isAssigned = true;
        this.cdr.detectChanges();
      },
      (err) => {
        this.snackBar.open('Failed to assign line.', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      }
    );
  }

  startOrder(): void {
    if (!this.selectedLine) {
      this.snackBar.open('Please select a Line before starting.', 'Close', { duration: 3000 });
      this.cdr.detectChanges();
      return;
    }
    const activeRecord = this.listSensorRecords.find(record => record.lineId === this.selectedLine && record.status === 1);
    if (activeRecord) {
      const dialogRef = this.dialog.open(ConfirmComponent, {
        width: '450px',
        height: '150px',
        disableClose: true,
        data: { message: `Line ${this.selectedLine} is currently in use by order ${activeRecord.orderId}. Would you like to view its details?` }
      });

      dialogRef.afterClosed().subscribe(result => {
        this.isStarting = false;
        this.isRunning = false;
        if (result) {
          this.router.navigate(['/ui-components/order-details', activeRecord.orderId]);
        } else {
          this.selectedLine = 0;
          this.snackBar.open('Please select another Line.', 'Close', { duration: 3000 });
          this.cdr.detectChanges();
        }
      });
      return;
    }
    this.updateWCFData();
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
      this.repoService.create('api/sensor-records', sensorRecordData).subscribe(
        (res) => {
          this.loadSensorRecord();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        (err) => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      );
    }
  }

  unassignLine(): void {
    if (!this.orderId || !this.selectedLine) {
      this.snackBar.open('No Line assigned to unassign.', 'Close', { duration: 3000 });
      this.cdr.detectChanges();
      return;
    }

    const assignedDetail = this.orderLineDetails.find(detail => detail.orderId === this.orderId && detail.lineId === this.selectedLine && detail.EndTime === undefined);
    if (!assignedDetail) {
      this.snackBar.open('No active assignment found for this Line.', 'Close', { duration: 3000 });
      this.cdr.detectChanges();
      return;
    }

    const dialogRef = this.dialog.open(ConfirmComponent, {
      width: '450px',
      height: '150px',
      disableClose: true,
      data: { message: `Are you sure you want to unassign Line ${this.selectedLine}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        assignedDetail.EndTime = new Date().toISOString();
        this.repoService.updateByID('api/order-line-details', assignedDetail.id.toString(), assignedDetail).subscribe(
          () => {
            this.snackBar.open('Line unassigned successfully.', 'Close', { duration: 3000 });
            this.isAssigned = false;
            this.selectedLine = 0;
            this.getOrderLineDetail();
            this.cdr.detectChanges();
          },
          (err) => {
            this.snackBar.open('Failed to unassign line.', 'Close', { duration: 3000 });
            this.cdr.detectChanges();
          }
        );
      }
    });
  }
}