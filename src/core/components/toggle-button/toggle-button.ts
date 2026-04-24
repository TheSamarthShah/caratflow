import { Component, computed, input, output, signal, model } from '@angular/core';
import { Button } from '../button/button';

@Component({
  selector: 'acty-toggle-button',
  imports: [Button],
  templateUrl: './toggle-button.html',
  styleUrl: './toggle-button.scss',
  standalone: true,
})
export class ToggleButton {
  // Use model() for two-way binding instead of input()
  state = model<'active' | 'inactive'>('inactive');
  disabled = input<boolean>();
  inactiveText = input<string>('');
  activeText = input<string | null>(null);
  inactiveLeftIcon = input<string | undefined>();
  activeLeftIcon = input<string | undefined>();
  inactiveRightIcon = input<string | undefined>();
  activeRightIcon = input<string | undefined>();
  btnClass = input<string | undefined>();
  activeBtnClass = input<string | undefined>();
  inactiveBtnClass = input<string | undefined>();
  severity = input<
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warn'
    | 'help'
    | 'danger'
    | undefined
  >();

  // Keep the output for additional events if needed
  onBtnClick = output<'active' | 'inactive'>();

  // Computed property based on the model
  isActive = computed(() => this.state() === 'active');

  buttonText = computed(() => {
    if (this.isActive() && this.activeText() !== null) {
      return this.activeText()!;
    }
    return this.inactiveText();
  });

  leftIcon = computed(() => {
    return this.isActive() ? this.activeLeftIcon() : this.inactiveLeftIcon();
  });

  rightIcon = computed(() => {
    return this.isActive() ? this.activeRightIcon() : this.inactiveRightIcon();
  });

  buttonClass = computed(() => {
    const baseClass = this.btnClass() || '';

    let stateClass = '';
    if (this.isActive()) {
      // If activeBtnClass is provided, use it + 'activeBtn', otherwise just 'activeBtn'
      stateClass = this.activeBtnClass()
        ? `${this.activeBtnClass()} activeBtn`
        : 'activeBtn';
    } else {
      // Use inactiveBtnClass if provided, otherwise empty
      stateClass = this.inactiveBtnClass() || '';
    }

    // Combine base class with state class, removing any extra spaces
    return (
      [baseClass, stateClass]
        .filter((c) => c.trim())
        .join(' ')
        .trim() || undefined
    );
  });

  onButtonClick(): void {
    if (this.disabled()) return;
    
    // Toggle the state by updating the model
    const newState = this.isActive() ? 'inactive' : 'active';
    this.state.set(newState);

    // Emit the event if needed
    this.onBtnClick.emit(newState);
  }
}