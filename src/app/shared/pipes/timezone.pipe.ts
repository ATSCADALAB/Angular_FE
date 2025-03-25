import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timezone',
  pure: false
})
export class TimezonePipe implements PipeTransform {
  transform(value: Date | string, format: string = 'medium'): string {
    if (!value) return '';
    
    let date: Date;
    if (typeof value === 'string') {
      date = new Date(value);
    } else {
      date = value;
    }

    // Thêm 7 giờ vào thời gian
    const adjustedDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));

    switch (format) {
      case 'short':
        return adjustedDate.toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'medium':
        return adjustedDate.toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'long':
        return adjustedDate.toLocaleString('vi-VN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return adjustedDate.toLocaleString('vi-VN');
    }
  }
} 