export interface DistributorDto {
    id: number;
    distributorCode: string;
    distributorName: string;
    address: string;
    phoneNumber: string;
    contactSource: string;
    area: string;
    note: string;
    isActive: boolean;
  }
  
  export interface DistributorForCreationDto {
    distributorCode: string;
    distributorName: string;
    address: string;
    phoneNumber: string;
    contactSource: string;
    area: string;
    note: string;
    isActive: boolean;
  }
  
  export interface DistributorForUpdateDto {
    distributorCode: string;
    distributorName: string;
    address: string;
    phoneNumber: string;
    contactSource: string;
    area: string;
    note: string;
    isActive: boolean;
  }