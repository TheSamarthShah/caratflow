import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[actyFieldHighlight]', // Apply to the parent table/container
  standalone: true
})
export class FieldHighlightDirective {
  private activeLabel: HTMLElement | null = null;
  private readonly HIGHLIGHT_CLASS = 'field-label-focused'; // Define this CSS class

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('focusin', ['$event'])
  onFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;

    // look for the attribute [data-input-for]
    const inputWrapper = target.closest('[data-input-for]');

    if (!inputWrapper) return;

    // Get the unique Field ID
    const fieldId = inputWrapper.getAttribute('data-input-for');

    if (fieldId) {
      this.highlightLabel(fieldId);
    }
  }

  @HostListener('focusout')
  onBlur(): void {
    this.removeHighlight();
  }

  private highlightLabel(fieldId: string): void {
    this.removeHighlight();

    // Find the corresponding Header Label
    // We search for an element with [data-label-for="fieldID"]
    const label = this.el.nativeElement.querySelector(`[data-label-for="${fieldId}"]`);

    if (label) {
      this.renderer.addClass(label, this.HIGHLIGHT_CLASS);
      this.activeLabel = label;
    }
  }

  private removeHighlight(): void {
    if (this.activeLabel) {
      this.renderer.removeClass(this.activeLabel, this.HIGHLIGHT_CLASS);
      this.activeLabel = null;
    }
  }
}