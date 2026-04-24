import { Injectable} from '@angular/core';
import { Notification } from 'src/core/components/notification/notification';
import { MessageDisplayOption } from '../models/MessageDisplayOption.type';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  static instance: ToastService | null = null;
   private notificationComponent!: Notification;

  constructor() {
    ToastService.instance = this;
  }

    setNotificationComponent(notification: Notification) {
    this.notificationComponent = notification;
  }

   show(
    options?: MessageDisplayOption,
    position? : | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  ) {
    if (!this.notificationComponent) {
      return;
    }
    this.notificationComponent.notify( options?.message??'', 
                                       options?.messageheader,
                                       options?.type,
                                       position ?? 'top-right',
                                       options?.params
                                      );
  }
}

export function notify(  
   options?: MessageDisplayOption ,
   position?:| 'top-right'  | 'top-left'  | 'bottom-right'  | 'bottom-left'
): void {
  if (!ToastService.instance) {
    throw new Error('ToastService is not initialized yet!');
  }
  ToastService.instance.show(options,position);
}
