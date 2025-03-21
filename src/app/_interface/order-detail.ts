import { DistributorDto } from "./distributor";
import { OrderDto } from "./order";
import { ProductInformationDto } from "./product-information";

export interface OrderLineDetailDto {
    id: number;
    orderId: string; // Guid trong C# là string trong TypeScript
    SequenceNumber: number;
    LineId: number;
    StartTime: string;
    EndTime: string;
    CreatedAt: string;
  }
  export interface OrderLineDetailCreationDto {
    orderId: string; // Guid trong C# là string trong TypeScript
    SequenceNumber: number;
    LineId: number;
    StartTime: string;
    EndTime: string;
  }
  export interface OrderDetailUpdatenDto {
    orderId: string; // Guid trong C# là string trong TypeScript
    productInformationId: number;
    requestedUnits: number;
    requestedWeight: number;
    manufactureDate: string; // Hoặc Date nếu bạn muốn xử lý dạng Date object
    defectiveUnits: number;
    defectiveWeight: number;
    replacedUnits: number;
    replacedWeight: number;
  }
  export interface OrderDetailDto {
    id: number;
    orderId: string;
    productInformationId: number;
    requestedUnits: number;
    requestedWeight: number;
    manufactureDate: string; // Hoặc Date nếu bạn muốn xử lý dạng Date object
    defectiveUnits: number;
    defectiveWeight: number;
    replacedUnits: number;
    replacedWeight: number;
    createdAt: string;
    order: OrderDto;
    productInformation: ProductInformationDto;
  }
  
