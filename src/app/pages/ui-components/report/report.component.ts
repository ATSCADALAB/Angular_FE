import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { OrderWithDetails } from 'src/app/_interface/order';

interface ReportSummary {
  date?: string;
  productName?: string;
  vehicleNumber?: string;
  distributorName?: string;
  area?: string;
  totalOrders: number;
  totalWeight: number;
  totalUnits: number;
}

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  orders: OrderWithDetails[] = [];
  productReport: ReportSummary[] = [];
  vehicleReport: ReportSummary[] = [];
  incompleteReport: ReportSummary[] = [];
  distributorReport: ReportSummary[] = [];
  areaReport: ReportSummary[] = [];

  constructor(
    private repoService: RepositoryService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.repoService.getData('api/orders/with-details')
      .subscribe(
        (res) => {
          this.orders = res as OrderWithDetails[];
          this.generateReports();
        },
        (err) => {
          this.dialogService.openErrorDialog('Error fetching orders: ' + err.message);
        }
      );
  }

  generateReports(): void {
    // 1. Báo cáo theo sản phẩm hàng ngày
    this.productReport = this.groupBy(this.orders, order => {
      const date = new Date(order.exportDate).toLocaleDateString();
      return `${date}-${order.orderDetail.productName}`;
    }, (group) => ({
      date: new Date(group[0].exportDate).toLocaleDateString(),
      productName: group[0].orderDetail.productName,
      totalOrders: group.length,
      totalWeight: group.reduce((sum, o) => sum + o.orderDetail.requestedWeight, 0),
      totalUnits: group.reduce((sum, o) => sum + o.orderDetail.requestedUnits, 0)
    }));

    // 2. Báo cáo theo phương tiện
    this.vehicleReport = this.groupBy(this.orders, order => order.vehicleNumber, (group) => ({
      vehicleNumber: group[0].vehicleNumber,
      totalOrders: group.length,
      totalWeight: group.reduce((sum, o) => sum + o.orderDetail.requestedWeight, 0),
      totalUnits: group.reduce((sum, o) => sum + o.orderDetail.requestedUnits, 0)
    }));

    // 4. Báo cáo đơn hàng xuất dở dang
    this.incompleteReport = this.groupBy(
      this.orders.filter(o => o.status === 0), // Giả sử status = 0 là dở dang
      order => order.orderCode,
      (group) => ({
        date: new Date(group[0].exportDate).toLocaleDateString(),
        totalOrders: group.length,
        totalWeight: group.reduce((sum, o) => sum + o.orderDetail.requestedWeight, 0),
        totalUnits: group.reduce((sum, o) => sum + o.orderDetail.requestedUnits, 0)
      })
    );

    // 5. Báo cáo sản lượng đại lý
    this.distributorReport = this.groupBy(this.orders, order => order.distributorName, (group) => ({
      distributorName: group[0].distributorName,
      totalOrders: group.length,
      totalWeight: group.reduce((sum, o) => sum + o.orderDetail.requestedWeight, 0),
      totalUnits: group.reduce((sum, o) => sum + o.orderDetail.requestedUnits, 0)
    }));

    // 6. Báo cáo theo khu vực (giả lập vì chưa có area)
    this.areaReport = this.groupBy(this.orders, order => order.distributorName, (group) => ({
      area: 'N/A', // Cần backend bổ sung area
      totalOrders: group.length,
      totalWeight: group.reduce((sum, o) => sum + o.orderDetail.requestedWeight, 0),
      totalUnits: group.reduce((sum, o) => sum + o.orderDetail.requestedUnits, 0)
    }));
  }

  // Hàm gom nhóm chung
  private groupBy<T, K>(array: T[], keyFn: (item: T) => K, transformFn: (group: T[]) => ReportSummary): ReportSummary[] {
    const map = new Map<K, T[]>();
    array.forEach(item => {
      const key = keyFn(item);
      const group = map.get(key) || [];
      group.push(item);
      map.set(key, group);
    });
    return Array.from(map.values()).map(transformFn);
  }
}