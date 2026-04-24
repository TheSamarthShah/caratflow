import { HttpClient } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { firstValueFrom } from 'rxjs';
import { API_ENDPOINTS } from "../api-endpoints";

@Injectable({
  providedIn: "root",
})
export class AppInfoService {
 constructor(
    public http: HttpClient,
  ) {}
  activeFormId = signal<string>('')
  plantData = signal<Record<string, any>>({});

  getMainMenu(): Promise<any[]> {
  return firstValueFrom(this.http.post<any>(API_ENDPOINTS.CONFIG.MAIN_MENU, {}))
    .then((response: any) => {
      return JSON.parse(response.Data.Records);
    })
    .catch((error) => {
      return null;
    });
}

  getScreen(screenName: string, historyTableId = ''): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(API_ENDPOINTS.CONFIG.SCREEN, {
        path: screenName,        
        data: historyTableId 
      })
    )
      .then((response: any) => JSON.parse(response.Data.Records))
      .catch((error) => {
      return null;
    });
  }

  getReferenceScreen(screenName: string): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(API_ENDPOINTS.CONFIG.REFERENCE_SCREEN, { 
        path: screenName,        
        data: ''
      })
    )
      .then((response: any) => JSON.parse(response.Data.Records))
      .catch((error) => {
      return null;
    });
  }

  // getConfigData(dataRoute: string,historyTableId : string = ''): Promise<any[]> {
  //   const payload = { path: dataRoute ,data : String(historyTableId)};
  //   return firstValueFrom(this.http.post<any>(this.BASE_URL, payload))
  //     .then((response: any) => {
  //         return JSON.parse(response.Data.Records);
  //     })
  //     .catch((error) => {
  //         return null;
  //     });
  // }

  setFormId(fromid : string) : void {
    this.activeFormId.set(fromid)
  }
  getFormId() : string {
    return this.activeFormId()
  }
  
  getHistoryFormTableName() : string {
    return this.activeFormId().replace('HistoryScreen_', '');
  }
}