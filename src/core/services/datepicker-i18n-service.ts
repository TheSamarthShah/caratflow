import { Injectable, OnDestroy, inject } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Language_Config } from 'src/core/models/languages.config';
import { DateTime as LuxonDateTime } from 'luxon';

@Injectable({
  providedIn: 'root',
})
export class DatepickerI18nService extends MatDatepickerIntl implements OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly dateAdapter = inject(DateAdapter<Date>);
  private sub?: Subscription;

  constructor() {
    super();
    this.updateLocale(this.translate.currentLang);

    this.sub = this.translate.onLangChange.subscribe((event) => {
      this.updateLocale(event.lang);
    });
  }

  /** Centralized getter for the current language config */
  private get currentLangConfig() {
    return (
      Language_Config.find((l) => l.code === this.translate.currentLang) ||
      Language_Config.find((l) => l.code === 'en') || // Fallback to English
      Language_Config[0]
    );
  }

  private updateLocale(lang: string): void {
    this.dateAdapter.setLocale(this.currentLangConfig.locale || 'en-US');
    this.changes.next();
  }

  /** Format a date based on current language safely */
  formatDate(
    rawValue: Date | string | number | null | undefined,
    dateFormatType : string
  ): string {
    if (!rawValue) return '';

    // Safely convert strings/timestamps to JS Date
    const date = rawValue instanceof Date ? rawValue : new Date(rawValue);
    if (isNaN(date.getTime())) return '';

    const datePattern = this.currentLangConfig.dateFormat[dateFormatType] ||'MM/dd/yyyy';
    const datePart = LuxonDateTime.fromJSDate(date).toFormat(datePattern);

    // if (showHours || showMinutes || showSeconds) {
    //   const timePart = this.formatTime(date, showHours, showMinutes, showSeconds);
    //   return `${datePart} ${timePart}`;
    // }

    return datePart;
  }

  /** Format time based on current language */
  private formatTime(
    date: Date,
    showHours: boolean,
    showMinutes: boolean,
    showSeconds: boolean
  ): string {
    // Strict Hierarchy
    const hours = showHours;
    const minutes = hours && showMinutes;
    const seconds = minutes && showSeconds;

    if (!hours) return ''; // If no hours, return early

    const is24Hour = this.currentLangConfig.timeFormat === '24';
    const mm = date.getMinutes().toString().padStart(2, '0');
    const ss = date.getSeconds().toString().padStart(2, '0');

    let timeStr = '';

    if (is24Hour) {
      timeStr = date.getHours().toString().padStart(2, '0');
      if (minutes) timeStr += `:${mm}`;
      if (seconds) timeStr += `:${ss}`;
      return timeStr;
    } 
    
    // 12 HOUR FORMAT
    const rawHours = date.getHours();
    const twelveHour = (rawHours % 12 || 12).toString();
    const ampm = rawHours >= 12 ? ' PM' : ' AM';

    timeStr = twelveHour;
    if (minutes) timeStr += `:${mm}`;
    if (seconds) timeStr += `:${ss}`;
    
    return timeStr + ampm;
  }

  /** Generates the format string for the DateAdapter to parse keyboard input */
  public getParseFormat(dateFormatType : string): string {
    let format = this.currentLangConfig.dateFormat[dateFormatType] ||'MM/dd/yyyy';

    // // Strict Hierarchy
    // const hours = showHours;
    // const minutes = hours && showMinutes;
    // const seconds = minutes && showSeconds;

    // if (hours) {
    //   format += ' HH';
    //   if (minutes) {
    //     format += ':mm';
    //     if (seconds) format += ':ss';
    //   }
    // }

    return format;
  }

  getCurrentLocale(): string {
    return this.currentLangConfig.locale || 'en-US';
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}