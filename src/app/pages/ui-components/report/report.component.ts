import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { FormControl } from '@angular/forms';

interface ReportSummary {
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
  reportPeriod: string;
  cumulativeUnits: number;
  cumulativeWeight: number;
}

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  productDailyReport: ReportSummary[] = [];
  productDailyColumns: string[] = ['date', 'lineName', 'productName', 'totalOrders',  'totalSensorUnits','totalSensorWeight'];
  productDailyDataSource = new MatTableDataSource<ReportSummary>();

  vehicleReport: VehicleReport[] = [];
  vehicleColumns: string[] = ['date', 'vehicleNumber', 'productName', 'totalOrders', 'totalSensorUnits', 'totalSensorWeight'];
  vehicleDataSource = new MatTableDataSource<VehicleReport>();
  vehicleNumber = new FormControl('');

  startDate = new FormControl(new Date());
  endDate = new FormControl(new Date());
  selectedLine = new FormControl(0); // Set mặc định là 0 (All)
  selectedProduct = new FormControl(0); // Set mặc định là 0 (All)
  lines: { id: number; name: string }[] = [];
  products: { id: number; name: string }[] = [];

  // Incomplete Orders Report properties
  incompleteOrderReport: IncompleteOrderReport[] = [];
  incompleteOrderColumns: string[] = [
    'date', 'licensePlate', 'productName', 
    'requestedUnits', 'requestedWeight', 
    'actualUnits', 'actualWeight', 'completionPercentage'
  ];
  incompleteOrderDataSource = new MatTableDataSource<IncompleteOrderReport>();

  // Distributor Report properties
  distributorReport: DistributorReport[] = [];
  distributorColumns: string[] = [
    'distributorName', 'productName', 'reportPeriod', 
    'cumulativeUnits', 'cumulativeWeight'
  ];
  distributorDataSource = new MatTableDataSource<DistributorReport>();
  
  // Form controls for distributor report
  fromYear = new FormControl(new Date().getFullYear());
  toYear = new FormControl(new Date().getFullYear());
  fromMonth = new FormControl(1);
  toMonth = new FormControl(12);
  distributorId = new FormControl('');
  productInformationId = new FormControl('');

  distributorOptions: { id: number; name: string }[] = [];

  constructor(
    private repoService: RepositoryService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadFilters();
    this.loadDistributors();
  }

  loadFilters(): void {
    this.repoService.getData<{ id: number; lineName: string }[]>('api/lines')
      .subscribe(
        (res) => {
          this.lines = res.map(l => ({ id: l.id, name: l.lineName }));
          this.lines.unshift({ id: 0, name: 'All' });
        },
        (err) => {
          this.dialogService.openErrorDialog('Error fetching lines: ' + err.message);
        }
      );

    this.repoService.getData<{ id: number; productName: string }[]>('api/product-informations')
      .subscribe(
        (res) => {
          this.products = res.map(p => ({ id: p.id, name: p.productName }));
          this.products.unshift({ id: 0, name: 'All' });
        },
        (err) => {
          this.dialogService.openErrorDialog('Error fetching products: ' + err.message);
        }
      );
  }

  loadDistributors(): void {
    this.repoService.getData<{ id: number; distributorName: string }[]>('api/distributors')
      .subscribe(
        (res) => {
          const distributors = res.map(d => ({ id: d.id, name: d.distributorName }));
          distributors.unshift({ id: 0, name: 'All' });
          // Cập nhật dropdown cho distributor
          this.distributorOptions = distributors;
        },
        (err) => {
          this.dialogService.openErrorDialog('Error fetching distributors: ' + err.message);
        }
      );
  }

  loadProductDailyReport(): void {
    const params = {
      startDate: this.startDate.value!.toISOString().split('T')[0],
      endDate: this.endDate.value!.toISOString().split('T')[0],
      lineId: this.selectedLine.value || null,
      productInformationId: this.selectedProduct.value || null
    };

    this.repoService.getData<ReportSummary[]>('api/reports/product-daily', params)
      .subscribe(
        (res) => {
          this.productDailyReport = res as ReportSummary[];
          this.productDailyDataSource.data = this.productDailyReport;
        },
        (err) => {
          this.dialogService.openErrorDialog('Error fetching product daily report: ' + err.message);
        }
      );
  }

  loadVehicleReport(): void {
    const params = {
      startDate: this.startDate.value!.toISOString().split('T')[0],
      endDate: this.endDate.value!.toISOString().split('T')[0],
      vehicleNumber: this.vehicleNumber.value || ''
    };

    this.repoService.getData<VehicleReport[]>('api/reports/vehicle-daily', params)
      .subscribe(
        (res) => {
          this.vehicleReport = res;
          this.vehicleDataSource.data = this.vehicleReport;
        },
        (err) => {
          this.dialogService.openErrorDialog('Error fetching vehicle report: ' + err.message);
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
          this.dialogService.openErrorDialog('Error fetching incomplete order report: ' + err.message);
        }
      );
  }

  loadDistributorReport(): void {
    const params = {
      fromYear: this.fromYear.value,
      toYear: this.toYear.value,
      fromMonth: this.fromMonth.value,
      toMonth: this.toMonth.value,
      distributorId: this.distributorId.value || null,
      productInformationId: this.productInformationId.value || null
    };

    this.repoService.getData<DistributorReport[]>('api/reports/distributor-production', params)
      .subscribe(
        (res) => {
          this.distributorReport = res;
          this.distributorDataSource.data = this.distributorReport;
        },
        (err) => {
          this.dialogService.openErrorDialog('Error fetching distributor report: ' + err.message);
        }
      );
  }

  exportReport(): void {
    const params = {
      startDate: this.startDate.value!.toISOString().split('T')[0],
      endDate: this.endDate.value!.toISOString().split('T')[0],
      lineId: this.selectedLine.value || null,
      productInformationId: this.selectedProduct.value || null
    };

    // Sử dụng RepositoryService để gọi API xuất báo cáo
    this.repoService.exportReport('api/reports/product-daily/export', params)
      .subscribe(
        (response: Blob) => {
          const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          // Format tên file giống backend
          const startDateStr = this.startDate.value!.toLocaleDateString('en-GB').split('/').join('');
          const endDateStr = this.endDate.value!.toLocaleDateString('en-GB').split('/').join('');
          a.download = `BaoCaoSanPham_${startDateStr}_${endDateStr}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        (err) => {
          this.dialogService.openErrorDialog('Error exporting report: ' + err.message);
        }
      );
  }

  exportVehicleReport(): void {
    const params = {
      startDate: this.startDate.value!.toISOString().split('T')[0],
      endDate: this.endDate.value!.toISOString().split('T')[0],
      vehicleNumber: this.vehicleNumber.value || ''
    };

    this.repoService.exportReport('api/reports/vehicle-daily/export', params)
      .subscribe(
        (response: Blob) => {
          const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const startDateStr = this.startDate.value!.toLocaleDateString('en-GB').split('/').join('');
          const endDateStr = this.endDate.value!.toLocaleDateString('en-GB').split('/').join('');
          a.download = `BaoCaoXe_${startDateStr}_${endDateStr}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        (err) => {
          this.dialogService.openErrorDialog('Error exporting report: ' + err.message);
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
          const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const startDateStr = this.startDate.value!.toLocaleDateString('en-GB').split('/').join('');
          const endDateStr = this.endDate.value!.toLocaleDateString('en-GB').split('/').join('');
          a.download = `BaoCaoDonHangChuaHoanThanh_${startDateStr}_${endDateStr}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        (err) => {
          this.dialogService.openErrorDialog('Error exporting report: ' + err.message);
        }
      );
  }

  exportDistributorReport(): void {
    const params = {
      fromYear: this.fromYear.value,
      toYear: this.toYear.value,
      fromMonth: this.fromMonth.value,
      toMonth: this.toMonth.value,
      distributorId: this.distributorId.value || null,
      productInformationId: this.productInformationId.value || null
    };

    this.repoService.exportReport('api/reports/distributor-production/export', params)
      .subscribe(
        (response: Blob) => {
          const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `BaoCaoNhaPhanPhoi_${this.fromYear.value}-${this.fromMonth.value}_${this.toYear.value}-${this.toMonth.value}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        (err) => {
          this.dialogService.openErrorDialog('Error exporting report: ' + err.message);
        }
      );
  }

  applyFilter(): void {
    // Không cần làm gì ở đây, vì dữ liệu chỉ tải khi nhấn Report
  }
}