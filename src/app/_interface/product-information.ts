export interface ProductInformationDto {
    id?: number;
    productCode?: string;
    productName?: string;
    unit?: string;
    weight?: number;
    isActive?: boolean;
  }
  
  export interface ProductInformationForCreationDto {
    productCode?: string;
    productName?: string;
    unit?: string;
    weight?: number;
    isActive?: boolean;
  }
  
  export interface ProductInformationForUpdateDto {
    productCode?: string;
    productName?: string;
    unit?: string;
    weight?: number;
    isActive?: boolean;
  }