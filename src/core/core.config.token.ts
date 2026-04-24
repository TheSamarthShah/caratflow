import { InjectionToken } from '@angular/core';

export interface CoreConfig {
  refreshTokenAPI: string;
  getColumnMetaDataAPI: string;
  getSortingDataAPI: string;
  saveSortingDataAPI: string;
  getColumnSwapDataAPI: string;
  saveColumnSwapDataAPI: string;
  getReferenceScreenDataAPI: string;
  logErrorAPI: string;
  getReferecesSettingDataAPI: string;
  saveReferenceSettingDataApi: string;
}

export const CORE_CONFIG = new InjectionToken<CoreConfig>('app.config');
