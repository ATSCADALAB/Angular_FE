import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { ProductInformationDto } from 'src/app/_interface/product-information';
import { AddProductInformationComponent } from './add-product-information/add-product-information.component';
import { UpdateProductInformationComponent } from './update-product-information/update-product-information.component';

@Component({
  selector: 'app-product-informations',
  templateUrl: './product-informations.component.html'
})
export class ProductInformationsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['action', 'productCode', 'productName', 'unit', 'weight'];
  public dataSource = new MatTableDataSource<ProductInformationDto>();
  @ViewChild('fileInput') fileInput: any; // Tham chiếu đến input file
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  private refreshSubscription!: Subscription;

  constructor(
    private repoService: RepositoryService,
    private dialog: MatDialog,
    private dialogServe: DialogService,
    private dataService: DataService
  ) {
    this.refreshSubscription = this.dataService.refreshTab1$.subscribe(() => {
      this.getProductInformations();
    });
  }

  ngOnInit(): void {
    this.getProductInformations();
  }

  public getProductInformations() {
    this.repoService.getData('api/productInformations')
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
    const popup = this.dialog.open(AddProductInformationComponent, {
      width: '500px',
      height: '450px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
    });
  }

  updateProductInformation(id: number) {
    const popup = this.dialog.open(UpdateProductInformationComponent, {
      width: '500px',
      height: '450px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { id }
    });
  }

  deleteProductInformation(id: number) {
    this.dialogServe.openConfirmDialog('Are you sure, you want to delete this product information?')
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const deleteUri: string = `api/productInformations/${id}`;
          this.repoService.delete(deleteUri).subscribe(
            (res) => {
              this.dialogServe.openSuccessDialog("The product information has been deleted successfully.")
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
    this.dialogServe.openErrorDialog('Please select a valid Excel file (.xlsx or .xls).');
    return;
  }

  const formData = new FormData();
  formData.append('file', file, file.name);

  this.repoService.upload('api/productInformations/import', formData).subscribe(
    (res) => {
      this.dialogServe.openSuccessDialog('Product informations imported successfully.')
        .afterClosed()
        .subscribe(() => {
          this.getProductInformations();
        });
    },
    (error) => {
      this.dialogServe.openErrorDialog(`Error importing product informations: ${error.message}`);
    }
  );

  event.target.value = '';
  }
  downloadTemplate() {
    this.repoService.download('api/productInformations/template').subscribe(
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
        this.dialogServe.openErrorDialog('Error downloading template: ' + error.message);
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
}