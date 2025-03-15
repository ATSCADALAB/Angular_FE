export interface LineDto {
    id: number;
    lineNumber: number;
    lineName: string;
    isActive: boolean;
    createdAt: Date; // DateTime trong C# ánh xạ thành Date trong TypeScript
    updatedAt: Date;
  }
  
  export interface LineForCreationDto {
    lineNumber: number;
    lineName: string;
    isActive?: boolean; // Optional, mặc định là true trong DTO
  }
  
  export interface LineForUpdateDto {
    lineNumber: number;
    lineName: string;
    isActive?: boolean; // Optional, mặc định là true trong DTO
  }