import { AfterViewInit, Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormControl } from '@angular/forms';
import { ReplaySubject, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { Router } from '@angular/router';
import { OrderWithDetails } from 'src/app/_interface/order';
import { DistributorDto } from 'src/app/_interface/distributor';
import { AreaDto } from 'src/app/_interface/area';
import { ProductInformationDto } from 'src/app/_interface/product-information';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = [
    'action', 'status', 'code', 'exportDate', 'quantityVehicle', 'vehicleNumber',
    'driverName', 'driverPhoneNumber', 'weightOrder', 'unitOrder', 'manufactureDate',
    'productName', 'distributorName', 'area'
  ];
  dataSource = new MatTableDataSource<OrderWithDetails>();
  importResult: {
    successCount: number;
    skippedCount: number;
    skippedRows: string[];
    errors: string[];
  } | null = null;
  showImportResult = false; // Điều khiển hiển thị phần kết quả
  // Filters
  startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
  endDate = new Date();
  selectedDistributorId: number | null = null;
  selectedAreaId: number | null = null;
  selectedProductInformationId: number | null = null;
  selectedStatus: number | null = null;

  // Data lists
  distributors: DistributorDto[] = [];
  areas: AreaDto[] = [];
  productInformations: ProductInformationDto[] = [];

  // Form Controls
  distributorControl = new FormControl(null);
  productControl = new FormControl(null);

  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('fileInput') fileInput!: ElementRef;

  private _onDestroy = new Subject<void>();
  private subscriptions = new Subscription();

  constructor(
    private repoService: RepositoryService,
    private dialogService: DialogService,
    private dataService: DataService,
    private router: Router
  ) {
    this.subscriptions.add(
      this.dataService.refreshTab1$.subscribe(() => this.applyFilter())
    );

    // Subscribe to form control changes
    this.subscriptions.add(
      this.distributorControl.valueChanges.subscribe(value => {
        this.selectedDistributorId = value;
      })
    );

    this.subscriptions.add(
      this.productControl.valueChanges.subscribe(value => {
        this.selectedProductInformationId = value;
      })
    );
  }

  ngOnInit(): void {
    this.getDistributors();
    this.getAreas();
    this.getProductInformations();
    this.applyFilter();
  }
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
    this.subscriptions.unsubscribe();
  }

  // Fetch data methods
  private getDistributors(): void {
    this.repoService.getData('api/distributors').subscribe({
      next: (res) => {
        this.distributors = res as DistributorDto[];
      },
      error: (err) => this.handleError('distributors', err)
    });
  }

  private getAreas(): void {
    this.repoService.getData('api/areas').subscribe({
      next: (res) => this.areas = res as AreaDto[],
      error: (err) => this.handleError('areas', err)
    });
  }

  private getProductInformations(): void {
    this.repoService.getData('api/product-informations').subscribe({
      next: (res) => {
        this.productInformations = res as ProductInformationDto[];
      },
      error: (err) => this.handleError('products', err)
    });
  }
  // Handle selection changes
  onDistributorChange(value: number | null): void {
    this.selectedDistributorId = value;
  }

  onAreaChange(value: number | null): void {
    this.selectedAreaId = value;
  }

  onProductChange(value: number | null): void {
    this.selectedProductInformationId = value;
  }

  onStatusChange(value: number | null): void {
    this.selectedStatus = value;
  }

  // Filter method
  applyFilter(): void {
    if (!this.startDate || !this.endDate) {
      this.dialogService.openErrorDialog('Start date and end date are required.');
      return;
    }
    if (this.startDate > this.endDate) {
      this.dialogService.openErrorDialog('Start date must be less than or equal to end date.');
      return;
    }
    const adjustedStartDate = new Date(this.startDate);
    adjustedStartDate.setHours(0, 0, 0, 0);
    const adjustedEndDate = new Date(this.endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
    adjustedEndDate.setHours(0, 0, 0, 0);

    const params = {
      startDate: adjustedStartDate.toISOString(),
      endDate: adjustedEndDate.toISOString(),
      distributorId: this.selectedDistributorId ?? null,
      areaId: this.selectedAreaId ?? null,
      productInformationId: this.selectedProductInformationId ?? null,
      status: this.selectedStatus ?? null
    };
    this.repoService.getData('api/orders/by-filter', params).subscribe({
      next: (res) => this.dataSource.data = res as OrderWithDetails[],
      error: (err) => this.handleError('orders', err)
    });
  }

  // Utility methods
  private handleError(type: string, err: any): void {
    console.error(`Error fetching ${type}:`, err);
  }

  resetFilters(): void {
    this.startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
    this.endDate = new Date();
    this.distributorControl.reset(null);
    this.productControl.reset(null);
    this.selectedAreaId = null;
    this.selectedStatus = null;
    this.dataSource.data = [];
  }

  doFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Pending',
      1: 'Processing',
      2: 'Completed',
      3: 'Cancelled'
    };
    return statusMap[status] ?? 'Unknown';
  }

  getStatusClass(status: number): string {
    const classMap: { [key: number]: string } = {
      0: 'status-pending',
      1: 'status-processing',
      2: 'status-completed',
      3: 'status-cancelled'
    };
    return classMap[status] ?? '';
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
// Hàm để reset kết quả import nếu cần
resetImportResult(): void {
  this.importResult = null;
  this.showImportResult = false;
}
  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    this.repoService.upload('api/orders/import', formData).subscribe({
      next: (res: any) => {
        // Lưu kết quả import
        this.importResult = res as {
          successCount: number;
          skippedCount: number;
          skippedRows: string[];
          errors: string[];
        };
        this.showImportResult = true; // Hiển thị phần kết quả
        this.applyFilter(); // Làm mới danh sách đơn hàng
      },
      error: (err) => this.dialogService.openErrorDialog(`Error importing orders: ${err.message}`)
    });
    (event.target as HTMLInputElement).value = '';
  }

  downloadTemplate(): void {
    this.repoService.download('api/orders/template').subscribe({
      next: (response) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'OrderTemplate.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => this.dialogService.openErrorDialog(`Error downloading template: ${err.message}`)
    });
  }

  updateOrder(id: string): void {
    this.router.navigate(['/ui-components/update-order', id]);
  }

  deleteOrder(id: string): void {
    this.dialogService.openConfirmDialog('Are you sure you want to delete this order?')
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.repoService.delete(`api/orders/${id}`).subscribe({
            next: () => {
              this.dialogService.openSuccessDialog('Order deleted successfully.')
                .afterClosed()
                .subscribe(() => this.applyFilter());
            },
            error: (err) => this.dialogService.openErrorDialog(`Error deleting order: ${err.message}`)
          });
        }
      });
  }
}