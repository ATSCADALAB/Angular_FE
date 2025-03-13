import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { ImportResponse, OrderDto } from 'src/app/_interface/order';
import { AddOrderComponent } from './add-order/add-order.component';
import { UpdateOrderComponent } from './update-order/update-order.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'action',
    'status',
    'code',
    'exportDate',
    'quantityVehicle',
    'vehicleNumber',
    'driverName',
    'driverPhoneNumber',
    'weightOrder',
    'unitOrder',
    'manufactureDate',
    'productName',
    'distributorName',
    'area'
  ];
  public dataSource = new MatTableDataSource<OrderDto>();

  @ViewChild('fileInput') fileInput: any; // Tham chiếu đến input file
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private refreshSubscription!: Subscription;
  importReport: ImportResponse | null = null; // Lưu báo cáo import
  statusFilter: number | string = ''; // Giá trị status được chọn
  searchText: string = ''; // Lưu giá trị search text
  constructor(
    private repoService: RepositoryService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private dataService: DataService
  ) {
    this.refreshSubscription = this.dataService.refreshTab1$.subscribe(() => {
      this.getOrders();
    });
  }

  ngOnInit(): void {
    this.getOrders();
  }

  public getOrders() {
    this.repoService.getData('api/orders').subscribe(
      (res) => {
        this.dataSource.data = res as OrderDto[];
      },
      (err) => {
        console.log(err);
      }
    );
  }

  addOrder() {
    const popup = this.dialog.open(AddOrderComponent, {
      width: '600px',
      height: '700px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms'
    });
  }

  updateOrder(id: string) {
    const popup = this.dialog.open(UpdateOrderComponent, {
      width: '600px',
      height: '700px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { id }
    });
  }

  deleteOrder(id: string) {
    this.dialogService
      .openConfirmDialog('Are you sure you want to delete this order?')
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const deleteUri: string = `api/orders/${id}`;
          this.repoService.delete(deleteUri).subscribe(
            () => {
              this.dialogService
                .openSuccessDialog('The order has been deleted successfully.')
                .afterClosed()
                .subscribe(() => {
                  this.getOrders();
                });
            },
            (err) => {
              console.log(err);
            }
          );
        }
      });
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!validTypes.includes(file.type)) {
      this.dialogService.openErrorDialog('Please select a valid Excel file (.xlsx or .xls).');
      return;
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    this.repoService.upload('api/orders/import', formData).subscribe(
      (res: ImportResponse) => {
        this.importReport = res;
        this.dialogService
          .openSuccessDialog('Orders imported successfully.')
          .afterClosed()
          .subscribe(() => {
            this.getOrders();
          });
      },
      (error) => {
        this.dialogService.openErrorDialog(`Error importing orders: ${error.message}`);
      }
    );

    event.target.value = ''; // Reset input file
  }

  downloadTemplate() {
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

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
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

  // Hàm trả về class CSS dựa trên trạng thái
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
}