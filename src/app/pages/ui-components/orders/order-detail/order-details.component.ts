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

// Enums cho status
enum OrderStatus {
  NOT_COMPLETED = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3
}
enum LineStatus {
  GOOD = 'good',
  BAD = 'bad'
}

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailsComponent implements OnInit, OnDestroy {

  // ===========================================
  // PROPERTIES & STATE MANAGEMENT
  // ===========================================
  
  // Order related properties
  orderId: string | null = null;
  orderDetail: OrderDetailDto;
  orderLineDetails: OrderLineDetailDto[] = [];
  
  // Line management
  selectedLine: number = 0;
  lines: LineDto[] = [];
  isAssigned: boolean = false;
  
  // Sensor data
  sensorRecord: SensorRecordDto[] = [];
  listSensorRecords: SensorRecordDto[] = [];
  receivedDataSensor: WcfDataDto[] = [];
  dataSensorByLine: WcfDataDto | null = null;
  latestRecord: any;
  
  // Calculations
  totalUnits: number = 0;
  totalWeight: number = 0;
  replacedUnits: number = 0;
  replacedWeight: number = 0;
  
  // UI States
  isExpanded = true;
  isSensorExpanded = true;
  isStarting: boolean = false;
  isRunning: boolean = false;
  isLoading: boolean = false;
  
  // SignalR management
  isSignalRRunning: boolean = false;
  private subscription: Subscription;

  private wcfSettingsInterval: any = null;
  private wcfSettingsTimeout: any = null;
  private readonly WCF_SETTINGS_INTERVAL_MS = 2000;
  private readonly WCF_SETTINGS_DURATION_MS = 60000;
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

  // ===========================================
  // LIFECYCLE HOOKS
  // ===========================================
  
  ngOnInit(): void {
    this.initializeComponent();
    this.setupVisibilityChangeListener();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initializeComponent(): void {
    this.route.paramMap.subscribe(params => {
      this.orderId = params.get('id');
      this.selectedLine = 0;

      if (this.orderId) {
        this.loadAllData();
      }
      this.detectChanges();
    });
  }

  private setupVisibilityChangeListener(): void {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.isRunning) {
        this.refreshAllData();
      }
    });
  }

  private cleanup(): void {
    console.log('Cleaning up OrderDetailsComponent...');
    
    // Stop tất cả intervals và timers
    this.stopPeriodicWCFSettingsWriter();
    
    // Disconnect SignalR
    this.disconnectSignalR();
    
    // Unsubscribe tất cả subscriptions
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    // Clear tất cả timeouts (nếu có)
    // Reset states
    this.isRunning = false;
    this.isSignalRRunning = false;
    this.isLoading = false;
    
    // Detach change detector
    this.cdr.detach();
    
    console.log('OrderDetailsComponent cleanup completed');
  }

  // ===========================================
  // DATA LOADING & API CALLS
  // ===========================================
  
  private loadAllData(): void {
    this.loadOrderDetails();
    this.loadLines();
    this.loadOrderLineDetails();
    this.loadSensorData();
    this.checkSignalRStatus();
  }

  private loadOrderDetails(): void {
    this.repoService.getData(`api/order-details/by-order/${this.orderId}`).subscribe(
      (res) => {
        this.orderDetail = (res as OrderDetailDto[])[0];
        this.detectChanges();
      },
      (err) => this.handleError('Failed to load order details', err)
    );
  }

  private loadLines(): void {
    this.repoService.getData(`api/lines`).subscribe(
      (res) => {
        this.lines = res as LineDto[];
        this.detectChanges();
      },
      (err) => this.handleError('Failed to load lines', err)
    );
  }

  private loadOrderLineDetails(): void {
    if (!this.orderId) return;

    this.repoService.getData(`api/order-line-details/${this.orderId}`).subscribe(
      (res) => {
        this.orderLineDetails = res as OrderLineDetailDto[];
        this.updateLineAssignmentStatus();
        this.detectChanges();
      },
      (err) => {
        this.orderLineDetails = [];
        this.isAssigned = false;
        this.handleError('Failed to load order line details', err);
      }
    );
  }

  private loadSensorData(): void {
    this.loadAllSensorRecords();
    this.loadOrderSensorRecords();
  }

  private loadAllSensorRecords(): void {
    this.repoService.getData(`api/sensor-records`).subscribe(
      (res) => {
        this.listSensorRecords = res as SensorRecordDto[];
        this.detectChanges();
      },
      (err) => {
        this.sensorRecord = [];
        this.handleError('Failed to load sensor records', err);
      }
    );
  }

  private loadOrderSensorRecords(): void {
    if (!this.orderId) return;

    this.repoService.getData(`api/sensor-records/by-order/${this.orderId}`).subscribe(
      (res) => {
        this.sensorRecord = res as SensorRecordDto[];
        this.processOrderSensorData();
        this.detectChanges();
      },
      (err) => {
        this.sensorRecord = [];
        this.handleError('Failed to load order sensor records', err);
      }
    );
  }

  private processOrderSensorData(): void {
    this.latestRecord = this.getLatestRecord();
    if (this.latestRecord && this.latestRecord.status === OrderStatus.IN_PROGRESS) {
      this.isRunning = true;
      this.selectedLine = this.latestRecord.lineId;
      this.connectToSignalR();
    }
    this.calculateTotals();
  }

  refreshAllData(): void {
    this.loadOrderSensorRecords();
    this.loadOrderLineDetails();
    this.loadOrderDetails();
    this.detectChanges();
  }

  // ===========================================
  // SIGNALR MANAGEMENT
  // ===========================================
  
  private connectToSignalR(): void {
    if (!this.selectedLine || this.isSignalRRunning) {
      return;
    }

    this.signalrService.startConnection().then(() => {
      this.isSignalRRunning = true;
      this.subscription = this.signalrService.dataReceived$.subscribe(data => {
        this.handleSignalRData(data);
      });
    }).catch(err => {
      this.handleError('Failed to connect to SignalR', err);
    });
  }

  private handleSignalRData(data: WcfDataDto[]): void {
    this.receivedDataSensor = data;
    if (Array.isArray(this.receivedDataSensor) && this.receivedDataSensor.length >= this.selectedLine) {
      this.dataSensorByLine = this.receivedDataSensor[this.selectedLine - 1];
    } else {
      this.dataSensorByLine = null;
    }
    this.detectChanges();
  }

  private disconnectSignalR(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.signalrService.stopConnection();
    this.isSignalRRunning = false;
    this.detectChanges();
  }

  private checkSignalRStatus(): void {
    this.isSignalRRunning = this.signalrService.isConnected();
    this.detectChanges();
  }

  // ===========================================
  // LINE MANAGEMENT
  // ===========================================
  
  selectLine(lineId: number): void {
    if (!this.isValidLine(lineId)) {
      this.showMessage('Invalid Line selected.');
      this.selectedLine = 0;
      return;
    }
    this.selectedLine = lineId;
    this.detectChanges();
  }

  assignLine(): void {
    if (!this.selectedLine || !this.orderId) {
      this.showMessage('Please select a Line to assign.');
      return;
    }

    if (this.isLineAlreadyAssigned()) {
      this.showMessage('This line has already been assigned.');
      return;
    }

    const orderLineDetail = this.createOrderLineDetailDto();
    this.repoService.create('api/order-line-details', orderLineDetail).subscribe(
      () => {
        this.showMessage('Line assigned successfully.');
        this.loadOrderLineDetails();
        this.isAssigned = true;
        this.detectChanges();
      },
      (err) => this.handleError('Failed to assign line', err)
    );
  }

  unassignLine(): void {
    if (!this.orderId || !this.selectedLine) {
      this.showMessage('No Line assigned to unassign.');
      return;
    }

    const assignedDetail = this.findAssignedDetail();
    if (!assignedDetail) {
      this.showMessage('No active assignment found for this Line.');
      return;
    }

    this.showConfirmDialog(
      `Are you sure you want to unassign Line ${this.selectedLine}?`,
      () => this.performUnassign(assignedDetail)
    );
  }

  private updateLineAssignmentStatus(): void {
    const assignedLine = this.orderLineDetails.find(
      detail => detail.orderId === this.orderId && detail.EndTime == undefined
    );
    
    if (assignedLine) {
      this.isAssigned = true;
      this.selectedLine = assignedLine.lineId;
    } else {
      this.isAssigned = false;
      this.selectedLine = 0;
    }
  }

  private isValidLine(lineId: number): boolean {
    return this.lines.some(line => line.id === lineId);
  }

  private isLineAlreadyAssigned(): boolean {
    return this.orderLineDetails.some(detail => detail.lineId === this.selectedLine);
  }

  private findAssignedDetail(): OrderLineDetailDto | undefined {
    return this.orderLineDetails.find(
      detail => detail.orderId === this.orderId && 
               detail.lineId === this.selectedLine && 
               detail.EndTime === undefined
    );
  }

  private performUnassign(assignedDetail: OrderLineDetailDto): void {
    assignedDetail.EndTime = new Date().toISOString();
    this.repoService.updateByID('api/order-line-details', assignedDetail.id.toString(), assignedDetail).subscribe(
      () => {
        this.showMessage('Line unassigned successfully.');
        this.isAssigned = false;
        this.selectedLine = 0;
        this.loadOrderLineDetails();
        this.detectChanges();
      },
      (err) => this.handleError('Failed to unassign line', err)
    );
  }

  // ===========================================
  // ORDER OPERATIONS
  // ===========================================
  
  async startOrder(): Promise<void> {
    if (!this.selectedLine) {
      this.showMessage('Please select a Line before starting.');
      return;
    }
  
    // Kiểm tra line có đang được sử dụng không
    if (this.isLineCurrentlyInUse()) {
      return;
    }
  
    // Kiểm tra trạng thái line từ SignalR
    this.isLoading = true;
    const isLineStatusGood = await this.validateLineStatusWithSignalR();
    
    if (!isLineStatusGood) {
      this.isLoading = false;
      return;
    }
  
    // Nếu line status good, tiếp tục start order
    this.performOrderStart();
  }

  private performOrderStart(): void {
    this.updateWCFData();
    if (this.selectedLine && this.orderId) {
      this.isLoading = true;
      this.updateOrderStatus(OrderStatus.IN_PROGRESS);
      
      const sensorRecordData = this.createSensorRecordDto();
      this.repoService.create('api/sensor-records', sensorRecordData).subscribe(
        (res) => {
          this.loadOrderSensorRecords();
          this.isLoading = false;
          this.detectChanges();
        },
        (err) => {
          this.isLoading = false;
          this.handleError('Failed to start order', err);
        }
      );
    }
  }

  stopOrder(): void {
    this.isLoading = true;
    const totalUnits = this.calculateCurrentTotalUnits();

    if (totalUnits < (this.orderDetail?.requestedUnits || 0)) {
      this.showConfirmDialog(
        "The count is not complete. Are you sure you want to stop?",
        () => this.performOrderStop(),
        () => {
          this.isLoading = false;
          this.detectChanges();
        }
      );
    } else {
      this.performOrderStop();
    }
  }

  private performOrderStop(): void {
    this.isRunning = false;
    this.selectedLine = 0;

    if (this.sensorRecord.length > 0 && this.receivedDataSensor) {
      this.updateLastSensorRecord();
      this.updateLastOrderLineDetail();
      this.updateWCFData();

      setTimeout(() => {
        this.refreshAllData();
        this.isLoading = false;
        this.detectChanges();
      }, 500);
    } else {
      this.showMessage('Error: No sensor data available.');
      this.isLoading = false;
      this.detectChanges();
    }

    this.disconnectSignalR();
  }

  async toggleOrder(): Promise<void> {
    if (!this.isRunning) {
      if (this.isLineCurrentlyInUse()) {
        return;
      }
      
      // Kiểm tra line status trước khi start
      this.isLoading = false;
      const isLineStatusGood = await this.validateLineStatusWithSignalR();
      
      if (!isLineStatusGood) {
        this.isLoading = false;
        return;
      }
      
      this.isStarting = false;
      this.isRunning = true;
      this.startOrder();
      
      if (this.selectedLine !== 0) {
        this.connectToSignalR();
      }
      
      this.startPeriodicWCFSettingsWriter();
       this.isLoading = false;
      this.detectChanges();
    } else {
      this.stopPeriodicWCFSettingsWriter();
      this.stopOrder();
    }
  }

  completeOrder(): void {
    if (!this.orderDetail?.id) return;
    
    const dialogRef = this.dialog.open(OrderDetailConfirmComponent, {
      width: '500px',
      height: '400px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: {
        id: this.orderDetail.id,
        totalUnits: this.totalUnits,
        updateOrderDetail: this.updateOrderDetail.bind(this),
        updateOrderStatus: this.updateOrderStatus.bind(this)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performOrderCompletion();
      }
    });
  }

  private performOrderCompletion(): void {
    this.isLoading = true;
    this.updateOrderDetail();
    this.updateOrderStatus(OrderStatus.COMPLETED);
    this.updateLastOrderLineDetail();
    
    setTimeout(() => {
      this.refreshAllData();
      this.isLoading = false;
      this.detectChanges();
    }, 500);
  }

  // ===========================================
  // UPDATE OPERATIONS
  // ===========================================
  
  private updateOrderDetail(): void {
    if (this.totalUnits <= (this.orderDetail?.requestedUnits || 0)) return;

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
      (res) => this.detectChanges(),
      (err) => this.handleError('Failed to update order detail', err)
    );
  }

  private updateOrderStatus(status: OrderStatus): void {
    if (!this.orderId) return;

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
        this.refreshAllData();
        this.detectChanges();
      },
      (err) => this.handleError('Failed to update order status', err)
    );
  }

  private updateLastSensorRecord(): void {
    if (!this.sensorRecord.length || !this.dataSensorByLine) {
      this.showMessage('Error: No sensor data available.');
      return;
    }

    const lastRecord = this.sensorRecord[this.sensorRecord.length - 1];
    lastRecord.sensorUnits = Number(this.dataSensorByLine.value);
    lastRecord.sensorWeight = lastRecord.sensorUnits * (this.orderDetail?.productInformation?.weightPerUnit || 0);
    lastRecord.status = OrderStatus.NOT_COMPLETED;
    lastRecord.recordTime = this.timezoneService.getCurrentTime().toISOString();

    if (!lastRecord.id) return;

    this.repoService.updateByID('api/sensor-records', lastRecord.id.toString(), lastRecord).subscribe(
      (res) => {
        this.calculateTotals();
        this.detectChanges();
      },
      (err) => this.handleError('Failed to update sensor record', err)
    );
  }

  private updateLastOrderLineDetail(): void {
    if (!this.orderLineDetails?.length) return;

    const lastOrderLineDetail = this.orderLineDetails.reduce((latest, current) =>
      current.id > latest.id ? current : latest
    );
    
    if (lastOrderLineDetail) {
      lastOrderLineDetail.EndTime = new Date().toISOString();
      this.repoService.updateByID('api/order-line-details', lastOrderLineDetail.id.toString(), lastOrderLineDetail).subscribe(
        (res) => this.detectChanges(),
        (err) => this.handleError('Failed to update order line detail', err)
      );
    }
  }

  private updateWCFData(): void {
    if (!this.dataSensorByLine) return;

    const sensorData: WcfDataUpdateDto[] = [{
      name: this.dataSensorByLine.name,
      valueToWrite: "0"
    }];
    
    this.repoService.update('api/wcf/write-value', sensorData).subscribe(
      (res) => {
        this.calculateTotals();
        this.detectChanges();
      },
      (err) => this.handleError('Failed to update WCF data', err)
    );
  }

  private writeSettingsToWCF(): void {
    if (!this.selectedLine) return;

    const settings: WcfDataUpdateDto[] = [{
      name: this.selectedLine.toString(),
      valueToWrite: `${this.orderDetail.order.vehicleNumber}/${this.orderDetail.productInformation.productCode}/${this.orderDetail.requestedUnits}/${this.orderDetail.productInformation.weightPerUnit}`
    }];
    
    this.repoService.update('api/wcf/write-setting', settings).subscribe(
      (res) => {
        this.detectChanges();
      },
      (err) => this.handleError('Failed to write settings to WCF', err)
    );
  }

  // ===========================================
  // CALCULATIONS & UTILITIES
  // ===========================================
  
  private calculateTotals(): void {
    this.totalUnits = this.sensorRecord.reduce((sum, item) => sum + item.sensorUnits, 0);
    this.totalWeight = this.sensorRecord.reduce((sum, item) => 
      sum + item.sensorUnits * (this.orderDetail?.productInformation?.weightPerUnit || 0), 0);
    this.detectChanges();
  }

  private calculateCurrentTotalUnits(): number {
    return this.totalUnits + Number(this.receivedDataSensor[this.selectedLine - 1]?.value || 0);
  }

  calculateWeight(item: SensorRecordDto): number {
    const weightPerUnit = this.orderDetail?.productInformation?.weightPerUnit || 0;
    const units = item === this.latestRecord && this.dataSensorByLine?.value ? 
      Number(this.dataSensorByLine.value) : item.sensorUnits;
    return units * weightPerUnit;
  }

  calculateRemainingUnits(item: SensorRecordDto): number {
    if (!this.orderDetail || !this.sensorRecord) {
      return 0;
    }

    const currentIndex = this.sensorRecord.findIndex(record => record.id === item.id);
    if (currentIndex === -1) {
      return this.orderDetail.requestedUnits;
    }

    let totalUnitsCounted = 0;
    for (let i = 0; i <= currentIndex; i++) {
      const record = this.sensorRecord[i];
      totalUnitsCounted += (record === this.latestRecord && this.dataSensorByLine?.value)
        ? Number(this.dataSensorByLine.value)
        : record.sensorUnits;
    }

    const remainingUnits = this.orderDetail.requestedUnits - totalUnitsCounted;
    return remainingUnits >= 0 ? remainingUnits : 0;
  }

  private getLatestRecord(): any {
    return this.sensorRecord?.length > 0
      ? this.sensorRecord.reduce((latest, item) => 
          new Date(item.recordTime) > new Date(latest.recordTime) ? item : latest)
      : null;
  }

  // ===========================================
  // STATUS & DISPLAY UTILITIES
  // ===========================================
  
  getStatusText(status: number): string {
    switch (status) {
      case OrderStatus.NOT_COMPLETED: return 'Not Completed';
      case OrderStatus.IN_PROGRESS: return 'In Progress';
      case OrderStatus.COMPLETED: return 'Completed';
      case OrderStatus.CANCELLED: return 'Cancel';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case OrderStatus.NOT_COMPLETED: return 'status-not-completed';
      case OrderStatus.IN_PROGRESS: return 'status-in-progress';
      case OrderStatus.COMPLETED: return 'status-completed';
      case OrderStatus.CANCELLED: return 'status-cancel';
      default: return 'status-unknown';
    }
  }

  // ===========================================
  // UI INTERACTIONS
  // ===========================================
  
  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    this.detectChanges();
  }

  toggleSensorExpand(): void {
    this.isSensorExpanded = !this.isSensorExpanded;
    this.detectChanges();
  }

  goBack(): void {
    this.router.navigate(['/ui-components/orders']);
    this.detectChanges();
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================
  
  private isLineCurrentlyInUse(): boolean {
    this.loadAllSensorRecords();
    const activeRecord = this.listSensorRecords.find(
      record => record.lineId === this.selectedLine && record.status === OrderStatus.IN_PROGRESS
    );
    
    if (activeRecord) {
      this.showLineInUseDialog(activeRecord);
      return true;
    }
    return false;
  }

  private showLineInUseDialog(activeRecord: any): void {
    const dialogRef = this.dialog.open(ConfirmComponent, {
      width: '450px',
      height: '150px',
      disableClose: true,
      data: { 
        message: `Line ${this.selectedLine} is currently in use by order ${activeRecord.orderId}. Do you want to stop that order?` 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.isStarting = false;
      this.isRunning = false;
      if (result) {
        this.resetLineStatus(this.selectedLine);
      } else {
        this.selectedLine = 0;
        this.showMessage('Please select another Line.');
      }
    });
  }
  private resetLineStatus(lineId: number): void {
    if (!lineId) {
      this.showMessage('Invalid Line ID for reset operation.');
      return;
    }
    console.log(lineId);

    this.isLoading = true;
    this.showMessage('Resetting line status...');

    // Gọi API reset status
    this.repoService.update(`api/sensor-records/reset-status-by-line/${lineId}`, {}).subscribe(
      (response: any) => {
        this.isLoading = false;
        setTimeout(() => {
        window.location.reload();
      }, 1500); // Delay 1.5 giây
        this.detectChanges();
      },
      (error) => {
        this.isLoading = false;
        this.handleError(`Failed to reset status for Line ${lineId}`, error);
        
        // Nếu reset thất bại, clear selection
        this.selectedLine = 0;
        this.detectChanges();
      }
    );
  }
  private showConfirmDialog(message: string, onConfirm: () => void, onCancel?: () => void): void {
    const dialogRef = this.dialog.open(ConfirmComponent, {
      width: '450px',
      height: '150px',
      disableClose: true,
      data: { message }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
    });
  }

  private createOrderLineDetailDto(): OrderLineDetailCreationDto {
    return {
      orderId: this.orderId!,
      LineId: this.selectedLine,
      SequenceNumber: this.orderLineDetails.length + 1,
      StartTime: new Date().toISOString(),
      EndTime: new Date().toISOString()
    };
  }

  private createSensorRecordDto(): SensorRecordCreationDto {
    return {
      orderId: this.orderId!,
      orderDetailId: this.orderDetail.id,
      lineId: this.selectedLine,
      sensorUnits: 0,
      sensorWeight: 0,
      recordTime: this.timezoneService.getCurrentTime().toISOString(),
      status: OrderStatus.IN_PROGRESS,
    };
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
    this.detectChanges();
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.showMessage(message);
    this.detectChanges();
  }

  private detectChanges(): void {
    this.cdr.detectChanges();
  }

  // ===========================================
  // LEGACY METHODS (for backward compatibility)
  // ===========================================
  
  hasAssignedLine(): boolean {
    return this.orderLineDetails !== null;
  }

  createOrderLineDetail(): void {
    // This method is kept for backward compatibility
    // Logic has been moved to assignLine()
    this.assignLine();
  }

  confirmForm(id: number): void {
    // This method is kept for backward compatibility  
    // Logic has been moved to completeOrder()
    this.completeOrder();
  }
  // ===========================================
// LINE STATUS VALIDATION
// ===========================================

/**
 * Kiểm tra trạng thái line từ SignalR data
 */
private checkLineStatus(): boolean {
  if (!this.selectedLine) {
    this.showMessage('Please select a Line first.');
    return false;
  }

  // Kiểm tra xem có dữ liệu SignalR không và đã nhận được data
  if (!this.receivedDataSensor || 
      this.receivedDataSensor.length === 0 || 
      !this.receivedDataSensor[this.selectedLine - 1]) {
    this.showMessage('No SignalR data available for the selected line.');
    return false;
  }

  // Lấy data của line được chọn
  const lineData = this.receivedDataSensor[this.selectedLine - 1];
  
  // Kiểm tra status của line
  const lineStatus = lineData.status?.toLowerCase();
  
  if (lineStatus === LineStatus.BAD) {
    this.showMessage(`Line ${this.selectedLine} is in BAD status. Cannot start order.`);
    return false;
  }

  if (lineStatus !== LineStatus.GOOD) {
    this.showMessage(`Line ${this.selectedLine} status is unknown (${lineStatus}). Cannot start order.`);
    return false;
  }

  return true;
}
  /**
 * Kiểm tra trạng thái line với SignalR connection
 */
  private async validateLineStatusWithSignalR(): Promise<boolean> {
    try {
      // Nếu chưa có SignalR connection, tạo connection
      if (!this.isSignalRRunning) {
        await this.signalrService.startConnection();
        this.isSignalRRunning = true;
        
        // Subscribe để nhận data
        this.subscription = this.signalrService.dataReceived$.subscribe(data => {
          this.handleSignalRData(data);
        });
      }
      
      // Đợi để nhận được data từ SignalR
      const maxWaitTime = 5000; // 5 seconds
      const checkInterval = 100; // 100ms
      let waitTime = 0;
      
      while (waitTime < maxWaitTime) {
        // Kiểm tra xem đã nhận được data chưa
        if (this.receivedDataSensor && 
            this.receivedDataSensor.length > 0 && 
            this.receivedDataSensor[this.selectedLine - 1]) {
          
          // Đã có data, kiểm tra status
          return this.checkLineStatus();
        }
        
        // Chưa có data, đợi thêm
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waitTime += checkInterval;
      }
      
      // Timeout - không nhận được data
      this.showMessage('Timeout waiting for SignalR data. Please try again.');
      return false;
      
    } catch (error) {
      this.handleError('Failed to connect to SignalR for status check', error);
      return false;
    }
  }
// ===========================================
// UTILITY METHODS FOR LINE STATUS
// ===========================================

/**
 * Lấy trạng thái hiện tại của line đã chọn
 */
getCurrentLineStatus(): string | null {
  if (!this.selectedLine || !this.receivedDataSensor) {
    return null;
  }

  const lineData = this.receivedDataSensor[this.selectedLine - 1];
  return lineData?.status || null;
}

/**
 * Kiểm tra xem có thể start order với line hiện tại không
 */
canStartOrderWithCurrentLine(): boolean {
  const status = this.getCurrentLineStatus();
  return status?.toLowerCase() === LineStatus.GOOD;
}

/**
 * Lấy text hiển thị cho line status
 */
getLineStatusText(status: string): string {
  switch (status?.toLowerCase()) {
    case LineStatus.GOOD:
      return 'Good';
    case LineStatus.BAD:
      return 'Bad';
    default:
      return 'Unknown';
  }
}

/**
 * Lấy CSS class cho line status
 */
  getLineStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case LineStatus.GOOD:
        return 'line-status-good';
      case LineStatus.BAD:
        return 'line-status-bad';
      default:
        return 'line-status-unknown';
    }
  }
  private startPeriodicWCFSettingsWriter(): void {
    // Nếu đã có interval đang chạy thì clear trước
    this.stopPeriodicWCFSettingsWriter();
    
    console.log('Starting periodic WCF settings writer...');
    
    // Gọi lần đầu ngay lập tức
    this.writeSettingsToWCF();
    
    // Sau đó gọi định kỳ mỗi 1 giây
    this.wcfSettingsInterval = setInterval(() => {
      if (this.isRunning && this.selectedLine && this.orderDetail) {
        this.writeSettingsToWCF();
      } else {
        this.stopPeriodicWCFSettingsWriter();
      }
    }, this.WCF_SETTINGS_INTERVAL_MS);
    this.wcfSettingsTimeout = setTimeout(() => {
      this.stopPeriodicWCFSettingsWriter();
      console.log('Stopped periodic WCF settings writer after 30 seconds.');
    }, this.WCF_SETTINGS_DURATION_MS);
  }
  private stopPeriodicWCFSettingsWriter(): void {
    if (this.wcfSettingsInterval) {
      console.log('Stopping periodic WCF settings writer...');
      clearInterval(this.wcfSettingsInterval);
      this.wcfSettingsInterval = null;
    }
    if (this.wcfSettingsTimeout) {
      clearTimeout(this.wcfSettingsTimeout);
      this.wcfSettingsTimeout = null;
    }
  }

  /**
   * Kiểm tra xem periodic writer có đang chạy không
   */
  private isPeriodicWCFWriterRunning(): boolean {
    return this.wcfSettingsInterval !== null;
  }
}