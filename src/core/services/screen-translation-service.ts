import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from 'src/app/shared/api-endpoints';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScreenTranslationService {
  constructor(private http: HttpClient) {}

  getScreenTranslation(screenName: string,  referenceScreenIds: string[], enumScreenIds: string[],lang: string) {
    const apiUrl = `${API_ENDPOINTS.BASE}/config/ScreenTranslation`;
    const body = {
      path: screenName,
      Data: { lang, referenceScreenIds, enumScreenIds },
    };

    return this.http.post<any>(apiUrl, body).pipe(
      map((response: any) => {
        const records = response?.Data?.Records;
        return records 
          ? JSON.parse(records)
          : { FORM: {}, REFERENCESCREEN: {}, ENUMSCREEN: {} };
      }),
    );
  }
}
