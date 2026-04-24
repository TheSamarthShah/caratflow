import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  input,
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
import {
  MessageDisplayOption,
  MessageType,
} from 'src/core/models/MessageDisplayOption.type';
import { TranslateModule } from '@ngx-translate/core';
import { ActyCommon } from 'src/core/services/acty-common';
import { ShowTooltipIfTruncatedDirective } from 'src/core/directive/show-tooltip-if-truncated';
import { Button } from '../button/button';
@Component({
  selector: 'acty-textinput',
  templateUrl: './text-input.html',
  styleUrl: './text-input.scss',
  standalone: true,
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
    Button
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInput),
      multi: true,
    },
  ],
})
export class TextInput implements ControlValueAccessor, OnInit, OnChanges {
  @ViewChild('inputRef', { static: false })
  inputRef!: ElementRef<HTMLInputElement>;
  actyCommonService = inject(ActyCommon);

  internalControl?: FormControl;
  label = input<string>('');
  placeholder = input<string>('');
  type = input<string>('text');
  appearance = input<MatFormFieldAppearance>('outline');
  floatLabel = input<FloatLabelType>('auto');
  hint = model<MessageDisplayOption>();
  required = input<boolean>(false);
  isDisabled = input<boolean>(false);
  readonly = input<boolean>(false);
  isVisible = input<boolean>(true);
  isEditable = input<boolean>(true);
  isNullable = input<boolean>(false);
  style = input<any>({});
  maxLength = input<number | undefined>(undefined);
  hasPrefix = input<boolean>(false);
  focusSuffixButton = input<boolean>(true);
  hide = model<boolean>(true);
  value = model<string>('');
  //onChange = input<(value: string) => void>(() => {});
  blurEvent = output<string>();
  valueChanged = output<string>();

  lastEmittedValue = signal<string>('');

  formField = new FormControl();

  onChange = (_: any) => { };
  onTouched = () => { };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isDisabled']) {
      if (this.isDisabled()) {
        this.formField.disable({ emitEvent: false });
      } else {
        this.formField.enable({ emitEvent: false });
      }
    }
  }

  ngOnInit(): void {
    const validators = [];
    if (this.required()) {
      validators.push(Validators.required);
    }

    if (this.type() === 'email') {
      validators.push(Validators.email);
    }

    this.formField.setValidators(validators);
    this.formField.updateValueAndValidity();

    // Subscribe to value changes to propagate value
    this.formField?.valueChanges.subscribe((value: string) => {
      this.value.set(value ?? '');
      /// set the last value typed by the user
      this.lastEmittedValue.set(value ?? '');
      this.onChange(value);
    });
  }

  onInputBlur() {
    this.onTouched();
    this.blurEvent.emit(this.value());
  }

  writeValue(val: any): void {
    // prevent duplicate emit
    if (JSON.stringify(this.lastEmittedValue()) === JSON.stringify(val)) {
      return;
    }
    this.lastEmittedValue.set(val);

    this.formField.setValue(val ?? '', { emitEvent: false });
    this.value.set(val ?? '');
    this.valueChanged.emit(val ?? '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  clearValue(event: Event) {
    event.stopPropagation();
    this.formField.setValue('', { emitEvent: true });
    this.value.set('');
    this.onChange('');
  }

  togglePasswordVisibility(): void {
    this.hide.set(!this.hide());
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
    this.inputRef?.nativeElement.focus();
  }
}
