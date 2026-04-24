import {
  Directive,
  ElementRef,
  NgZone,
  Renderer2,
  afterNextRender,
  effect,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { Languages } from '../models/languages.config';

@Directive({
  selector: '[actySyncMinWidthObserve]',
  standalone: true,
})
export class SyncMinWidthObserve implements OnDestroy {
  // Signal input replacing @Input (The fallback group ID)
  readonly key = input.required<string>({ alias: 'actySyncMinWidthObserve' });

  // Prefix to prepend to the final key
  readonly keyPrefix = input<string>('');

  // Input for the attribute name to watch (default: 'data-wrapped-index')
  readonly indexAttributeName = input<string>('data-wrapped-index');

  // NEW: Toggle to conditionally enable/disable using the index attribute
  // If false, it ignores the attribute and forces usage of the 'key'
  readonly useIndexAttribute = input<boolean>(false);
  readonly currLanguage = input<Languages>('en');
  readonly triggerChange = input<boolean>(false);

  // Using Set instead of Array for better performance (O(1) lookups/deletes)
  private static elementGroups = new Map<string, Set<HTMLElement>>();

  private resizeListener?: () => void;
  private resizeObserver?: ResizeObserver;
  // MutationObserver is handled via effect
  private syncPending = false;
  private activeKey: string | null = null;

  // Injection token style
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly ngZone = inject(NgZone);

  constructor() {
    // 1. Main Effect: Handle Group Membership Logic
    effect(() => {
      // Register dependencies
      this.key();
      this.keyPrefix();
      this.indexAttributeName();
      this.useIndexAttribute(); // React to the toggle
      
      // Check if we need to switch groups
      // this.updateGroupMembership();
      const trigger = this.currLanguage(); 
      const triggerChange = this.triggerChange();
      this.updateGroupMembership(trigger != null || triggerChange !== null);
    });

    // 2. Observer Effect: specific for MutationObserver to handle dynamic attribute names
    effect((onCleanup) => {
      // Only set up the observer if we are actually using the attribute
      if (!this.useIndexAttribute()) return;

      const attrName = this.indexAttributeName();
      const nativeEl = this.el.nativeElement;

      if (typeof MutationObserver !== 'undefined' && nativeEl) {
        const observer = new MutationObserver(() => {
          this.updateGroupMembership();
        });

        observer.observe(nativeEl, {
          attributes: true,
          attributeFilter: [attrName] // Watch the configured attribute
        });

        onCleanup(() => {
          observer.disconnect();
        });
      }
    });

    // 3. Setup Layout Observers (Resize) once stable
    afterNextRender(() => {
      this.ngZone.runOutsideAngular(() => {
        this.setupObservers();
        // Initial check in case attribute is present on render
        this.updateGroupMembership();
      });
    });
  }

  ngOnDestroy(): void {
    this.cleanupObservers();
    
    // Manual cleanup
    if (this.activeKey) {
      const nativeEl = this.el.nativeElement;
      this.removeFromGroup(this.activeKey, nativeEl);

      if (nativeEl) {
        this.renderer.removeStyle(nativeEl, 'min-width');
      }

      this.ngZone.runOutsideAngular(() => {
        if (this.activeKey) {
           this.syncWidths(this.activeKey);
        }
      });
    }
  }

  // Central logic to decide Group ID
  private updateGroupMembership(forceSync = false) {
    const nativeEl = this.el.nativeElement;
    
    // 1. Check for attribute (Conditional)
    let attrVal: string | null = null;
    
    if (this.useIndexAttribute()) {
      attrVal = nativeEl.getAttribute(this.indexAttributeName());
    }
    
    // 2. Fallback to input signal
    // If attrVal is null (either didn't exist OR useIndexAttribute is false), use key
    const rawKey = attrVal ? attrVal : this.key();
    
    // 3. Apply Prefix
    const prefix = this.keyPrefix() || '';
    const targetKey = prefix + rawKey;

    // If no change, exit
    if (targetKey === this.activeKey) {
      if (forceSync) { 
        //re-sync even if key unchanged
        this.ngZone.runOutsideAngular(() => {
          requestAnimationFrame(() => {
            if (this.activeKey) this.syncWidths(this.activeKey);
          });
        });
      }
      return;
    }

    // --- Switch Groups Logic ---

    // Clean up old group
    if (this.activeKey) {
      this.removeFromGroup(this.activeKey, nativeEl);
      this.renderer.removeStyle(nativeEl, 'min-width');
      
      const oldKey = this.activeKey;
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => this.syncWidths(oldKey));
      });
    }

    // Join new group
    this.activeKey = targetKey;
    if (this.activeKey) {
      this.addToGroup(this.activeKey, nativeEl);

      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          if (this.activeKey) this.syncWidths(this.activeKey);
        });
      });
    }
  }

  private addToGroup(key: string, el: HTMLElement): void {
    if (!key) return;

    if (!SyncMinWidthObserve.elementGroups.has(key)) {
      SyncMinWidthObserve.elementGroups.set(key, new Set());
    }
    const group = SyncMinWidthObserve.elementGroups.get(key)!;

    // Avoid duplicates
    // (Set handles this automatically, but keeping comment/intent)
    group.add(el);
  }

  private removeFromGroup(key: string, el: HTMLElement): void {
    if (!key) return;

    const group = SyncMinWidthObserve.elementGroups.get(key);
    if (!group) return;

    group.delete(el);

    if (group.size === 0) {
      SyncMinWidthObserve.elementGroups.delete(key);
    }
  }

  private setupObservers(): void {
    // Setup window resize listener
    this.resizeListener = this.renderer.listen('window', 'resize', () => {
      this.debouncedSync();
    });

    // Use ResizeObserver for more efficient observation
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.debouncedSync();
      });

      this.resizeObserver.observe(this.el.nativeElement);
    }
  }

  private cleanupObservers(): void {
    if (this.resizeListener) {
      this.resizeListener();
      this.resizeListener = undefined;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }

  private debouncedSync(): void {
    // Debounce using requestAnimationFrame
    if (!this.syncPending && this.activeKey) {
      this.syncPending = true;
      requestAnimationFrame(() => {
        if (this.activeKey) {
            this.syncWidths(this.activeKey);
        }
        this.syncPending = false;
      });
    }
  }

  private syncWidths(key: string): void {
    if (!key) return;

    const group = SyncMinWidthObserve.elementGroups.get(key);
    if (!group || group.size === 0) return;

    // Run the measurement outside Angular zone
    this.ngZone.runOutsideAngular(() => {
      // Remove existing min-width before measuring
      group.forEach((el) => {
        this.renderer.removeStyle(el, 'min-width');
      });

      // Force reflow to get accurate offsetWidth
      let maxWidth = 0;
      group.forEach((el) => {
        const w = el.offsetWidth || 0;
        if (w > maxWidth) maxWidth = w;
      });

      // Apply the uniform min-width
      group.forEach((el) => {
        this.renderer.setStyle(el, 'min-width', `${maxWidth}px`);
      });
    });
  }
}