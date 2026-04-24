import { HttpClient } from '@angular/common/http';
import { ElementRef, inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { CORE_CONFIG } from '../core.config.token';
import { DataChangeDetectedService } from './data-change-detected-service';
import { LoaderService } from './loader-service';
import { MessageDialogService } from './message-dialog-service';
import { notify } from 'src/core/services/toast.service';
import { MessageResponseModel } from '../models/MessageResponseModel.type';
import { DialogButton } from '../models/message-dialog-data.type';
import { Router } from '@angular/router';
import { CryptoService } from './crypto-encrypt-decrypt-service';

@Injectable({
  providedIn: 'root',
})
export class ActyCommon {
  router = inject(Router);
  cryptoService = inject(CryptoService);
  http = inject(HttpClient);
  coreConfig = inject(CORE_CONFIG);
  cookieService = inject(CookieService);
  dataChangeDetectedService = inject(DataChangeDetectedService);
  loaderService = inject(LoaderService);
  msgDialogService = inject(MessageDialogService);

  //for getting userid
  getUserId() : string | null{
    return JSON.parse(this.cookieService.get('seira_user') || '{}')?.userid;;
  }

  getRefreshedJWTToken(
    refreshToken: string
  ): Observable<string> {
    const url = this.coreConfig.refreshTokenAPI;
    const body = {
      RefreshToken: refreshToken
    };

    return this.http.post<any>(url, body).pipe(
      map((res) => {
        if (res.Messagecode === null && res.Message === null) {
          const newToken = res.Data.jwttoken;

          // Save token in cookie
          this.cookieService.set('seira_jwttoken', newToken, {
            path: '/',
            sameSite: 'Lax',
            secure: true,
          });

          return newToken;
        } else {
          throw new Error('Failed to refresh token');
        }
      })
    );
  }

  /**
   * Converts the given input to a UTC ISO date string.
   *
   * @param input - A Date object or a date string.
   * @param includeTime - Whether to include the time component in the output. Defaults to false.
   * @returns A UTC ISO date string or null if input is invalid.
   */
  getUtcIsoDate = (input: any, includeTime: boolean = false): string | null => {
    if (!input) return null;

    let date: Date;

    if (input instanceof Date) {
      date = input;
    } else {
      date = new Date(input);
      // Return null if the date is invalid
      if (isNaN(date.getTime())) return null;
    }

    // Extract the UTC-relevant parts
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    if (includeTime) {
      // Extract time components if needed
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const millis = date.getMilliseconds();

      // Create a new UTC date with time
      const utcDate = new Date(
        Date.UTC(year, month, day, hours, minutes, seconds, millis)
      );
      return utcDate.toISOString();
    } else {
      // Create a new UTC date without time (00:00:00)
      const utcDate = new Date(Date.UTC(year, month, day));
      return utcDate.toISOString();
    }
  };
  /**
 * Determines the message type based on a message code.
 *
 * @param code - The message code string (e.g., "MESSAGE_S001", "MESSAGE_E002").
 * @returns The message type corresponding to the code prefix:
 *          - `'success'` if code contains "_S"
 *          - `'error'` if code contains "_E"
 *          - `'warning'` if code contains "_W"
 *          - `'info'` otherwise or when input is invalid
 */
  getTypeFromMsgCode(code: string): 'success' | 'error' | 'info' | 'warning' {
    //  Validate input
    if (!code) return 'info';


    //  Split by underscore ("_")
    const parts = code.split('_');
    if (parts.length < 2) return 'info'; // default type

    //  Get first character after underscore and match type
    const typeChar = parts[parts.length-1].charAt(0).toUpperCase(); // e.g. I, S, E, W

    switch (typeChar) {
      case 'S':
        return 'success';
      case 'E':
        return 'error';
      case 'W':
        return 'warning';
      case 'I':
        return 'info';
      default:
        return 'info';
    }
  }

  resetGlobalStateManagementServices(): void{
    this.loaderService.destroy();
    this.dataChangeDetectedService.dataChangeListReset();
    this.dataChangeDetectedService.netRowChangeCounterReset();
  }

  async displayMessage(res: MessageResponseModel,screenName : string): Promise<number | null> {
    if (!res) return null;

    const type = res.MsgDispType ?? 2; // default toast if null

    if (type === 1) {
      //  Show Dialog
       const result = await this.msgDialogService.show({
        messageData: {message: res.Message,type:this.getTypeFromMsgCode(res.Messagecode) },
        messagePrifixIcon:this.getmessagePrifixIconName(res.Messagecode),
        header: 'SCREEN.'+screenName,
        buttons:this.getButtonsByMessageCode(res.Messagecode)
      });
      return result;
    } else if (type === 2) {
      // Show Toast
      notify({message: res.Message ?? res.Messagecode});
      return null;
    } else {
      //  fallback safety
      notify({message: res.Message ?? res.Messagecode});
      return null ;
    }
  }

  private getButtonsByMessageCode(messageCode: string):DialogButton[] {
    const parts = messageCode.split('_');    

    //  Get first character after underscore and match type
    const typeChar = parts[parts.length-1].charAt(0).toUpperCase();    

    if (typeChar == 'C') {
      return [        
        {
          label: 'CORE.DefaultDisplayMessage.YesBtn',
          severity: 'primary',
        },
        {
          label: 'CORE.DefaultDisplayMessage.NoBtn',
          severity: 'primary',
        },
      ];
    }

    // Default → Single button
    return [
      {
        label: 'CORE.DefaultDisplayMessage.OkBtn',
        severity: 'primary',
      },
    ];
  }

  private getmessagePrifixIconName(messageCode: string):string{
    
    const parts = messageCode.split('_');    

    //  Get first character after underscore and match type
    const typeChar = parts[parts.length-1].charAt(0).toUpperCase();  
    switch (typeChar) {
      case 'S':
        return 'check_circle';
      case 'E':
        return 'cancel';
      case 'W':
        return 'warning';
      case 'I':
        return 'info';
      case 'C':
        return 'help';
      default:
        return 'info';
    }
  }
  
  async redirectParams(
    filters?: Record<string, any>
  ): Promise<string> {
    const dataToProcess = { ...filters };
 
    // Combine mode and the other parameters into a single object for encryption
    const urlParams = {
      ...dataToProcess
    };
 
    const encryptedData = await this.cryptoService.encryptData(urlParams);
    return btoa(encryptedData);
  }

   async redirect(formOpenType: string, screenType: string, screenName: string, filters?: Record<string, any>): Promise<void> {
    
    const screenPath = screenType ? `/screen/${screenType}/${screenName}` : `/screen/${screenName}`;

    // Mode is processed internally by redirectParams now, but we'll ensure it passes through
    if (formOpenType == 'open_sameTab') {
      filters = {
                  ...filters,
                  inSameTab: true
                };
      const encodedUrlParams = await this.redirectParams(filters);
      this.router.navigate(
        [screenPath],
        {
          queryParams: { params: encodedUrlParams },
        }
      );
    } else if (
      formOpenType == 'open_newWindow'
    ) {
      const encodedUrlParams = await this.redirectParams(filters);
      const features = `
      width=screen.availWidth,
      height=screen.availHeight,
    `.replace(/\s+/g, '');
      const baseHref: string = (
        document.getElementsByTagName('base')[0]?.href ||
        window.location.origin
      ).replace(/\/$/, ''); // remove tailing backslash
      const urlTree = `${screenPath}?params=${encodedUrlParams}`;
      const fullUrl: string = baseHref + urlTree;
      window.open(fullUrl, '_blank', features);
    } else {
      const encodedUrlParams = await this.redirectParams(filters);
      const baseHref: string = (
        document.getElementsByTagName('base')[0]?.href ||
        window.location.origin
      ).replace(/\/$/, ''); // remove tailing backslash
      const urlTree = `${screenPath}?params=${encodedUrlParams}`;
      const fullUrl: string = baseHref + urlTree;
      window.open(fullUrl, '_blank');
    }
  }

  adjustSplitterSizeForEntry(
    splitterContainer: ElementRef<any>,
    headerContent: ElementRef<any>,
    activeTabId : string = '',
    minRowSize : number = 4
  ): number[] | null {
    // Safety check: ensure the main elements are loaded
    if (
      !splitterContainer?.nativeElement ||
      !headerContent?.nativeElement
    ) {
      return null;
    }

    const containerEle = splitterContainer.nativeElement;
    const filterRoot = headerContent.nativeElement;
    
    // 1. Find the necessary containers
    const activeTab = filterRoot?.querySelector('.'+activeTabId);
    const groupContainer = activeTab?.querySelector('.group-container');
    const tabHeaderContainer = filterRoot.querySelector('.acty-tab-header');
    const formWrapperClass = filterRoot.querySelector('.entry-form-content'+activeTabId);

    if (!groupContainer) {
      return null;
    }

    // 2. Calculate height for max 5 group-rows
    const groupRows = groupContainer.querySelectorAll('.group-row');
    let targetGroupHeight = 0;

    if (groupRows.length > 0) {
      // We take the minimum of 5 or the actual number of rows present
      const rowsToMeasure = Math.min(groupRows.length, minRowSize);
      // Sum up the height of the first N rows
      for (let i = 0; i < rowsToMeasure; i++) {
        targetGroupHeight += (groupRows[i] as HTMLElement).offsetHeight;
      }

      // Optional: If you have gaps/margins between rows not captured by offsetHeight,
      // you might need to add them here.
    } else {
      // Fallback if no rows exist yet
      targetGroupHeight = groupContainer.offsetHeight;
    }

    // 3. Get Heights
    const containerHeight = containerEle.offsetHeight;

    //get a gap
    let gap = 0;
    if (groupRows.length > 1) {
      const firstRow = groupRows[0] as HTMLElement;
      const secondRow = groupRows[1] as HTMLElement;

      gap = secondRow.offsetTop - (firstRow.offsetTop + firstRow.offsetHeight);
    }
    const totalGap = gap * (Math.min(groupRows.length, minRowSize) - 1);

    //get scroll heigth
    const hasHorizontalScroll = formWrapperClass.scrollWidth > formWrapperClass.clientWidth;
    const scrollbarHeight = hasHorizontalScroll ? formWrapperClass.offsetHeight - formWrapperClass.clientHeight : 0;

    // Use targetGroupHeight (capped at 5 rows) instead of the full groupContainer height
    const contentHeight =
      targetGroupHeight +
      (minRowSize === 0 ? 0 : 2) +
      (tabHeaderContainer?.offsetHeight ?? 0) + scrollbarHeight;
      

    if (containerHeight > 0) {
      // 4. Calculate Percentage
      let headerPercent = ((contentHeight) / containerHeight) * 100;

      headerPercent = headerPercent;

      return [headerPercent, 100 - headerPercent];
    }

    return null;
  }

  adjustFilterSplitterSize(
    splitterContainer: ElementRef<any>,
    filterComponentEle: ElementRef<any>,
    minRowSize: number = 4
  ): number[] | null {
    // Safety check: ensure the main elements are loaded
    if (
      !splitterContainer?.nativeElement ||
      !filterComponentEle?.nativeElement
    ) {
      return null;
    }

    const containerEle = splitterContainer.nativeElement;
    const filterRoot = filterComponentEle.nativeElement;

    // 1. Find the necessary containers
    const groupContainer = filterRoot.querySelector('.group-container');
    const buttonContainer = filterRoot.querySelector('.basic-search-contianer');
    const advancedSearchBtns = filterRoot.querySelector('.advanced-search-btn-container');
    const fixedFilterButtonContainer = filterRoot.querySelector('.fixedFilterButtons');
    const breadCrumContainer = filterRoot.querySelector('.acty-tab-header');
    const filterWrapperContainer = filterRoot.querySelector('.filter-wrapper');
    const advancedSearchFormContainer = filterRoot.querySelector('.advanced-search-form-container');


    let offSetHeightValue : number = 0;
    let isAdvancedSearch : boolean = false;
    //for the global search 
    if(buttonContainer?.offsetHeight && buttonContainer?.offsetHeight !== 0){
      offSetHeightValue = buttonContainer?.offsetHeight
    }
    //for adavnce search in Materil filter
    else if(advancedSearchBtns?.offsetHeight && advancedSearchBtns?.offsetHeight !== 0) {
      offSetHeightValue = advancedSearchBtns?.offsetHeight;
      isAdvancedSearch = true;
    }
    //for reference screen as well as condition settings button's continer
    else if(fixedFilterButtonContainer?.offsetHeight && fixedFilterButtonContainer?.offsetHeight !== 0){
      offSetHeightValue = fixedFilterButtonContainer?.offsetHeight
      isAdvancedSearch = true;
    }

    // if (!groupContainer && !breadCrumContainer && !buttonContainer) {
    if (!groupContainer && !breadCrumContainer) {
      return null;
    }

    // 2. Calculate height for max 5 group-rows
    const groupRows = groupContainer.querySelectorAll('.group-row');
    let targetGroupHeight = 0;

    if (groupRows.length > 0) {
      // We take the minimum of 5 or the actual number of rows present
      const rowsToMeasure = Math.min(groupRows.length, minRowSize);
      // Sum up the height of the first N rows
      for (let i = 0; i < rowsToMeasure; i++) {
        targetGroupHeight += (groupRows[i] as HTMLElement).offsetHeight;
      }

      // Optional: If you have gaps/margins between rows not captured by offsetHeight,
      // you might need to add them here.
    } else {
      // Fallback if no rows exist yet
      targetGroupHeight = groupContainer.offsetHeight;
    }

    // 3. Get Heights
    const containerHeight = containerEle.offsetHeight;

     // 4. Calculate Scrollbar Height SYNCHRONOUSLY
    let scrollbarHeight = 0;
    if (filterWrapperContainer && !isAdvancedSearch) {
      const hasHorizontalScroll = filterWrapperContainer.scrollWidth > filterWrapperContainer.clientWidth;
      // Calculate the actual height taken by the horizontal scrollbar
      scrollbarHeight = hasHorizontalScroll 
        ? filterWrapperContainer.offsetHeight - filterWrapperContainer.clientHeight 
        : 0;
    }
    else if(isAdvancedSearch && advancedSearchFormContainer){
      const hasHorizontalScroll = advancedSearchFormContainer.scrollWidth > advancedSearchFormContainer.clientWidth;
      // Calculate the actual height taken by the horizontal scrollbar
      scrollbarHeight = hasHorizontalScroll 
        ? advancedSearchFormContainer.offsetHeight - advancedSearchFormContainer.clientHeight 
        : 0;
    }
    // Use targetGroupHeight (capped at 5 rows) instead of the full groupContainer height
    const contentHeight =
      targetGroupHeight +
      (breadCrumContainer?.offsetHeight ?? 0) +
      offSetHeightValue + 
      scrollbarHeight +
      (minRowSize === 0 ? 0 : 2);
      

    if (containerHeight > 0) {
      // 4. Calculate Percentage
      let headerPercent = (contentHeight / containerHeight) * 100;

      headerPercent = headerPercent;

      return [headerPercent, 100 - headerPercent];
    }

    return null;
  }
}
