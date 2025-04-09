import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { ProductDto } from 'src/app/_interface/product';
import { AddProductComponent } from './add-product/add-product.component';
import { UpdateProductComponent } from './update-product/update-product.component';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { ProductDetailComponent } from './product-detail/product-detail.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'] 
})
export class ProductsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['action', 'tagID', 'distributorId', 'productInformationId', 'shipmentDate', 'productDate', ];
  public dataSource = new MatTableDataSource<ProductDto>();

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
      this.getProducts();
    });
  }

  ngOnInit(): void {
    this.getProducts();
  }

  public getProducts() {
    this.repoService.getData('api/products')
      .subscribe(
        (res) => {
          this.dataSource.data = res as ProductDto[];
        },
        (err) => {
          console.log(err);
        }
      );
  }

  addProduct() {
    const popup = this.dialog.open(AddProductComponent, {
      width: '500px',
      height: '570px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
    });
  }

  updateProduct(id: number) {
    const popup = this.dialog.open(UpdateProductComponent, {
      width: '500px',
      height: '567px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { id }
    });
  }

  deleteProduct(id: number) {
    this.dialogServe.openConfirmDialog('Are you sure, you want to delete this product?')
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const deleteUri: string = `api/products/${id}`;
          this.repoService.delete(deleteUri).subscribe(
            (res) => {
              this.dialogServe.openSuccessDialog("The product has been deleted successfully.")
                .afterClosed()
                .subscribe(() => {
                  this.getProducts();
                });
            },
            (err) => {
              console.log(err);
            }
          );
        }
      });
  }
// Thêm phương thức để mở popup chi tiết
viewProductDetail(product: ProductDto) {
  const popup = this.dialog.open(ProductDetailComponent, {
    width: '500px',
    height: '600px',
    enterAnimationDuration: '100ms',
    exitAnimationDuration: '100ms',
    data: { product } // Truyền toàn bộ đối tượng product vào dialog
  });
}
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  }
}