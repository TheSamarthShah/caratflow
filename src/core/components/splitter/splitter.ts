import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, ContentChildren, Directive, ElementRef, forwardRef, HostListener, input, OnDestroy, QueryList, ViewChild, output, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// Directive to mark each panel
@Directive({
  selector: '[acty-split-panel]',
  standalone: true,
  host: {
    'class': 'split-panel acty-split-panel',
    '[style.overflow]': '"hidden"'
  }
})
export class SplitPanel {
  size = input<number>(50); // Initial size in percent
  minSize = input<number>(10); // Minimum size in percent

  // Track the last applied size from input
  private _lastInputSize = signal<number>(1);

  constructor(public elementRef: ElementRef) { }

  setFlexBasis(basis: string) {
    this.elementRef.nativeElement.style.flex = basis;
  }

  getCurrentSize(): number {
    return this.size();
  }

  getLastInputSize(): number {
    return this._lastInputSize();
  }

  setLastInputSize(size: number) {
    this._lastInputSize.set(size);
  }
}

@Component({
  selector: 'acty-splitter',
  templateUrl: './splitter.html',
  styleUrl: './splitter.scss',
  imports: [
    CommonModule,
    MatTooltipModule,
    MatIconModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Splitter),
      multi: true
    }
  ]
})
export class Splitter implements AfterContentInit, OnDestroy {
  @ViewChild('splitContainer', { static: true }) splitContainer!: ElementRef;  
  @ContentChildren(SplitPanel, { descendants: false }) panels!: QueryList<SplitPanel>;

  direction = input<'horizontal' | 'vertical'>('horizontal');
  toolTip = input<string | undefined>();
  sizes = input<number[]>([]); //Initial all panels size array

  panelSizes: number[] = [];
  sizeChange = output<number[]>();

  private lastAppliedInputSizes: number[] = [];
  private lastAppliedPanelSizes: number[] = [];

  private isDragging = false;
  private draggedSplitterIndex = -1;
  private containerRect!: DOMRect;
  private splitterElements: HTMLElement[] = [];
  private splitterListeners: Array<{ element: HTMLElement, listener: (e: MouseEvent) => void }> = [];
  private rafId: number | null = null;

  constructor(private elRef: ElementRef) { }

  ngAfterContentInit() {
    this.initializeSizes();
    this.createSplitters();

    // React to panel changes
    this.panels.changes.subscribe(() => {
      this.initializeSizes();
      this.createSplitters();
    });

    // Start checking for size input changes
    this.startSizeChangeDetection();
  }

  private startSizeChangeDetection() {
    const checkSizes = () => {
      // Skip size detection while dragging
      if (this.isDragging) {
        this.rafId = requestAnimationFrame(checkSizes);
        return;
      }

      const panelsArray = this.panels.toArray();
      const inputSizes = this.sizes();
      let hasChanged = false;

      if (inputSizes.length > 0) {
        const lengthChanged = inputSizes.length !== this.lastAppliedInputSizes.length;
        const valuesChanged = inputSizes.some((size, index) =>
          this.lastAppliedInputSizes[index] !== size
        );

        hasChanged = lengthChanged || valuesChanged;

        if (hasChanged) {
          this.lastAppliedInputSizes = [...inputSizes];
          this.panelSizes = [...inputSizes];

          // Pad with equal distribution if not enough sizes provided
          if (this.panelSizes.length < panelsArray.length) {
            const remaining = panelsArray.length - this.panelSizes.length;
            const usedSize = this.panelSizes.reduce((sum, size) => sum + size, 0);
            const remainingSize = Math.max(0, 100 - usedSize);
            const equalSize = remainingSize / remaining;

            for (let i = this.panelSizes.length; i < panelsArray.length; i++) {
              this.panelSizes.push(equalSize);
            }
          }

          this.updatePanelSizes();
          this.sizeChange.emit([...this.panelSizes]);
        }
      } else {
        const rawSizes = panelsArray.map(panel => panel.getCurrentSize());
        const allDefaultSize = rawSizes.every(size => size === 50); //Check panels sizes are default or changed manually

        if (!allDefaultSize || this.lastAppliedPanelSizes.length === 0) {
          panelsArray.forEach((panel, index) => {
            const newSize = panel.getCurrentSize();
            const lastAppliedSize = this.lastAppliedPanelSizes[index];

            // Only update if the input size has actually changed
            if (lastAppliedSize !== newSize) {
              this.panelSizes[index] = newSize;
              this.lastAppliedPanelSizes[index] = newSize;
              panel.setLastInputSize(newSize);
              hasChanged = true;
            }
          });

          if (hasChanged) {
            //Check panels sizes are default or changed manually
            const allStillDefault = this.panelSizes.every(size => size === 50);
            if (allStillDefault) {
              // All at default, do equal distribution
              const equalSize = 100 / panelsArray.length;
              this.panelSizes = panelsArray.map(() => equalSize);
              this.lastAppliedPanelSizes = [...this.panelSizes];
              panelsArray.forEach((panel, index) => {
                panel.setLastInputSize(equalSize);
              });
            }

            this.updatePanelSizes();
            this.sizeChange.emit([...this.panelSizes]);
          }
        }
      }

      // Continue checking
      this.rafId = requestAnimationFrame(checkSizes);
    };

    this.rafId = requestAnimationFrame(checkSizes);
  }

  private initializeSizes() {
    if (!this.panels || this.panels.length === 0) return;

    const panelsArray = this.panels.toArray();
    const inputSizes = this.sizes();

    if (inputSizes.length > 0) {
      this.panelSizes = [...inputSizes];
      this.lastAppliedInputSizes = [...inputSizes];

      // Pad with equal distribution if not enough sizes provided
      if (this.panelSizes.length < panelsArray.length) {
        const remaining = panelsArray.length - this.panelSizes.length;
        const usedSize = this.panelSizes.reduce((sum, size) => sum + size, 0);
        const remainingSize = Math.max(0, 100 - usedSize);
        const equalSize = remainingSize / remaining;

        for (let i = this.panelSizes.length; i < panelsArray.length; i++) {
          this.panelSizes.push(equalSize);
          this.lastAppliedInputSizes.push(equalSize);
        }
      }
    } else {
      const rawSizes = panelsArray.map(panel => panel.getCurrentSize());

      //Check panels sizes are default or changed manually
      const allDefaultSize = rawSizes.every(size => size === 50);

      if (allDefaultSize) {
        // All panels are at default - distribute equally
        const equalSize = 100 / panelsArray.length;
        this.panelSizes = panelsArray.map(() => equalSize);
      } else {
        // User set custom sizes, use them
        this.panelSizes = [...rawSizes];

        // Normalize if they don't sum to 100%
        const totalSize = this.panelSizes.reduce((sum, size) => sum + size, 0);
        if (totalSize > 0 && Math.abs(totalSize - 100) > 0.01) {
          this.panelSizes = this.panelSizes.map(size => (size / totalSize) * 100);
        }
      }

      this.lastAppliedPanelSizes = [...this.panelSizes];
      panelsArray.forEach((panel, index) => {
        panel.setLastInputSize(this.panelSizes[index]);
      });
    }

    // Apply flex basis to each panel
    this.updatePanelSizes();

    this.sizeChange.emit([...this.panelSizes]);
  }

  private updatePanelSizes() {
    const panelsArray = this.panels.toArray();
    panelsArray.forEach((panel, index) => {
      if (index === panelsArray.length - 1) {
        const totalPreviousSize = this.panelSizes
          .slice(0, index)
          .reduce((sum, size) => sum + size, 0);
        panel.setFlexBasis(`1 1 calc(100% - ${totalPreviousSize}%)`);
      } else {
        panel.setFlexBasis(`0 0 ${this.panelSizes[index] || 50}%`);
      }
    });
  }

  private createSplitters() {
    // Clean up old listeners
    this.splitterListeners.forEach(({ element, listener }) => {
      element.removeEventListener('mousedown', listener as EventListener);
    });
    this.splitterListeners = [];

    // Remove existing splitters
    const container = this.splitContainer.nativeElement;
    const existingSplitters = container.querySelectorAll('.splitter');
    existingSplitters.forEach((s: Element) => s.remove());

    // Wait for next tick to ensure panels are rendered
    setTimeout(() => {
      const panelsArray = this.panels.toArray();
      for (let i = 0; i < panelsArray.length - 1; i++) {
        const splitter = this.createSplitterElement(i);
        const nextPanel = panelsArray[i + 1].elementRef.nativeElement;
        container.insertBefore(splitter, nextPanel);
      }
    }, 0);
  }

  private createSplitterElement(index: number): HTMLElement {
    const splitter = document.createElement('div');
    splitter.className = 'splitter';
    if (this.direction() === 'vertical') {
      splitter.classList.add('vertical');
    }

    // Add inline critical styles to ensure visibility
    splitter.style.cssText = this.direction() === 'vertical'
      ? `
        background: var(--theme-surface-100);
        height: 5px;
        width: 100%;
        cursor: row-resize;
        user-select: none;
        position: relative;
        flex-shrink: 0;
      `
      : `
        background: var(--theme-surface-100);
        width: 5px;
        cursor: col-resize;
        user-select: none;
        position: relative;
        flex-shrink: 0;
      `;

    const icon = document.createElement('div');
    icon.className = 'split-icon';
    icon.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: ${this.direction() === 'vertical' ? 'row' : 'column'};
      align-items: center;
      justify-content: center;
      gap: var(--theme-spacing-small, 2px);
    `;

    // Create spans with inline styles
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.style.cssText = `
        display: block;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--theme-inverse, #666);
        opacity: 0.6;
      `;
      icon.appendChild(span);
    }

    splitter.appendChild(icon);

    const listener = (e: MouseEvent) => {
      this.startDragging(e, index);
    };
    splitter.addEventListener('mousedown', listener);

    // Track the listener for cleanup
    this.splitterListeners.push({ element: splitter, listener });

    // Add tooltip if provided
    if (this.toolTip()) {
      splitter.setAttribute('title', this.toolTip()!);
    }

    return splitter;
  }

  startDragging(event: MouseEvent, splitterIndex: number) {
    this.isDragging = true;
    this.draggedSplitterIndex = splitterIndex;
    const container = this.elRef.nativeElement.querySelector('.split-container');
    this.containerRect = container.getBoundingClientRect();
    event.preventDefault();
  }
  
  @HostListener('document:mousemove', ['$event'])
  onDrag(event: MouseEvent) {
    if (!this.isDragging || this.draggedSplitterIndex === -1) return;

    const leftPanelIndex = this.draggedSplitterIndex;
    const rightPanelIndex = this.draggedSplitterIndex + 1;

    let offset: number;

    if (this.direction() === 'horizontal') {
      offset = event.clientX - this.containerRect.left;
    } else {
      offset = event.clientY - this.containerRect.top;
    }

    const containerSize = this.direction() === 'horizontal' ? this.containerRect.width : this.containerRect.height;
    const offsetPercent = (offset / containerSize) * 100;

    // Calculate the total size of panels before the dragged splitter
    const sizeBefore = this.panelSizes
      .slice(0, leftPanelIndex)
      .reduce((sum, size) => sum + size, 0);

    const leftPanel = this.panels.toArray()[leftPanelIndex];
    const rightPanel = this.panels.toArray()[rightPanelIndex];

    const leftMinSize = leftPanel.minSize();
    const rightMinSize = rightPanel.minSize();

    // The combined size of left + right panels (this is what we're redistributing)
    const combinedSize = this.panelSizes[leftPanelIndex] + this.panelSizes[rightPanelIndex];

    // Calculate new left panel size
    let newLeftSize = offsetPercent - sizeBefore;

    // Constrain to min/max based on the COMBINED size of just these two panels
    const maxLeftSize = Math.min(combinedSize - rightMinSize, 100 - sizeBefore - rightMinSize);
    newLeftSize = Math.max(leftMinSize, Math.min(newLeftSize, maxLeftSize));
    // Calculate new right panel size
    const newRightSize = combinedSize - newLeftSize;

    // Update sizes
    this.panelSizes[leftPanelIndex] = newLeftSize;
    this.panelSizes[rightPanelIndex] = newRightSize;

    this.updatePanelSizes();
    this.sizeChange.emit([...this.panelSizes]);
  }

  @HostListener('document:mouseup')
  stopDragging() {
    if (this.isDragging) {
      this.isDragging = false;
      this.draggedSplitterIndex = -1;
      
      // Update the last input sizes after dragging completes
      const panelsArray = this.panels.toArray();
      panelsArray.forEach((panel, index) => {
        panel.setLastInputSize(this.panelSizes[index]);
      });
    }
  }

  ngOnDestroy() {
    // Clean up event listeners
    this.splitterListeners.forEach(({ element, listener }) => {
      element.removeEventListener('mousedown', listener as EventListener);
    });

    // Cancel animation frame
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }
}