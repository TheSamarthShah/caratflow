import {
  AfterViewInit,
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  Renderer2,
  inject,
  input
} from '@angular/core';

@Directive({
  selector: '[actyMarkWrappedLabels]',
  standalone: true,
  exportAs: 'actyMarkWrappedLabels'
})
export class MarkWrappedLabels implements AfterViewInit, OnDestroy {

  targetClass = input<string>('field-label');
  wrappedClass = input<string>('is-wrapped');

  // Toggle to mark only the first element of a wrapped row
  onlyFirstWrapped = input<boolean>(false);

  // Toggle to enable the index marking logic
  markDirectChildWithIndex = input<boolean>(false);

  // New Input: List of classes to target. 
  // It will apply the index to ALL elements matching these classes found within the item.
  indexTargetClass = input<string[]>([]);

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private ngZone = inject(NgZone);

  private resizeObserver: ResizeObserver | null = null;
  private rafId: number | null = null;

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => {
        this.scheduleCheck();
      });

      this.resizeObserver.observe(this.el.nativeElement);
      this.scheduleCheck();
    });
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private scheduleCheck() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => {
      this.checkChildrenWrapping();
    });
  }

  public checkChildrenWrapping() {
    const container = this.el.nativeElement;
    const children = container.children;

    if (children.length === 0 || container.clientWidth === 0) return;

    // Establish Baseline (Row 1 Top Position)
    const firstItem = children[0] as HTMLElement;
    const baselineTop = firstItem.offsetTop;

    const targetSelector = '.' + this.targetClass();
    const activeClass = this.wrappedClass();
    
    const targetClasses = this.indexTargetClass();

    // Track previous item's top to detect new lines
    let previousTop = baselineTop;
    
    // Counter for items WITHIN a wrapped row
    let wrappedRowItemIndex = 0;

    // 2. Loop and apply classes
    for (let i = 0; i < children.length; i++) {
      const item = children[i] as HTMLElement;
      const currentTop = item.offsetTop;
      
      // A. Is it visually below the first row?
      const isBelowBaseline = currentTop > (baselineTop + 5);

      // B. Is it starting a NEW line compared to the previous item?
      const isStartOfNewRow = Math.abs(currentTop - previousTop) > 5;

      // C. Logic for Counting Items in Wrapped Rows
      if (isBelowBaseline) {
        if (isStartOfNewRow) {
          wrappedRowItemIndex = 1;
        } else {
          wrappedRowItemIndex++;
        }
      } else {
        wrappedRowItemIndex = 0;
      }

      // --- Logic 1: Existing Label Marking ---
      const shouldMarkLabel = isBelowBaseline && (!this.onlyFirstWrapped() || isStartOfNewRow);
      const label = item.querySelector(targetSelector);

      if (label) {
        if (shouldMarkLabel) {
          this.renderer.addClass(label, activeClass);
        } else {
          this.renderer.removeClass(label, activeClass);
        }
      }

      // --- Logic 2: Index Marking (Apply to ALL targets found) ---
      if (this.markDirectChildWithIndex()) {
        
        // 1. Determine which elements to mark
        const elementsToMark: HTMLElement[] = [];

        if (targetClasses.length > 0) {
            // Case A: User provided specific classes. Find EACH one independently.
            targetClasses.forEach(className => {
                const found = item.querySelector('.' + className);
                if (found) {
                    elementsToMark.push(found as HTMLElement);
                }
            });
        } else {
            // Case B: No classes provided. Mark the direct child (item) itself.
            elementsToMark.push(item);
        }

        // 2. Apply logic to all identified elements
        elementsToMark.forEach(targetEl => {
             if (isBelowBaseline) {
                this.renderer.setAttribute(targetEl, 'data-wrapped-index', wrappedRowItemIndex.toString());
                this.renderer.addClass(targetEl, activeClass);
            } else {
                this.renderer.removeAttribute(targetEl, 'data-wrapped-index');
                this.renderer.removeClass(targetEl, activeClass);
            }
        });
      }

      // Update previousTop for the next iteration
      previousTop = currentTop;
    }
  }
}