import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  input,
  Input,
  model,
  NgModule,
  OnChanges,
  OnInit,
  output,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatFormFieldAppearance,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { FloatLabelType } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ShowTooltipIfTruncatedDirective } from 'src/core/directive/show-tooltip-if-truncated';

import {
  MessageDisplayOption,
  MessageType,
} from 'src/core/models/MessageDisplayOption.type';

import { ActyCommon } from 'src/core/services/acty-common';

@Component({
  selector: 'acty-numberinput',
  templateUrl: './number-input.html',
  styleUrl: './number-input.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    ShowTooltipIfTruncatedDirective,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInput),
      multi: true,
    },
  ],
})
export class NumberInput implements ControlValueAccessor, OnInit, OnChanges {
  @ViewChild('inputRef', { static: false })
  inputRef!: ElementRef<HTMLInputElement>;
  actyCommonService = inject(ActyCommon);
  label = input<string>('');
  placeholder = input<string>('');
  appearance = input<MatFormFieldAppearance>('outline');
  floatLabel = input<FloatLabelType>('auto');
  hint = model<MessageDisplayOption>();
  required = input<boolean>(false);
  isDisabled = input<boolean>(false);
  showButtons = input<boolean>(false);
  isVisible = input<boolean>(true);
  isDefaultZero = input<boolean>(false);
  style = input<any>({});
  minValue = input<number | undefined>();
  maxValue = input<number | undefined>();
  //Exa: dataPrecision - 10 , dataScale - 3
  //max-number: 9999999.999
  dataScale = input<number | undefined>(); // Values after decimal
  dataPrecision = input<number | undefined>(); // Total length of number
  onChange: (value: number | null) => void = () => {};
  blurEvent = output<number | null>();
  valueChanged = output<number | null>();

  value = signal<number | null>(null);
  formField = new FormControl();
  hasDecimal = false;
  currentHint = {} as MessageDisplayOption;
  private wheelListener: any;

  //onChange = (_: any) => { };
  onTouched = () => {};

  ngOnInit(): void {
    const validators = [];
    if (this.required()) validators.push(Validators.required);
    if (this.minValue() !== undefined)
      validators.push(Validators.min(this.minValue()!));
    if (this.maxValue() !== undefined)
      validators.push(Validators.max(this.maxValue()!));

    this.formField.setValidators(validators);

    this.formField.valueChanges.subscribe((value) => {
      if (value === '' || value === '-' || value === '.' || value === null) {
        this.value.set(null);
        this.onChange(null);
        return;
      }

      const num = Number(value);
      if (!isNaN(num)) {
        this.onChange(num);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.inputRef) return;
    this.inputRef.nativeElement.addEventListener(
      'wheel',
      this.onMouseWheel.bind(this),
      { passive: false }
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    const validators = [];
    if (this.required()) validators.push(Validators.required);
    if (this.minValue() !== undefined)
      validators.push(Validators.min(this.minValue()!));
    if (this.maxValue() !== undefined)
      validators.push(Validators.max(this.maxValue()!));

    if (changes['isDisabled']) {
      if (this.isDisabled()) {
        this.formField.disable({ emitEvent: false });
      } else {
        this.formField.enable({ emitEvent: false });
      }
    }

    this.formField.setValidators(validators);
    this.formField.updateValueAndValidity({ emitEvent: false });
  }

  ngOnDestroy() {
    this.inputRef.nativeElement.removeEventListener(
      'wheel',
      this.wheelListener
    );
  }

  writeValue(val: any): void {
    if (val === null || val === undefined || val === '') {
      this.formField.setValue(this.isDefaultZero() ? '0' : '', {
        emitEvent: false,
      });
      return;
    }

    this.formField.setValue(String(val), { emitEvent: false });
    this.value.set(val);
    this.valueChanged.emit(val);
    //// Pooja Maru: For valiadte calculations.
    // Commented because it validates value on row change
    //this.formField.updateValueAndValidity();
    //this.onValueChanged();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInputChange(val: string): void {
    if (val === '' || val === null) {
      this.formField.setValue('', { emitEvent: false });
      
      return;
    }

    const parsed = Number(val);
    if (isNaN(parsed)) {
      return;
    }

    const scale = this.dataScale() ?? Infinity;
    const precision = this.dataPrecision() ?? Infinity;
    const maxInt = precision - scale;

    const isNegative = String(val).startsWith('-');
    const raw = String(val).replace('-', '');

    const [intPartRaw, decPartRaw = ''] = raw.split('.');
    let intPart = intPartRaw;
    let decPart = decPartRaw;

    if (intPart.length > maxInt) {
      const pure = intPart.replace('-', '');
      intPart = pure.substring(0, maxInt);
    }

    if (decPart.length > scale) {
      decPart = decPart.substring(0, scale);
    }

    let finalStr = (isNegative ? '-' : '') + intPart;
    if (scale > 0 && decPart.length > 0) {
      finalStr += '.' + decPart;
    }

    const current = this.formField.value;
    if (!Object.is(current, Number(finalStr))) {
      this.formField.setValue(finalStr, { emitEvent: false });
    }

  }

  onValueChanged(): void {
    this.hasDecimal = false;
    const val = this.formField.value;
    const min = this.minValue();
    const max = this.maxValue();

    //// Pooja Maru: for Compare min and max value convert into number.
    if (val !== null && val !== undefined && val != '') {
      if (min != null && min !== undefined && max != null && Number(max) !== undefined && (Number(val) < Number(min) || Number(val) > Number(max))) {
        this.currentHint = {
          message: 'MESSAGE.COM_E0012',
          params: { minValue: this.minValue(), maxValue: this.maxValue() },
        };
        this.hint.set(this.currentHint);
      } else if (min != null && min !== undefined && (max == null || max == undefined) && Number(val) < Number(min)) {
        this.currentHint = {
          message: 'MESSAGE.COM_E0013',
          params: { minValue: this.minValue() },
        };
        this.hint.set(this.currentHint);
      } else if (max != null && max !== undefined && (min == null || min == undefined) && Number(val) > Number(max)) {
        this.currentHint = {
          message: 'MESSAGE.COM_E0014',
          params: { maxValue: this.maxValue() },
        };
        this.hint.set(this.currentHint);
      } else {
        this.hint.set(undefined);
      }
    } else {
      this.hint.set(undefined);
    }

    if (val === null || val === undefined || val === '') {
      this.formField.setValue(this.isDefaultZero() ? '0' : null, {
        emitEvent: false,
      });
      this.onChange(this.isDefaultZero() ? 0 : null);
      return;
    }

    let parsed = parseFloat(val);
    if (isNaN(parsed)) parsed = 0;

    parsed = this.normalizeNumber(parsed, this.dataScale());
    this.formField.setValue(String(parsed), { emitEvent: false });
    this.onChange(parsed);
    this.onTouched();
  }

  onInputBlur() {
    this.onTouched();
    this.blurEvent.emit(this.value());
  }
  adjustValue(delta: number) {
    let formValue = this.formField.value;
    let currentStr = (formValue ?? '0').toString();

    let raw = parseFloat(currentStr);
    if (isNaN(raw)) raw = 0;

    const scale = this.dataScale() ?? Infinity;

    const parts = currentStr.split('.');
    const decPart = parts[1] ?? '';

    raw = raw + delta;

    let finalNum = raw;
    if (scale > 0 && decPart.length > 0) {
      const decimals = Math.min(decPart.length, scale);
      finalNum = +(raw.toFixed(0) + '.' + decPart.substring(0, decimals));
    }

    finalNum = this.normalizeNumber(finalNum, this.dataScale());

    this.formField.setValue(String(finalNum), { emitEvent: false });
    this.onChange(finalNum);
  }

  onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    if (!this.showButtons()) return;
    if (this.isDisabled()) return;
    if (document.activeElement !== event.target) return;

    this.adjustValue(event.deltaY < 0 ? +1 : -1);
  }

  getHintType(): MessageType {
    const hintObj = this.hint();

    // 1. Safety check
    if (!hintObj) return 'info';

    // 2. Return existing type if available
    if (hintObj.type !== undefined) {
      return hintObj.type;
    }

    // 3. Calculate and Cache the type
    const calculatedType = this.actyCommonService.getTypeFromMsgCode(
      hintObj.message ?? ''
    );

    // Mutate object to cache the result
    hintObj.type = calculatedType;

    return calculatedType;
  }

  getHintIcon(): string {
    const type = this.getHintType();

    switch (type) {
      case 'error':
        return 'close';
      case 'warning':
        return 'warning';
      case 'success':
        return 'check';
      case 'info':
      default:
        return 'info';
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    const value = (event.target as HTMLInputElement).value;
    const cursorPos = (event.target as HTMLInputElement).selectionStart ?? 0;

    if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
    }

    if (this.showButtons()) {
      if (key === 'ArrowUp') {
        event.preventDefault();
        this.adjustValue(+1);
        return;
      }

      if (key === 'ArrowDown') {
        event.preventDefault();
        this.adjustValue(-1);
        return;
      }
    }
    const allowed = [
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Escape',
      'Home',
      'End',
    ];

    if (allowed.includes(key)) return;

    if (key === '.' && value.includes('.')) {
      event.preventDefault();
      return;
    }

    if (key === '.') {
      const scale = this.dataScale() ?? Infinity;
      if (scale <= 0 || value.includes('.')) {
        event.preventDefault();
        return;
      }
    }

    if (key === '-' && (cursorPos !== 0 || value.includes('-'))) {
      event.preventDefault();
    }
  }
  public focus(): void {
    this.inputRef?.nativeElement.focus();
  }

  private normalizeNumber(value: number, scale?: number): number {
    if (scale === undefined || !Number.isFinite(scale)) {
      return value;
    }
    return +value.toFixed(scale);
  }
}
