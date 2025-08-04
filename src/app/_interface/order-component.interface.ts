// interfaces/order-component.interface.ts

export interface ComponentState {
    isExpanded: boolean;
    isSensorExpanded: boolean;
    isStarting: boolean;
    isRunning: boolean;
    isLoading: boolean;
    isAssigned: boolean;
    isSignalRRunning: boolean;
  }
  
  export interface OrderCalculations {
    totalUnits: number;
    totalWeight: number;
    replacedUnits: number;
    replacedWeight: number;
  }
  
  export interface DialogConfig {
    width: string;
    height: string;
    disableClose?: boolean;
    data: any;
  }
  
  export interface ConfirmDialogData {
    message: string;
  }
  
  export interface OrderLineAssignment {
    orderId: string;
    lineId: number;
    isActive: boolean;
    startTime: string;
    endTime?: string;
  }
  
  export interface SensorDataSummary {
    currentUnits: number;
    currentWeight: number;
    remainingUnits: number;
    isComplete: boolean;
  }
  
  // enums/order-status.enum.ts
  export enum OrderStatus {
    NOT_COMPLETED = 0,
    IN_PROGRESS = 1,
    COMPLETED = 2,
    CANCELLED = 3
  }
  
  export enum SensorStatus {
    STOPPED = 0,
    RUNNING = 1,
    COMPLETED = 2,
    ERROR = 3
  }
  
  // constants/dialog-config.constant.ts
  export const DIALOG_CONFIGS = {
    CONFIRM: {
      width: '450px',
      height: '150px',
      disableClose: true
    },
    ORDER_DETAIL_CONFIRM: {
      width: '500px',
      height: '400px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms'
    }
  } as const;
  
  // constants/api-endpoints.constant.ts
  export const API_ENDPOINTS = {
    ORDER_DETAILS: 'api/order-details',
    ORDER_DETAILS_BY_ORDER: (orderId: string) => `api/order-details/by-order/${orderId}`,
    LINES: 'api/lines',
    ORDER_LINE_DETAILS: (orderId: string) => `api/order-line-details/${orderId}`,
    SENSOR_RECORDS: 'api/sensor-records',
    SENSOR_RECORDS_BY_ORDER: (orderId: string) => `api/sensor-records/by-order/${orderId}`,
    ORDERS: 'api/orders',
    WCF_WRITE_VALUE: 'api/wcf/write-value',
    WCF_WRITE_SETTING: 'api/wcf/write-setting'
  } as const;
  
  // constants/messages.constant.ts
  export const MESSAGES = {
    SUCCESS: {
      ORDER_STARTED: 'Order started successfully.',
      LINE_ASSIGNED: 'Line assigned successfully.',
      LINE_UNASSIGNED: 'Line unassigned successfully.'
    },
    ERROR: {
      FAILED_TO_START: 'Failed to start order.',
      FAILED_TO_ASSIGN: 'Failed to assign line.',
      FAILED_TO_UNASSIGN: 'Failed to unassign line.',
      INVALID_LINE: 'Invalid Line selected.',
      NO_LINE_SELECTED: 'Please select a Line before starting.',
      LINE_ALREADY_ASSIGNED: 'This line has already been assigned.',
      NO_SENSOR_DATA: 'Error: No sensor data available.',
      COUNT_NOT_COMPLETE: 'The count is not complete. Are you sure you want to stop?'
    },
    CONFIRM: {
      UNASSIGN_LINE: (lineId: number) => `Are you sure you want to unassign Line ${lineId}?`,
      LINE_IN_USE: (lineId: number, orderId: string) => 
        `Line ${lineId} is currently in use by order ${orderId}. Would you like to view its details?`
    }
  } as const;