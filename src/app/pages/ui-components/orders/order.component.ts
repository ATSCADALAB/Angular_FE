import { AfterViewInit, Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
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
  public dataSource = new MatTableDataSource<OrderWithDetails>();
  importReport: { successfulImports: number; duplicateRows: number } | null = null;

  // Bộ lọc (mặc định "All" cho các trường ngoài ngày)
  startDate: Date = new Date(new Date().setMonth(new Date().getMonth() - 1)); // Mặc định 1 tháng trước
  endDate: Date = new Date(); // Mặc định hôm nay
  selectedDistributorId: number | null = null; // Mặc định "All"
  selectedAreaId: number | null = null; // Mặc định "All"
  selectedProductInformationId: number | null = null; // Mặc định "All"
  selectedStatus: number | null = null; // Mặc định "All"

  // Danh sách cho dropdown
  distributors: DistributorDto[] = [];
  areas: AreaDto[] = [];
  productInformations: ProductInformationDto[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('fileInput') fileInput!: ElementRef;
  private refreshSubscription!: Subscription;

  constructor(
    private repoService: RepositoryService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private dataService: DataService,
    private router: Router
  ) {
    this.refreshSubscription = this.dataService.refreshTab1$.subscribe(() => {
      this.applyFilter();
    });
  }

  ngOnInit(): void {
    this.getDistributors();
    this.getAreas();
    this.getProductInformations();
    this.applyFilter(); // Thêm lại nếu muốn dữ liệu mặc định
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.refreshSubscription.unsubscribe();
  }

  // Lấy dữ liệu Orders theo bộ lọc khi nhấn nút Search
  applyFilter(): void {
    if (!this.startDate || !this.endDate) {
      this.dialogService.openErrorDialog('Start date and end date are required.');
      return;
    }

    if (this.startDate > this.endDate) {
      this.dialogService.openErrorDialog('Start date must be less than or equal to end date.');
      return;
    }

    const params = {
      startDate: this.startDate.toISOString().split('T')[0],
      endDate: this.endDate.toISOString().split('T')[0],
      distributorId: this.selectedDistributorId || null,
      areaId: this.selectedAreaId || null,
      productInformationId: this.selectedProductInformationId || null,
      status: this.selectedStatus || null
    };

    this.repoService.getData('api/orders/by-filter', params)
      .subscribe(
        (res) => {
          this.dataSource.data = res as OrderWithDetails[];
        },
        (err) => {
          console.error('Error fetching orders:', err);
          this.dialogService.openErrorDialog('Error fetching orders: ' + err.message);
        }
      );
  }

  // Lấy danh sách Distributors
  getDistributors(): void {
    this.repoService.getData('api/distributors')
      .subscribe(
        (res) => {
          this.distributors = res as DistributorDto[];
        },
        (err) => {
          console.error('Error fetching distributors:', err);
          this.dialogService.openErrorDialog('Error fetching distributors: ' + err.message);
        }
      );
  }

  // Lấy danh sách Areas
  getAreas(): void {
    this.repoService.getData('api/areas')
      .subscribe(
        (res) => {
          this.areas = res as AreaDto[];
        },
        (err) => {
          console.error('Error fetching areas:', err);
          this.dialogService.openErrorDialog('Error fetching areas: ' + err.message);
        }
      );
  }

  // Lấy danh sách ProductInformations
  getProductInformations(): void {
    this.repoService.getData('api/product-informations')
      .subscribe(
        (res) => {
          this.productInformations = res as ProductInformationDto[];
        },
        (err) => {
          console.error('Error fetching products:', err);
          this.dialogService.openErrorDialog('Error fetching products: ' + err.message);
        }
      );
  }

  getStatusText(status: number): string {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Processing';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'status-pending';
      case 1: return 'status-processing';
      case 2: return 'status-completed';
      case 3: return 'status-cancelled';
      default: return '';
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) {
      this.dialogService.openErrorDialog('Please select a valid Excel file (.xlsx or .xls).');
      return;
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    this.repoService.upload('api/orders/import', formData).subscribe(
      (res: any) => {
        this.importReport = {
          successfulImports: res.successCount,
          duplicateRows: res.skippedCount
        };
        this.dialogService.openSuccessDialog('Orders imported successfully.')
          .afterClosed()
          .subscribe(() => {
            this.applyFilter();
          });
      },
      (error) => {
        this.dialogService.openErrorDialog(`Error importing orders: ${error.message}`);
      }
    );

    event.target.value = '';
  }

  downloadTemplate(): void {
    this.repoService.download('api/orders/template').subscribe(
      (response: Blob) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'OrderTemplate.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        this.dialogService.openErrorDialog('Error downloading template: ' + error.message);
      }
    );
  }

  updateOrder(id: string): void {
    console.log('Update order:', id);
    // Có thể thêm logic mở dialog hoặc điều hướng
    // this.router.navigate(['/ui-components/update-order', id]);
  }

  deleteOrder(id: string): void {
    this.dialogService.openConfirmDialog('Are you sure you want to delete this order?')
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.repoService.delete(`api/orders/${id}`).subscribe(
            () => {
              this.dialogService.openSuccessDialog('Order deleted successfully.')
                .afterClosed()
                .subscribe(() => this.applyFilter());
            },
            (error) => {
              this.dialogService.openErrorDialog('Error deleting order: ' + error.message);
            }
          );
        }
      });
  }

  public doFilter(value: string): void {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  }

  // Phương thức đặt lại bộ lọc về mặc định (tùy chọn, nếu cần)
  resetFilters(): void {
    this.startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
    this.endDate = new Date();
    this.selectedDistributorId = null;
    this.selectedAreaId = null;
    this.selectedProductInformationId = null;
    this.selectedStatus = null;
    this.dataSource.data = []; // Xóa dữ liệu bảng khi reset
  }
}