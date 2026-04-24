import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MessageDialogService } from './message-dialog-service';
import { CORE_CONFIG } from '../core.config.token';
import { notify } from 'src/core/services/toast.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorLogService {
  http = inject(HttpClient);

  actyDialog = inject(MessageDialogService);
  coreConfig = inject(CORE_CONFIG);

  constructor() {
    this.interceptConsoleErrors();
  }

  private interceptConsoleErrors(): void {
    const originalConsoleError = console.error;

    console.error = async (...args: any[]) => {
      const isHttpError = args.some(
        (arg) => arg && typeof arg === 'object' && 'status' in arg
      );

      // Skip processing for all HTTP errors because they are handled in interpretor.
      // When we reject promises then they do console.error so we need gaurd that case
      if (isHttpError) {
        return;
      }

      // Initialize default values
      let errorId: string | null = null;
      let errorMessage: string | null = null;
      let loggedSuccessfully = true; // to track if something went wrong in logging
      let fullErrorMessage = '';

      originalConsoleError.apply(console, args);

      // If no ErrorId is found, generate a new one
      errorId = Date.now().toString();

      // Always extract full error message for logging
      fullErrorMessage = args
        .map((arg) => {
          if (arg instanceof Error) {
            return arg.message;
          } else if (typeof arg === 'object') {
            return arg.Message || arg.message || JSON.stringify(arg);
          }
          return arg;
        })
        .join(' ');

      const fullLogDetails = args
        .map((arg) => {
          if (arg instanceof Error) {
            // Vital: Use .stack to get the trace for the log
            return arg.stack || arg.message;
          } else if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch (e) {
              return 'Object (circular)';
            }
          }
          return arg;
        })
        .join(' ');

      //UI error message
      errorMessage = fullErrorMessage;

      // Try to log the error
      loggedSuccessfully = await this.logErrorToApi(errorId!, fullLogDetails!);

      // if log success then show toast else there will be a dialog
      if (loggedSuccessfully) {
        notify({
          message: `${errorMessage}`,
          messageheader: `Error : ${errorId}`,
          type: 'error',
        });
      }
    };
  }

  logErrorToApi(errorId: string, args: string): Promise<boolean> {
    const errorDetails = {
      logId: errorId,
      logMessage: args,
    };
    return new Promise((resolve) => {
      this.http.post(this.coreConfig.logErrorAPI, errorDetails).subscribe({
        next: (response) => {
          resolve(true); // Resolve as success
        },
        error: async (err) => {
          // if there is some error in logging then show dialog with error
          await this.actyDialog.show({
            messageData: { message: args },
            header: 'CORE.COMMON.Logging_Failure',
            buttons: [
              {
                label: 'Ok',
                severity: 'primary',
              },
            ],
          });
          resolve(false); // Resolve as failure
        },
      });
    });
  }
}
