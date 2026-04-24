import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { SwapColumns } from '../models/swapcolumns.type';
import { CORE_CONFIG } from '../core.config.token';
@Injectable({
  providedIn: 'root'
})
export class SwapColumnServices {
    http = inject(HttpClient);

    coreConfig = inject(CORE_CONFIG);
    private apiUrlGet = this.coreConfig.getColumnSwapDataAPI;
    private apiUrlSave = this.coreConfig.saveColumnSwapDataAPI;
   getSwapData(UserId: string, FormId: string,childId : string): Observable<any> {
    const url = `${
      this.apiUrlGet
    }`;
    const body = {
      UserId : UserId,
      FormId : FormId,
       ChildId : childId
    };   
    return this.http.post(url, body);
  }
  /**
   * 
   * @param userid 
   * @param formid 
   * @returns promise of swap data fetched from getSwapData
   */
  async getSwapDataOfForm(
    userid: string,
    formid: string,
    childId :string
  ): Promise<Array<SwapColumns>> {
    // always use try..catch when using lastValueFrom and firstValueFrom
    try {
      const res = await firstValueFrom(this.getSwapData(userid, formid, childId));
      if (res.Data?.ColumnSwapData?.length > 0) {
        return res.Data.ColumnSwapData;
      } else {
        return [];
      }
    } catch (err) {
      return [];
    }
  }

  savechanges(SwapData: Array<SwapColumns>): Observable<any> {
    const url = `${
      this.apiUrlSave
    }`;
    const body = {
      records : SwapData
    }
    return this.http.post(url, body);
  }
}