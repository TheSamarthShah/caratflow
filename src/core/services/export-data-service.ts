import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { FILTER } from '../models/filter.type';
import { gridColumnHeaderMetaData } from '../models/grid.type';
import { GridServices } from './grid-services';
import { API_ENDPOINTS } from 'src/app/shared/api-endpoints';
import { notify } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ExportDataService {
  http = inject(HttpClient);
  getDataService = inject(GridServices);

  /**
   *
   * @param filterData for search data which is used under the hood
   * @param gridColumnNameAndDisplayNameList for exporting only the visible columns
   * @param fileType for deciding weather to export csv or txt
   * @param exportURL is form's export url
   * @param userId for fetching user wise sorting data for current form
   * @param formId for fetching user wise sorting data for current form
   * @param additionalSearchData
   * @returns
   */
  exportData(
    filterData: Array<FILTER> | undefined,
    gridColumnNameAndDisplayNameList: Array<gridColumnHeaderMetaData>,
    fileType: string,
    additionalSearchData : string,
    screenName : string,
    apiObjectName : string,
    getDataMethod : string,
    relationList : any,
    currPkData : any
  ): Observable<Blob | null> {
     const apiUrl = API_ENDPOINTS.BASE + API_ENDPOINTS.CORE.EXPORT_DATA.EXPORT;
    
    const Searchdata = this.getDataService.createBodyObj(filterData);


    const body = {
      searchData:  (Object.keys(currPkData ?? {}).length > 0) ? currPkData : (Searchdata ?? {}),
      screenName : screenName,
      apiObjectName : apiObjectName,
      getDataMethod : getDataMethod,
      relationList : relationList,
      gridColumnNameAndDisplayNameList: gridColumnNameAndDisplayNameList,
      fileType: fileType,
      AdditionalData : additionalSearchData
    };

    return this.http.post(apiUrl, body, { responseType: 'blob' }).pipe(
      map((blob) => {
        // if the file is empty then show message and throw error so that file wont be downloaded
        // Need to do the check here because for blob data we need to specify { responseType: 'blob' } and if we do that we can't pass json.
        // If we pass json then .subscribe will give error.
        if (!blob || blob.size === 0) {
          notify({ message: 'MESSAGE.COM_I0001' });
          return null;
        }else{
        return blob;
        }
      })
    );
  }
}
