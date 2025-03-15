export interface ProductInformationDto {
  id: number;
  productCode: string;
  productName: string;
  unit: string;
  weightPerUnit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductInformationForCreationDto {
  productCode: string;
  productName: string;
  unit: string;
  weightPerUnit: number;
  isActive?: boolean; // Optional, mặc định true
}

export interface ProductInformationForUpdateDto {
  productCode: string;
  productName: string;
  unit: string;
  weightPerUnit: number;
  isActive?: boolean; // Optional, mặc định true
}