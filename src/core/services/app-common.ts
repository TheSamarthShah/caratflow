import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
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
export class AppCommon {
  router = inject(Router);
  cryptoService = inject(CryptoService);
  http = inject(HttpClient);
  coreConfig = inject(CORE_CONFIG);
  cookieService = inject(CookieService);
  dataChangeDetectedService = inject(DataChangeDetectedService);
  loaderService = inject(LoaderService);
  msgDialogService = inject(MessageDialogService);

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
    
    // Mode is processed internally by redirectParams now, but we'll ensure it passes through
    if (formOpenType == 'open_sameTab') {
      filters = {
                  ...filters,
                  inSameTab: true
                };
      const encodedUrlParams = await this.redirectParams(filters);
      this.router.navigate(
        [`/screen/${screenType}/${screenName}`],
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
      const urlTree = `/screen/${screenType}/${screenName}?params=${encodedUrlParams}`;
      const fullUrl: string = baseHref + urlTree;
      window.open(fullUrl, '_blank', features);
    } else {
      const encodedUrlParams = await this.redirectParams(filters);
      const baseHref: string = (
        document.getElementsByTagName('base')[0]?.href ||
        window.location.origin
      ).replace(/\/$/, ''); // remove tailing backslash
      const urlTree = `/screen/${screenType}/${screenName}?params=${encodedUrlParams}`;
      const fullUrl: string = baseHref + urlTree;
      window.open(fullUrl, '_blank');
    }
  }
}
