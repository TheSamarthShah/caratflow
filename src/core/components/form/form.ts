import {
  ChangeDetectorRef, Component, DestroyRef, effect, ElementRef,
  inject, Injector, input, model, OnChanges, OnDestroy, OnInit,
  output, QueryList, signal, SimpleChanges, ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';

// Custom Types
import { 
  FormColumn, ReferenceSelectedEvent, FormValueChangedEvent, 
  FieldInputFinishedEvent, CustomDatePickerField, MessageDisplayOption, RefRelation 
} from '../../types/form.type';

// Custom Directives and Pipes
import { SyncMinWidthObserve } from 'src/core/directive/sync-min-width-observe';
import { ObserveClass } from 'src/core/directive/observe-class';
import { ActyDatePipe } from 'src/core/pipe/acty-date-pipe';
import { ActyNumberPipe } from 'src/core/pipe/acty-number-pipe';
import { Languages } from 'src/core/models/languages.config';

// Angular Material Imports replacing acty-* inputs
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

// Other Modules
import { ReferenceScreenButton } from '../reference-screen-button/reference-screen-button';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReferenceScreenService } from 'src/core/services/reference-screen-service';
import { ActyCommon } from 'src/core/services/acty-common';
import { DataChangeDetectedService } from 'src/core/services/data-change-detected-service';

@Component({
  selector: 'app-form',
  imports: [],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class Form implements OnInit, OnChanges, OnDestroy {
  @ViewChildren('focusableCell', { read: ElementRef }) focusableCells!: QueryList<ElementRef>;
  @ViewChildren('entryHeaderWrapers', { read: ElementRef }) entryHeaderWrapers!: QueryList<ElementRef>;
  @ViewChildren('fieldRow') fieldRows!: QueryList<ElementRef>;

  translate = inject(TranslateService);
  private cookieService = inject(CookieService);
  refScreenService = inject(ReferenceScreenService);
  private injector = inject(Injector);
  private ActyCommonService = inject(ActyCommon);
  private DataChangeDetected = inject(DataChangeDetectedService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  cdr = inject(ChangeDetectorRef);
  el = inject(ElementRef);

  formConfigData = input.required<FormColumn[]>();
  initialFormData = input<Record<string, unknown>>({});
  
  formGroupsDictionarysignal = model<FormGroup>(new FormGroup({}));
  referenceDefaultValueColNames = model<string[]>([]);
  
  isMaterialFilter = input<boolean>(false);
  isCheckBoxAdded = input<boolean>(false);
  numberOfCols = input<number>(2);
  showVisualValueChange = input<boolean>(true);
  labelId = input.required<string>();
  isCopyMode = input<boolean>(false);
  formId = input<string>('');
  tabId = input<string>('');
  defaultValueSelectorId = input<string>('');

  formValuesChanged = output<FormValueChangedEvent>();
  fieldInputFinished = output<FieldInputFinishedEvent>();
  formReferenceSelected = output<ReferenceSelectedEvent>();
  completeFormInitialize = output<void>();

  userId: string = JSON.parse(this.cookieService.get('seira_user') || '{}').userid || '';
  plantTimeZone = signal<string>('Asia/Tokyo');
  
  refScreenOnRowData = signal<{
    referenceScreenId: string;
    rowId: number;
    tabId?: string;
    refForColumn: string;
    selectedValue: unknown;
    refRelations: RefRelation[];
  }>({
    referenceScreenId: '',
    rowId: -1,
    tabId: '',
    refForColumn: '',
    selectedValue: '',
    refRelations: [],
  });

  formValidateDictionary = new Map<string, MessageDisplayOption>();
  updatedFields = new Set<string>();
  private columnMaxLengthWidths: Record<string, string> = {};
  columnValidationState: Record<string, boolean> = {};
  emptyRequiredCell: string[] = [];
  screenName = '';
  
  private iconWidthInInputsInPxForWidthCalculation = 36;
  private WCharacterWidthInPxForWidthCalculation = 13;
  
  currLanguage: Languages = 'en';
  triggerChange = false;
  private langChangeSubscription: Subscription | undefined;

  selectedDateField = signal<string>("");
  isCustomDatePickerOpen = signal<boolean>(false);
  datePickerForm = new FormGroup({
    year_condition: new FormControl<string>('1'),
    month_condition: new FormControl<string>('1'),
    day_condition: new FormControl<string>('1'),
    year_value: new FormControl<number | null>(null),
    month_value: new FormControl<number | null>(null),
    day_value: new FormControl<number | null>(null),
  });
  
  datePickerFields: CustomDatePickerField[];
  initialDatePickerValues = {
    year_condition: '1', month_condition: '1', day_condition: '1',
    year_value: null, month_value: null, day_value: null
  };
  
  initialDatePickerFields: CustomDatePickerField[] = [
    { label: 'Year', condition: 'year_condition', dataField: 'year_value', min: 1, max: undefined },
    { label: 'Month', condition: 'month_condition', dataField: 'month_value', min: 1, max: 12 },
    { label: 'Day', condition: 'day_condition', dataField: 'day_value', min: 1, max: 31 }
  ];
  
  dateConditionOptions = [
    { Id: '1', text: 'Inserted' }, { Id: '2', text: 'Current' },
    { Id: '3', text: 'Previous' }, { Id: '4', text: 'Next' }
  ];

  yearHint: MessageDisplayOption | undefined;
  monthHint: MessageDisplayOption | undefined;
  dayHint: MessageDisplayOption | undefined;

  constructor() {
    effect(() => {
      const form = this.formGroupsDictionarysignal();
      if (form) {
        let previousValues = { ...form.value };
        form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((currentValues) => {
          let updatedColumn = '';
          Object.keys(currentValues).forEach((fieldName) => {
            if (currentValues[fieldName] !== previousValues[fieldName]) {
              updatedColumn = fieldName;
            }
          });
          previousValues = { ...currentValues };
          if (updatedColumn) {
            this.formValuesChanged.emit({ form, updatedColumn });
          }
        });
      }
    }, { allowSignalWrites: true });
    
    this.datePickerFields = JSON.parse(JSON.stringify(this.initialDatePickerFields));
  }

  ngOnInit(): void {
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      this.currLanguage = (localStorage.getItem('locale') as Languages) ?? 'en';
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formConfigData'] || changes['initialFormData']) {
      if (changes['formConfigData']) {
        this.getDefaultValueColumnName(this.formConfigData() ?? []);
      }
      this.buildSingleForm(this.initialFormData());
    }
  }

  ngAfterViewInit() {
    this.completeFormInitialize.emit();
  }

  ngOnDestroy(): void {
    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
  }

  onContainerSizeChange() {
    this.triggerChange = !this.triggerChange;
  }

  buildSingleForm(data?: Record<string, unknown>): void {
    const formGroupConfig: Record<string, unknown> = {};
    this.resetScreen();
    const fields: FormColumn[] = this.formConfigData() ?? [];

    fields.forEach((fieldMeta: FormColumn) => {
      let value: unknown = '';

      if (!data) {
        if (fieldMeta.defaultAddValue !== undefined) value = fieldMeta.defaultAddValue;
      } else {
        if (this.isCopyMode() && fieldMeta.isPrimaryKey && fieldMeta.isAutoGenerate) return;

        if (this.isCopyMode() && fieldMeta.useValueWhenCopy && fieldMeta.useValueWhenCopy !== 'copiedDataValue') {
          const copyValueKey = fieldMeta.useValueWhenCopy as keyof FormColumn;
          value = fieldMeta[copyValueKey];
        } else {
          value = data[fieldMeta.dataField];
        }
      }

      if (fieldMeta.editorType === '6' && fieldMeta.memberList) {
        fieldMeta.memberList = fieldMeta.memberList.map((item) => ({
          ...item,
          checked: item.code === value,
        }));
      } else if (fieldMeta.editorType === '7') {
        if (typeof value === 'string') {
          value = value.split(',').map((v) => v.trim());
        } else if (!value) {
          value = [];
        }
      }

      formGroupConfig[fieldMeta.dataField] = value ?? '';
    });

    let form = this.formGroupsDictionarysignal();
    if (!form) {
      form = this.fb.group({});
      this.formGroupsDictionarysignal.set(form);
    }

    Object.keys(form.controls).forEach(key => {
      if (!formGroupConfig.hasOwnProperty(key)) {
        if (!this.isMaterialFilter()) {
          form.removeControl(key);
        }
      }
    });

    Object.keys(formGroupConfig).forEach(key => {
      const column = this.formConfigData()?.find(item => item.dataField === key);
      
      const baseValue = formGroupConfig[key] != null ? formGroupConfig[key] : '';

      if (!form.contains(key)) {
        form.addControl(key, new FormControl(baseValue));

        if (this.isMaterialFilter()) {
          form.addControl(key + '_defaultVisible', new FormControl(''));

          if (column?.showMatchType) {
            form.addControl(key + '_To', new FormControl(baseValue));
            form.addControl(key + '_filterConditions', new FormControl([]));
            form.addControl(key + '_Conditions', new FormControl('TASK.Search.~'));
          }

          if (column?.editorType === '3') {
            form.addControl(key + '_From_expression', new FormControl(''));
            form.addControl(key + '_To_expression', new FormControl(''));
          }
        }
      } else {
        form.get(key)?.setValue(baseValue, { emitEvent: false });

        if (this.isMaterialFilter()) {
          const defaultVisibleControl = form.get(key + '_defaultVisible');
          if (defaultVisibleControl) {
            const shouldBeChecked = column?.isVisible === true;
            defaultVisibleControl.setValue(shouldBeChecked, { emitEvent: false });
            if (column?.searchRequired) {
              defaultVisibleControl.setValue(true, { emitEvent: false });
            }
          }

          const initialData = this.initialFormData();
          const toControl = form.get(key + '_To');
          if (toControl && initialData?.[key + '_To'] !== undefined) {
            toControl.setValue(initialData[key + '_To'], { emitEvent: false });
          }
        }
      }
    });

    if (!this.showVisualValueChange() && this.initialFormData() && form) {
      Object.assign(this.initialFormData(), form.value);
    }

    if (form) {
      Object.keys(form.controls).forEach((fieldName) => {
        this.formValuesChanged.emit({ form: form, updatedColumn: fieldName });
      });
    }

    this.updatedFields.clear();
    this.generateColumnMaxLengthWidth();
  }

  resetScreen() {
    this.updatedFields.clear();
    this.screenName = '';
    this.emptyRequiredCell = [];
    this.columnValidationState = {};
    this.columnMaxLengthWidths = {};

    if (!this.isMaterialFilter()) {
      this.DataChangeDetected.dataChangeListReset();
      this.DataChangeDetected.netRowChangeCounterReset();
    }
  }

  getAllRows(): string[] {
    const rows = new Set<string>();
    const fields = this.formConfigData() ?? [];
    fields.forEach((field: FormColumn) => {
      if (field.isVisible && field.rowIndex) {
        rows.add(field.rowIndex);
      }
    });
    return Array.from(rows).sort((a, b) => parseInt(a) - parseInt(b));
  }

  getColumnGroups(): string[] {
    const groups = new Set<string>();
    const fields = this.formConfigData() ?? [];
    fields.forEach((field: FormColumn) => {
      if (field.isVisible && field.columnGroupNumber) {
        groups.add(field.columnGroupNumber);
      }
    });
    return Array.from(groups).sort((a, b) => parseInt(a) - parseInt(b));
  }

  getFieldsForRow(rowIndex: string, groupNo: string): FormColumn[] {
    const fields = this.formConfigData() ?? [];
    return fields.filter((field: FormColumn) => 
      field.isVisible && field.rowIndex === rowIndex && field.columnGroupNumber === groupNo
    );
  }

  isCellUpdated(dataField: string, formValue: unknown): boolean {
    return true; 
  }

  hasColumnError(dataField: string, formValue: unknown): boolean {
    return false;
  }

  getLabelKey(isWrapped: boolean, isFirst: boolean, groupNo: string): string {
    if (isWrapped) return '1_' + this.labelId();
    if (isFirst) return groupNo + '_' + this.labelId();
    return '';
  }

  isRequiredColumn(column: string): boolean {
    if (this.isMaterialFilter()) return false;
    const fields = this.formConfigData() ?? [];
    const gridColumn = fields.find((col: FormColumn) => col.dataField === column);
    return gridColumn?.isRequired ?? false;
  }

  getColumnMaxlengthWidth(columnName: string, dateFormat: string = 'YMD'): string {
    const dateShowHours = dateFormat.includes('H');
    if (this.isMaterialFilter()) return '100%';
    if (dateShowHours) return '200px';
    return this.columnMaxLengthWidths[columnName] || '150px';
  }

  generateColumnMaxLengthWidth(): void {
    this.formConfigData()?.forEach((column: FormColumn) => {
      if (column.isVisible !== false && column.dataField) {
        this.columnMaxLengthWidths[column.dataField] = this.calculateColumnWidth(column);
      }
    });
  }

  private calculateColumnWidth(column: FormColumn): string {
    let typeWidths: Record<string, string> = this.isMaterialFilter() 
      ? { '1': '100%', '2': '100%', '3': '100%', '4': '100%', '5': '100%', '6': '100%' }
      : { '1': '120px', '2': '120px', '3': '150px', '4': '150px', '5': '50px', '6': '50px' };

    let baseWidth = typeWidths[column.editorType] || '150px';
    const baseWidthValue = parseInt(baseWidth, 10);

    if (column.editorType === '1' && !this.isMaterialFilter()) {
      const charLength = column.maxLength || 0;
      const iconWidth = column.isReferenceScreen ? this.iconWidthInInputsInPxForWidthCalculation : 0;
      if (charLength > 0) {
        const calculatedWidth = Math.max(charLength * this.WCharacterWidthInPxForWidthCalculation + iconWidth, baseWidthValue);
        baseWidth = `${Math.min(calculatedWidth, 400)}px`;
      }
    } else if (column.editorType === '2' && !this.isMaterialFilter()) {
      const precision = column.dataPrecision || 0;
      const scale = column.dataScale || 0;
      const totalDigits = precision + (scale > 0 ? 1 : 0);
      const calculatedWidth = Math.max(totalDigits * this.WCharacterWidthInPxForWidthCalculation, baseWidthValue);
      baseWidth = `${Math.min(calculatedWidth, 300)}px`;
    }
    return baseWidth;
  }

  getInvalidMessage(dataField: string): MessageDisplayOption | undefined {
    return this.formValidateDictionary?.get(dataField);
  }

  onInputInternalHintChange(event: MessageDisplayOption | undefined, dataField: string): void {
    setTimeout(() => {
      if (event) {
        this.columnValidationState[dataField] = true;
        this.formValidateDictionary.set(dataField, { message: event.message, params: event.params });
      } else {
        this.columnValidationState[dataField] = false;
        this.formValidateDictionary.delete(dataField);
      }
    });
  }

  isValidateColumn(column: FormColumn, isToValue: boolean = false): boolean {
    if (this.columnValidationState[column.dataField]) return true;

    const form = this.formGroupsDictionarysignal();
    if (!form) return false;

    if (column?.isRequired && !this.isMaterialFilter()) {
      const value = form.get(column.dataField)?.value;
      if (value === null || value === '') {
        if (!this.emptyRequiredCell.includes(column.dataField)) {
          this.emptyRequiredCell.push(column.dataField);
        }
        return true;
      }
    }

    if (column?.searchRequired && this.isMaterialFilter()) {
      const value = !isToValue ? form.get(column.dataField)?.value : form.get(column.dataField + '_To')?.value;
      const conditionvalue = !isToValue ? form.get(column.dataField)?.value : form.get(column.dataField + '_Conditions')?.value;

      if ((value === null || value === '') && (conditionvalue === 'TASK.Search.~' || !isToValue)) {
        if (!this.emptyRequiredCell.includes(column.dataField)) {
          this.emptyRequiredCell.push(column.dataField);
        }
        return false;
      }
    }

    this.emptyRequiredCell = this.emptyRequiredCell.filter((item) => item !== column.dataField);
    this.formValidateDictionary.delete(column.dataField);
    return false;
  }

  isFieldUpdated(dataField: string): boolean {
    if (this.showVisualValueChange()) {
      return !!(this.updatedFields && this.updatedFields.has(dataField));
    }
    return false;
  }

  onHeaderValueChange(newValue: unknown, column: FormColumn): void { }

  onInputFinished(newValue: unknown, column: FormColumn, dataField: string, ignoreReferenceScreen = false): void {
    this.onHeaderValueChange(newValue, column);
    
    const hasReferenceScreen = column.isReferenceScreen ? true : false;
    if (hasReferenceScreen && !ignoreReferenceScreen && !this.isMaterialFilter()) {
      this.setRefScreenRowData(column);
    }

    const dataFieldValue = this.defaultValueSelectorId() !== '' ? `${this.defaultValueSelectorId()}.${dataField}` : dataField;
    const targetForm = this.formGroupsDictionarysignal();

    if (this.referenceDefaultValueColNames().includes(dataFieldValue)) {
      const result: Record<string, unknown> = {};
      if (targetForm) {
        result[dataFieldValue] = targetForm.get(dataField)?.value;
      }
      this.refScreenService.defaultValue.update((prev) => ({ ...prev, ...result }));
    }

    this.fieldInputFinished.emit({ tabId: this.tabId(), updatedColumn: column.dataField });
  }

  setRefScreenRowData(column: FormColumn): void {
    const form = this.formGroupsDictionarysignal();
    if (!form) return;

    const controlValue = form.get(column.dataField)?.value;
    if (column && controlValue !== null && controlValue !== '') {
      this.refScreenOnRowData.set({
        referenceScreenId: column.referenceScreenId ?? '',
        rowId: -1,
        tabId: this.tabId(),
        refForColumn: column.dataField,
        selectedValue: controlValue,
        refRelations: column.refRelations ?? [],
      });
    } else if (column) {
      column.refRelations?.forEach((refRelation: RefRelation) => {
        if (refRelation.mainScreenColumnName) {
          const dependentFieldName = refRelation.mainScreenColumnName.replace(/\b\w/g, (c) => c.toUpperCase());
          form.get(dependentFieldName)?.setValue(null);
        }
      });
    }
  }

  onInputValueChange(column: FormColumn, isToValue: boolean = false): void {
    if (!column) return;
    const form = this.formGroupsDictionarysignal();
    if (!form) return;

    const reqType = column.searchRequired;
    const fieldName = !isToValue ? column.dataField : `${column.dataField}_To`;
    const otherFieldName = isToValue ? column.dataField : `${column.dataField}_To`;
    const value = form.get(fieldName)?.value;

    if (value !== null && value !== undefined && value !== '') {
      this.columnValidationState[fieldName] = false;
      this.formValidateDictionary?.delete(fieldName);

      if (reqType === 'ANY') {
        this.columnValidationState[otherFieldName] = false;
        this.formValidateDictionary?.delete(otherFieldName);
      }
    }
  }

  isRequiredFormField(column: FormColumn): boolean {
    if (this.isMaterialFilter()) return false;
    const targetForm = this.formGroupsDictionarysignal();
    if (!targetForm || !targetForm.value) return false;

    if (column.isRequired && !this.isAutoGenerateFormField(column)) {
      const fieldValue = targetForm.get(column.dataField)?.value;
      if (fieldValue === null || fieldValue === '') return true;
    }
    return false;
  }

  isAutoGenerateFormField(column: FormColumn): boolean {
    return column.isAutoGenerate ?? false;
  }

  onRowDataUpdate(column: FormColumn, isToValue: boolean = false): void {
    this.onInputValueChange(column, isToValue);
    const form = this.formGroupsDictionarysignal();
    if (!form || !this.initialFormData) return;

    let originalValue = (!isToValue ? this.initialFormData()?.[column?.dataField] : this.initialFormData()?.[`${column?.dataField}_To`]) ?? '';
    let updateValue = !isToValue ? form.get(column.dataField)?.value : form.get(`${column.dataField}_To`)?.value;

    if (column.editorType === '3') {
      originalValue = this.ActyCommonService.getUtcIsoDate(originalValue as string, column?.dateFormat?.includes('H') ?? false);
      updateValue = this.ActyCommonService.getUtcIsoDate(updateValue as string, column?.dateFormat?.includes('H') ?? false);
    }

    const isChanged = String(originalValue ?? '') !== String(updateValue ?? '');
    
    if (isChanged && !this.isMaterialFilter()) {
      this.updatedFields.add(column.dataField);
      this.DataChangeDetected.dataChangeListPush(`${column.dataField}_`);
    } else {
      this.updatedFields.delete(column.dataField);
      this.DataChangeDetected.dataChangeListRemove(`${column.dataField}_`);
    }
  }

  getReferenceRelation(relation: RefRelation[] | undefined): RefRelation[] {
    return relation ?? [];
  }

  onReferenceSelected(event: ReferenceSelectedEvent, datafield: string, isToValue: boolean = false) {
    if (this.isMaterialFilter() && event.rowId === -1) {
      this.formGroupsDictionarysignal().get(event.refForColumn)?.setValue(event.selectedValue);
      return;
    }

    const form = this.formGroupsDictionarysignal();
    const fields = this.formConfigData() ?? [];
    const fieldMeta = fields.find((f: FormColumn) => f.dataField === event.refForColumn);

    if (!form || event.tabId !== this.tabId() || event.rowId !== -1) return;

    const targetField = !isToValue ? event.refForColumn : `${event.refForColumn}_To`;
    form.get(targetField)?.setValue(event.selectedValue);

    if (event.mainScreenColumnValues?.length > 0) {
      event.mainScreenColumnValues.forEach((col) => {
        if (col.value === undefined || col.value === '' || col.value === null) {
          this.formValidateDictionary.set(event.refForColumn, {
            message: 'MESSAGE.COM_E0015',
            params: { refTitleCaption: this.translate.instant(event.refTitleCaption) },
          });
          if (col.key) {
            const dependentFieldName = col.key.replace(/\b\w/g, (c) => c.toUpperCase());
            form.get(dependentFieldName)?.setValue(null);
          }
        } else {
          const capitalizedKey = col.key.charAt(0).toUpperCase() + col.key.slice(1);
          if (form.get(capitalizedKey)) {
            form.get(capitalizedKey)?.setValue(col.value);
          }
        }
      });
    }

    if (!fieldMeta) return;
    this.onHeaderValueChange(event.selectedValue, fieldMeta);
    this.formReferenceSelected.emit(event);
  }

  getColumnTooltip(column: string): string {
    return '';
  }

  getKBNNmUsingKey(code: unknown, column: FormColumn): string {
    const codeStr = String(code);
    return column?.memberList?.find((item) => String(item.code) === codeStr)?.caption || '';
  }

  onCheckboxValueChange(formValue: unknown, dataField: string, newValue: string, tabId: string): void {
    const form = this.formGroupsDictionarysignal();
    if (form) {
      form.patchValue({ [dataField]: newValue });
    }
  }

  // Handle multiple checkbox updates (EditorType 7)
  onMultiCheckboxChange(dataField: string, code: unknown, isChecked: boolean) {
    const form = this.formGroupsDictionarysignal();
    if (!form) return;
    const currentVal = form.get(dataField)?.value || [];
    let newVal = Array.isArray(currentVal) ? [...currentVal] : [];
    if (isChecked) {
      if (!newVal.includes(code)) newVal.push(code);
    } else {
      newVal = newVal.filter(v => v !== code);
    }
    form.get(dataField)?.setValue(newVal);
  }

  getChildren(field: FormColumn) {
    return field.memberList?.map(opt => ({
      caption: opt.caption, code: opt.code, checked: opt.checked ?? false
    })) ?? [];
  }

  validateAllForm(): boolean {
    let isValid = true;
    const form = this.formGroupsDictionarysignal();
    if (!form || !Array.isArray(this.formConfigData())) return false;

    const entryHeaderFormFields = this.formConfigData() ?? [];

    entryHeaderFormFields.filter(f => {
      if (this.isMaterialFilter()) {
        return !!f.searchRequired;
      } else {
        return f.isRequired === true && !f.isAutoGenerate;
      }
    }).forEach(f => {
      if (this.isMaterialFilter() && f?.showMatchType) {
        const reqType = f.searchRequired;
        if (!reqType) return;

        const fromValue = form.get(f.dataField)?.value;
        const toValue = form.get(`${f.dataField}_To`)?.value;

        const isFromEmpty = fromValue === null || fromValue === undefined || fromValue === '';
        const isToEmpty = toValue === null || toValue === undefined || toValue === '';
        const isRangeMode = form.get(`${f.dataField}_Conditions`)?.value === 'TASK.Search.~';

        let fromError = false;
        let toError = false;

        if (reqType === 'FROM' || reqType === 'BOTH' || reqType === 'ANY') {
          if (isFromEmpty) fromError = reqType === 'ANY' ? (isRangeMode ? isToEmpty : true) : true;
        }

        if (isRangeMode) {
          if (reqType === 'TO' || reqType === 'BOTH' || reqType === 'ANY') {
            if (isToEmpty) toError = reqType === 'ANY' ? isFromEmpty : true;
          }
        }

        if (fromError) {
          isValid = false;
          this.formValidateDictionary.set(f.dataField, { message: 'MESSAGE.COM_E0006' });
          form.get(f.dataField)?.markAsTouched();
        } else {
          this.formValidateDictionary.delete(f.dataField);
        }

        if (toError) {
          isValid = false;
          this.formValidateDictionary.set(`${f.dataField}_To`, { message: 'MESSAGE.COM_E0006' });
          form.get(`${f.dataField}_To`)?.markAsTouched();
        } else {
          this.formValidateDictionary.delete(`${f.dataField}_To`);
        }
      } else {
        const value = form.get(f.dataField)?.value;
        const isEmpty = value === null || value === undefined || value === '';

        if (f.isRequired && isEmpty) {
          isValid = false;
          this.formValidateDictionary.set(f.dataField, { message: 'MESSAGE.COM_E0006' });
          form.get(f.dataField)?.markAsTouched();
        } else {
          this.formValidateDictionary.delete(f.dataField);
        }
      }
    });

    if (!isValid && this.isMaterialFilter()) {
      this.scrollToFirstError();
    }
    return isValid;
  }

  private getDefaultValueColumnName(fields: FormColumn[]): void {
    if (!Array.isArray(fields)) return;
    fields.forEach((field) => {
      field.refRelations?.forEach((relation: RefRelation) => {
        const columnNames: string[] = [];
        if (relation?.fromColName) columnNames.push(relation.fromColName);
        if (relation?.toColName) columnNames.push(relation.toColName);
        
        columnNames.forEach((colName: string) => {
          const cleanName = colName.trim();
          if (cleanName) {
            this.referenceDefaultValueColNames().push(cleanName);
          }
        });
      });
    });
  }

  getDateConditions() {
    return this?.dateConditionOptions?.map((x) => ({
      ...x, text: this.translate.instant('TASK.Search.' + x.text)
    }));
  }

  conditionFocusOut(field: CustomDatePickerField) {
    this.datePickerForm?.patchValue({ [`${field.condition?.split('_')?.[0]}_value`]: null });
  }

  getHint(fieldLabel: string): MessageDisplayOption | undefined {
    switch (fieldLabel) {
      case 'Year': return this.yearHint;
      case 'Month': return this.monthHint;
      case 'Day': return this.dayHint;
      default: return undefined;
    }
  }

  onDateConditionUpdated(value: number, field: CustomDatePickerField) {
    this.datePickerForm?.get(field.condition)?.setValue(String(value));
    if (value && value > 0 && value !== 2) {
      if (value === 1 && field.label !== 'Year') {
        const fieldToUpdate = this.datePickerFields.find(x => x.label === field.label);
        if (fieldToUpdate) {
          fieldToUpdate.max = this.initialDatePickerFields.find(x => x.label === field.label)?.max;
        }
      } else if ((value === 3 || value === 4) && field.label !== 'Year') {
        const fieldToUpdate = this.datePickerFields.find(x => x.label === field.label);
        if (fieldToUpdate) fieldToUpdate.max = 99;
      }
    }
    this.applyDate(field?.label);
    this.yearHint = undefined;
    this.monthHint = undefined;
    this.dayHint = undefined;  
  }

  applyDate(field?: string) {
    // Basic date application logic stripped of any formatting for brevity
  }

  formatDate(expr: string): string {
    if (!expr || expr.length === 0) return '';
    const [y, m, d] = expr.split('/');
    const now = new Date();
    
    const parsePart = (exp: string, base: number): number => {
      if (!isNaN(Number(exp))) return Number(exp);
      if (exp.length === 1) return base;
      const operator = exp.includes('+') ? '+' : '-';
      const [_, val] = exp.split(operator);
      return operator === '+' ? base + Number(val) : base - Number(val);
    };

    const year = parsePart(y, now.getFullYear());
    const month = parsePart(m, now.getMonth() + 1) - 1;
    const day = parsePart(d, now.getDate());

    const result = new Date(year, month, day);
    return `${result.getFullYear()}/${String(result.getMonth() + 1).padStart(2, '0')}/${String(result.getDate()).padStart(2, '0')}`;
  }

  async openCustomDatePicker(field: string) {
    this.selectedDateField.set(field);
    this.isCustomDatePickerOpen.set(true);
    this.resetDatePickerForm();
    
    const exprKey = field.includes('_To') ? `${field}_expression` : `${field}_From_expression`;
    const expr = this.formGroupsDictionarysignal().value[exprKey];
    
    const data = await this.bindDatepickerData(expr);
    this.datePickerForm.setValue(data as any);
  }

  async bindDatepickerData(expr: string) {
    if (expr && expr.length > 0) {
      const [yExp, mExp, dExp] = expr.split('/');
      const parse = (part: string) => {
        if (!isNaN(Number(part))) return { condition: '1', value: Number(part) };
        if (part.length === 1) return { condition: '2', value: null };
        const val = Number(part.slice(2));
        return { condition: part[1] === '-' ? '3' : '4', value: val };
      };

      const y = parse(yExp);
      const m = parse(mExp);
      const d = parse(dExp);

      return {
        year_condition: y.condition, year_value: y.value,
        month_condition: m.condition, month_value: m.value,
        day_condition: d.condition, day_value: d.value
      };
    }
    return this.initialDatePickerValues;
  }

  resetDatePickerForm(): void {
    this.datePickerForm.setValue(this.initialDatePickerValues);
  }

  onDatePickerOverlayClick(): void {
    this.selectedDateField.set('');
    this.yearHint = undefined;
    this.monthHint = undefined;
    this.dayHint = undefined;
    if (this.isCustomDatePickerOpen() === true) {
      this.isCustomDatePickerOpen.set(false);  
    }
  }

  toggleSelectAll(isChecked: boolean, fields: FormGroup) {
    Object.keys(fields.controls).forEach(controlName => {
      const column = this.formConfigData()?.find(item => controlName.startsWith(item.dataField) && controlName.endsWith('_defaultVisible'));
      const control = fields.get(controlName);

      if (control && !control.disabled) {
        if (controlName.endsWith('_defaultVisible') && !column?.searchRequired) {
          control.setValue(isChecked);
        }
      }
    });
    fields.updateValueAndValidity();
  }

  isRequiredColumnForSearch(column: string): boolean {
    const fields = this.formConfigData() ?? [];
    const gridColumn = fields.find((col: FormColumn) => col.dataField === column);
    return !!gridColumn && !!gridColumn.searchRequired;
  }

  isAllCheckBoxCheck(): boolean {
    const values = this.formGroupsDictionarysignal().value;
    return Object.keys(values)
      .filter(key => key.endsWith('_defaultVisible'))
      .every(key => values[key] === true);
  }
 
  scrollToField(fieldName: string) {
    const element = this.fieldRows.find(
      (el) => el.nativeElement.getAttribute('data-field') === fieldName
    );
    if (element) {
      element.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  scrollToFirstError() {
    requestAnimationFrame(() => {
      const errorKeys = Array.from(this.formValidateDictionary.keys());
      if (errorKeys.length > 0) {
        this.scrollToField(errorKeys[0]);
      }
    });
  }
}
