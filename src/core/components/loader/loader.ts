import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderService } from 'src/core/services/loader-service';

@Component({
  selector: 'acty-loader',
  imports: [MatProgressSpinnerModule],
  templateUrl: './loader.html',
  styleUrl: './loader.scss'
})
export class Loader {
  loaderService = inject(LoaderService);
  destroyRef = inject(DestroyRef);

  key = input.required<string>();

  // Local signal that actually controls the DOM visibility
  displaySpinner = signal(false);

  // --- UX Configuration ---
  private readonly GRACE_PERIOD_MS = 200;      // Don't show if it finishes faster than this
  private readonly MIN_SPIN_DURATION_MS = 0; // If it shows, it must stay for at least this long

  private showTimeoutId: any;
  private hideTimeoutId: any;
  private showTimestamp = 0;

  constructor() {
    effect(() => {
      const isServiceLoading = this.loaderService.isLoading(this.key())();

      if (isServiceLoading) {
        // --- PROCESS STARTED ---
        
        // 1. Cancel any pending "hide" actions if they quickly triggered it again
        clearTimeout(this.hideTimeoutId);

        // 2. Start the Grace Period countdown
        this.showTimeoutId = setTimeout(() => {
          // If this executes, the grace period ended and it's STILL loading.
          // Record the exact time it became visible and show it.
          this.showTimestamp = Date.now();
          this.displaySpinner.set(true);
        }, this.GRACE_PERIOD_MS);

      } else {
        // --- PROCESS FINISHED ---
        
        // 1. Cancel the "show" countdown. 
        // If the process finished before GRACE_PERIOD_MS, the timeout is cleared 
        // and the spinner NEVER appears.
        clearTimeout(this.showTimeoutId);

        // 2. If the spinner IS currently visible, we must enforce the minimum spin time
        if (this.displaySpinner()) {
          const elapsed = Date.now() - this.showTimestamp;
          const remainingTime = this.MIN_SPIN_DURATION_MS - elapsed;

          if (remainingTime > 0) {
            // It showed up, but finished too fast. Wait out the remaining minimum time.
            this.hideTimeoutId = setTimeout(() => {
              this.displaySpinner.set(false);
            }, remainingTime);
          } else {
            // It has been spinning longer than the minimum time. Hide immediately.
            this.displaySpinner.set(false);
          }
        }
      }
    }, { allowSignalWrites: true });

    // Clean up timeouts to prevent memory leaks if component is destroyed
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.showTimeoutId);
      clearTimeout(this.hideTimeoutId);
    });
  }
}