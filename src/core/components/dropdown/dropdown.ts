import {
  Component,
  EventEmitter,
  inject,
  input,
  Input,
  model,
  NgZone,
  OnInit,
  output,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef,
  signal
} from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import {
  FloatLabelType,
  MatFormFieldAppearance,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom, take } from 'rxjs';
import {
  MessageDisplayOption,
  MessageType,
} from 'src/core/models/MessageDisplayOption.type';
import { ActyCommon } from 'src/core/services/acty-common';
import { ShowTooltipIfTruncatedDirective } from 'src/core/directive/show-tooltip-if-truncated';
import { TextInput } from '../text-input/text-input';
import { Button } from '../button/button';

@Component({
  selector: 'acty-dropdown',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    ShowTooltipIfTruncatedDirective,
    TextInput,
    Button
  ],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropDown),
      multi: true,
    },
  ],
})
export class DropDown implements OnInit {
  @ViewChild('select') select!: MatSelect;
  ngZone = inject(NgZone);
  actyCommonService = inject(ActyCommon);

  dataSource = input<any[]>([]);
  displayExpr = input<any>();
  valueExpr = input<any>();
  label = input<string>('');
  placeholder = input<string>('');
  appearance = input<MatFormFieldAppearance>('outline');
  floatLabel = input<FloatLabelType>('auto');
  hint = model<MessageDisplayOption>();
  required = input<boolean>(true);
  isDisabled = input<boolean>(false);
  isVisible = input<boolean>(true);
  isMultiple = input<boolean>(false);
  isNullable = input<boolean>(true);
  isSearch = input<boolean>(true);
  style = input<any>({});
  selectedValue = input<any>(null);
  toolTip = input<string | undefined>();

  selectionChange = output<any>(); // Notify parent of change

  isInitialized = signal(false);

  selectControll: any;
  searchTerm: string = '';
  filteredDataSource: any[] = [];
  private onChange: (_: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {}

  ngOnInit(): void {
    this.filteredDataSource = this.dataSource();
    this.selectControll = new FormControl({
      value: [],
      disabled: this.isDisabled(),
    });

    const validators = [];

    if (this.required()) {
      validators.push(Validators.required);
    }

    this.selectControll.setValidators(validators);
    this.selectControll.updateValueAndValidity();
    if (this.isMultiple()) {
      // Always set as array for multi-select
      this.selectControll.setValue(
        Array.isArray(this.selectedValue())
          ? this.selectedValue()
          : this.selectedValue()
          ? [this.selectedValue()[this.valueExpr()]]
          : []
      );
    } else {
      this.selectControll.setValue(
        this.selectedValue() ? this.selectedValue()[this.valueExpr()] : null
      );
    }

    if (
      this.selectControll.value != null &&
      this.selectControll.value != undefined &&
      this.selectControll.value != ''
    ) {
      this.selectionChange.emit(this.selectControll.value);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedValue']) {
      this.setSelectedValues();
    }
  }

  openDropDown(){
    this.select.open();
  }
  setSelectedValues(): void {
    // Replace onStable with setTimeout. This breaks the sync execution
    // allowing the view to init, but doesn't wait for the whole world to stop.
    queueMicrotask(() => {
      // Safety check
      if (!this.selectControll) return;

      const val = this.selectedValue();
      const expr = this.valueExpr();

      // Consolidated Logic
      if (this.isMultiple()) {
        const valueToSet = Array.isArray(val) ? val.map(v => String(v)) : [String(val?.[expr])];
        this.selectControll.setValue(valueToSet, { emitEvent: false });
      } else {
        const valueToSet =
          typeof val === 'object' && val !== null ? String(val?.[expr]) : String(val);          // Convert to string
        this.selectControll.setValue(valueToSet, { emitEvent: false });
      }
      setTimeout(() => {
        this.selectionChange.emit(this.selectControll.value);
      });
    });
  }

  ngAfterViewInit(): void {
    this.selectControll.valueChanges.subscribe((value: any) => {
      this.onChange(value);      // notify Angular form
      this.onTouched();          // mark touched
      this.selectionChange.emit(value);
    });
  }

  writeValue(value: any): void {
    if (!this.selectControll) return;

    const expr = this.valueExpr();

    if (this.isMultiple()) {
      if (Array.isArray(value)) {
        this.selectControll.setValue(value.map(v => String(v)), { emitEvent: false });
      } else if (value) {
        this.selectControll.setValue([String(value[expr])], { emitEvent: false });
      } else {
        this.selectControll.setValue([], { emitEvent: false });
      }
    } else {
      if (typeof value === 'object' && value !== null) {
        this.selectControll.setValue(String(value[expr]), { emitEvent: false });
      } else {
        this.selectControll.setValue(value !== null && value !== undefined ? String(value) : null, { emitEvent: false });
      }
    }
    // Only emit on first initialization
    if (!this.isInitialized()) {
      this.isInitialized.set(true);
      setTimeout(() => {
        this.selectionChange.emit(this.selectControll.value);
      });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (!this.selectControll) return;
    if (isDisabled) this.selectControll.disable({ emitEvent: false });
    else this.selectControll.enable({ emitEvent: false });
  }

  compareObjects = (a: any, b: any) => {
    if (!a || !b) return false;
    return a[this.valueExpr()!] === b[this.valueExpr()!];
  };

  onSelectOpen() {
    this.searchTerm = '';
    this.filteredDataSource = this.dataSource();
  }

  getDisplayText(value: any): string {
    if (!this.dataSource || !this.displayExpr || !this.valueExpr) return '';

    const found = this.dataSource()?.find(
      (item: any) => item[this.valueExpr()!] === value
    );
    return found ? found[this.displayExpr()!] : '';
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.selectControll.setValue(this.isMultiple() ? [] : null);
    this.selectControll.markAsTouched();
  }

  hasSelected(): boolean {
    const value = this.selectControll.value;
    if (this.isMultiple()) {
      return Array.isArray(value) && value.length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  }

  filterOptions() {
    const term = this.searchTerm?.toLowerCase().trim() || '';
    if (!term) {
      this.filteredDataSource = this.dataSource();
    } else {
      this.filteredDataSource = this.dataSource().filter((item: any) =>
        item[this.displayExpr()!].toLowerCase().includes(term)
      );
    }
  }

  getHintType(): MessageType {
    const hint = this.hint();

    if (hint?.type !== undefined) {
      return hint.type;
    }
    const message = hint?.message ?? '';
    return this.actyCommonService.getTypeFromMsgCode(message);
  }

  getHintIcon() {
    const icon = this.getHintType();
    switch (icon) {
      case 'error':
        return 'close';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'check';
      default:
        return 'info';
    }
  }
  public focus(): void {
    this.select?.focus();
    this.select?.open();
  }
}
