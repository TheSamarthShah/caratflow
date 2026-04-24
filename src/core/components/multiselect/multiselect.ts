import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MultiselectOption } from 'src/core/models/MultiselectOption.type';
import { Button } from '../button/button';
import { Checkbox } from '../checkbox/checkbox';
import { TextInput } from '../text-input/text-input';

@Component({
  selector: 'acty-multiselect',
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    TranslateModule,
    Button,
    Checkbox,
    TextInput
  ],
  standalone: true,
  templateUrl: './multiselect.html',
  styleUrl: './multiselect.scss',
})
export class Multiselect {
  options = input<MultiselectOption[]>([]);
  value = input<string>('');
  leftIcon = input<string | undefined>();
  disabled = input<boolean>(false);
  showToggleAll = input<boolean>(true); //Whether to show the checkbox at header to toggle all items at once.
  filter = input<boolean>(true); //When specified, displays an input field to filter the items on keyup.
  maxSelectedLabels = input<number>(2); //Decides how many selected item labels to show at most.
  scrollHeight = input<string>('200px'); //Height of the viewport in pixels, a scrollbar is defined if height of list exceeds this value.
  styleClass = input<string>();
  fixedPlaceholder = input<string>(''); // fixLabelText for a Fix Button label
  severity = input<
    'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | undefined
  >();
  valueChange = output<string>();

  // Use a computed signal to convert the input string to an array
  // .split() and .trim() handle spaces and empty strings
  internalValue = computed(() =>
    this.value() ? this.value().split(',').map(s => s.trim()) : []
  );
  // Signal to store the filter input's value
  filterValue = signal('');

  // A computed signal that filters options based on filterValue
  filteredOptions = computed(() => {
    const filter = this.filterValue().toLowerCase();
    if (!filter) {
      return this.options();
    }
    return this.options().filter((option) =>
      option.label.toLowerCase().includes(filter)
    );
  });

  // Method to update the filter value (called from the template)
  updateFilter(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.filterValue.set(inputElement.value);
  }

  toggleAllSelection(): void {
    let newValue: string[];
    const filteredKeys = this.filteredOptions().map((option) => option.key);

    const allFilteredAreSelected = filteredKeys.every((key) =>
      this.internalValue().includes(key)
    );

    if (allFilteredAreSelected) {
      newValue = this.internalValue().filter(
        (key) => !filteredKeys.includes(key)
      );
    } else {
      const newKeysToAdd = filteredKeys.filter(
        (key) => !this.internalValue().includes(key)
      );
      newValue = [...this.internalValue(), ...newKeysToAdd];
    }
    this.updateValue(newValue);
  }

  toggleOption(optionKey: string): void {
    const currentValue = this.internalValue();
    const index = currentValue.indexOf(optionKey);
    let newValue: string[];

    if (index > -1) {
      newValue = currentValue.filter((key) => key !== optionKey);
    } else {
      newValue = [...currentValue, optionKey];
    }
    this.updateValue(newValue);
  }

  private updateValue(newValue: string[]): void {
    // Convert the array back to a string before emitting
    this.valueChange.emit(newValue.join(', '));
  }

  isAllSelected(): boolean {
    return this.internalValue().length === this.options().length;
  }

  getSelectedText(): string {
    if (this.internalValue().length > 0) {
      const selectedLabels = this.internalValue()
        .map((key) => this.options().find((option) => option.key === key))
        .filter((option) => option)
        .map((option) => option?.label);

      if (this.maxSelectedLabels() != undefined) {
        if (selectedLabels.length <= (this.maxSelectedLabels() ?? 0)) {
          return selectedLabels.join(', ');
        } else {
          return this.internalValue().length + ' items selected';
        }
      } else {
        return selectedLabels.join(', ');
      }
    } else {
      return '';
    }
  }
}
