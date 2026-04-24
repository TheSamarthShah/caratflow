import { inject, Pipe, PipeTransform } from '@angular/core';
import { DatepickerI18nService } from '../services/datepicker-i18n-service';
import { DateTime as LuxonDateTime } from 'luxon';

export class AppDateUtils {
  /**
   * STRICTLY TIMEZONE-BLIND PARSER
   * Extracts the exact visual numbers from any input and strictly locks them 
   * so the browser cannot shift them on load or on blur.
   */
  static parseToNeutral(value: Date | string | number | null | undefined): Date | null {
    if (value === null || value === undefined || value === '') return null;

    let luxonDate: LuxonDateTime;

    if (typeof value === 'string') {
      const normalized = value.replace(/\//g, '-').replace(' ', 'T');
      luxonDate = LuxonDateTime.fromISO(normalized, { zone: 'utc' });
      
      if (!luxonDate.isValid) {
         luxonDate = LuxonDateTime.fromJSDate(new Date(value)).toUTC();
      }
    } else if (value instanceof Date) {
      luxonDate = LuxonDateTime.fromJSDate(value).toUTC();
    } else if (typeof value === 'number') {
      luxonDate = LuxonDateTime.fromMillis(value).toUTC();
    } else {
      return null;
    }

    if (!luxonDate || !luxonDate.isValid) return null;

    // Lock the extracted numbers securely against the system timezone
    return luxonDate.setZone('system', { keepLocalTime: true }).toJSDate();
  }
}

@Pipe({
  name: 'actyDate',
  standalone: true,
})
export class AppDatePipe implements PipeTransform {
  public readonly datepickerI18n = inject(DatepickerI18nService);

  transform(
    value: Date | string | number | null | undefined,
    currentLang: string,
    showHours: boolean = false,
    showMinutes: boolean = false,
    showSeconds: boolean = false,
  ): string {
    const neutralDate = AppDateUtils.parseToNeutral(value);
    if (!neutralDate) return '';

    return this.formatNeutralDate(neutralDate, showHours, showMinutes, showSeconds);
  }

  public formatNeutralDate(neutralDate: Date, showHours: boolean, showMinutes: boolean, showSeconds: boolean): string {
    return (this.datepickerI18n as any).formatDate(neutralDate, showHours, showMinutes, showSeconds);
  }
}