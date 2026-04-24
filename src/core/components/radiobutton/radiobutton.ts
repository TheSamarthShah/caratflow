import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, effect, forwardRef, inject, input, model, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MatHint } from "@angular/material/form-field";
import { MessageDisplayOption, MessageType } from 'src/core/models/MessageDisplayOption.type';
import { ActyCommon } from 'src/core/services/acty-common';
import { MatIcon } from "@angular/material/icon";
import { ShowTooltipIfTruncatedDirective } from 'src/core/directive/show-tooltip-if-truncated';

@Component({
  selector: 'acty-radio-button',
  templateUrl: './radiobutton.html',
  styleUrl: './radiobutton.scss',
  imports: [
    CommonModule,
    MatRadioModule,
    MatTooltipModule,
    TranslateModule,
    MatHint,
    MatIcon,
    ShowTooltipIfTruncatedDirective
],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioButton),
      multi: true
    }
  ]
})

export class RadioButton implements ControlValueAccessor, OnInit {
  actyCommonService = inject(ActyCommon);
  
  value = input<any>();
  label = input<string>('');
  name = input<string>('');
  isDisabled = input<boolean>(false);
  style = input<any>({});
  align = input<'before' | 'after'>('after');
  toolTip = input<string>('');
  hint = model<MessageDisplayOption>();
  
  children = model<{ caption: string; code: any; checked?: boolean }[]>([]);
  
  selectionChange = output<any>();

  isInitialized = signal(false);

  private onChangeFn: (value: any) => void = () => { };
  private onTouchedFn: () => void = () => { };

  constructor() { }

  ngOnInit(): void {
    if (this.hasChildren) {
        const selected = this.children().find(c => c.checked);
        if (selected) {
          this.selectionChange.emit({ value: selected.code, label: selected.caption });
        }
      }
  }
  
  writeValue(selectedValue: any): void {

    if (this.hasChildren) {
      const updatedChildren = this.children().map(child => ({
        ...child,
        checked: child.code === selectedValue
      }));
      this.children.set(updatedChildren);

      if (!this.isInitialized()) {
        this.isInitialized.set(true);
        const selectedChild = updatedChildren.find(c => c.checked);
        this.selectionChange.emit({ value: selectedChild?.code ?? null, label: selectedChild?.caption ?? null }); // ← emit on init
      }
    }

    if (selectedValue === null || selectedValue === undefined) {
      this.selectionChange.emit({ value: null, label: null });
      this.onChangeFn(null);
    }
  }

  registerOnChange(fn: any): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedFn = fn;
  }

  get hasChildren(): boolean {
    return this.children() && this.children().length > 0;
  }

  onSelectionChange(event: MatRadioChange): void {   
    if (!this.isDisabled()) {
      const selectedValue = event.value;
      if (this.hasChildren && this.children().length > 0) {
        const updatedChildren = this.children().map(child => ({
          ...child,
          checked: child.code === selectedValue
        }));
        this.children.set(updatedChildren);
        const selectedChild = updatedChildren.find(c => c.code === selectedValue);
        this.selectionChange.emit({ value: selectedChild?.code, label: selectedChild?.caption });
        this.onChangeFn(selectedChild?.code);
      }
      this.onTouchedFn();
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
}
