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

@Component({
  selector: 'app-product-informations',
  templateUrl: './product-informations.component.html',
  styleUrls: ['./product-informations.component.scss']
})
export class ProductInformationsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['action', 'productCode', 'productName', 'unit', 'weightPerUnit', 'isActive', 'createdAt', 'updatedAt'];
  public dataSource = new MatTableDataSource<ProductInformationDto>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('fileInput') fileInput!: ElementRef;
  private refreshSubscription!: Subscription;

  constructor(
    private repoService: RepositoryService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private dataService: DataService
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

  // Xử lý khi người dùng chọn file Excel và gửi file lên API
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
        this.dialogService.openSuccessDialog('Product informations imported successfully.')
          .afterClosed()
          .subscribe(() => {
            this.getProductInformations();
          });
      },
      (error) => {
        this.dialogService.openErrorDialog(`Error importing product informations: ${error.message}`);
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
}