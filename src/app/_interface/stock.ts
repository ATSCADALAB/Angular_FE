import { ProductInformationDto } from "./product-information";


export interface InboundRecordDto {
  id: number;
  productInformationId: number;
  quantityUnits: number;
  quantityWeight: number;
  inboundDate: Date; // DateTime trong C# ánh xạ thành Date trong TS
  createdAt: Date;
  productInformation: ProductInformationDto;
}

export interface InboundRecordForCreationDto {
  productInformationId: number;
  quantityUnits: number;
  quantityWeight: number;
  inboundDate: Date;
}

export interface OutboundRecordDto {
  id: number;
  productInformationId: number;
  quantityUnits: number;
  quantityWeight: number;
  outboundDate: Date; // DateTime trong C# ánh xạ thành Date trong TS
  createdAt: Date;
  productInformation: ProductInformationDto;
}

export interface OutboundRecordForCreationDto {
  productInformationId: number;
  quantityUnits: number;
  quantityWeight: number;
  outboundDate: Date;
}

export interface InventoryReportDto {
  productName: string;
  openingStockUnits: number;
  openingStockWeight: number;
  inQuantityUnits: number;
  inQuantityWeight: number;
  outQuantityUnits: number;
  outQuantityWeight: number;
  closingStockUnits: number;
  closingStockWeight: number;
}