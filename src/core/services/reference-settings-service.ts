import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CORE_CONFIG } from '../core.config.token';

@Injectable({
  providedIn: 'root'
})
export class ReferenceSettingsService {
  http = inject(HttpClient);
  coreConfig = inject(CORE_CONFIG);
  /**
   * Converts data input to api's S_SET008Model shape
   * @param data
   */
  private createS_SET008Model(data: any): any {
    return {
      USERID: data.UserId ?? '',
      FORMID: data.FormId ?? '',
      REFERENCESCREENID: data.referenceScreenId ?? '',
      INITIALSEARCHKBN: data.InitialSearchKBN ?? null,
      INITIALCONDITIONKBN : data.InitialConditionKBN ?? null
    };
  }

  /**
   * Makes POST call to get reference setting
   * @param data
   */
  getReferenceSetting(data: any): Observable<any> {
    const apiUrl = this.coreConfig.getReferecesSettingDataAPI;
    let body = this.createS_SET008Model(data);
    return this.http.post(apiUrl, body);
  }

  /**
   * Makes POST call to save reference setting
   * @param data
   */
  saveReferenceSetting(data: any): Observable<any> {
    const apiUrl = this.coreConfig.saveReferenceSettingDataApi;
    const body = this.createS_SET008Model(data);
    return this.http.post(apiUrl, body);
  }
}
