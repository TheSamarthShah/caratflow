import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { DatepickerI18nService } from 'src/core/services/datepicker-i18n-service';
import { DateAdapter } from '@angular/material/core';
import { StripKanjiDateAdapter } from 'src/core/services/strip-kanji-date-adapter';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    { provide: MatDatepickerIntl, useClass: DatepickerI18nService },
    { provide: DateAdapter, useClass: StripKanjiDateAdapter },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ]
};
