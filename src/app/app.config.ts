import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { routes } from './app.routes';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { DatepickerI18nService } from 'src/core/services/datepicker-i18n-service';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { StripKanjiDateAdapter } from 'src/core/services/strip-kanji-date-adapter';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptor/auth-interceptor';
import { CORE_CONFIG, CoreConfig } from 'src/core/core.config.token';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(TranslateModule.forRoot()),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideNativeDateAdapter(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: MatDatepickerIntl, useClass: DatepickerI18nService },
    { provide: DateAdapter, useClass: StripKanjiDateAdapter },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
    {
      provide: CORE_CONFIG,
      useValue: {
        refreshTokenAPI: '',
        getColumnMetaDataAPI: '',
        getSortingDataAPI: '',
        saveSortingDataAPI: '',
        getColumnSwapDataAPI: '',
        saveColumnSwapDataAPI: '',
        getReferenceScreenDataAPI: '',
        logErrorAPI: '',
        getReferecesSettingDataAPI: '',
        saveReferenceSettingDataApi: '',
      } as CoreConfig,
    },
  ]
};
