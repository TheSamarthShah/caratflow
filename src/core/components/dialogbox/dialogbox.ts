import { CommonModule } from '@angular/common';
import { Component, ElementRef, forwardRef, HostListener, inject, input, model, NgZone, output, signal, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Button } from 'src/core/components/button/button';
import { DialogButton } from 'src/core/models/dialogbutton.type';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom, Subscription, take } from 'rxjs';
import { TabTraverseService } from 'src/core/services/tab-traverse-service';

@Component({
  selector: 'acty-dialog-box',
  templateUrl: './dialogbox.html',
  styleUrl: './dialogbox.scss',
  imports: [
    CommonModule,
    MatIconModule,
    DragDropModule,
    Button,
    TranslateModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DialogBox),
      multi: true
    }
  ]
})

export class DialogBox {
  @ViewChild('dialogBox') dialogBoxRef!: ElementRef<HTMLDivElement>;
  ngZone = inject(NgZone);
  tabTraverseService = inject(TabTraverseService);

  type = input<string>();
  titleColor = input<string>('');
  message = input<string>('');
  messageColor = input<string>('');
  showClose = input<boolean>(false);
  showTitle = input<boolean>(false);
  showFooterButton = input<boolean>(false);
  showIcon = input<boolean>(false);
  buttonPosition = input<'left' | 'center' | 'right'>('right');   // Footer Button Position
  buttons = input<DialogButton[]>();
  isDraggable = input<boolean>(true);
  isDraggableFromBody = input<boolean>(false);
  isResizable = input<boolean>(false);
  width = input<string>('');
  height = input<string>('');
  backgroundAccess = input<boolean>(false);
  position = input<'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'>('center');
  closeOnOutsideClick = input<boolean>(false);
  setCellSummaryPosition = input<{x : number,y : number}>({x :0, y :0});
  hasDefaultTraverse = input<boolean>(true);
  dialogResult = output<string>();
  dialogClosed = output<string>();

  isDialogVisible = signal(false);
  title = model<string | undefined>('');
  iconColor = model<string>('');
  iconName = model<string>('');

  static instance: DialogBox | null = null;

  isDialogRendered = false;
  private resizing = false;
  private resizeDir: string = '';
  private lastX = 0;
  private lastY = 0;
  private traverseSub!: Subscription;
  private static dialogCounter = 0;
  public dialogContextId = `dialog-context-${DialogBox.dialogCounter++}`;

  constructor() {
    DialogBox.instance = this;
  }

  ngOnInit() {
    // If user didn't provide custom values, apply defaults
    if (!this.iconName()) {
      this.iconName.set(this.getDefaultIcon());
    }
    if (!this.iconColor()) {
      this.iconColor.set(this.getDefaultColor());
    }
    if (!this.title()) {
      this.title.set(this.getDefaultTitle(this.type()!));
    }

    if (this.hasDefaultTraverse()) {
      this.traverseSub = this.tabTraverseService.traverseComplete$.subscribe((direction) => {
        if (this.tabTraverseService.isCurrentContext(this.dialogContextId) && this.isDialogVisible()) {
          this.registerForTraverse(direction);
        }
      });
    }

    document.addEventListener('click', this.handleOutsideClick);
  }

  ngOnDestroy() {
    if (this.traverseSub) {
      this.traverseSub.unsubscribe();
    }
  }

  async openDialog(): Promise<void> {
    this.isDialogVisible.set(true);

     await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
      if (this.dialogBoxRef?.nativeElement) {
        this.isDialogRendered = true;
      }

      if (this.hasDefaultTraverse()) {
        this.tabTraverseService.memorizeCurrentFocus();
        this.tabTraverseService.pushContext(this.dialogContextId);
        requestAnimationFrame(() => {
          this.registerForTraverse('forward');
        });
      }
  }

  onButtonClick(btn: DialogButton) {
    if(!btn.avoidDialogCloseOnClick){
      this.onClose();
    }
    this.dialogResult.emit(btn.btnId);
  }

  onClose(reason: string = 'close') {
  if (!this.isDialogVisible()) return;  

  // Blur all active element before close dialog
  (document.activeElement as HTMLElement)?.blur();
  this.isDialogVisible.set(false);
  this.dialogClosed.emit(reason);

  if (this.hasDefaultTraverse()) {
      this.tabTraverseService.popContext();
      this.tabTraverseService.restoreMemorizedFocus();
    }
}

  getDefaultIcon(): string {
    switch (this.type()) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'check_circle';
      default: return 'info';
    }
  }

  getDefaultColor(): string {
    switch (this.type()) {
      case 'error': return '#ff0000';   // Red
      case 'warning': return '#ff9800'; // Orange
      case 'success': return '#4caf50'; // Green
      default: return '#2196f3';        // Blue
    }
  }

  private getDefaultTitle(type: string): string {
    switch (type) {
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      case 'success': return 'Success';
      case 'info': return 'Information';
      default: return '';
    }
  }

  handleOutsideClick = (event: MouseEvent) => {
    if (this.closeOnOutsideClick()) {
      const dialogBox = document.querySelector('.dialog-box');
      if (this.isDialogVisible() && dialogBox && !dialogBox.contains(event.target as Node)) {
        this.onClose();
      }
    }
  }

  initResize(event: MouseEvent | TouchEvent, direction: string, isTouch = false) {
  event.preventDefault();
  event.stopPropagation();

  this.resizing = true;
  this.resizeDir = direction;

  // Get initial position
  if (isTouch) {
    this.lastX = (event as TouchEvent).touches[0].clientX;
    this.lastY = (event as TouchEvent).touches[0].clientY;
    document.addEventListener('touchmove', this.onResizeTouch, { passive: false });
    document.addEventListener('touchend', this.stopResizeTouch);
  } else {
    this.lastX = (event as MouseEvent).clientX;
    this.lastY = (event as MouseEvent).clientY;
    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.stopResize);
  }
}

// Mouse version
private onResize = (event: MouseEvent) => this.resizeHandler(event.clientX, event.clientY);
private stopResize = () => {
  this.resizing = false;
  document.removeEventListener('mousemove', this.onResize);
  document.removeEventListener('mouseup', this.stopResize);
};

// Touch version
private onResizeTouch = (event: TouchEvent) => {
  if (event.touches.length > 0) {
    event.preventDefault();
    this.resizeHandler(event.touches[0].clientX, event.touches[0].clientY);
  }
};
private stopResizeTouch = () => {
  this.resizing = false;
  document.removeEventListener('touchmove', this.onResizeTouch);
  document.removeEventListener('touchend', this.stopResizeTouch);
};

// Common resize handler
private resizeHandler(clientX: number, clientY: number) {
  if (!this.resizing || !this.dialogBoxRef?.nativeElement) return;

  const el = this.dialogBoxRef.nativeElement;
  const dx = clientX - this.lastX;
  const dy = clientY - this.lastY;

  let newWidth = el.offsetWidth;
  let newHeight = el.offsetHeight;
  let newLeft = el.offsetLeft;
  let newTop = el.offsetTop;

  switch (this.resizeDir) {
    case 'right': newWidth += dx; break;
    case 'left': newWidth -= dx; newLeft += dx; break;
    case 'bottom': newHeight += dy; break;
    case 'top': newHeight -= dy; newTop += dy; break;
    case 'top-left': newWidth -= dx; newLeft += dx; newHeight -= dy; newTop += dy; break;
    case 'top-right': newWidth += dx; newHeight -= dy; newTop += dy; break;
    case 'bottom-left': newWidth -= dx; newLeft += dx; newHeight += dy; break;
    case 'bottom-right': newWidth += dx; newHeight += dy; break;
  }

  const minWidth = 200;
  const minHeight = 100;
  newWidth = Math.max(newWidth, minWidth);
  newHeight = Math.max(newHeight, minHeight);

  el.style.width = `${newWidth}px`;
  el.style.height = `${newHeight}px`;
  el.style.left = `${newLeft}px`;
  el.style.top = `${newTop}px`;

  this.lastX = clientX;
  this.lastY = clientY;
}

  getDialogStyles(): any {
    const position = this.setCellSummaryPosition();
    const styles: any = {
      width: this.width() || 'auto',
      height: this.height() || 'auto'
    };

    //set dialog in spesific location based on left and top(x and y)
    //set specific location when x and y is not 0
    if (position?.x !== 0 || position?.y !== 0) {
      styles['left'] = `${position.x}px`;
      styles['top'] = `${position.y}px`;
      styles['position'] = 'absolute'; // Usually required when setting left/top
    }

    return styles;
  }

  private registerForTraverse(direction: 'forward' | 'backward') {
    if (this.dialogBoxRef?.nativeElement) {
      this.tabTraverseService.registerComponent('Custom', this.dialogBoxRef.nativeElement, direction);
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.hasDefaultTraverse() || !this.isDialogVisible()) return;
    if (!this.tabTraverseService.isCurrentContext(this.dialogContextId)) return;

    if (event.repeat) { event.preventDefault(); return; }

    if (event.key === 'Enter' && event.shiftKey) { event.preventDefault(); return; }

    if (event.key === 'Tab' || event.key === 'Enter') {
      const activeEl = document.activeElement as HTMLElement;

      if (event.key === 'Enter' && activeEl) {
        const tag = activeEl.tagName.toLowerCase();
        if (tag !== 'input' && tag !== 'mat-checkbox' &&  tag !== 'mat-radio-button') return;
      }

      event.stopPropagation();
      this.tabTraverseService.checkBoundaryAndTraverse(event);
    }
  }
}
