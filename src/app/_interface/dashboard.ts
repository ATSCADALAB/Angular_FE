export interface DashboardSummaryDto {
    totalOrdersToday: number;
    pendingOrders: number;
    completedOrdersToday: number;
    totalDistributors: number;
    totalAreas: number;
  }
  
  export interface OrdersByLineDto {
    lineName: string;
    totalOrders: number;
    orderID: string;
  }
  
  export interface OrderStatusTrendDto {
    date: string;
    pending: number;
    processing: number;
    incomplete: number;
    completed: number;
  }
  
  export interface TopProductDto {
    productName: string;
    totalUnits: number;
  }
  
  export interface IncompleteOrderDto {
    date: string;
    orderNumber: string;
    vehicleNumber: string;
    productName: string;
    requestedUnits: number;
    actualUnits: number;
    orderId:string;
    completionPercentage: number;
  }
  
  export interface ProcessingOrderDto {
    date: string;
    orderNumber: string;
    vehicleNumber: string;
    lineName: string;
    totalUnits: number;
    totalRequestedUnits: number;
    orderId:string;
    status: string;
  }
  
  export interface RecentCompletedOrderDto {
    completedDate: string;
    orderNumber: string;
    distributorName: string;
    productName: string;
    totalUnits: number;
    orderId:string;
  }