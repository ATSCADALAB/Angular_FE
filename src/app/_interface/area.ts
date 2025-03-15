export interface AreaDto {
    id: number;
    areaCode: string;
    areaName: string;
    createdAt: Date; // DateTime trong C# sẽ map thành Date trong TypeScript
    updatedAt: Date;
  }
  
  export interface AreaForCreationDto {
    areaCode: string;
    areaName: string;
  }
  
  export interface AreaForUpdateDto {
    areaCode: string;
    areaName: string;
  }