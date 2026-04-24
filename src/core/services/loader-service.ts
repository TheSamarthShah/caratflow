import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  // Map of loader names to numeric counts
  private loaders = signal<Record<string, number>>({});

  /**
   * Returns a computed signal that tells whether the loader is active (> 0)
   */
  isLoading = (name: string) => computed(() => (this.loaders()[name] ?? 0) > 0);

  /**
   * Increments loader count for a given name
   */
  increment(name: string): void {
    const current = { ...this.loaders() };
    const count = current[name] ?? 0;
    current[name] = count + 1;
    this.loaders.set(current);
  }

  /**
   * Decrements loader count for a given name (not below 0)
   * Automatically hides when count hits 0
   */
  decrement(name: string): void {
    const current = { ...this.loaders() };
    const count = current[name] ?? 0;
    current[name] = Math.max(0, count - 1);
    this.loaders.set(current);
  }
 
  /**
   * Force reset (useful for cleanup)
   */
  reset(name: string): void {
    const current = { ...this.loaders() };
    current[name] = 0;
    this.loaders.set(current);
  }

  destroy(): void{
    this.loaders.set({});
  }
}
