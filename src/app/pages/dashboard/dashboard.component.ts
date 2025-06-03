import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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
import { LineDetailsDialogComponent } from './popup/line-details-dialog.component';

// Interface for OrderLineDetailDto
export interface OrderLineDetailDto {
  lineNumber: number;
  lineName: string;
  orderId: string;
  orderCode: string;
  productName: string;
  requestedUnits: number;
  distributorName: string;
}

// Interface for grouped line data
export interface GroupedLineData {
  lineName: string;
  totalOrders: number;
  orders: OrderLineDetailDto[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class AppDashboardComponent implements OnInit {
  public errorMessage: string = '';
  public showError?: boolean;
  public salesOverviewChart!: Partial<salesOverviewChart> | any;

  // Dashboard variables
  summary: DashboardSummaryDto | null = null;
  ordersByLine: OrdersByLineDto[] = [];
  orderStatusTrend: OrderStatusTrendDto[] = [];
  topProducts: TopProductDto[] = [];
  incompleteOrders: IncompleteOrderDto[] = [];
  processingOrders: ProcessingOrderDto[] = [];
  recentCompletedOrders: RecentCompletedOrderDto[] = [];
  groupedLineData: GroupedLineData[] = []; // Store grouped data

  // Line colors
  lineColors: string[] = [
    '#5D87FF', // Blue
    '#FF5733', // Orange
    '#33FF57', // Green
    '#FFC107', // Yellow
    '#FF33A1', // Pink
    '#7B33FF', // Purple
    '#33FFF5', // Cyan
  ];

  constructor(
    private repoService: RepositoryService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.initializeChart();
    this.getDashboardSummary();
    this.getOrdersByLine();
    this.getOrderStatusTrend();
    this.getTopProducts();
    this.getIncompleteOrders();
    this.getProcessingOrders();
    this.getRecentCompletedOrders();
    this.getOrderLineDetails();
  }

  // Get color based on index
  getLineColor(index: number): string {
    return this.lineColors[index % this.lineColors.length];
  }

  // Fetch dashboard summary
  public getDashboardSummary() {
    this.repoService.getData('api/dashboard/summary').subscribe(
      (res) => {
        this.summary = res as DashboardSummaryDto;
        this.updateChartWithSummary();
      },
      (err) => {
        console.log(err);
      }
    );
  }

  // Fetch orders by line
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

  // Fetch order status trend
  public getOrderStatusTrend() {
    this.repoService.getData('api/dashboard/order-status-trend').subscribe(
      (res) => {
        this.orderStatusTrend = res as OrderStatusTrendDto[];
      },
      (err) => {
        console.log(err);
      }
    );
  }

  // Fetch top products
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

  // Fetch incomplete orders
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

  // Fetch processing orders
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

  // Fetch recent completed orders
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

  // Fetch and group order line details
  public getOrderLineDetails() {
    this.repoService.getData('api/order-line-details/grouped-by-line').subscribe(
      (res) => {
        const orderLineDetails = res as OrderLineDetailDto[];
        // Group data by lineName
        this.groupedLineData = this.groupByLine(orderLineDetails);
      },
      (err) => {
        console.log(err);
      }
    );
  }

  // Group orders by line
  private groupByLine(orders: OrderLineDetailDto[]): GroupedLineData[] {
    const grouped = orders.reduce((acc, order) => {
      const lineName = order.lineName;
      if (!acc[lineName]) {
        acc[lineName] = {
          lineName,
          totalOrders: 0,
          orders: []
        };
      }
      acc[lineName].totalOrders += 1;
      acc[lineName].orders.push(order);
      return acc;
    }, {} as { [key: string]: GroupedLineData });

    return Object.values(grouped);
  }

  // Open dialog with line details
  openLineDetails(line: GroupedLineData) {
    this.dialog.open(LineDetailsDialogComponent, {
      width: '1200px', // Doubled from 600px for PC
      maxWidth: '90vw', // Responsive for smaller screens
      panelClass: 'custom-dialog-container',
      data: line
    });
  }

  // Update chart with summary data
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

  // Initialize chart
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