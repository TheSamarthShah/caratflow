import {
  Component,
  forwardRef,
  Input,
  Output,
  EventEmitter,
  input,
  output,
  signal,
  model,
  OnInit,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActyCommon } from 'src/core/services/acty-common';
import { MessageDisplayOption, MessageType } from 'src/core/models/MessageDisplayOption.type';
import { MatHint } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { ShowTooltipIfTruncatedDirective } from 'src/core/directive/show-tooltip-if-truncated';

@Component({
  selector: 'acty-check-box',
  templateUrl: './checkbox.html',
  styleUrls: ['./checkbox.scss'],
  imports: [
    CommonModule,
    MatCheckboxModule,
    FormsModule,
    TranslateModule,
    MatTooltipModule,
    MatHint,
    MatIcon,
    ShowTooltipIfTruncatedDirective
],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Checkbox),
      multi: true,
    },
  ],
})
export class Checkbox implements ControlValueAccessor, OnInit, OnChanges {
  actyCommonService = inject(ActyCommon);

  label = input<string>('');
  align = input<'before' | 'after'>('after');
  isDisabled = input<boolean>(false);
  toolTip = input<string | undefined>();
  showParent = input<boolean>(true);
  style = input<any>({});
  isChecked = input<boolean>(false);
  hint = model<MessageDisplayOption>();

  change = output<boolean | { parent: boolean; children: any[] }>();

  value = signal(false);
  lastEmittedValue = signal<any>(undefined);
  indeterminate = model(false);
  children = model<{ caption: string; code: any; checked?: boolean }[]>([]);

  onChange = (value: boolean | any[]) => {};
  onTouched = () => {};

  ngOnInit(): void {
    if (this.isChecked() !== undefined && this.isChecked() !== null) {
      this.value.set(this.isChecked());
      this.indeterminate.set(false);

      if (this.hasChildren) {
        this.children.set(
          this.children().map((c) => ({
            ...c,
            checked: this.isChecked(),
          }))
        );
      }
      this.emitCurrentValue();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isChecked'] && !changes['isChecked'].firstChange) {
      if (this.isChecked() !== undefined && this.isChecked() !== null) {
        this.value.set(this.isChecked());
        
        if (this.hasChildren) {
          const allChecked = this.children().every((c) => c.checked);
          const someChecked = this.children().some((c) => c.checked);
          this.value.set(allChecked);
          this.indeterminate.set(someChecked && !allChecked);
        }

        if (this.hasChildren) {
          this.children.set(
            this.children().map((c) => ({
              ...c,
              checked: this.isChecked(),
            }))
          );
        }
      }
    }
  }

  writeValue(val: boolean | any[]): void {
    if (this.hasChildren && Array.isArray(val)) {
      this.children.set(
        this.children().map((c) => ({
          ...c,
          checked: val.includes(c.code),
        }))
      );

      this.value.set(this.children().every((c) => c.checked));
      this.indeterminate.set(
        !this.value && this.children().some((c) => c.checked)
      );
    } else if (val == null) {
      this.value.set(true);
      this.indeterminate.set(false);
      this.children.set(this.children().map((c) => ({ ...c, checked: true })));
    } else {
      this.value.set(!!val);

      if (this.hasChildren) {
        this.children.set(
          this.children().map((c) => ({ ...c, checked: !!val }))
        );
        this.indeterminate.set(!!val);
      }
    }

    if (this.hasChildren) {
      const allChecked = this.children().every((c) => c.checked);
      const someChecked = this.children().some((c) => c.checked);
      this.value.set(allChecked);
      this.indeterminate.set(someChecked && !allChecked);
    }

    this.emitCurrentValue();
  }

  private emitCurrentValue() {
    queueMicrotask(() => {
      let currentValue: any;
      if (this.hasChildren) {
        currentValue = this.children()
          .filter(c => c.checked)
          .map(c => c.code);
      } else {
        currentValue = this.value();
      }

      // prevent duplicate emit
      if (JSON.stringify(this.lastEmittedValue()) === JSON.stringify(currentValue)) {
        return;
      }
      this.lastEmittedValue.set(currentValue);

      if (this.hasChildren) {
        this.change.emit({
          parent: this.value(),
          children: currentValue,
        });
      } else {
        this.change.emit(currentValue);
      }
    });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  get hasChildren(): boolean {
    return this.children() && this.children().length > 0;
  }

  onParentCheckboxChange(checked: boolean): void {
    this.value.set(checked);
    this.indeterminate.set(false);

    if (this.hasChildren) {
      this.children.set(
        this.children().map((c) => ({ ...c, checked: checked }))
      );
    }

    this.propagateChange();
  }

  onChildCheckboxChange(child: any, checked: boolean): void {
    child.checked = checked;

    const allChecked = this.children().every((c) => c.checked);
    const noneChecked = this.children().every((c) => !c.checked);

    this.value.set(allChecked);
    this.indeterminate.set(!allChecked && !noneChecked);

    this.propagateChange();
  }

  private propagateChange() {
    this.onTouched();

    if (this.hasChildren) {
      const selectedValues = this.children()
        .filter((c) => c.checked)
        .map((c) => c.code);

      this.onChange(selectedValues);
      this.change.emit({ parent: this.value(), children: selectedValues });
    } else {
      this.onChange(this.value());
      this.change.emit(this.value());
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

   getHintIcon(): string {
    const type = this.getHintType();

    switch (type) {
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
