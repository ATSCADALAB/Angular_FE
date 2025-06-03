export interface OrderLineDetailDto {
  id: number;
  orderId: string; // Guid trong C# là string trong TypeScript
  SequenceNumber: number;
  lineId: number;
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
export interface OrderLineDetailUpdateDto {
  orderId: string; // Guid trong C# là string trong TypeScript
  SequenceNumber: number;
  LineId: number;
  StartTime: string;
  EndTime: string;
}