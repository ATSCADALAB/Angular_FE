import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { InventoryReportDto } from 'src/app/_interface/stock';
import { RepositoryService } from 'src/app/shared/services/repository.service';

@Component({
  selector: 'app-stock-report',
  templateUrl: './stock-report.component.html',
  styleUrls: ['./stock-report.component.scss']
})
export class StockReportComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'productName', 'openingStockUnits', 'openingStockWeight', 'inQuantityUnits', 'inQuantityWeight',
    'outQuantityUnits', 'outQuantityWeight', 'closingStockUnits', 'closingStockWeight'
  ];
  dataSource = new MatTableDataSource<InventoryReportDto>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  reportType: string = 'daily';
  selectedDate: Date = new Date();
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

  constructor(private repoService: RepositoryService) {}

  ngOnInit(): void {
    this.getReport();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  getReport() {
    let apiUri: string;
    if (this.reportType === 'daily') {
      const dateStr = this.selectedDate.toISOString().split('T')[0];
      apiUri = `api/stock/report/daily?date=${dateStr}`;
    } else if (this.reportType === 'monthly') {
      apiUri = `api/stock/report/monthly?year=${this.selectedYear}&month=${this.selectedMonth}`;
    } else {
      apiUri = `api/stock/report/yearly?year=${this.selectedYear}`;
    }

    this.repoService.getData(apiUri)
      .subscribe(
        (res) => {
          this.dataSource.data = res as InventoryReportDto[];
        },
        (err) => {
          console.log(err);
        }
      );
  }

  changeReportType(type: string) {
    this.reportType = type;
    this.getReport();
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  }
}