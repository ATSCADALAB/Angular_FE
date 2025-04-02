import { AreaDto } from './area';

export interface DistributorDto {
  id: number;
  distributorCode: string;
  distributorName: string;
  address: string;
  contactSource: string;
  phoneNumber: string;
  province: string;
  areaId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  area: AreaDto; // Thông tin khu vực liên quan
}

export interface DistributorForCreationDto {
  distributorCode: string;
  distributorName: string;
  address: string;
  contactSource: string;
  phoneNumber: string;
  areaId: number;
  province: string; // Thông tin tỉnh thành
  isActive?: boolean; // Optional, mặc định là true
}

export interface DistributorForUpdateDto {
  distributorCode: string;
  distributorName: string;
  address: string;
  contactSource: string;
  phoneNumber: string;
  province: string; // Thông tin tỉnh thành
  areaId: number;
  isActive?: boolean; // Optional, mặc định là true
}