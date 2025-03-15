import { AfterViewInit, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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


@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, AfterViewInit {
  
  displayedColumns: string[] = [
    'action', 'status', 'code', 'exportDate', 'quantityVehicle', 'vehicleNumber',
    'driverName', 'driverPhoneNumber', 'weightOrder', 'unitOrder', 'manufactureDate',
    'productName', 'distributorName', 'area'
  ];
  public dataSource = new MatTableDataSource<OrderWithDetails>();
  importReport: { successfulImports: number; duplicateRows: number } | null = null;

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
      this.getOrdersWithDetails();
    });
  }

  ngOnInit(): void {

    this.getOrdersWithDetails();

  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.refreshSubscription.unsubscribe();
  }

  public getOrdersWithDetails(): void {
    this.repoService.getData('api/orders/with-details')
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

  getStatusText(status: number): string {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Completed';
      case 2: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'status-pending';
      case 1: return 'status-completed';
      case 2: return 'status-cancelled';
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
            this.getOrdersWithDetails();
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
                .subscribe(() => this.getOrdersWithDetails());
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
}