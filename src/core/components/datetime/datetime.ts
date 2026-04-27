import {
  Component, forwardRef, input, output, signal, SimpleChanges,
  OnDestroy, OnChanges, inject, ChangeDetectorRef, model
} from '@angular/core';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS,
  Validator, AbstractControl, ValidationErrors
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ActyDatePipe, ActyDateUtils } from 'src/core/pipe/acty-date-pipe';
import { MessageDisplayOption, MessageType } from 'src/core/models/MessageDisplayOption.type';
import { ActyCommon } from 'src/core/services/acty-common';
import { DatepickerI18nService } from 'src/core/services/datepicker-i18n-service';

@Component({
  standalone: true,
  selector: 'acty-date-time',
  templateUrl: './datetime.html',
  styleUrls: ['./datetime.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatTimepickerModule,
    TranslateModule,
  ],
  providers: [
    ActyDatePipe,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTime),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DateTime),
      multi: true,
    },
  ],
})
export class DateTime implements ControlValueAccessor, Validator, OnDestroy, OnChanges {
  translate = inject(TranslateService);
  actyCommonService = inject(ActyCommon);
  i18nService = inject(DatepickerI18nService);
  dateAdapter = inject(DateAdapter<Date>);
  datePipe = inject(ActyDatePipe);

  // Core Value State
  currentDate: Date | null = null;

  // Inputs
  isDisabled = input(false);
  required = input(false);
  readOnly = input(false);
  dateFormat = input<string | undefined>('YMD');
  hint = model<MessageDisplayOption>();

  // ControlValueAccessor Hooks
  onChange = (value: Date | null) => { };
  onTouched = () => { };

  // Visibility Flags
  isYearVisible = true;
  isMonthVisible = true;
  isDayVisible = true;
  isHourVisible = false;
  isMinuteVisible = false;
  isSecondVisible = false;

  ngOnInit() {
    this.updateVisibilityProperties();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dateFormat']) {
      this.updateVisibilityProperties();
    }
  }

  ngOnDestroy() { }

  private updateVisibilityProperties() {
    const fmt = this.dateFormat() || '';
    this.isYearVisible = !fmt || fmt.includes('Y');
    this.isMonthVisible = !fmt || fmt.includes('M');
    this.isDayVisible = !fmt || fmt.includes('D');
    this.isHourVisible = fmt.includes('H');
    this.isMinuteVisible = fmt.includes('m');
    this.isSecondVisible = fmt.includes('s');
  }

  // --- CONTROL VALUE ACCESSOR ---
  writeValue(val: any): void {
    this.currentDate = ActyDateUtils.parseToNeutral(val);
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { }

  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required() && !this.currentDate) return { required: true };
    return null;
  }

  // --- EVENT HANDLERS ---

  private extractSafeDate(event: any): Date | null {
    if (!event) return null;
    const val = event.value !== undefined ? event.value : event;
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val.toJSDate === 'function') return val.toJSDate();
    if (typeof val.toDate === 'function') return val.toDate();
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  onDateSelected(event: any) {
    this.onTouched();
    const newDate = this.extractSafeDate(event);
    if (!newDate) {
      this.currentDate = null;
    } else {
      const merged = this.currentDate ? new Date(this.currentDate) : new Date();
      if (!this.currentDate) merged.setHours(0, 0, 0, 0); // Default midnight
      merged.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      this.currentDate = merged;
    }
    this.emitChange();
  }

  onTimeSelected(event: any) {
    this.onTouched();
    const newTime = this.extractSafeDate(event);
    if (!newTime) return; // Ignore clearing time via picker

    const merged = this.currentDate ? new Date(this.currentDate) : new Date();
    merged.setHours(newTime.getHours(), newTime.getMinutes(), newTime.getSeconds(), 0);
    this.currentDate = merged;
    this.emitChange();
  }

  // --- SMART INPUT TYPING (e.g. 20260425 -> Date) ---

  onDateInputChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    const raw = input.value.trim();

    if (!raw) {
      this.currentDate = null;
      this.emitChange();
      return;
    }

    const valStr = raw.replace(/\D/g, ''); // strip non-digits
    let parsedDate: Date | null = null;

    if (valStr.length === 8) {
      parsedDate = new Date(parseInt(valStr.substring(0, 4), 10), parseInt(valStr.substring(4, 6), 10) - 1, parseInt(valStr.substring(6, 8), 10));
    } else if (valStr.length === 6) {
      parsedDate = new Date(parseInt('20' + valStr.substring(0, 2), 10), parseInt(valStr.substring(2, 4), 10) - 1, parseInt(valStr.substring(4, 6), 10));
    } else {
      parsedDate = this.dateAdapter.parse(raw, this.i18nService.getParseFormat('YMD'));
    }

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      this.onDateSelected({ value: parsedDate });
      input.value = this.datePipe.formatNeutralDate(parsedDate, 'YMD') ?? ''; // Clean up input UI
    } else {
      input.value = this.currentDate ? (this.datePipe.formatNeutralDate(this.currentDate, 'YMD') ?? '') : '';
    }
  }

  onTimeInputChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    const raw = input.value.trim();

    if (!raw && this.currentDate) {
      this.currentDate.setHours(0, 0, 0, 0);
      this.emitChange();
      return;
    }

    const valStr = raw.replace(/\D/g, '');
    let parsedTime: Date | null = null;

    if (valStr.length >= 3 && valStr.length <= 4) {
      const h = parseInt(valStr.length === 3 ? valStr.substring(0, 1) : valStr.substring(0, 2), 10);
      const m = parseInt(valStr.slice(-2), 10);
      parsedTime = new Date();
      parsedTime.setHours(h, m, 0, 0);
    } else {
      parsedTime = this.dateAdapter.parse(raw, this.i18nService.getParseFormat('Hms'));
    }

    if (parsedTime && !isNaN(parsedTime.getTime())) {
      this.onTimeSelected({ value: parsedTime });
      input.value = `${parsedTime.getHours().toString().padStart(2, '0')}:${parsedTime.getMinutes().toString().padStart(2, '0')}`;
    }
  }

  // --- ACTIONS & HINTS ---

  clear() {
    this.currentDate = null;
    this.emitChange();
  }

  emitChange() {
    this.onChange(this.currentDate);
  }

  getHintType(): MessageType {
    const h = this.hint();
    if (h?.type !== undefined) return h.type;
    return this.actyCommonService.getTypeFromMsgCode(h?.message ?? '');
  }

  getHintIcon() {
    switch (this.getHintType()) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'check_circle';
      default: return 'info';
    }
  }
}