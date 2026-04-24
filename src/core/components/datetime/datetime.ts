import {
  Component,
  forwardRef,
  input,
  output,
  signal,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  OnDestroy,
  OnChanges,
  inject,
  ChangeDetectorRef,
  ElementRef,
  model,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatCalendar, MatCalendarView } from '@angular/material/datepicker';
import { Subject } from 'rxjs';
import { ActyDatePipe, ActyDateUtils } from 'src/core/pipe/acty-date-pipe';
import { TranslateService } from '@ngx-translate/core';
import { MessageDisplayOption, MessageType } from 'src/core/models/MessageDisplayOption.type';
import { ActyCommon } from 'src/core/services/acty-common';
import { MatFormField } from '@angular/material/form-field';
import { Language_Config } from 'src/core/models/languages.config'
import { DateTime as LuxonDateTime } from 'luxon';
import { DatepickerI18nService } from 'src/core/services/datepicker-i18n-service';

@Component({
  standalone: false,
  selector: 'acty-date-time',
  templateUrl: './datetime.html',
  styleUrls: ['./datetime.scss'],
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
export class DateTime
  implements ControlValueAccessor, Validator, OnDestroy, OnChanges {
  @ViewChild('popupTemplate') popupTemplate!: TemplateRef<any>;
  @ViewChild(MatCalendar) calendar!: MatCalendar<Date>;
  @ViewChild('matInputDate', { static: false }) matInputDate!: MatFormField;
  @ViewChild('popupElement') popupElement!: ElementRef;
  @ViewChild('inputRef', { static: false })
  inputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('hourSpinner') hourSpinnerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('minuteSpinner') minuteSpinnerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('secondSpinner') secondSpinnerRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('iconButtons', { read: ElementRef })iconButtons!: QueryList<ElementRef>;
  @ViewChild('firstButton', { read: ElementRef }) firstButton!: ElementRef; 

  translate = inject(TranslateService);
  actyCommonService = inject(ActyCommon);
  i18nService = inject(DatepickerI18nService);
  
  isDisabled = input(false);
  required = input(false);
  readOnly = input(false);
  isDatePickerVisible = input(true);
  minDate = input<Date | null | undefined>(undefined);
  maxDate = input<Date | null | undefined>(undefined);
  style = input<any>({});
  hint = model<MessageDisplayOption>();
  avoidTabFocus = input<boolean>(false);
  valueChanged = output<Date | null>();
  dateFormat = input<string | undefined>('YMD');

  // Input signal aliased to 'value' (to handle [value] binding)
  valueInput = input<Date | null>(null, { alias: 'value' });

  // Signals and ControlValueAccessor boilerplate
  onChange = signal<(value: Date | null) => void>(() => { });
  onTouched = () => { };

  isOpen = false;
  private formDisabled = false;
  popupOpen = false;
  value: Date | null = null; // CVA internal value state
  selectedDate: Date | null = null;
  selectedHour = 0;
  selectedMinute = 0;
  selectedSecond = 0;
  currentLang: string = 'en-EN';
  isOpenByIcon: boolean = false;

  // Tracks which spinner is currently focused for arrow-key handling
  private focusedSpinner: 'hour' | 'minute' | 'second' | null = null;
  //number of focus in Date picker like when show only hours  and minues then it is contain 4(with today and clear)
  numberOfInputForDate : number = 0;
  //foucs index for travel focus in datepicker
  focusIndex : number = 0;


  isYearVisible = true;
  isMonthVisible = true;
  isDayVisible = true;
  isHourVisible = false;
  isMinuteVisible = false;
  isSecondVisible = false;

  calendarStartView: MatCalendarView = 'month';

  private rawTextInput: string | null = null;

  overlayRef: OverlayRef | null = null;
  private holdInterval: any;
  private destroyed$ = new Subject<void>();

  constructor(
    private dateAdapter: DateAdapter<Date>,
    private datePipe: ActyDatePipe,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.updateVisibilityProperties();
    if (this.value) {
      this.applyFromDate(this.value);
    } else {
      // Initialize time only if time is enabled
      if (this.isHourVisible || this.isMinuteVisible || this.isSecondVisible) {
        const now = new Date();
        this.selectedHour = now.getHours();
        this.selectedMinute = now.getMinutes();
        this.selectedSecond = now.getSeconds();
      } else {
        // If showTime is false, ensure time is explicitly zeroed out
        this.selectedHour = 0;
        this.selectedMinute = 0;
        this.selectedSecond = 0;
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['valueInput']) {
      const newValue = changes['valueInput'].currentValue;
      if (newValue !== this.value) {
        this.writeValue(newValue);
      }
    }
    if(changes['dateFormat']){
      this.updateVisibilityProperties();
    }
  }

  private updateVisibilityProperties() {
    const fmt = this.dateFormat() || '';
    this.isYearVisible = !fmt || fmt.includes('Y');
    this.isMonthVisible = !fmt || fmt.includes('M');
    this.isDayVisible = !fmt || fmt.includes('D');
    this.isHourVisible = fmt.includes('H');
    this.isMinuteVisible = fmt.includes('m');
    this.isSecondVisible = fmt.includes('s');

    if (!fmt) {
      this.calendarStartView = 'month';
    } else if (fmt.includes('D')) {
      this.calendarStartView = 'month';
    } else if (fmt.includes('M')) {
      this.calendarStartView = 'year';
    } else if (fmt.includes('Y')) {
      this.calendarStartView = 'multi-year';
    } else {
      this.calendarStartView = 'month';
    }
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
    //2 for clear and today buttons
    this.numberOfInputForDate = [this.isHourVisible,this.isMinuteVisible,this.isSecondVisible].filter(Boolean).length + 2;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.closePopup();
  }

  writeValue(val: any): void {
    const dateToApply = ActyDateUtils.parseToNeutral(val);

    this.value = dateToApply;
    this.rawTextInput = this.formatDisplay(dateToApply);
    if (dateToApply) {
      this.applyFromDate(dateToApply);
    } else {
      this.selectedDate = null;
    }
    this.valueChanged.emit(dateToApply); 
  }

  registerOnChange(fn: any): void {
    this.onChange.set(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled = isDisabled;
  }

  // -----------------------
  // Validator
  // -----------------------
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required() && !this.value) {
      return { required: true };
    }
    return null;
  }

  // Text Input Handling
  onTextInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputString = inputElement.value;
    this.rawTextInput = inputString;

    if (!this.isHourVisible && !this.isMinuteVisible && !this.isSecondVisible && inputString.includes(':')) {
      return;
    }

    // Use DateAdapter strictly for user typing because it understands 
    // locale formats like MM/DD/YYYY, unlike strict ISO parsers.
    const parsedDate = this.dateAdapter.parse(
      inputString,
      this.i18nService.getParseFormat(this.dateFormat() ?? 'YMD')
    );

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      this.applyFromDate(parsedDate);

      if (this.calendar && this.selectedDate) {
        this.calendar.activeDate = this.selectedDate;
        this.calendar.updateTodaysDate();
      }
    }
  }

  onValueChanged(event: Event) {
    this.onTouched();

    const inputElement = event.target as HTMLInputElement;
    const inputString = inputElement.value.trim();

    if (!inputString && !this.overlayRef) {
      this.clear();
      return;
    }

    // Use DateAdapter to read the localized string
    const parsedDate = this.dateAdapter.parse(
      inputString,
      this.i18nService.getParseFormat(this.dateFormat() ?? 'YMD')
    );

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      const formattedValue = this.formatDisplay(this.value) ?? '';
      inputElement.value = formattedValue;
      return;
    }

    if (!this.isHourVisible && !this.isMinuteVisible && !this.isSecondVisible && inputString.includes(':')) {
      this.applyFromDate(parsedDate);
      inputElement.value = this.formatDisplay(this.value);
      this.emitDateTime();
      return;
    }

    this.applyFromDate(parsedDate);
    this.emitDateTime();
  }

  openCalendar() {
    if (!this.isDisabled()) {
      this.togglePopup();
      this.isOpenByIcon = true;
    }
  }

  togglePopup() {
    if (this.isDisabled()) return;
    if (!this.isDatePickerVisible()) return;

    if (this.isOpenByIcon) {
      this.isOpenByIcon = false;
      return;
    }
    if (this.isOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  private onEscape = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.focusSetInCalendarIconOnInput();
      this.closePopup();
    }
  };

  //method for focus set in input date icon
  focusSetInCalendarIconOnInput(){
    requestAnimationFrame(() => {
      const btn = this.firstButton?.nativeElement?.querySelector('button');
      btn?.focus();
      if(!btn){
        this.focusSetInCalendarIconOnInput();
      }
    });
    this.focusIndex = 0;
  }

  openPopup() {
    this.isOpen = true;
    setTimeout(() => {
      this.calendar?.focusActiveCell();
      if(!this.calendar){
        this.openPopup();
      }
       this.iconButtons.forEach((btn: ElementRef) => {
        const icon = btn.nativeElement.querySelector('.calendar-icon');
        if (icon) {
          icon.setAttribute('tabindex', '-1');
        }
      });
    });
    this.focusIndex = 0;
    window.addEventListener('keydown', this.onEscape);
  }

  onCalendarKeydown(event : KeyboardEvent){
    if (event.key !== 'Tab' && !event.shiftKey) return;
    //when press Shift with Tab then move backwords
    if(event.key === 'Tab' && event.shiftKey){
      if(this.focusIndex === 0){
        this.inputRef?.nativeElement?.focus();
      }else{
        this.focusIndex--;
      }
    }
    else if(event.key === 'Tab'){
      if(this.focusIndex === this.numberOfInputForDate){
        this.focusSetInCalendarIconOnInput();
        this.closePopup();
      }else{
        this.focusIndex++;
      }
    }
  }

  //whenever anywhere click on calender then set focus inside the calender
  onClickInCalender(event : any){
    // this.calendar?.focusActiveCell();
    if(this.focusedSpinner === 'hour'){
      this.focusIndex = 1;
    }
    else if(this.focusedSpinner === 'minute'){
      this.focusIndex =2;
    }
    else if(this.focusedSpinner ===  'second'){
      this.focusIndex = 3;
    }
    else 
      this.focusIndex = 0
    }

  closePopup(event? : any) {
    if(event){
      this.focusSetInCalendarIconOnInput();
    }
    if (!this.isOpen) return;
    this.isOpen = false;
    this.focusedSpinner = null;
    window.removeEventListener('keydown', this.onEscape);
    this.onTouched();
    this.focusIndex = 0;
  }

  // -------------------------------------------------------
  // Spinner keyboard interaction
  // -------------------------------------------------------

  onSpinnerFocus(unit: 'hour' | 'minute' | 'second') {
    this.focusedSpinner = unit;
  }

  onSpinnerBlur() {
    this.focusedSpinner = null;
  }

  onSpinnerKeydown(event: KeyboardEvent, unit: 'hour' | 'minute' | 'second') {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.changeValue(unit, 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.changeValue(unit, -1);
        break;
      case 'Tab':
        // Let Tab flow naturally to the next focusable spinner.
        // The tabindex on each spinner div handles the order.
        // We only need to stop the popup from closing on Tab —
        // remove Tab from the escape handler (already done above).
        break;
      case 'Enter':
        this.focusSetInCalendarIconOnInput();
        this.closePopup();
        break;
    }
  }

  //added for when click(select) on alreay selected date
  clickOnCalenderDate(event : MouseEvent){
    if(!this.isOpen) return;
    const target = event.target as HTMLElement;

    // Find the closest date cell
    //mension in website
    const cell = target.closest('.mat-calendar-body-cell');

    if (cell) {
      // const ariaLabel = cell.getAttribute('aria-label');
      this.focusSetInCalendarIconOnInput();
     this.closePopup();
    }

  }

  onCalendarDateChange(date: Date) {
    this.selectedDate = date;
    this.emitDateTime();
    if (this.isDayVisible) {
      // If time spinners exist, move focus to the first one instead of closing
      if (this.isHourVisible || this.isMinuteVisible || this.isSecondVisible) {
        requestAnimationFrame(() => {
          const first = this.isHourVisible
            ? this.hourSpinnerRef
            : this.isMinuteVisible
            ? this.minuteSpinnerRef
            : this.secondSpinnerRef;
          first?.nativeElement?.focus();
        });
      } else {
        this.focusSetInCalendarIconOnInput();
        this.closePopup();
      }
    }
    this.focusSetInCalendarIconOnInput();
    this.closePopup();
  }

  onViewChanged(view: MatCalendarView) {
    if (view === 'multi-year' && !this.isYearVisible) {
      setTimeout(() => {
        this.calendar.currentView = 'year';
      });
    }
  }

  onMonthSelected(date: Date) {
    if (!this.isDayVisible) {
      this.selectedDate = date;
      this.emitDateTime();
      this.focusSetInCalendarIconOnInput();
      this.closePopup();
    }
  }

  onYearSelected(date: Date) {
    if (!this.isMonthVisible) {
      this.selectedDate = date;
      this.emitDateTime();
      this.focusSetInCalendarIconOnInput();
      this.closePopup();
    }
  }

  onTimeChange() {
    this.emitDateTime();
  }

  emitDateTime() {
    if (!this.selectedDate) return;
    const dt = new Date(this.selectedDate);

    if (!this.isYearVisible) {
      dt.setFullYear(new Date().getFullYear());
    }
    if (!this.isDayVisible) {
      dt.setDate(1);
    }

    let neutralValue: Date; // The internal UI state (MUST be a Date object)
    let emitValue: Date;    // The API state (MUST be a Date object)

    if (this.isHourVisible || this.isMinuteVisible || this.isSecondVisible) {
      dt.setHours(this.selectedHour);
      dt.setMinutes(this.selectedMinute);
      dt.setSeconds(this.isSecondVisible ? this.selectedSecond : 0);

      // Keep UI numbers local so the screen looks correct
      neutralValue = new Date(dt);

      // Keep API numbers UTC so the database is correct
      emitValue = new Date(Date.UTC(
        dt.getFullYear(),
        dt.getMonth(),
        dt.getDate(),
        this.selectedHour,
        this.selectedMinute,
        this.isSecondVisible ? this.selectedSecond : 0
      ));
    } else {
      // FIX: Keep the date strictly as a JS Date object at local midnight. 
      // Do NOT convert this to a "YYYY-MM-DD" string!
      neutralValue = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0);
      
      // Keep API numbers at UTC midnight
      emitValue = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0));
    }

    this.value = neutralValue; 
    
    // Because neutralValue is a Date, formatDisplay won't run into string-parsing bugs!
    this.rawTextInput = this.formatDisplay(neutralValue);

    this.onChange()(emitValue); 
    this.valueChanged.emit(emitValue);
    this.onTouched();
  }

  setToday() {
    const now = new Date();
    this.applyFromDate(now);
    this.emitDateTime();

    if (this.calendar && this.selectedDate) {
      this.calendar.activeDate = this.selectedDate;
      this.calendar.updateTodaysDate();
    }
    this.focusSetInCalendarIconOnInput()
    this.closePopup();
  }

  clear() {
    this.selectedDate = null;
    this.value = null;
    this.rawTextInput = '';

    this.selectedHour = 0;
    this.selectedMinute = 0;
    this.selectedSecond = 0;

    this.valueChanged.emit(null);
    this.onChange()(null); // notify forms
    this.onTouched();
    if (this.overlayRef) {
      this.closePopup();
    }
  }

  formatDisplay(date: Date | null): string {
    if (!date) return '';
    return this.datePipe.formatNeutralDate(
      date, 
      this.dateFormat() ?? 'YMD'
    ) ?? '';
  }

  private applyFromDate(date: Date) {
    this.selectedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (this.isHourVisible || this.isMinuteVisible || this.isSecondVisible) {
      this.selectedHour = date.getHours();
      this.selectedMinute = date.getMinutes();
      this.selectedSecond = date.getSeconds();
    } else {
      this.selectedHour = 0;
      this.selectedMinute = 0;
      this.selectedSecond = 0;
    }
  }

  // -----------------------
  // Time Spinner Logic
  // -----------------------
  startIncrement(unit: 'hour' | 'minute' | 'second') {
    if (!this.isHourVisible && !this.isMinuteVisible && !this.isSecondVisible) return;

    this.changeValue(unit, 1);
    this.holdInterval = setInterval(() => {
      this.changeValue(unit, 1);
    }, 150);
  }

  startDecrement(unit: 'hour' | 'minute' | 'second') {
    if (!this.isHourVisible && !this.isMinuteVisible && !this.isSecondVisible) return;

    this.changeValue(unit, -1);
    this.holdInterval = setInterval(() => {
      this.changeValue(unit, -1);
    }, 150);
  }

  stopIncrement() {
    clearInterval(this.holdInterval);
  }

  private changeValue(unit: 'hour' | 'minute' | 'second', delta: number) {
    if (unit === 'hour') {
      const langConfig = Language_Config.find(l => l.code === this.translate.currentLang);
      const maxHour = langConfig?.timeFormat ? (Number(langConfig.timeFormat) === 24 ? 23 : 12) : 12;
      this.selectedHour =
        (this.selectedHour + delta + (maxHour + 1)) % (maxHour + 1);
    } else if (unit === 'minute') {
      this.selectedMinute = (this.selectedMinute + delta + 60) % 60;
    } else if (unit === 'second') {
      this.selectedSecond = (this.selectedSecond + delta + 60) % 60;
    }
    this.onTimeChange();
  }

  formatTwoDigits(value: number): string {
    return value < 10 ? '0' + value : String(value);
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