import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {CORE_CONFIG } from '../core.config.token'; 

@Injectable({
  providedIn: 'root'
})
export class SortDataService {
  http = inject(HttpClient);
  coreConfig = inject(CORE_CONFIG);

  private apiUrlGet = this.coreConfig.getSortingDataAPI;
  private apiUrlSave = this.coreConfig.saveSortingDataAPI;

  getSortingData(UserId: string, FormId: string,ChildId : string): Observable<any> {
    const body = {
      Userid : UserId,
      Formid : FormId,
       Childid : ChildId
    };   

    return this.http.post(this.apiUrlGet, body);
  }

  saveSortingData(sortingData: any): Observable<any> {
    
    return this.http.post(this.apiUrlSave, sortingData);
  }
}
