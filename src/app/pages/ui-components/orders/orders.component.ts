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
import { ImportResult } from 'src/app/_interface/import-result';

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
  importReport: ImportResult | null = null;

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
    this.getOrders();
    this.getDistributors();
    this.getAreas();
    this.getProductInformations();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  // Lấy danh sách Orders
  getOrders(): void {
    const params = {
      startDate: this.startDate.toISOString().split('T')[0],
      endDate: this.endDate.toISOString().split('T')[0],
      distributorId: this.selectedDistributorId,
      areaId: this.selectedAreaId,
      productInformationId: this.selectedProductInformationId,
      status: this.selectedStatus
    };

    this.repoService.getData('api/orders', params)
      .subscribe(
        (res) => {
          this.dataSource.data = res as OrderWithDetails[];
        },
        (err) => {
          console.error('Error fetching orders:', err);
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
        }
      );
  }

  // Áp dụng bộ lọc
  applyFilter(): void {
    this.getOrders();
  }

  // Reset bộ lọc
  resetFilters(): void {
    this.startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
    this.endDate = new Date();
    this.selectedDistributorId = null;
    this.selectedAreaId = null;
    this.selectedProductInformationId = null;
    this.selectedStatus = null;
    this.applyFilter();
  }

  // Lọc theo text
  doFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  // Trigger input file
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  // Xử lý khi file thay đổi
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
      (res) => {
        this.importReport = res as ImportResult;
        console.log(this.importReport);
      },
      (error: Error) => {
        this.dialogService.openErrorDialog(`Error importing orders: ${error.message}`);
      }
    );

    event.target.value = '';
  }

  // Download template
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

  // Cập nhật Order
  updateOrder(id: string): void {
    this.router.navigate(['/ui-components/order-details', id]);
  }

  // Xóa Order
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

  // Lấy class cho trạng thái
  getStatusClass(status: number): string {
    switch (status) {
      case 0:
        return 'status-pending';
      case 1:
        return 'status-processing';
      case 2:
        return 'status-completed';
      case 3:
        return 'status-incomplete';
      default:
        return '';
    }
  }

  // Lấy text cho trạng thái
  getStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Processing';
      case 2:
        return 'Completed';
      case 3:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }
} 