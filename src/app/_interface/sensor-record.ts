import { DistributorDto } from "./distributor";
import { ProductInformationDto } from "./product-information";

export interface SensorRecordDto {
    id: number;
    orderId: string; // Guid trong C# là string trong TypeScript
    orderDetailId: number;
    lineId: number;
    sensorUnits: number;
    sensorWeight: number;
    recordTime: string;
    status:number;
    createdByName: string;
    updatedByName: string;
  }
  
  export interface SensorRecordCreationDto {
    orderId: string; // Guid trong C# là string trong TypeScript
    orderDetailId: number;
    lineId: number;
    sensorUnits: number;
    sensorWeight: number;
    recordTime: string;
    status : number;
  }