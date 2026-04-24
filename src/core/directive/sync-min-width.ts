import { AfterViewInit, Directive, ElementRef, input, Input, OnChanges, OnDestroy, Renderer2, SimpleChanges } from '@angular/core';
import { Languages } from '../models/languages.config';

@Directive({
  selector: '[actySyncMinWidth]'
})
export class SyncMinWidth implements OnChanges, AfterViewInit, OnDestroy {

  @Input('actySyncMinWidth') key!: string;

  readonly currLanguage = input<Languages>('en');

  private static elementGroups = new Map<string, ElementRef[]>();
  
  // Store the animation frame ID so we can cancel it if needed
  private frameId?: number;
  private resizeListener?: () => void;

  constructor(private el: ElementRef, private renderer: Renderer2) { }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Re-sync when language changes (skip firstChange, AfterViewInit handles it)
    if (changes['currLanguage'] && !changes['currLanguage'].firstChange) {
      this.scheduleSync();
    }
  }

  ngAfterViewInit(): void {
    if (!this.key) return;

    // Add current element to its group
    const group = SyncMinWidth.elementGroups.get(this.key) || [];
    group.push(this.el);
    SyncMinWidth.elementGroups.set(this.key, group);

    // Use requestAnimationFrame instead of setTimeout
    // This ensures calculation runs before the next repaint
    this.scheduleSync();

    // Listen to resize events
    // We use scheduleSync which effectively throttles this to the frame rate
    this.resizeListener = this.renderer.listen('window', 'resize', () => {
      this.scheduleSync();
    });
  }

  ngOnDestroy(): void {
    // Cancel any pending frame
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }

    if (!this.key) return;

    // Remove element from group
    const group = SyncMinWidth.elementGroups.get(this.key);
    if (!group) return;

    const index = group.indexOf(this.el);
    if (index !== -1) group.splice(index, 1);

    // If group is empty, clean up the global variable
    if (group.length === 0) {
      document.documentElement.style.removeProperty(`--${this.key}-min-width`);
      SyncMinWidth.elementGroups.delete(this.key);
    } else {
      // Recalculate remaining items
      this.scheduleSync();
    }

    // Remove resize listener
    if (this.resizeListener) {
      this.resizeListener();
      this.resizeListener = undefined;
    }
  }

  private scheduleSync(): void {
    // Cancel previous frame if it hasn't run yet to avoid stacking calculations
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }

    this.frameId = requestAnimationFrame(() => {
      this.syncWidths();
      this.frameId = undefined;
    });
  }

  private syncWidths(): void {
    const group = SyncMinWidth.elementGroups.get(this.key);
    if (!group || group.length === 0) return;

    const varName = `--${this.key}-min-width`;

    // 1. Remove the variable. 
    // Because we are in a RequestAnimationFrame, this won't trigger a visual paint 
    // until this function finishes.
    document.documentElement.style.removeProperty(varName);

    // 2. Force Layout / Reflow.
    // Measuring offsetWidth forces the browser to calculate the natural layout immediately.
    const maxWidth = Math.max(
      ...group.map(el => el.nativeElement.offsetWidth || 0)
    );

    // 3. Set the Global CSS Variable
    document.documentElement.style.setProperty(varName, `${maxWidth}px`);
  }
}