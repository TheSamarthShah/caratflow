import {
  Component,
  forwardRef,
  input,
  output,
  SimpleChanges,
  ViewChild,
  OnDestroy,
  OnChanges,
  inject,
  ElementRef,
  model,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

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
  @ViewChild('inputRef', { static: false }) inputRef!: ElementRef<HTMLInputElement>;

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
  isDatePickerVisible = input(true);
  minDate = input<Date | null | undefined>(undefined);
  maxDate = input<Date | null | undefined>(undefined);
  style = input<any>({});
  avoidTabFocus = input<boolean>(false);
  dateFormat = input<string | undefined>('YMD');
  
  hint = model<MessageDisplayOption>();
  valueInput = input<Date | null>(null, { alias: 'value' });
  valueChanged = output<Date | null>();

  // ControlValueAccessor Hooks
  onChange = (value: Date | null) => {};
  onTouched = () => {};

  // Visibility Flags
  isYearVisible = true;
  isMonthVisible = true;
  isDayVisible = true;
  isHourVisible = false;
  isMinuteVisible = false;
  isSecondVisible = false;

  private destroyed$ = new Subject<void>();

  ngOnInit() {
    this.updateVisibilityProperties();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['valueInput']) {
      const newValue = changes['valueInput'].currentValue;
      if (newValue !== this.currentDate) {
        this.writeValue(newValue);
      }
    }
    if (changes['dateFormat']) {
      this.updateVisibilityProperties();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

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
    const dateToApply = ActyDateUtils.parseToNeutral(val);
    this.currentDate = dateToApply;
    this.valueChanged.emit(this.currentDate);
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void {}

  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required() && !this.currentDate) return { required: true };
    return null;
  }

  // --- DYNAMIC DISPLAY FORMATTERS ---
  formatDisplay(date: Date | null): string {
    if (!date) return '';
    return this.datePipe.formatNeutralDate(date, this.dateFormat() || 'YMD') ?? '';
  }

  getCombinedPlaceholder(): string {
    return this.i18nService.getParseFormat(this.dateFormat() || 'YMD').toUpperCase();
  }

  // --- SMART MASK TYPING & INPUT HANDLING ---

  /** Auto-injects separators dynamically while the user is typing based on any format length */
  onTypingFormat(event: Event) {
    const input = event.target as HTMLInputElement;
    
    // Preserve AM/PM letters at the end
    const letters = input.value.replace(/[^a-zA-Z]/g, '');
    const raw = input.value.replace(/\D/g, ''); 
    let formatted = '';
    let rawIndex = 0;
    
    const inputFmt = this.i18nService.getParseFormat(this.dateFormat() || 'YMD');
    const isYMD_first = inputFmt.toLowerCase().startsWith('y'); 
    const hasDate = this.isYearVisible || this.isMonthVisible || this.isDayVisible;

    // Smart offset pointer
    const addPart = (len: number, sep: string) => {
      if (rawIndex < raw.length) {
        const partLength = Math.min(len, raw.length - rawIndex);
        formatted += (formatted.length > 0 ? sep : '') + raw.substring(rawIndex, rawIndex + partLength);
        rawIndex += len; 
      }
    };

    if (hasDate) {
      if (isYMD_first) {
        if (this.isYearVisible) addPart(4, '');
        if (this.isMonthVisible) addPart(2, this.isYearVisible ? '/' : '');
        if (this.isDayVisible) addPart(2, '/');
      } else {
        if (this.isMonthVisible) addPart(2, '');
        if (this.isDayVisible) addPart(2, this.isMonthVisible ? '/' : '');
        if (this.isYearVisible) addPart(4, '/');
      }
    }

    if (this.isHourVisible || this.isMinuteVisible || this.isSecondVisible) {
      const tSep = (formatted.length > 0) ? ' ' : '';
      if (this.isHourVisible) {
        addPart(2, tSep);
        if (this.isMinuteVisible) addPart(2, ':');
        if (this.isSecondVisible) addPart(2, ':');
      } else if (this.isMinuteVisible) {
        addPart(2, tSep);
        if (this.isSecondVisible) addPart(2, ':');
      } else if (this.isSecondVisible) {
        addPart(2, tSep);
      }
    }

    if (letters) {
      formatted += ' ' + letters.substring(0, 2).toUpperCase();
    }

    input.value = formatted;
  }

  onCombinedInputChanged(event: Event) {
    this.onTouched();
    const input = event.target as HTMLInputElement;
    const raw = input.value.trim();
    
    if (!raw) {
      this.clear();
      return;
    }

    const parseFormat = this.i18nService.getParseFormat(this.dateFormat() || 'YMD');
    let parsedDate = this.dateAdapter.parse(raw, parseFormat);
    
    // If the standard DateAdapter fails, run the manual strict digit parser
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      const valStr = raw.replace(/\D/g, ''); 
      
      if (valStr) {
        parsedDate = new Date();
        let pointer = 0;
        
        const hasDate = this.isYearVisible || this.isMonthVisible || this.isDayVisible;
        const isYMD_first = parseFormat.toLowerCase().startsWith('y');

        // Extract Date Data
        if (hasDate) {
          let y = parsedDate.getFullYear();
          let m = parsedDate.getMonth();
          let d = parsedDate.getDate();
          
          if (isYMD_first) {
            if (this.isYearVisible && valStr.length > pointer) { y = parseInt(valStr.substring(pointer, pointer + 4), 10); pointer += 4; }
            if (this.isMonthVisible && valStr.length > pointer) { m = parseInt(valStr.substring(pointer, pointer + 2), 10) - 1; pointer += 2; }
            if (this.isDayVisible && valStr.length > pointer) { d = parseInt(valStr.substring(pointer, pointer + 2), 10); pointer += 2; }
          } else {
            if (this.isMonthVisible && valStr.length > pointer) { m = parseInt(valStr.substring(pointer, pointer + 2), 10) - 1; pointer += 2; }
            if (this.isDayVisible && valStr.length > pointer) { d = parseInt(valStr.substring(pointer, pointer + 2), 10); pointer += 2; }
            if (this.isYearVisible && valStr.length > pointer) { y = parseInt(valStr.substring(pointer, pointer + 4), 10); pointer += 4; }
          }
          parsedDate = new Date(y, m, d);
          parsedDate.setHours(0,0,0,0);
        } else {
          parsedDate.setHours(0,0,0,0); // Clear out today's hours so time-only doesn't bleed
        }

        // Extract Time Data
        if (this.isHourVisible || this.isMinuteVisible || this.isSecondVisible) {
          let hr = 0, mn = 0, sc = 0;
          if (this.isHourVisible && valStr.length > pointer) { hr = parseInt(valStr.substring(pointer, pointer + 2), 10); pointer += 2; }
          if (this.isMinuteVisible && valStr.length > pointer) { mn = parseInt(valStr.substring(pointer, pointer + 2), 10); pointer += 2; }
          if (this.isSecondVisible && valStr.length > pointer) { sc = parseInt(valStr.substring(pointer, pointer + 2), 10); pointer += 2; }
          
          // Adjust for AM/PM if the user typed 'p' or 'a'
          if (raw.toLowerCase().includes('p') && hr < 12) hr += 12;
          if (raw.toLowerCase().includes('a') && hr === 12) hr = 0;
          
          parsedDate.setHours(hr, mn, sc);
        }
      }
    }
    
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      this.currentDate = parsedDate;
      input.value = this.formatDisplay(this.currentDate);
      this.emitChange();
    } else {
      input.value = this.formatDisplay(this.currentDate); // Revert to valid previous state on invalid
    }
  }

  // --- ACTIONS & HINTS ---

  clear() {
    this.currentDate = null;
    this.emitChange();
  }

  emitChange() {
    this.onChange(this.currentDate);
    this.valueChanged.emit(this.currentDate);
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

  public focus(): void {
    this.inputRef?.nativeElement.focus();
  }
}