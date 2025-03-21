import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AreaDto } from 'src/app/_interface/area';

interface ProductDailyReport {
  date: string;
  lineName: string;
  productName: string;
  totalOrders: number;
  totalSensorWeight: number;
  totalSensorUnits: number;
}

interface VehicleReport {
  date: string;
  vehicleNumber: string;
  productName: string;
  totalOrders: number;
  totalSensorWeight: number;
  totalSensorUnits: number;
}

interface IncompleteOrderReport {
  date: string;
  licensePlate: string;
  productName: string;
  requestedUnits: number;
  requestedWeight: number;
  actualUnits: number;
  actualWeight: number;
  completionPercentage: number;
}

interface DistributorReport {
  distributorName: string;
  productName: string;
  exportPeriod: string;
  monthlyUnits: number;
  cumulativeUnits: number;
  monthlyWeight: number;
  cumulativeWeight: number;
}

interface AreaReport {
  areaName: string;
  productName: string;
  exportPeriod: string;
  totalUnits: number;
  totalWeight: number;
  cumulativeUnits: number;
  cumulativeWeight: number;
}

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  // Product Daily
  productDailyReport: ProductDailyReport[] = [];
  productDailyColumns: string[] = ['date', 'lineName', 'productName', 'totalOrders', 'totalSensorUnits', 'totalSensorWeight'];
  productDailyDataSource = new MatTableDataSource<ProductDailyReport>();

  // Vehicle
  vehicleReport: VehicleReport[] = [];
  vehicleColumns: string[] = ['date', 'vehicleNumber', 'productName', 'totalOrders', 'totalSensorUnits', 'totalSensorWeight'];
  vehicleDataSource = new MatTableDataSource<VehicleReport>();
  vehicleNumber = new FormControl('');

  // Common Filters
  startDate = new FormControl(new Date());
  endDate = new FormControl(new Date());
  selectedLine = new FormControl(0); // 0 = All
  selectedProduct = new FormControl(0); // 0 = All
  lines: { id: number; name: string }[] = [];
  products: { id: number; name: string }[] = [];

  // Incomplete Orders
  incompleteOrderReport: IncompleteOrderReport[] = [];
  incompleteOrderColumns: string[] = [
    'date', 'licensePlate', 'productName', 'requestedUnits', 'requestedWeight',
    'actualUnits', 'actualWeight', 'completionPercentage'
  ];
  incompleteOrderDataSource = new MatTableDataSource<IncompleteOrderReport>();

  // Distributor
  distributorReport: DistributorReport[] = [];
  distributorColumns: string[] = [
    'distributorName', 'productName', 'exportPeriod', 'monthlyUnits', 'cumulativeUnits', 'monthlyWeight', 'cumulativeWeight'
  ];
  distributorDataSource = new MatTableDataSource<DistributorReport>();
  fromYear = new FormControl<number | null>(new Date().getFullYear() - 1);
  toYear = new FormControl<number | null>(new Date().getFullYear());
  fromMonth = new FormControl<number | null>(null); // Mặc định để trống
  toMonth = new FormControl<number | null>(null);   // Mặc định để trống
  distributorId = new FormControl(0); // 0 = All
  productInformationId = new FormControl(0); // 0 = All
  distributorOptions: { id: number; name: string }[] = [];

  // Area
  areaReport: AreaReport[] = [];
  areaColumns: string[] = [
    'areaName', 'productName', 'exportPeriod', 'totalUnits', 'totalWeight', 'cumulativeUnits', 'cumulativeWeight'
  ];
  areaDataSource = new MatTableDataSource<AreaReport>();
  areaId = new FormControl(0); // 0 = All
  areaOptions: { id: number; name: string }[] = [];

  // Danh sách tháng
   months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' }, { value: 3, name: 'March' },
    { value: 4, name: 'April' }, { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' }, { value: 9, name: 'September' },
    { value: 10, name: 'October' }, { value: 11, name: 'November' }, { value: 12, name: 'December' }
];


  // Danh sách năm
  years: number[] = [];

  constructor(
    private repoService: RepositoryService,
    private dialogService: DialogService,
    private http: HttpClient
  ) {
    this.generateYears(); // Tạo danh sách năm
  }

  ngOnInit(): void {
    this.loadFilters();
    this.loadDistributors();
    this.loadAreas();
  }

  generateYears(): void {
    const currentYear = new Date().getFullYear();
    const startYear = 2000; // Năm bắt đầu
    const endYear = currentYear + 5; // Năm kết thúc (5 năm sau hiện tại)
    for (let year = startYear; year <= endYear; year++) {
      this.years.push(year);
    }
  }

  loadFilters(): void {
    this.repoService.getData<{ id: number; lineName: string }[]>('api/lines')
      .subscribe(
        (res) => {
          this.lines = res.map(l => ({ id: l.id, name: l.lineName }));
          this.lines.unshift({ id: 0, name: 'All' });
        },
        (err) => {
        }
      );

    this.repoService.getData<{ id: number; productName: string }[]>('api/product-informations')
      .subscribe(
        (res) => {
          this.products = res.map(p => ({ id: p.id, name: p.productName }));
          this.products.unshift({ id: 0, name: 'All' });
        },
        (err) => {
        }
      );
  }

  loadDistributors(): void {
    this.repoService.getData<{ id: number; distributorName: string }[]>('api/distributors')
      .subscribe(
        (res) => {
          this.distributorOptions = res.map(d => ({ id: d.id, name: d.distributorName }));
          this.distributorOptions.unshift({ id: 0, name: 'All' });
        },
        (err) => {
        }
      );
  }

  loadAreas(): void {
    this.repoService.getData<AreaDto[]>('api/areas').subscribe({
      next: (response) => {
        this.areaOptions = response.map(area => ({ id: area.id, name: area.areaName }));
        this.areaOptions.unshift({ id: 0, name: 'All' });
      },
      error: (error) => {
      }
    });
  }

  loadProductDailyReport(): void {
    const params = {
      startDate: this.startDate.value!.toISOString().split('T')[0],
      endDate: this.endDate.value!.toISOString().split('T')[0],
      lineId: this.selectedLine.value === 0 ? null : this.selectedLine.value,
      productInformationId: this.selectedProduct.value === 0 ? null : this.selectedProduct.value
    };

    this.repoService.getData<ProductDailyReport[]>('api/reports/product-daily', params)
      .subscribe(
        (res) => {
          this.productDailyReport = res;
          this.productDailyDataSource.data = this.productDailyReport;
        },
        (err) => {
        }
      );
  }

  loadVehicleReport(): void {
    const params = {
      startDate: this.startDate.value!.toISOString().split('T')[0],
      endDate: this.endDate.value!.toISOString().split('T')[0],
      vehicleNumber: this.vehicleNumber.value || null
    };

    this.repoService.getData<VehicleReport[]>('api/reports/vehicle-daily', params)
      .subscribe(
        (res) => {
          this.vehicleReport = res;
          this.vehicleDataSource.data = this.vehicleReport;
        },
        (err) => {
        }
      );
  }

  loadIncompleteOrderReport(): void {
    const params = {
      startDate: this.startDate.value!.toISOString().split('T')[0],
      endDate: this.endDate.value!.toISOString().split('T')[0]
    };

    this.repoService.getData<IncompleteOrderReport[]>('api/reports/incomplete-order-shipment', params)
      .subscribe(
        (res) => {
          this.incompleteOrderReport = res;
          this.incompleteOrderDataSource.data = this.incompleteOrderReport;
        },
        (err) => {
        }
      );
  }

  loadDistributorReport(): void {
    if (!this.fromYear.value || !this.toYear.value) {
      this.dialogService.openErrorDialog('Please select start year and end year.');
      return;
    }
    if (this.fromYear.value > this.toYear.value) {
      this.dialogService.openErrorDialog('Start year must be less than or equal to end year.');
      return;
    }

    const params = {
      fromYear: this.fromYear.value,
      toYear: this.toYear.value,
      fromMonth: this.fromMonth.value || null,
      toMonth: this.toMonth.value || null,
      distributorId: this.distributorId.value === 0 ? null : this.distributorId.value,
      productInformationId: this.productInformationId.value === 0 ? null : this.productInformationId.value
    };

    this.repoService.getData<DistributorReport[]>('api/reports/distributor-production', params)
      .subscribe(
        (res) => {
          this.distributorReport = res;
          this.distributorDataSource.data = this.distributorReport;
        },
        (err) => {
        }
      );
  }

  loadAreaReport(): void {
    if (!this.fromYear.value || !this.toYear.value) {
      this.dialogService.openErrorDialog('Please select start year and end year.');
      return;
    }
    if (this.fromYear.value > this.toYear.value) {
      this.dialogService.openErrorDialog('Start year must be less than or equal to end year.');
      return;
    }

    const params = {
      fromYear: this.fromYear.value,
      toYear: this.toYear.value,
      fromMonth: this.fromMonth.value || null,
      toMonth: this.toMonth.value || null,
      productInformationId: this.productInformationId.value === 0 ? null : this.productInformationId.value,
      areaId: this.areaId.value === 0 ? null : this.areaId.value
    };

    this.repoService.getData<AreaReport[]>('api/reports/region-production', params).subscribe(
      (res) => {
        this.areaReport = res;
        this.areaDataSource.data = this.areaReport;
      },
      (err) => {
      }
    );
  }

  exportReport(): void {
    const params = {
      startDate: this.startDate.value!.toISOString().split('T')[0],
      endDate: this.endDate.value!.toISOString().split('T')[0],
      lineId: this.selectedLine.value === 0 ? null : this.selectedLine.value,
      productInformationId: this.selectedProduct.value === 0 ? null : this.selectedProduct.value
    };

    this.repoService.exportReport('api/reports/product-daily/export', params)
      .subscribe(
        (response: Blob) => {
          this.downloadFile(response, `BaoCaoSanPham_${this.formatDate(this.startDate.value!)}_${this.formatDate(this.endDate.value!)}.xlsx`);
        },
        (err) => {
        }
      );
  }

  exportVehicleReport(): void {
    const params = {
      startDate: this.startDate.value!.toISOString().split('T')[0],
      endDate: this.endDate.value!.toISOString().split('T')[0],
      vehicleNumber: this.vehicleNumber.value || null
    };

    this.repoService.exportReport('api/reports/vehicle-daily/export', params)
      .subscribe(
        (response: Blob) => {
          this.downloadFile(response, `BaoCaoXe_${this.formatDate(this.startDate.value!)}_${this.formatDate(this.endDate.value!)}.xlsx`);
        },
        (err) => {
          this.dialogService.openErrorDialog('Error exporting report');
        }
      );
  }

  exportIncompleteOrderReport(): void {
    const params = {
      startDate: this.startDate.value!.toISOString().split('T')[0],
      endDate: this.endDate.value!.toISOString().split('T')[0]
    };

    this.repoService.exportReport('api/reports/incomplete-order-shipment/export', params)
      .subscribe(
        (response: Blob) => {
          this.downloadFile(response, `BaoCaoDonHangChuaHoanThanh_${this.formatDate(this.startDate.value!)}_${this.formatDate(this.endDate.value!)}.xlsx`);
        },
        (err) => {
          this.dialogService.openErrorDialog('Error exporting report');
        }
      );
  }

  exportDistributorReport(): void {
    if (!this.fromYear.value || !this.toYear.value) {
      this.dialogService.openErrorDialog('Please select start year and end year.');
      return;
    }
    if (this.fromYear.value > this.toYear.value) {
      this.dialogService.openErrorDialog('Start year must be less than or equal to end year.');
      return;
    }

    const params = {
      fromYear: this.fromYear.value,
      toYear: this.toYear.value,
      fromMonth: this.fromMonth.value || null,
      toMonth: this.toMonth.value || null,
      distributorId: this.distributorId.value === 0 ? null : this.distributorId.value,
      productInformationId: this.productInformationId.value === 0 ? null : this.productInformationId.value
    };

    this.repoService.exportReport('api/reports/distributor-production/export', params)
      .subscribe(
        (response: Blob) => {
          this.downloadFile(response, `BaoCaoNhaPhanPhoi_${this.fromYear.value}${this.fromMonth.value ? '-' + this.fromMonth.value : ''}_${this.toYear.value}${this.toMonth.value ? '-' + this.toMonth.value : ''}.xlsx`);
        },
        (err) => {
          this.dialogService.openErrorDialog('Error exporting report');
        }
      );
  }

  exportAreaReport(): void {
    if (!this.fromYear.value || !this.toYear.value) {
      this.dialogService.openErrorDialog('Please select start year and end year.');
      return;
    }
    if (this.fromYear.value > this.toYear.value) {
      this.dialogService.openErrorDialog('Start year must be less than or equal to end year.');
      return;
    }

    const params = {
      fromYear: this.fromYear.value,
      toYear: this.toYear.value,
      fromMonth: this.fromMonth.value || null,
      toMonth: this.toMonth.value || null,
      productInformationId: this.productInformationId.value === 0 ? null : this.productInformationId.value,
      areaId: this.areaId.value === 0 ? null : this.areaId.value
    };

    this.repoService.exportReport('api/reports/region-production/export', params)
      .subscribe(
        (response: Blob) => {
          this.downloadFile(response, `BaoCaoKhuVuc_${this.fromYear.value}${this.fromMonth.value ? '-' + this.fromMonth.value : ''}_${this.toYear.value}${this.toMonth.value ? '-' + this.toMonth.value : ''}.xlsx`);
        },
        (err) => {
          this.dialogService.openErrorDialog('Error exporting area report');
        }
      );
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB').split('/').join('');
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
}