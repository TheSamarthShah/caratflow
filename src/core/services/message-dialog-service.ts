import { Injectable, ApplicationRef, createComponent, EnvironmentInjector, ComponentRef, inject } from '@angular/core';
import { ActyDialogData, TrackedDialog } from '../models/message-dialog-data.type';
import { MessageDialog } from '../components/message-dialog/message-dialog';

@Injectable({
  providedIn: 'root'
})
export class MessageDialogService {
  appRef = inject(ApplicationRef);
  injector = inject(EnvironmentInjector);

  private activeDialogs: TrackedDialog[] = [];

  /**
   * Show dialog which return promise with button index
   *
   * @param data
   * @returns button index (starts from 0)
   */
  async show(data: ActyDialogData): Promise<number> {
    const header = data.header;
    const message = data.messageData?.message;

    // Check if a dialog with the same header and message is CURRENTLY open (and not closing)
    const isDuplicate = this.activeDialogs.some(tracked => {
      const sameHeader = tracked.header === header;
      const sameMessage = tracked.message === message;
      const match = sameHeader && sameMessage && !tracked.isClosing;
      return match;
    });

    // If duplicate found, return immediately without creating a new dialog
    if (isDuplicate) {
      return Promise.resolve(-1);
    }

    return new Promise((resolve) => {
      // Create component dynamically
      const componentRef = createComponent(MessageDialog, {
        environmentInjector: this.injector
      });

      // Attach to application
      this.appRef.attachView(componentRef.hostView);
      const domElem = componentRef.location.nativeElement;
      document.body.appendChild(domElem);

      // Track active dialog with its metadata
      const trackedDialog: TrackedDialog = {
        componentRef,
        header,
        message,
        isClosing: false
      };
      this.activeDialogs.push(trackedDialog);

      // Flag to ensure resolve is only called once
      let resolved = false;
      const resolveOnce = (value: number) => {
        if (!resolved) {
          resolved = true;
          resolve(value);
        }
      };

      // Apply default 'secondary' severity if none provided
      const buttons = (data.buttons ?? []).map((btn, index) => ({
        ...btn,
        label: btn.label,
        severity: btn.severity || 'secondary', // Default class
        callback: () => {
          btn.callback?.();
          this.closeDialog(trackedDialog);
          resolveOnce(index);
        },
      }));

      // By default one button of OK will be there in dialog
      if (buttons.length === 0) {
        buttons.push({
          label: 'OK',
          severity: 'primary',
          callback: () => {
            this.closeDialog(trackedDialog);
            resolveOnce(0);
          },
        });
      }

      const onCloseCallback = () => {
        this.closeDialog(trackedDialog);
        resolveOnce(0);
      };

      // Set the data
      componentRef.instance.data.set({
        ...data,
        buttons,
        onClose: onCloseCallback,
      });

      componentRef.changeDetectorRef.detectChanges();

      // Open dialog after ViewChild is ready
      setTimeout(() => {
        if (componentRef.instance.dialogBox) {
          componentRef.instance.dialogBox.openDialog();
        }
      });
    });
  }

  private closeDialog(trackedDialog: TrackedDialog) {
    // Prevent double-close
    if (trackedDialog.isClosing) {
      return;
    }

    trackedDialog.isClosing = true;
   
    // IMPORTANT: Remove from activeDialogs
    const index = this.activeDialogs.findIndex(d => d === trackedDialog);
    if (index > -1) {
      this.activeDialogs.splice(index, 1);
    }

    // Close the dialog UI
    if (trackedDialog.componentRef?.instance?.dialogBox) {
      trackedDialog.componentRef.instance.dialogBox.onClose();
    }

    // Clean up component
    setTimeout(() => {
      try {
        if (trackedDialog.componentRef) {
          this.appRef.detachView(trackedDialog.componentRef.hostView);
          trackedDialog.componentRef.destroy();
        }
      } catch (error) {}
    });
  }

  // Close all dialogs
  closeAll() {
    // Create a copy to avoid modification during iteration
    const dialogsToClose = [...this.activeDialogs];
    dialogsToClose.forEach(tracked => this.closeDialog(tracked));
  }

  // // Optional: Check if a dialog with specific header/message is currently open
  // hasDialog(header?: string, message?: string): boolean {
  //   return this.activeDialogs.some(tracked => {
  //     const headerMatch = header ? tracked.header === header : true;
  //     const messageMatch = message ? tracked.message === message : true;
  //     return headerMatch && messageMatch && !tracked.isClosing;
  //   });
  // }

  // // Optional: Close dialogs with specific header/message
  // closeByContent(header?: string, message?: string) {
  //   const dialogsToClose = this.activeDialogs.filter(tracked => {
  //     const headerMatch = header ? tracked.header === header : true;
  //     const messageMatch = message ? tracked.message === message : true;
  //     return headerMatch && messageMatch;
  //   });

  //   console.log(`Closing ${dialogsToClose.length} dialogs by content`);
  //   dialogsToClose.forEach(tracked => this.closeDialog(tracked));
  // }

  // // Optional: Get count of active dialogs
  // getActiveDialogCount(): number {
  //   return this.activeDialogs.filter(d => !d.isClosing).length;
  // }

  // // Debug method to see all active dialogs
  // debugActiveDialogs() {
  //   console.log('=== Active Dialogs Debug ===');
  //   console.log('Total count:', this.activeDialogs.length);
  //   this.activeDialogs.forEach((d, i) => {
  //     console.log(`Dialog ${i}:`, {
  //       header: d.header,
  //       message: d.message,
  //       isClosing: d.isClosing,
  //       componentExists: !!d.componentRef,
  //       isDestroyed: (d.componentRef as any)?._destroyed
  //     });
  //   });
  //   console.log('=========================');
  // }
}