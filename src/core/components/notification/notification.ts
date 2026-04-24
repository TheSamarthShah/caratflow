import { CommonModule } from '@angular/common';
import { Component, inject, input, Input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ActyCommon } from '../../services/acty-common';
import { Button } from '../button/button';

@Component({
  selector: 'acty-notify',
  imports: [
    CommonModule,
    MatIconModule,
    TranslateModule,
    Button
  ],
  templateUrl: './notification.html',
  styleUrl: './notification.scss'
})
export class Notification {
  actyCommonService = inject(ActyCommon);
  toasts = signal<any[]>([]);
  positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

  notify(message: string, header?: string, type?: 'success' | 'error' | 'info' | 'warning', position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right', params?: any[] | Record<string, any>) {

    const isDuplicate = this.toasts().some(t => t.message === message);
    if (isDuplicate) return;

    if (!type) {
      type = this.actyCommonService.getTypeFromMsgCode(message);
    }
    const toast = { type, message, header, position, params };
    this.toasts.set([...this.toasts(), toast]);

    // Auto-remove after 3s
    setTimeout(() => this.removeToast(toast), 3000);
  }

  removeToast(toast: any) {
    this.toasts.set(this.toasts().filter(t => t !== toast));
  }
}
