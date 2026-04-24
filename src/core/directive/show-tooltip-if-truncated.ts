import { Directive, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
  selector: '[actyShowTooltipIfTruncated]',
  standalone: true
})
export class ShowTooltipIfTruncatedDirective implements OnInit {
  private elementRef = inject(ElementRef);
  private matTooltip = inject(MatTooltip, { optional: true });

  ngOnInit(): void {
    // Disable by default so keyboard focus (Tab) does NOT trigger it
    if (this.matTooltip) {
      this.matTooltip.disabled = true;
    }
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    // Safety check: ensure MatTooltip is actually present on this element
    if (!this.matTooltip) return;

    const element = this.elementRef.nativeElement;
    
    // Check if text is overflowing (horizontal or vertical)
    const isTruncated = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;

    // 1. Update the disabled state based on truncation
    if (isTruncated) {
      this.matTooltip.disabled = false;
      
      // 2. If it is truncated, we must manually trigger the show
      //    because MatTooltip's internal hover logic might have already checked 'disabled' 
      //    when it was true (before we flipped it), so it won't show automatically.
      this.matTooltip.show();
    } else {
      // Ensure it remains disabled if it fits
      this.matTooltip.disabled = true;
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.matTooltip) {
      // Hide and re-disable on leave so subsequent focus events don't show it
      this.matTooltip.hide();
      this.matTooltip.disabled = true;
    }
  }
}