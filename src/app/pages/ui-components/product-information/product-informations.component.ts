import { AfterViewInit, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { ProductInformationDto } from 'src/app/_interface/product-information';
import { AddProductInformationComponent } from './add-product-information/add-product-information.component';
import { UpdateProductInformationComponent } from './update-product-information/update-product-information.component';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { HttpClient } from '@angular/common/http'; // Thêm HttpClient

@Component({
  selector: 'app-product-informations',
  templateUrl: './product-informations.component.html',
  styleUrls: ['./product-informations.component.scss']
})
export class ProductInformationsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['action', 'productCode', 'productName', 'unit', 'weightPerUnit', 'isActive', 'createdAt', 'updatedAt'];
  public dataSource = new MatTableDataSource<ProductInformationDto>();
  
  // Thêm properties cho import result
  importResult: {
    successCount: number;
    skippedCount: number;
    skippedRows: string[];
    errors: string[];
  } | null = null;
  showImportResult = false; // Điều khiển hiển thị phần kết quả

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('fileInput') fileInput!: ElementRef;
  private refreshSubscription!: Subscription;

  constructor(
    private repoService: RepositoryService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private dataService: DataService,
    private http: HttpClient // Thêm HttpClient vào constructor
  ) {
    this.refreshSubscription = this.dataService.refreshTab1$.subscribe(() => {
      this.getProductInformations();
    });
  }

  ngOnInit(): void {
    this.getProductInformations();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.refreshSubscription.unsubscribe();
  }

  public getProductInformations() {
    this.repoService.getData('api/product-informations')
      .subscribe(
        (res) => {
          this.dataSource.data = res as ProductInformationDto[];
        },
        (err) => {
          console.log(err);
        }
      );
  }

  addProductInformation() {
    this.dialog.open(AddProductInformationComponent, {
      width: '500px',
      height: '550px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
    });
  }

  updateProductInformation(id: number) {
    this.dialog.open(UpdateProductInformationComponent, {
      width: '500px',
      height: '550px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { id }
    });
  }

  deleteProductInformation(id: number) {
    this.dialogService.openConfirmDialog('Are you sure you want to delete this product information?')
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const deleteUri: string = `api/product-informations/${id}`;
          this.repoService.delete(deleteUri).subscribe(
            () => {
              this.dialogService.openSuccessDialog("The product information has been deleted successfully.")
                .afterClosed()
                .subscribe(() => {
                  this.getProductInformations();
                });
            },
            (err) => {
              console.log(err);
            }
          );
        }
      });
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  }

  // Kích hoạt input file khi người dùng nhấp vào nút Import
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  // Xử lý khi người dùng chọn file Excel và gửi file lên API - CẬP NHẬT
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra loại file
    const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) {
      this.dialogService.openErrorDialog('Please select a valid Excel file (.xlsx or .xls).');
      return;
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    this.repoService.upload('api/product-informations/import', formData).subscribe(
      (res) => {
        // Lưu kết quả import
        this.importResult = res as {
          successCount: number;
          skippedCount: number;
          skippedRows: string[];
          errors: string[];
        };
        this.showImportResult = true;
        this.dialogService.openSuccessDialog('Product informations imported successfully.')
          .afterClosed()
          .subscribe(() => {
            this.getProductInformations();
          });
      },
      (error) => {
        // Xử lý lỗi khi import
        this.dialogService.openErrorDialog(`Error importing product informations`);
      }
    );

    event.target.value = ''; // Reset input file sau khi chọn
  }

  downloadTemplate() {
    this.repoService.download('api/product-informations/template').subscribe(
      (response: Blob) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ProductInformationTemplate.xlsx';
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

  // THÊM MỚI: Function export ProductInformations
  exportProductInformations() {
    this.repoService.download('api/product-informations/export').subscribe(
      (response: Blob) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        
        // Tạo tên file với timestamp
        const now = new Date();
        const timestamp = now.getFullYear().toString() + 
                         (now.getMonth() + 1).toString().padStart(2, '0') + 
                         now.getDate().toString().padStart(2, '0') + '_' +
                         now.getHours().toString().padStart(2, '0') + 
                         now.getMinutes().toString().padStart(2, '0') + 
                         now.getSeconds().toString().padStart(2, '0');
        
        a.download = `ProductInformations_Export_${timestamp}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        this.dialogService.openErrorDialog('Error exporting product informations: ' + error.message);
      }
    );
  }

  // THÊM MỚI: Hàm để reset kết quả import nếu cần
  resetImportResult(): void {
    this.importResult = null;
    this.showImportResult = false;
  }
}