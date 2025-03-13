import { DistributorDto } from 'src/app/_interface/distributor';
import { ProductInformationDto } from 'src/app/_interface/product-information';

export interface OrderDto {
  id: string;
  code: string;
  exportDate: Date;
  quantityVehicle: number;
  vehicleNumber: string;
  containerNumber: number;
  sealNumber: number;
  driverName: string;
  driverPhoneNumber: string;
  unitOrder: string;
  weightOrder: number;
  manufactureDate: Date;
  distributorId: string;
  productInformationId: string;
  distributor: DistributorDto;
  productInformation: ProductInformationDto;
  status:number;
}
export interface OrderForCreationDto {
  code: string; // Số Phiếu XK
  exportDate: Date; // Ngày xuất
  quantityVehicle: number; // Số tài xế
  vehicleNumber: string; // Biển số xe vận chuyển
  containerNumber: number; // Số Cont
  sealNumber: number; // Số Seal
  driverName: string; // Tên TX
  driverPhoneNumber: string; // SĐT TX
  unitOrder: string; // Số lượng (Bao)
  weightOrder: number; // Số Lượng (Kg)
  manufactureDate: Date; // Ngày sản xuất
  distributorId: string; // ID của Distributor
  productInformationId: string; // ID của ProductInformation
  status:number;
}
export interface ImportResponse {
  successfulImports: number;
  duplicateRows: number;
}
export interface OrderLineDetailCreationDto {
  OrderId: string;
  Line: number;
}