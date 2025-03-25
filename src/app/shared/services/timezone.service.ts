import { Injectable } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { LOCALE_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  constructor() {
    registerLocaleData(localeVi);
  }

  // Lấy thời gian hiện tại với múi giờ +7
  getCurrentTime(): Date {
    const now = new Date();
    return new Date(now.getTime() + (7 * 60 * 60 * 1000));
  }

  // Chuyển đổi Date sang ISO string với múi giờ +7
  toISOString(date: Date): string {
    return new Date(date.getTime() + (7 * 60 * 60 * 1000)).toISOString();
  }

  // Chuyển đổi ISO string sang Date với múi giờ +7
  fromISOString(isoString: string): Date {
    const date = new Date(isoString);
    return new Date(date.getTime() + (7 * 60 * 60 * 1000));
  }
} 