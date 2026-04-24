import {
  Component,
  signal,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import {
  ActyDialogData,
  DialogButton,
} from '../../models/message-dialog-data.type';
import { DialogBox } from '../dialogbox/dialogbox';
import { Button } from '../button/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'acty-message-dialog',
  imports: [DialogBox, Button, MatIconModule,TranslateModule,CommonModule],
  templateUrl: './message-dialog.html',
  styleUrl: './message-dialog.scss',
})
export class MessageDialog implements OnDestroy {
  @ViewChild('dialog') dialogBox!: DialogBox;

  data = signal<ActyDialogData | null>(null);

  private hasSubscribedToClose = false;
  private isHandlingButton = false;

  ngAfterViewInit() {
    if (this.dialogBox && !this.hasSubscribedToClose) {
      this.hasSubscribedToClose = true;

      this.dialogBox.dialogClosed.subscribe(() => {
        if (!this.isHandlingButton) {
          const currentData = this.data();
          currentData?.onClose?.();
        }
        this.isHandlingButton = false;
      });
    }
  }

  ngOnDestroy() {
    if (this.dialogBox) {
      this.dialogBox.onClose();
    }
  }

  handleButtonClick(btn: DialogButton) {
    this.isHandlingButton = true;
    btn.callback?.();
  }
}