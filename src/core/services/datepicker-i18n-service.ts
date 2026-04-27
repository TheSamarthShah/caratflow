import { Injectable, OnDestroy, inject } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Subject } from 'rxjs';
import { Language_Config, DateFormatKey } from 'src/core/models/languages.config';
import { DateTime as LuxonDateTime } from 'luxon';

@Injectable({
  providedIn: 'root',
})
export class DatepickerI18nService implements OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly dateAdapter = inject(DateAdapter<Date>);
  private sub?: Subscription;
  public changes = new Subject<void>();

  constructor() {
    this.updateLocale(this.translate.currentLang);

    this.sub = this.translate.onLangChange.subscribe((event) => {
      this.updateLocale(event.lang);
    });
  }

  private get currentLangConfig() {
    return (
      Language_Config.find((l) => l.code === this.translate.currentLang) ||
      Language_Config.find((l) => l.code === 'en') ||
      Language_Config[0]
    );
  }

  private updateLocale(lang: string): void {
    this.dateAdapter.setLocale(this.currentLangConfig.locale || 'en-US');
    this.changes.next();
  }

  private getFormatConfig(key: string) {
    const formatKey = key as DateFormatKey;
    return this.currentLangConfig.dateFormat[formatKey] || this.currentLangConfig.dateFormat['YMD'];
  }

  /** Gets the unified Display String (e.g. "MMM-dd-yyyy hh:mm a") */
  getDisplayFormat(key: string): string {
    const config = this.getFormatConfig(key);
    return [config.displayDate, config.displayTime].filter(Boolean).join(' ');
  }

  /** Gets the unified Input String (e.g. "MM/dd/yyyy hh:mm a") */
  getParseFormat(key: string): string {
    const config = this.getFormatConfig(key);
    return [config.inputDate, config.inputTime].filter(Boolean).join(' ');
  }

  /** Format the date strictly for final visual display */
  formatDateDisplay(
    rawValue: Date | string | number | null | undefined,
    dateFormatType: string
  ): string {
    if (!rawValue) return '';
    const date = rawValue instanceof Date ? rawValue : new Date(rawValue);
    if (isNaN(date.getTime())) return '';

    const combinedPattern = this.getDisplayFormat(dateFormatType);
    return combinedPattern ? LuxonDateTime.fromJSDate(date).toFormat(combinedPattern) : '';
  }

  getCurrentLocale(): string {
    return this.currentLangConfig.locale || 'en-US';
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}