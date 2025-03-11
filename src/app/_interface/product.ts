import { DistributorDto } from "./distributor";
import { ProductInformationDto } from "./product-information";

export interface ProductDto {
    id?: number;
    tagID?: string;
    shipmentDate?: Date;
    productDate?: Date;
    delivery?: string;
    stockOut?: string;
    isActive?: boolean;
    distributorId?: number;
    distributor?: DistributorDto; // Thêm để hiển thị thông tin Distributor
    productInformationId?: number;
    productInformation?: ProductInformationDto; // Thêm để hiển thị thông tin ProductInformation
  }
  
  export interface ProductForCreationDto {
    tagID?: string;
    shipmentDate?: Date;
    productDate?: Date;
    delivery?: string;
    stockOut?: string;
    isActive?: boolean;
    distributorId?: number;
    productInformationId?: number;
  }
  
  export interface ProductForUpdateDto {
    tagID?: string;
    shipmentDate?: Date;
    productDate?: Date;
    delivery?: string;
    stockOut?: string;
    isActive?: boolean;
    distributorId?: number;
    productInformationId?: number;
  }