import { DistributorDto } from "./distributor";

export interface OrderWithDetails {
  id: string; // Guid trong C# là string trong TypeScript
  orderCode: string;
  exportDate: string; // DateTime từ backend sẽ là string ở frontend
  vehicleNumber: string;
  driverName: string;
  driverNumber: number;
  driverPhoneNumber: string;
  area: string;
  status: number;
  distributorId: number;
  distributorName: string;
  createdAt: string;
  updatedAt: string | null;
  orderDetail: OrderDetailWithProduct;
}

export interface OrderDetailWithProduct {
  id: number;
  orderId: string; // Guid trong C# là string trong TypeScript
  productInformationId: number;
  productCode: string;
  productName: string;
  requestedUnits: number;
  requestedWeight: number;
  manufactureDate: string; // DateTime từ backend sẽ là string ở frontend
  defectiveUnits: number;
  defectiveWeight: number;
  replacedUnits: number;
  replacedWeight: number;
  createdAt: string;
}
export interface OrderDto {
  id: string;
  orderCode: string;
  exportDate: string;
  vehicleNumber: string;
  driverNumber: number;
  driverName: string;
  driverPhoneNumber: string;
  status: number;
  distributorId: number;
  createdAt: string;
  updatedAt: string;
  distributor: DistributorDto; // Nếu có dữ liệu distributor, bạn có thể thay đổi kiểu phù hợp
}

export interface  OrderForManipulationDto
{
  id: string;
  orderCode: string;
  vehicleNumber: string;
  driverNumber: number;
  driverName: string;
  driverPhoneNumber: string;
  status: number;
  distributorId: number;
  exportDate: string;
}