import { AfterViewInit, Directive, ElementRef, HostListener, NgZone, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

@Directive({
  selector: '[actySelectOnFocus]'
})
export class SelectOnFocus implements AfterViewInit {
  private inputElement: HTMLInputElement | null = null;

  constructor(
    private el: ElementRef, 
    private ngZone: NgZone
  ) {}

  async ngAfterViewInit(): Promise<void> {
    // This waits for Angular to finish rendering all nested components
    // ensuring the inner <input> tag actually exists in the DOM.
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));

    this.findInputElement();
  }

  private findInputElement() {
    if (this.el.nativeElement.tagName === 'INPUT') {
      this.inputElement = this.el.nativeElement;
    } else {
      this.inputElement = this.el.nativeElement.querySelector('input');
    }
  }

  @HostListener('focusin')
  onFocus(): void {
    if (!this.inputElement) return;
    // Selecting text is a UI-only operation. 
    // We do NOT want to trigger a Change Detection cycle here so use runOutsideAngular.
    this.ngZone.runOutsideAngular(() => {
      
      // Keep setTimeout because of browser quirks (especially Safari/iOS)
      // where the selection is cleared if done immediately during the event.
      setTimeout(() => {
        // FIX: Check if this element is STILL the focused element.
        // If the user tabbed away fast, 'activeElement' will be the NEXT input, 
        // so we skip the select() to avoid stealing focus back.
        if (document.activeElement === this.inputElement) {
          this.inputElement?.select();
        }
      }, 0);
      
    });
  }
}