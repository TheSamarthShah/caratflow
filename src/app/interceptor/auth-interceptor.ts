import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { catchError, EMPTY, from, switchMap, throwError } from 'rxjs';
import { ActyCommon } from 'src/core/services/acty-common';
import { MessageDialogService } from '../../core/services/message-dialog-service';
import { FormStateService } from 'src/core/services/form-state-service';
import { ErrorLogService } from 'src/core/services/error-log-service';
import { notify } from '../../core/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { ConfigDataService } from 'src/core/services/config-data.service';
import { AppInfoService } from '../shared/services/app-info.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const cookieService = inject(CookieService);
  const actyCommonService = inject(ActyCommon);
  const router = inject(Router);
  const msgDialogService = inject(MessageDialogService);
  const formstateservice = inject(FormStateService);
  const AppInfoservice = inject(AppInfoService);
  const toastErrorSerivce = inject(ErrorLogService);
  const translate = inject(TranslateService);
  const configDataService = inject(ConfigDataService);

  const token: string = cookieService.get('seira_jwttoken');
  const refreshtoken: string = cookieService.get('seira_refreshtoken');
  const userid = (() => {
    try {
      return JSON.parse(cookieService.get('seira_user') || '{}')?.userid;
    } catch {
      return undefined;
    }
  })();

  let screenName: string | null = null;

  try {
    const currentRoute = router.routerState.root;
    let activeChild = currentRoute;
    while (activeChild.firstChild) {
      activeChild = activeChild.firstChild;
    }
    if(activeChild.snapshot.params['screen'] != null)
    {
      screenName = activeChild.snapshot.params['screen'] || null;
      if(screenName === 'HistoryScreen'){
        screenName = screenName + '.' + AppInfoservice.getHistoryFormTableName()
      }
    }
    else{
      screenName = activeChild.snapshot.routeConfig?.path ?? ''
    }

  } catch (e) {
  }


  let newBody = req.body || {};
  newBody = {
    ...newBody,
    _UserId: userid,
    _FormId: AppInfoservice.getFormId(),
    _Programnm: AppInfoservice.getFormId() + (translate?.instant(`SCREEN.${screenName}`) ? `-${translate.instant(`SCREEN.${screenName}`)}` : ''),
    _Translation: translate.currentLang,
  };

  // Clone the request to add Authorization header if token exists
  let modifiedReq = req.clone({
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    body: newBody
  });

  return next(modifiedReq).pipe(
    catchError((e) => {
      if (e.error instanceof Blob) {
        const reader = new FileReader();
        let parsedError;
        reader.readAsText(e.error);

        reader.onload = function (event) {
          // Convert the Blob to a text
          const text = event.target?.result as string;
          parsedError = JSON.parse(text);
          if (parsedError.Message || parsedError.Messagecode) {
            const logId = parsedError.Logid;
            const msgText = parsedError.Message ? parsedError.Message : ''; // can be empty for now; later you can call API using messageCode

            const formattedMessage = `ErrorId: ${logId}\n ${msgText}`;
            const result = msgDialogService.show({
              messageData: {message:formattedMessage}, // When e.error.Message is null that time in future Call a API Base on e.error.Logid That give a Message
              header: 'CORE.COMMON.Server_Error',
              buttons: [
                {
                  label: 'Ok',
                  severity: 'primary',
                },
              ],
            });
          }
        };
      } else {
        // 0 is for server unreachable
        if (e.status === 0) {
          setTimeout(() => {
          const result = msgDialogService.show({
            messageData: {message:'Server is unreachable.'},
            header: 'Network Error',
            buttons: [
              {
                label: 'Ok',
                severity: 'primary',
              },
            ],
          });
          });
        }
        // if 401 then try to refresh jwt token else redirect to root url
        else if (e.status === 401) {
          return from(
            // refresh the jwt token
            actyCommonService.getRefreshedJWTToken(refreshtoken)
          ).pipe(
            // use switchMap because next(newReq) is an observable inside an observable
            switchMap((newToken: any) => {
              // Clone the failed request and attach the new token
              const newReq = modifiedReq.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              return next(newReq); // Retry the failed request with new token
            }),
            catchError((err) => {
              actyCommonService.resetGlobalStateManagementServices();
              const baseUrl = (
                document.getElementsByTagName('base')[0]?.href ||
                window.location.origin
              ).replace(/\/$/, '');
              const currentUrl = window.location.href;
              // Extract the part after baseUrl
              const pathSegment = currentUrl
                .replace(baseUrl, '')
                .replace(/^\//, '');

              // Extract the first segment of the current browser path and store it in the `url` signal
              if (!formstateservice.lastRoute) {
                formstateservice.lastRoute = pathSegment;
              }
              // if fails to refresh jwt token then delete cookeis and go to '/'
              cookieService.delete('seira_user', '/');
              cookieService.delete('seira_jwttoken', '/');
              cookieService.delete('seira_refreshtoken', '/');
              //dataChangeDetectedService.dataChangeListReset();

              //Reset configDataService
              configDataService.reset();

              router.navigate(['/login']);
              // router.navigate(['/']);
              return EMPTY;
            })
          );
        }
        // if 500 then there will be an
        else if (e.status === 500 && e.error) {
          const logId = e.error.Logid;
          const msgText = e.error.Message ? e.error.Message : ''; // can be empty for now; later you can call API using messageCode

          let formattedMessage ='';
          if (logId && logId !== '') {
            formattedMessage += `ErrorId: ${logId}\n`;
          }
          formattedMessage += msgText;
          
          const result = msgDialogService.show({
            messageData: {message:formattedMessage}, // When e.error.Message is null that time in future Call a API Base on e.error.Logid That give a Message
            header: 'CORE.COMMON.Server_Error',
            buttons: [
              {
                label: 'Ok',
                severity: 'primary',
              },
            ],
          });
        } else if (e.status === 404 || e.status === 405) {
          const errorId = Date.now().toString();
          const errorLogMessage = e.message;
          // Try to log the error
          const logError = toastErrorSerivce.logErrorToApi(
            errorId!,
            errorLogMessage!
          );
          notify({message:'MESSAGE.COM_E0001', messageheader:`Error : ${errorId}`});
        }
      }
      return throwError(() => e);
    })
  );
};
