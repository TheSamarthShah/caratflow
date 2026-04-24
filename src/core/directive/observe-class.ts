import { 
  Directive, 
  ElementRef, 
  OnDestroy, 
  AfterViewInit, 
  OnChanges, 
  SimpleChanges, 
  input
} from '@angular/core';

@Directive({
  selector: '[actyObserveClass]',
  standalone: true,
  exportAs: 'actyObservingClass' 
})
export class ObserveClass implements AfterViewInit, OnDestroy, OnChanges {
  
  // Allow a single string OR an array of strings
  targetClass = input.required<string | string[]>({alias:'actyObserveClass'});

  public isActive: boolean = false;

  get isWrapped(): boolean {
    return this.isActive;
  }

  private observer: MutationObserver | null = null;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.observer = new MutationObserver((mutations) => {
      // If class attribute changes, re-check
      const classChanged = mutations.some(m => m.attributeName === 'class');
      if (classChanged) {
        this.checkClass();
      }
    });

    this.observer.observe(this.el.nativeElement, {
      attributes: true,
      attributeFilter: ['class'] 
    });

    this.checkClass();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['targetClass'] && !changes['targetClass'].firstChange) {
      this.checkClass();
    }
  }

  private checkClass() {
    const rawInput = this.targetClass();
    if (!rawInput) return;

    // Normalize input to an array
    const classesToCheck = Array.isArray(rawInput) ? rawInput : [rawInput];
    
    // Check if the element contains ANY of the target classes
    const hasClass = classesToCheck.some(cls => 
      this.el.nativeElement.classList.contains(cls)
    );

    if (this.isActive !== hasClass) {
      this.isActive = hasClass;
    }
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }
}