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