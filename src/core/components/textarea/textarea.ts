import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, inject, input, model, output, signal } from '@angular/core';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessageDisplayOption, MessageType } from 'src/core/models/MessageDisplayOption.type';
import { ActyCommon } from 'src/core/services/acty-common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from "@angular/material/icon";
import { ShowTooltipIfTruncatedDirective } from 'src/core/directive/show-tooltip-if-truncated';
@Component({
  selector: 'acty-text-area',
  standalone: true,
  templateUrl: './textarea.html',
  styleUrls: ['./textarea.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    TextFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    TranslateModule,
    MatIconModule,
    ShowTooltipIfTruncatedDirective
]
   ,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Textarea),
      multi: true
    }
  ]
})
export class Textarea implements ControlValueAccessor {
  actyCommonService = inject(ActyCommon);
  placeholder = input<string>('');   // default empty
  required = input<boolean>(false);
  isDisabled = input<boolean>(false);  
  allowResize = input<boolean>(true);
  toolTip = input<string | undefined>();
  rows = input<number>(3);
  columns = input<number>(30);
  style = input<any>({});
  hint = model<MessageDisplayOption>();
  maxLength = input<number | undefined>(undefined);

  valueChanged = output<string>(); 

  isInitialized = signal(false);

  currentHint = {} as MessageDisplayOption;
  value: string = '';
  formField = new FormControl();

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value = val || '';
    if (!this.isInitialized()) {
      this.isInitialized.set(true);
      this.valueChanged.emit(this.value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }


  onInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.value = input.value;

    this.onChange(this.value);
    this.onTouched();
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
    switch (this.getHintType()) {
      case 'error': return 'close';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'check';
      default: return 'info';
    }
  }
}
