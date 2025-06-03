import { AfterViewInit, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { DistributorDto } from 'src/app/_interface/distributor';
import { ProductInformationDto } from 'src/app/_interface/product-information';

export interface ProductExportDto {
  tagID: string;
  distributorName: string;
  productName: string;
  productCode: string;
  shipmentDate: string;
  groupedPeriod?: string;
}

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['action', 'tagID', 'distributorName', 'productName', 'productCode', 'shipmentDate', 'groupedPeriod'];
  public dataSource = new MatTableDataSource<ProductExportDto>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Filters
  startDate: Date = new Date(); // Mặc định là hôm nay
  endDate: Date = new Date(); // Mặc định là hôm nay
  selectedDistributorId: number | null = null; // Mặc định All
  selectedProductInformationId: number | null = null; // Mặc định All
  selectedGroupBy: string = 'day'; // Mặc định group by day
  distributorKeyword: string = '';
  productKeyword: string = '';
  filteredDistributors: DistributorDto[] = [];
  filteredProducts: ProductInformationDto[] = [];
  distributors: DistributorDto[] = [];
  productInformations: ProductInformationDto[] = [];

  private refreshSubscription!: Subscription;
  private subscriptions = new Subscription();

  constructor(
    private repoService: RepositoryService,
    private dialog: MatDialog,
    private dialogServe: DialogService,
    private dataService: DataService
  ) {
    this.refreshSubscription = this.dataService.refreshTab1$.subscribe(() => {
      this.applyFilter();
    });
  }

  ngOnInit(): void {
    this.getDistributors();
    this.getProductInformations();
    this.applyFilter(); // Gọi API ngay khi load trang
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.refreshSubscription.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  // Fetch data methods
  private getDistributors(): void {
    this.repoService.getData('api/distributors').subscribe({
      next: (res) => {
        this.distributors = res as DistributorDto[];
        this.filteredDistributors = [...this.distributors];
      },
      error: (err) => this.handleError('distributors', err)
    });
  }

  private getProductInformations(): void {
    this.repoService.getData('api/product-informations').subscribe({
      next: (res) => {
        this.productInformations = res as ProductInformationDto[];
        this.filteredProducts = [...this.productInformations];
      },
      error: (err) => this.handleError('products', err)
    });
  }

  // Filter methods
  filterDistributors(): void {
    this.filteredDistributors = this.filterOptions(this.distributors, this.distributorKeyword, 'distributorName');
  }

  filterProducts(): void {
    this.filteredProducts = this.filterOptions(this.productInformations, this.productKeyword, 'productName');
  }

  private filterOptions<T extends { distributorName?: string; productName?: string }>(
    sourceList: T[],
    keyword: string,
    key: keyof T
  ): T[] {
    if (!keyword) {
      return [...sourceList];
    }
    const lowerKeyword = keyword.toLowerCase();
    return sourceList.filter(item =>
      (item[key] as string)?.toLowerCase().includes(lowerKeyword)
    );
  }

  displayDistributorName(distributor: DistributorDto): string {
    return distributor ? distributor.distributorName : '';
  }

  displayProductName(product: ProductInformationDto): string {
    return product?.productName || '';
  }

  onDistributorSelected(event: any): void {
    const selectedDistributor = event.option.value as DistributorDto;
    this.selectedDistributorId = selectedDistributor?.id || null;
  }

  onProductInformationSelected(event: any): void {
    const selectedProductInfo = event.option.value as ProductInformationDto;
    this.selectedProductInformationId = selectedProductInfo?.id || null;
  }

  applyFilter(): void {
    if (!this.startDate || !this.endDate) {
      this.dialogServe.openErrorDialog('Start date and end date are required.');
      return;
    }
    if (this.startDate > this.endDate) {
      this.dialogServe.openErrorDialog('Start date must be less than or equal to end date.');
      return;
    }

    const adjustedStartDate = new Date(this.startDate);
    adjustedStartDate.setHours(0, 0, 0, 0);
    const adjustedEndDate = new Date(this.endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    const filter = {
      fromDate: adjustedStartDate.toISOString(),
      toDate: adjustedEndDate.toISOString(),
      distributorId: this.selectedDistributorId ?? null,
      productInformationId: this.selectedProductInformationId ?? null,
      groupBy: this.selectedGroupBy
    };

    this.repoService.postData('api/products/report', filter).subscribe({
      next: (res) => {
        const products = res as ProductExportDto[];
        this.dataSource.data = products;
        if (products.length === 0) {
          
        }
      },
      error: (err) => {
        this.handleError('Report', err);
      }
    });
  }

  exportToExcel(): void {
    if (!this.startDate || !this.endDate) {
      this.dialogServe.openErrorDialog('Start date and end date are required.');
      return;
    }
    if (this.startDate > this.endDate) {
      this.dialogServe.openErrorDialog('Start date must be less than or equal to end date.');
      return;
    }
    const adjustedStartDate = new Date(this.startDate);
    adjustedStartDate.setHours(0, 0, 0, 0);
    const adjustedEndDate = new Date(this.endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);
    const filter = {
      fromDate: adjustedStartDate.toISOString(),
      toDate: adjustedEndDate.toISOString(),
      distributorId: this.selectedDistributorId ?? null,
      productInformationId: this.selectedProductInformationId ?? null,
      groupBy: this.selectedGroupBy
    };

    this.repoService.postExportReport('api/products/export', filter).subscribe({
      next: (response: Blob) => {
        if (response && response.size > 0) {
          this.downloadFile(response, `BaoCaoXuatSanPham_${this.formatDate(adjustedStartDate)}_${this.formatDate(adjustedEndDate)}.xlsx`);
        } else {
          this.dialogServe.openErrorDialog('No Tag.');
        }
      },
      error: (err) => {
        if (err.status === 204) {
          this.dialogServe.openErrorDialog('No Tag.');
        } else if (err.status === 400) {
          this.dialogServe.openErrorDialog('Filter Error.');
        } else {
          const errorMessage = err.error?.detail || 'Error Report.';
          this.dialogServe.openErrorDialog(errorMessage);
        }
      }
    });
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}${month}${year}`;
  }

  private downloadFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  resetFilters(): void {
    this.startDate = new Date();
    this.endDate = new Date();
    this.distributorKeyword = '';
    this.productKeyword = '';
    this.selectedDistributorId = null;
    this.selectedProductInformationId = null;
    this.selectedGroupBy = 'none'; // Mặc định khi reset là none theo API
    this.filteredDistributors = [...this.distributors];
    this.filteredProducts = [...this.productInformations];
    this.dataSource.data = [];
    this.applyFilter(); // Gọi lại API với giá trị mặc định
  }

  private handleError(type: string, err: any): void {
    console.error(`Error fetching ${type}:`, err);
    this.dialogServe.openErrorDialog(`Error ${type}: ${err.message}`);
  }

  public doFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  viewProductDetail(product: ProductExportDto): void {
    const popup = this.dialog.open(ProductDetailComponent, {
      width: '500px',
      height: '600px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { product }
    });
  }
}