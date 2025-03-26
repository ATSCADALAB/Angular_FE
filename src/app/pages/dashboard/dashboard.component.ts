import { Component, ViewEncapsulation } from '@angular/core';
import { salesOverviewChart } from 'src/app/_interface/chart';
import {
  DashboardSummaryDto,
  OrdersByLineDto,
  OrderStatusTrendDto,
  TopProductDto,
  IncompleteOrderDto,
  ProcessingOrderDto,
  RecentCompletedOrderDto
} from 'src/app/_interface/dashboard';
import { RepositoryService } from 'src/app/shared/services/repository.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'] 
})
export class AppDashboardComponent {
  public errorMessage: string = '';
  public showError?: boolean;
  public salesOverviewChart!: Partial<salesOverviewChart> | any;

  // Biến cho dashboard
  summary: DashboardSummaryDto | null = null;
  ordersByLine: OrdersByLineDto[] = [];
  orderStatusTrend: OrderStatusTrendDto[] = [];
  topProducts: TopProductDto[] = [];
  incompleteOrders: IncompleteOrderDto[] = [];
  processingOrders: ProcessingOrderDto[] = [];
  recentCompletedOrders: RecentCompletedOrderDto[] = [];
  // Danh sách màu cho các line
  lineColors: string[] = [
    '#5D87FF', // Xanh dương
    '#FF5733', // Cam
    '#33FF57', // Xanh lá
    '#FFC107', // Vàng
    '#FF33A1', // Hồng
    '#7B33FF', // Tím
    '#33FFF5', // Xanh ngọc
  ];
  constructor(private repoService: RepositoryService) { }

  ngOnInit() {
    this.initializeChart();
    this.getDashboardSummary();
    this.getOrdersByLine();
    this.getOrderStatusTrend();
    this.getTopProducts();
    this.getIncompleteOrders();
    this.getProcessingOrders();
    this.getRecentCompletedOrders();
  }
  // Hàm lấy màu dựa trên index
  getLineColor(index: number): string {
    return this.lineColors[index % this.lineColors.length]; // Lặp lại màu nếu vượt quá số lượng
  }
  public getDashboardSummary() {
    this.repoService.getData('api/dashboard/summary').subscribe(
      (res) => {
        this.summary = res as DashboardSummaryDto;
        this.updateChartWithSummary(); // Cập nhật chart với summary
      },
      (err) => {
        console.log(err);
      }
    );
  }

  public getOrdersByLine() {
    this.repoService.getData('api/dashboard/orders-by-line').subscribe(
      (res) => {
        this.ordersByLine = res as OrdersByLineDto[];
      },
      (err) => {
        console.log(err);
      }
    );
  }

  public getOrderStatusTrend() {
    this.repoService.getData('api/dashboard/order-status-trend').subscribe(
      (res) => {
        this.orderStatusTrend = res as OrderStatusTrendDto[];
        // Nếu muốn dùng trend thay vì summary cho chart, uncomment dòng dưới
        // this.updateChartWithTrend();
      },
      (err) => {
        console.log(err);
      }
    );
  }

  public getTopProducts() {
    this.repoService.getData('api/dashboard/top-products').subscribe(
      (res) => {
        this.topProducts = res as TopProductDto[];
      },
      (err) => {
        console.log(err);
      }
    );
  }

  public getIncompleteOrders() {
    this.repoService.getData('api/dashboard/incomplete-orders').subscribe(
      (res) => {
        this.incompleteOrders = res as IncompleteOrderDto[];
      },
      (err) => {
        console.log(err);
      }
    );
  }

  public getProcessingOrders() {
    this.repoService.getData('api/dashboard/processing-orders').subscribe(
      (res) => {
        this.processingOrders = res as ProcessingOrderDto[];
      },
      (err) => {
        console.log(err);
      }
    );
  }

  public getRecentCompletedOrders() {
    this.repoService.getData('api/dashboard/recent-completed-orders').subscribe(
      (res) => {
        this.recentCompletedOrders = res as RecentCompletedOrderDto[];
      },
      (err) => {
        console.log(err);
      }
    );
  }

  // Cập nhật chart với dữ liệu từ summary (hoàn thành vs chưa hoàn thành)
  private updateChartWithSummary() {
    if (!this.summary) return;

    this.salesOverviewChart.series = [
      {
        name: 'Pending Orders',
        data: [this.summary.pendingOrders],
        color: '#FF5733',
      },
      {
        name: 'Completed Orders Today',
        data: [this.summary.completedOrdersToday],
        color: '#5D87FF',
      },
    ];


    this.salesOverviewChart.xaxis = {
      categories: ['Today'],
    };
  }

  // Nếu muốn dùng trend thay vì summary
  private updateChartWithTrend() {
    this.salesOverviewChart.series = [
      {
        name: 'Chưa xử lý',
        data: this.orderStatusTrend.map((trend) => trend.pending),
        color: '#FF5733',
      },
      {
        name: 'Đang xử lý',
        data: this.orderStatusTrend.map((trend) => trend.processing),
        color: '#33FF57',
      },
      {
        name: 'Dở dang',
        data: this.orderStatusTrend.map((trend) => trend.incomplete),
        color: '#FFC107',
      },
      {
        name: 'Hoàn thành',
        data: this.orderStatusTrend.map((trend) => trend.completed),
        color: '#5D87FF',
      },
    ];

    this.salesOverviewChart.xaxis = {
      categories: this.orderStatusTrend.map((trend) => trend.date),
    };
  }

  private initializeChart() {
    this.salesOverviewChart = {
      series: [],
      grid: {
        borderColor: 'rgba(0,0,0,0.1)',
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '35%', borderRadius: [4] },
      },
      chart: {
        type: 'bar',
        height: 380,
        offsetX: -15,
        toolbar: { show: true },
        foreColor: '#adb0bb',
        fontFamily: 'inherit',
        sparkline: { enabled: false },
      },
      dataLabels: { enabled: false },
      markers: { size: 0 },
      legend: { show: true },
      xaxis: {
        type: 'category',
        categories: [],
        labels: {
          style: { cssClass: 'grey--text lighten-2--text fill-color' },
        },
      },
      yaxis: {
        show: true,
        min: 0,
        tickAmount: 4,
        labels: {
          style: {
            cssClass: 'grey--text lighten-2--text fill-color',
          },
        },
      },
      stroke: {
        show: true,
        width: 3,
        lineCap: 'butt',
        colors: ['transparent'],
      },
      tooltip: { theme: 'light' },
      responsive: [
        {
          breakpoint: 600,
          options: {
            plotOptions: {
              bar: {
                borderRadius: 3,
              },
            },
          },
        },
      ],
    };
  }
}