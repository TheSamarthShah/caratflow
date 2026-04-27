import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  QueryList,
  signal,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { SyncMinWidthObserve } from 'src/core/directive/sync-min-width-observe';
import { ObserveClass } from 'src/core/directive/observe-class';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltip } from '@angular/material/tooltip';
import { TextInput } from '../text-input/text-input';
import { ReferenceScreenButton } from '../reference-screen-button/reference-screen-button';
import { NumberInput } from '../number-input/number-input';
import { DateTime } from '../datetime/datetime';
import { DropDown } from '../dropdown/dropdown';
import { Checkbox } from '../checkbox/checkbox';
import { RadioButton } from '../radiobutton/radiobutton';
import { Textarea } from '../textarea/textarea';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  columnInfo,
  entryScreenMode,
  RELATION,
  TabObject,
} from 'src/core/models/entryScreen.type';
import { MessageDisplayOption } from 'src/core/models/MessageDisplayOption.type';
import {
  LangChangeEvent,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { refScreenRelations } from 'src/core/models/refScreen.type';
import { ActyDatePipe } from 'src/core/pipe/acty-date-pipe';
import { CookieService } from 'ngx-cookie-service';
import { ReferenceScreenService } from 'src/core/services/reference-screen-service';
import { ActyCommon } from 'src/core/services/acty-common';
import { DateTime as LuxonDateTime } from 'luxon';
import { DataChangeDetectedService } from 'src/core/services/data-change-detected-service';
import { GRID, GRID_INFO } from 'src/core/models/grid.type';
import { from, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomDatePickerFields, getFilterConditions } from 'src/core/models/filter.type';
import { CommonModule } from '@angular/common';
import { Languages } from 'src/core/models/languages.config';
import { ActyNumberPipe } from 'src/core/pipe/acty-number-pipe';
@Component({
  selector: 'acty-form',
  imports: [
    SyncMinWidthObserve,
    ObserveClass,
    MatFormFieldModule,
    MatTooltip,
    TextInput,
    ReferenceScreenButton,
    NumberInput,
    DateTime,
    DropDown,
    Checkbox,
    RadioButton,
    Textarea,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    ActyDatePipe,
    CommonModule,
    ActyNumberPipe
  ],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class Form implements OnInit, OnChanges ,OnDestroy {
  @ViewChildren('focusableCell', { read: ElementRef }) focusableCells!: QueryList<ElementRef>;
  @ViewChildren('entryHeaderWrapers', { read: ElementRef })
  entryHeaderWrapers!: QueryList<ElementRef>;
  @ViewChildren('fieldRow') fieldRows!: QueryList<ElementRef>;
  @ViewChildren('headerInput', { read: NgControl }) controls!: QueryList<NgControl>;

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

  formConfigData = input.required<columnInfo[] | undefined>();
  formGroupsDictionarysignal = model<FormGroup | undefined>(undefined);
  formValuesChanged = output<{ form: FormGroup; updatedColumn: string }>();
  fieldInputFinished = output<{ tabId: string; updatedColumn: string,newValue:any }>();
  onCellFocusLose = output<{ tabId: string; updatedColumn: string }>();
  formReferenceSelected = output<any>();
  isMaterialFilter = input<boolean>(false);
  isCheckBoxAdded = input<boolean>(false)
  completeFormInitialize = output<void>();
  // formGroupsDictionarysignal = signal<FormGroup | undefined>(undefined);
  initialFormData = input<any>({});
  numberOfCols = input<number>(2)
  showVisualValueChange = input<boolean>(true);
  labelId = input.required<string>();
  //for supporting useValueWhenCopy feature of entry screen we need this prop
  isCopyMode = input<boolean>(false);

  // formMode = signal<entryScreenMode | undefined>('Edit');
  formId = input<string>('');
  tabId = input<string>('');
  //for references screen Tabid in Entry screen
  defaultValueSelectorId = input<string>('');
  referenceDefaultValueColNames = model<string[]>([]);

  userId: string =
    JSON.parse(this.cookieService.get('seira_user') || '{}').userid || '';

  // currPkData = signal<{ [key: string]: any } | null>(null);
  plantTimeZone = signal<string>('Asia/Tokyo');
  refScreenOnRowData = signal<{
    referenceScreenId: string;
    rowId: number;
    gridId?: string;
    tabId?: string;
    refForColumn: string;
    selectedValue: any;
    refRelations: refScreenRelations[];
  }>({
    referenceScreenId: '',
    rowId: -1,
    gridId: '',
    tabId: '',
    refForColumn: '',
    selectedValue: '',
    refRelations: [],
  });
  entryTabs = signal<Map<string, TabObject>>(new Map());
  // formGroupsDictionary: Map<string, FormGroup> = new Map();
  formValidateDictionary = new Map<string, MessageDisplayOption>();
  // updatedFieldsMap = new Map<string, Set<string>>();
  updatedFields = new Set<string>();

  private columnMaxLengthWidths: { [key: string]: string } = {};
  columnValidationState: { [key: string]: boolean } = {};
  emptyRequiredCell: string[] = [];
  // currPkFields: string[] = [];
  screenName = input<string>('');
  private iconWidthInInputsInPxForWidthCalculation = 36;
  //for dropdown icon width
  private dropDowniconWidthInInputsInPxForWidthCalculation = 24;
  //18px icon rigth icon size and 16px rigth side padding in dropdown list
  private rigthIconWidthAndPaddingInDropDownInPxForWidthCalculation = 18+16;
  private WCharacterWidthInPxForWidthCalculation = 13;
  //for language change trigger width of form component(recalculate width of form component's)
  currLanguage : Languages = 'en';
  triggerChange : boolean = false;
  private langChangeSubscription: Subscription | undefined;
  // formConfig: any;

  //for custom date
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
  datePickerFields !: CustomDatePickerFields[];
  initialDatePickerValues = {
    "year_condition": '1',
    "month_condition": '1',
    "day_condition": '1',
    "year_value": null,
    "month_value": null,
    "day_value": null
  };
  
  
  initialDatePickerFields = [
    { label: 'Year', condition: 'year_condition', dataField: 'year_value', min: 1, max: undefined },
    { label: 'Month', condition: 'month_condition', dataField: 'month_value', min: 1, max: 12 },
    { label: 'Day', condition: 'day_condition', dataField: 'day_value', min: 1, max: 31 }
  ];
  dateConditionOptions = [
    { Id: '1', text: 'Inserted' },
    { Id: '2', text: 'Current' },
    { Id: '3', text: 'Previous' },
    { Id: '4', text: 'Next' }
  ];
  yearHint = {} as MessageDisplayOption  | undefined;
  monthHint = {} as MessageDisplayOption  | undefined;
  dayHint = {} as MessageDisplayOption  | undefined;

  constructor() {
    effect(
      () => {
        const form = this.formGroupsDictionarysignal();
        let previousValue = '';
        let currentValue = '';
        let updatedColumn = '';

        if (form) {
          // Store previous values snapshot
          let previousValues = { ...form.value };

          form.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((currentValues) => {
              // Compare current vs previous to find what actually changed
              const changedFields: { column: string; value: any }[] = [];

              Object.keys(currentValues).forEach((fieldName) => {
                if (currentValues[fieldName] !== previousValues[fieldName]) {
                  changedFields.push({
                    column: fieldName,
                    value: currentValues[fieldName],
                  });
                  updatedColumn = fieldName;
                  currentValue = currentValues[updatedColumn];
                  previousValue = previousValues[updatedColumn];
                }
              });
              // Update snapshot for next comparison
              previousValues = { ...currentValues };

              this.formValuesChanged.emit({
                form: form,
                updatedColumn: updatedColumn,
              });

              const dataFieldValue = this.defaultValueSelectorId() !== '' ? this.defaultValueSelectorId()+'.'+ updatedColumn : updatedColumn;
              const changedValueColName = dataFieldValue;
              // need to write it here because we want non editable values too. So removing this code from on input finished
              if (this.referenceDefaultValueColNames().includes(changedValueColName)) {
                const result: Record<string, any> = {};
                result[changedValueColName] = currentValue;
                this.refScreenService.defaultValue.update((previousValues) => ({
                  ...previousValues,
                  ...result,
                }));
              }
            });
        }
      },
      { allowSignalWrites: true },
    );
    this.datePickerFields = JSON.parse(JSON.stringify(this.initialDatePickerFields));
  }

  ngOnInit(): void {
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      this.currLanguage = localStorage.getItem('locale') as Languages ?? 'en';
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formConfigData'] || changes['initialFormData']) {
      if (changes['formConfigData']){
        this.getDefaultValueColumnName(this.formConfigData() ?? []);
      }
      this.buildSingleForm(this.initialFormData());
    }
  }

  ngAfterViewInit(){
    this.completeFormInitialize.emit();
  }

  ngOnDestroy(): void {
    if(this.langChangeSubscription){
      this.langChangeSubscription.unsubscribe();
    }
  }

  onContainerSizeChange(){
   this.triggerChange = !this.triggerChange;
  }

  buildSingleForm(data?: any): void {
    const formGroupConfig: { [key: string]: any } = {};
    //  Get fields ONLY for selected tab.
    this.resetScreen();
    const fields: columnInfo[] = this.formConfigData() ?? []; //group.get(tabId)?.entryHeaderFormFields ?? [];

    fields.forEach((fieldMeta: columnInfo) => {
      let value: any = '';

      if (data === undefined || data === null) {
        // Reset all form fields to blank and when add mode then set default value according to defaultAddValue
        if (fieldMeta?.defaultAddValue) {
          value = fieldMeta.defaultAddValue;
        }
      } else {
        // SAFE: formMode() inside untracked
        // Skip PK only in Copy mode
        if (
          this.isCopyMode()&&
          fieldMeta?.isPrimaryKey &&
          fieldMeta?.isAutoGenerate
        ) {
          return; // Do NOT add to form
        }

        // Apply only if the key matches useValueWhenCopy
        if (
          this.isCopyMode() &&
          fieldMeta?.useValueWhenCopy &&
          fieldMeta?.useValueWhenCopy !== 'copiedDataValue'
        ) {
          const copyValueKey = fieldMeta.useValueWhenCopy as keyof columnInfo;
          value = fieldMeta[copyValueKey];
        } else {
          value = data[fieldMeta.dataField];
        }
      }

      //radion button
      if (fieldMeta.editorType === '6') {
        if (fieldMeta?.memberList?.length) {
          fieldMeta.memberList = fieldMeta.memberList.map((item) => ({
            ...item,
            checked: item.code === value,
          }));
        }
      }
      // CASE 7:checkbox
      else if (fieldMeta.editorType === '7') {
        if (value && typeof value === 'string') {
          value = String(value)
            .split(',')
            .map((v) => v.trim());
        } else if (!value) {
          value = [];
        }
      }
      // OTHER CONTROLS
      formGroupConfig[fieldMeta.dataField] = (value === '' || value === null ? null : value) ?? null;
      
      const dataFieldValue = this.defaultValueSelectorId() !== '' ? this.defaultValueSelectorId()+'.'+ fieldMeta.dataField : fieldMeta.dataField;
      const changedValueColName = dataFieldValue;
      // need to do it here because when we do addControl for a form then it wont go in the effect.
      if (this.referenceDefaultValueColNames().includes(changedValueColName)) {
        const result: Record<string, any> = {};
        result[changedValueColName] = value;
        this.refScreenService.defaultValue.update((previousValues) => ({
          ...previousValues,
          ...result,
        }));
      }
    });

    // // ── 1. Build the new form FIRST into a local variable
    // const newForm = this.fb.group(formGroupConfig);

    // // ── 2. Store it in the dictionary
    // this.formGroupsDictionarysignal.set(newForm);

    // // ── 3. Tear down any previous subscription for this tab
    // // this.formValueChangeSubscriptions.get(tabId)?.unsubscribe();

    // // ── 4. Subscribe only if the form has controls
    // if (Object.keys(formGroupConfig).length > 0) {
    //   const combined = new Subscription();

    //   Object.keys(formGroupConfig).forEach((fieldName) => {
    //     const control = newForm.get(fieldName);
    //     if (!control) return;

    //     combined.add(
    //       control.valueChanges.pipe().subscribe((newValue) => {
    //         const currentFormValue = newForm.getRawValue();
    //         const patchFn = (updates: { [key: string]: any }) => {
    //           newForm.patchValue(updates, { emitEvent: false });
    //         };
    //         this.pageService?.onDataHeaderDataInput?.(
    //           fieldName,
    //           newValue,
    //           currentFormValue,
    //           patchFn,
    //         );
    //       }),
    //     );
    //   });

    //   // this.formValueChangeSubscriptions.set(tabId, combined);
    // }

  let form = this.formGroupsDictionarysignal();
 
  if (!form) {
    form = this.fb.group({});
    this.formGroupsDictionarysignal.set(form);
  }
 
  // remove old controls
  Object.keys(form.controls).forEach(key => {
    if (!formGroupConfig.hasOwnProperty(key)) {
      if(!this.isMaterialFilter()){
        form.removeControl(key);
      }
    }
  });
 
  // add / update controls
  // await Object.keys(formGroupConfig).forEach(key => {
  //   if (!form!.contains(key)) {
  //     form!.addControl(key, this.fb.control(formGroupConfig[key].toString()));
  //     const columnn = this.formConfigData()?.find(item => item.dataField === key)
  //     if(columnn?.showMatchType === true && columnn){
  //       form!.addControl(key+'_To', this.fb.control(formGroupConfig[key].toString()));
  //       const getConditionList  = getFilterConditions(columnn?.editorType as '1' | '2' | '3').map((opt: any) =>
  //             typeof opt === 'string' ? { option: opt } : opt
  //           );
  //       form!.addControl(key+'_filterConditions', this.fb.control(getConditionList));
  //       form!.addControl(key+'_Conditions', this.fb.control(formGroupConfig[key].toString()) ?? '');
  //     } 
  //   }
  //   else {
  //     form!.get(key)?.setValue(formGroupConfig[key].toString(), { emitEvent: false });
  //   }
  // });

  // add / update controls
  Object.keys(formGroupConfig).forEach(key => {
    const column = this.formConfigData()?.find(item => item.dataField === key)
    const getConditionList = getFilterConditions(column?.editorType as '1' | '2' | '3').map((opt: any) =>
      typeof opt === 'string' ? { option: opt } : opt
    );
    if (!form!.contains(key)) {
      form!.addControl(key, this.fb.control(formGroupConfig[key]));

        if(this.isMaterialFilter()){
          form!.addControl(key + '_defaultVisible', this.fb.control(''));

        if (column?.showMatchType === true && column) {
          form!.addControl(key + '_To', this.fb.control(formGroupConfig[key]));
          
          form!.addControl(key + '_filterConditions', this.fb.control(getConditionList));
          form!.addControl(key + '_Conditions', this.fb.control('TASK.Search.~'));
        }

        if(column && column?.editorType === '3'){
          form!.addControl(key + '_From_expression', this.fb.control(''));
          form!.addControl(key + '_To_expression', this.fb.control(''));
        }
      }
    }
    else {
      // Update base control
      form!.get(key)?.setValue(formGroupConfig[key], { emitEvent: false });

      //Also update _To and _Conditions if they exist in the form
      const toControl = form!.get(key + '_To');
      const conditionsControl = form!.get(key + '_Conditions');
      const filterConditionsControl = form!.get(key + '_filterConditions');
      let defaultVisibleControl
      if(this.isMaterialFilter()){
        defaultVisibleControl = form!.get(key + '_defaultVisible');
        if (defaultVisibleControl) {
          /**
           * POINT OF CHANGE:
           * Set the checkbox value (true/false) based on the column's visibility 
           * in the configuration data.
           */
          const shouldBeChecked = column?.isVisible === true;
          
          defaultVisibleControl.setValue(shouldBeChecked, { emitEvent: false });

          // Keep your existing override for searchRequired if needed:
          if (column?.searchRequired ) {
            defaultVisibleControl.setValue(true, { emitEvent: false });
          }
        }

        const to_expressionControl = form!.get(key + '_To_expression');
        const from_expressionControl = form!.get(key + '_From_expression');

        const initialData = this.initialFormData();

        if (toControl && initialData?.[key + '_To'] !== undefined) {
          toControl.setValue(initialData[key + '_To'], { emitEvent: false });
        }

        if (conditionsControl && initialData?.[key + '_Conditions'] !== undefined) {
          conditionsControl.setValue(initialData[key + '_Conditions'], { emitEvent: false });
        }else{
          conditionsControl?.setValue(column?.editorType === '1' ? 'TASK.Search.StartsWith' : 'TASK.Search.~', { emitEvent: false });
        }

        if (defaultVisibleControl && initialData?.[key + '_defaultVisible'] !== undefined) {
          defaultVisibleControl.setValue(initialData[key + '_defaultVisible'], { emitEvent: false });
        }

        if(defaultVisibleControl && (column?.searchRequired )){
          defaultVisibleControl.setValue(true)
        }

        if (filterConditionsControl && column?.showMatchType === true && column) {
          filterConditionsControl.setValue(getConditionList, { emitEvent: false });
        }

        if (column && column?.editorType === '3' && from_expressionControl && to_expressionControl && column?.showMatchType === true && column) {
          from_expressionControl?.setValue(initialData[key + '_From_expression'], { emitEvent: false });
          to_expressionControl?.setValue(initialData[key + '_To_expression'], { emitEvent: false });
        }
      }
    }
  });


    // ── 5. Existing Add/Copy merge logic — unchanged
    // if (this.formMode() === 'Add' || this.formMode() === 'Copy') {
    if (!this.showVisualValueChange()) {
      // Merge form values under the same apiObjectName
      if(!this.formGroupsDictionarysignal() || !this.initialFormData()){}
      else{
      Object.assign(
        this.initialFormData(),
        (this.formGroupsDictionarysignal()),
      );}
    }

    // /Emit initial values for all fields
    //emitEvent is set false then not setting initialTime emit to parent as of not emit when form is build and set vlaues then emit to parent
    if (form) {
      Object.keys(form.controls).forEach((fieldName) => {
        this.formValuesChanged.emit({
          form: form!,
          updatedColumn: fieldName,
        });
      });
    }
    this.updatedFields.clear()
    this.generateColumnMaxLengthWidth();
  }

  resetScreen() {
    // --- Reset Signals ---
    this.entryTabs.set(new Map());
    this.updatedFields.clear()
    
    this.emptyRequiredCell = [];
    this.columnValidationState = {};
    this.columnMaxLengthWidths = {};

    //reset Change Detection
    if(!this.isMaterialFilter()){
      this.DataChangeDetected.dataChangeListReset();
      this.DataChangeDetected.netRowChangeCounterReset();
    }
  }

  // get formGroupsDictionary based on given tabid.
  getformGroupsDictionary(tabid: string): FormGroup | undefined {
    return this.formGroupsDictionarysignal();
  }

  getAllRows(): string[] {
    const rows = new Set<string>();
    const fields = this.formConfigData() ?? []; //configGroup.get(tabId)?.entryHeaderFormFields ?? []; // safely call signal or function

    fields.forEach((field: columnInfo) => {
      if (field.isVisible && field.rowIndex) {
        rows.add(field.rowIndex);
      }
    });

    return Array.from(rows).sort((a, b) => parseInt(a) - parseInt(b));
  }

  getColumnGroups(): string[] {
    const groups = new Set<string>();
    const fields = this.formConfigData() ?? []; //configGroup.get(tabId)?.entryHeaderFormFields ?? []; // safely call signal or function
    fields.forEach((field: columnInfo) => {
      if (field.isVisible && field.columnGroupNumber) {
        groups.add(field.columnGroupNumber);
      }
    });
    return Array.from(groups).sort((a, b) => parseInt(a) - parseInt(b));
  }

  getFieldsForRow(
    rowIndex: string,
    groupNo: string,
    applyRowFilter?: boolean,
    applyGroupFilter?: boolean,
  ): columnInfo[] {
    const fields = this.formConfigData() ?? []; //configGroup.get(tabId)?.entryHeaderFormFields ?? []; // safely call signal or function

    return fields.filter(
      (field: columnInfo) =>
        field.isVisible &&
        // field.rowIndex === rowIndex &&
        (applyRowFilter == false || field.rowIndex === rowIndex) &&
        // field.columnGroupNumber === groupNo
        (applyGroupFilter == false || field.columnGroupNumber === groupNo),
    );
  }

  // Helper methods for styling
  isCellUpdated(dataField: string, formValue: any): boolean {
    // Implement your update detection logic
    return true;
  }

  hasColumnError(dataField: string, formValue: any): boolean {
    // Implement your error detection logic
    return false;
  }

  getLabelKey(isWrapped: boolean, isFirst: boolean, groupNo: string): string {
    // 1. If wrapped, force to 'field-label-1' (single column layout style)
    if (isWrapped) {
      return '1_'+this.labelId();
    }

    // 2. If not wrapped, but it is the first element, use the group specific class
    if (isFirst) {
      return groupNo+'_'+this.labelId().toString();
    }

    // 3. Otherwise, return empty (it will just have the base 'field-label' class)
    return '';
  }

  isRequiredColumn(column: string): boolean {
    if(this.isMaterialFilter()){
      return false;
    }
    const fields = this.formConfigData() ?? []; //configGroup.get(tabId)?.entryHeaderFormFields ?? [];

    const gridColumn = fields.find(
      (col: columnInfo) => col.dataField === column,
    );
    return gridColumn && gridColumn.isRequired ? gridColumn.isRequired : false;
  }

  // Get width for a specific column
  getColumnMaxlengthWidth(
    columnName: string,
    dateFormat: string = 'YMD',
  ): string {
    const dateShowHours = dateFormat.includes('H') ? true : false
    if(this.isMaterialFilter()) return '250px';
    if (dateShowHours) return '200px';
    //return '100%';
    return this.columnMaxLengthWidths[columnName] || '150px';
  }

  generateColumnMaxLengthWidth(): void { 
    this.formConfigData()?.forEach((column : any) => {

      if (column.IsVisible !== false && column.dataField){

      this.columnMaxLengthWidths[column.dataField] =
        this.calculateColumnWidth(column);
      } 
    })    
  }

  private calculateColumnWidth(
    column: columnInfo
  ): string {
    //when values is exists in fixedValueWidthpx of entry header form field then set length based on that otherwise set based on max-length
    //first priority : fixedValueWidthpx and second max-length
    if(column && column?.fixedValueWidthpx !== 0 && column?.fixedValueWidthpx !== undefined && column?.fixedValueWidthpx !== null){
      return column?.fixedValueWidthpx+'px';
    }

    // Default widths based on editor type
    let typeWidths: { [key: string]: string } = {}
    if(this.isMaterialFilter()){
      typeWidths = {
        '1': '200px', // text
        '2': '200px', // number
        '3': '200px', // date
        '4': '200px', // dropdown
        '5': '200px', // checkbox
        '6': '200px', // checkbox
        '8': '150px', // TextArea
      };
    }
    else{ 
      typeWidths = {
      '1': '120px', // text
      '2': '120px', // number
      '3': '150px', // date
      '4': '150px', // dropdown
      '5': '50px', // checkbox
      '6': '50px', // checkbox
      '8': '150px', // TextArea
    };
    }

    let baseWidth = typeWidths[column.editorType] || '150px';
    const baseWidthValue = parseInt(baseWidth, 10);

    // Logic for String Types (Editor Type 1)
    if (column.editorType === '1' || column.editorType === '8') {
      const charLength = column.maxLength || 0;
      const iconWidth = column.isReferenceScreen
        ? this.iconWidthInInputsInPxForWidthCalculation
        : 0;
      if (charLength > 0) {
        const charWidth = this.WCharacterWidthInPxForWidthCalculation; // approximate pixels per character
        const calculatedWidth = Math.max(
          charLength * charWidth + iconWidth,
          baseWidthValue // Use base width as minimum
        );
        // Cap at 400px for strings
        baseWidth = `${Math.min(calculatedWidth)}px`;
      }
    }
    // Logic for Number Types (Editor Type 2)
    else if (column.editorType === '2') {
      const precision = column.dataPrecision || 0;
      const scale = column.dataScale || 0;

      // Estimate width based on total digits + decimal point
      const totalDigits = precision + (scale > 0 ? 1 : 0);
      const digitWidth = this.WCharacterWidthInPxForWidthCalculation; // pixels per digit

      const calculatedWidth = Math.max(
        totalDigits * digitWidth,
        baseWidthValue // Use base width as minimum
      );
      // Cap at 300px for numbers
      baseWidth = `${Math.min(calculatedWidth)}px`;
    }

    //calculate the dropdown list
    else if (column.editorType === '4' && column?.isEditable) {
      const memberList = column?.memberList;
      if (memberList?.length) {
        // Calculate the maximum caption length, including spaces
        const captionCache = memberList.map(item => this.translate.instant(item.caption));

        const maxCaptionLength = Math.max(
          ...captionCache.map(caption => caption.length)
        );

        //commenet this line : Removes  Clear(X) dropdown icon for adding this set this [isNullable]="true"
        // const iconWidth = this.iconWidthInInputsInPxForWidthCalculation + this.dropDowniconWidthInInputsInPxForWidthCalculation;
        const iconWidth = this.dropDowniconWidthInInputsInPxForWidthCalculation + this.rigthIconWidthAndPaddingInDropDownInPxForWidthCalculation;
        const charWidth = this.WCharacterWidthInPxForWidthCalculation; // approximate pixels per character

        // Calculate width based on character count
        const calculatedWidth = Math.max(
          maxCaptionLength * charWidth + iconWidth,
          baseWidthValue // Base width as a minimum
        );

        // Cap at 400px for strings and set base width
        baseWidth = `${Math.min(calculatedWidth)}px`;
      }
    }
    return baseWidth;
  }

  /**
   * returns the invalid message for columnName
   * @param column
   * @returns
   */
  getInvalidMessage(
    dataField : string
  ): MessageDisplayOption | undefined {
    return this.formValidateDictionary?.get(dataField);
  }

  /**
   * update a column's specific validation state based on whether a hint message
   * @param event
   * @param column
   */
  onInputInternalHintChange(
    event: MessageDisplayOption | undefined,
    dataField: string,
  ): void {
    setTimeout(() => {
      if (event) {
        this.columnValidationState[dataField] = true;

        this.formValidateDictionary.set(dataField, {
          message: event.message,
          params: event.params,
        });
      } else {
        this.columnValidationState[dataField] = false;

        this.formValidateDictionary.delete(dataField);
      }
    });
  }

  /**
   * check the validation for all field
   * @param column
   * @returns
   */
  isValidateColumn(column: columnInfo,isToValue : boolean = false): boolean {
    if (this.columnValidationState[column.dataField]) {
      return true;
    }

    const form = this.formGroupsDictionarysignal();
    if (!form) return false;

    if (column?.isRequired && !this.isMaterialFilter()) {
      const value = form?.get(column.dataField)?.value;

      if (value === null || value === '') {
        // Add column.dataField to the emptyRequiredCell array if it's required
        if (!this.emptyRequiredCell.includes(column.dataField)) {
          this.emptyRequiredCell.push(column.dataField);
        }
        return true;
      }
    }

    if ((column?.searchRequired && this.isMaterialFilter())) {
      const value = !isToValue ? form?.get(column.dataField)?.value : form?.get(column.dataField+ '_To')?.value;
      const conditionvalue = !isToValue ? form?.get(column.dataField)?.value : form?.get(column.dataField+ '_Conditions')?.value;

      if ((value === null || value === '') && (conditionvalue === 'TASK.Search.~' || !isToValue)) {
        // Add column.dataField to the emptyRequiredCell array if it's required
        if (!this.emptyRequiredCell.includes(column.dataField)) {
          this.emptyRequiredCell.push(column.dataField);
        }
        return false;
      }
    }
    
    // Remove column.dataField from emptyRequiredCell using filter
    this.emptyRequiredCell = this.emptyRequiredCell.filter(
      (item) => item !== column.dataField,
    );

    this.formValidateDictionary.delete(column.dataField);
    return false;
  }

  isFieldUpdated(dataField: any): boolean {
    if (this.showVisualValueChange()) {
      const tabUpdates = this.updatedFields;
      return !!(tabUpdates && tabUpdates.has(dataField));
    }
    return false;
  }

  onHeaderValueChange(newValue: any, column: columnInfo): void {
  }

  // private getActiveGrid(): any {
  //   // Case 1: Single grid tab
  //   if (this.gridComponent) {
  //     return this.gridComponent;
  //   }

  //   // Case 2: Parent-child grid tab
  //   if (this.parentChildGridComponent?.gridComponent) {
  //     return this.parentChildGridComponent.gridComponent;
  //   }

  //   return null;
  // }

  // calculateHeaderAggregations(
  //   detailTabId: string,
  //   fieldName: string,
  //   _visited = new Set<string>(),
  // ): void {
  //   // const key = `${this?.getActiveGrid()?.gridId()}.${fieldName}`;
  //   // // Guard: if we have already processed this key in this call chain, stop.
  //   // if (_visited.has(key)) return;
  //   // _visited.add(key);
  //   // const aggs = this.childAggregationMap.get(key);
  //   // if (!aggs) return;
  //   // aggs.forEach((agg) => {
  //   //   const headerForm = this.formGroupsDictionary.get(agg.headerTab);
  //   //   if (!headerForm) return;
  //   //   const detailTab = this.entryTabs().get(detailTabId);
  //   //   if (!detailTab) return;
  //   //   let result = 0;
  //   //   // Handle Form Type Detail Tabs
  //   //   if (detailTab.tabType === 'Form') {
  //   //     const detailForm = this.formGroupsDictionary.get(detailTabId);
  //   //     if (!detailForm) return;
  //   //     const value = Number(detailForm.value[fieldName]) || 0;
  //   //     result = value;
  //   //   }
  //   //   // Handle Grid Type Detail Tabs
  //   //   else if (detailTab.tabType === 'Grid') {
  //   //     // const grid = this.getGridByTabId(detailTabId);
  //   //     // if (!grid) return;
  //   //     const allRows = this.getActiveGrid()?.getGridData() || [];
  //   //     if (agg.operation === 'sum') {
  //   //       result = allRows.reduce(
  //   //         (sum: number, row: any) => sum + (Number(row[fieldName]) || 0),
  //   //         0,
  //   //       );
  //   //     } else if (agg.operation === 'avg') {
  //   //       const sum = allRows.reduce(
  //   //         (s: number, r: any) => s + (Number(r[fieldName]) || 0),
  //   //         0,
  //   //       );
  //   //       result = allRows.length > 0 ? sum / allRows.length : 0;
  //   //     } else if (agg.operation === 'count') {
  //   //       result = allRows.length;
  //   //     } else if (agg.operation === 'min') {
  //   //       result = Math.min(
  //   //         ...allRows.map((r: any) => Number(r[fieldName]) || 0),
  //   //       );
  //   //     } else if (agg.operation === 'max') {
  //   //       result = Math.max(
  //   //         ...allRows.map((r: any) => Number(r[fieldName]) || 0),
  //   //       );
  //   //     }
  //   //   }
  //   //   // Update header form
  //   //   headerForm.patchValue({ [agg.headerField]: result });
  //   //   // Recursively calculate if this field is also a source for another aggregation
  //   //   this.calculateHeaderAggregations(
  //   //     agg.headerTab,
  //   //     agg.headerField,
  //   //     _visited,
  //   //   );
  //   // });
  // }

  onBlurEvent(event: any,column: columnInfo){
    if(!event){
      return;
    }
    this.onCellFocusLose.emit({tabId: this.tabId(), updatedColumn: column.dataField})
  }

  /**
   * when input finished then execute
   * @param column
   */
  onInputFinished(
    newValue: any,
    column: columnInfo,
    dataField : string,
    ignoreReferenceScreen = false,
  ): void {

    //removes bind with blurEvent
    this.onHeaderValueChange(newValue, column)
    
    const hasReferenceScreen = column.isReferenceScreen ? true : false;
    // if it has reference screen then get its ref data by setting this.refScreenOnRowData
    if (hasReferenceScreen && !ignoreReferenceScreen && !this.isMaterialFilter()) {
      this.setRefScreenRowData(column);
    }

    const formdata = this.formConfigData(); //{[this.entryTabs().get(tabId)?.apiObjectName ?? '']: [activeForm?.value],};
    let data: any;
    let isMultiGrid = false;

    // if (this?.parentChildGridComponent) {
    //   data = {
    //     activeGridId: this.entryTabs()?.get(this.tabId())?.apiObjectName ?? '',
    //     column: column,
    //     dataGridGroup: this.parentChildGridComponent.dataGridGroup(),
    //     selectedGroup: {
    //       ...this.parentChildGridComponent.selectedGroup(),
    //       ...formdata,
    //     },
    //     childGridData: {
    //       ...this.parentChildGridComponent.dataListGroup(),
    //       ...formdata,
    //     },
    //   };
    //   isMultiGrid = true;
    // } else if (this?.gridComponent) {
    //   data = {
    //     activeGridId: this.entryTabs()?.get(this.tabId())?.apiObjectName ?? '',
    //     column: column,
    //     dataGridGroup: this.entryTabs()?.get(this.tabId()),
    //     selectedGroup: {
    //       ...{
    //         [this.gridComponent.gridId()]:
    //           this.gridComponent.visibleDataList?.data,
    //       },
    //       ...formdata,
    //     },
    //     childGridData: this.gridComponent.visibleDataList?.data,
    //   };
    // }
    this.fieldInputFinished.emit({tabId: this.tabId(), updatedColumn: column.dataField,newValue: newValue})
    // let headerTabConfig = this.formConfigData(); //this.entryTabs().get(tabId)?.entryHeaderFormFields;
    // if (column.editorType == '2') {
    //   this.CalculateNesteadNumericValues(headerTabConfig,dataField, data,isMultiGrid,true,);
    // } else if (column.editorType == '3') {
    //   this.CalculateNesteadDateValues(headerTabConfig,dataField,data,isMultiGrid, true,);
    // }
    // this.childOperationsNested(dataField,data,isMultiGrid,true,headerTabConfig,);
    // //// Pooja Maru: In Sales Quotation For reset dependent fields after input finished
    // const serviceName = this.screenName + 'Service';
    // const serviceType = ENTRY_SERVICE_MAP[serviceName];
    // if (serviceType) {
    //   const serviceInstance = this.injector.get(serviceType);
    //   serviceInstance?.afterOnInputFinished?.(
    //     column.dataField,
    //     this.formGroupsDictionarysignal(),
    //   );
    // }
  }

  getAllGrids(tab: any): Array<Record<string, any[]>> {
    const res: Array<Record<string, any[]>> = [];

    const walk = (g: any): void => {
      g.apiObjectName &&
        g.dataGrid &&
        res.push({
          [tab?.tabId ? tab.tabId + '_' + g.apiObjectName : g.apiObjectName]: g.dataGrid,});
      g.childGridInfo?.forEach(walk);
    };

    walk(tab?.gridInfo ?? tab);
    return res;
  }

  findGridInfo(gridInfo: GRID_INFO, targetGridId: string): GRID_INFO | null {
    if (gridInfo.apiObjectName === targetGridId) {
      return gridInfo;
    }

    if (gridInfo.childGridInfo && gridInfo.childGridInfo.length > 0) {
      for (const child of gridInfo.childGridInfo) {
        const found = this.findGridInfo(child, targetGridId);
        if (found) return found;
      }
    }
    return null;
  }

  // CalculateNesteadDateValues(
  //   dataGrid: any,
  //   dataField: string,
  //   eventData: any,
  //   isMultiGrid?: boolean,
  //   isfromHeader?: boolean,
  //   visited = new Set<string>(),
  // ) {
  //   const isDateValue = (v: any): v is Date => {
  //     if (v instanceof Date) return true;
  //     if (typeof v === 'string') {
  //       const d = new Date(v);
  //       return !isNaN(d.getTime());
  //     }
  //     return false;
  //   };

  //   const gridKey = eventData?.activeGridId?.includes('_')
  //     ? eventData?.activeGridId?.split('_')?.[1]
  //     : eventData?.activeGridId;
  //   if (!gridKey) return;

  //   const dependencyKey = `${gridKey}.${dataField}`;
  //   const targets = this.formulaDependencyMapMultiGrid.get(dependencyKey);
  //   if (!targets?.length) return;

  //   targets.forEach((target: any) => {
  //     const targetGridKey = target.gridKey;

  //     let allGrids: any;
  //     let childconfigObj: any;
  //     let childGridData: any;
  //     let targetedData: any;

  //     if (isMultiGrid) {
  //       allGrids = this.getAllGrids(eventData.dataGridGroup);
  //       childconfigObj = this.findGridInfo(
  //         eventData?.dataGridGroup,
  //         target.gridKey?.substring(target.gridKey.indexOf('_') + 1),
  //       );
  //       childGridData =
  //         eventData.childGridData?.[
  //           target.gridKey?.substring(target.gridKey.indexOf('_') + 1)
  //         ];

  //       if (!childconfigObj && dataGrid) {
  //         childconfigObj = dataGrid;
  //       }
  //       if (isfromHeader) {
  //         var gridConfig = this.getAllGrids(eventData.dataGridGroup);
  //         gridConfig.push({ [gridKey]: dataGrid });
  //         allGrids = gridConfig;
  //       }
  //     } else {
  //       if (gridKey !== this.gridComponent.gridId()) {
  //         allGrids = [
  //           { [gridKey]: eventData?.dataGridGroup?.entryHeaderFormFields },
  //           { [this.gridComponent.gridId()]: this?.gridComponent?.dataGrid() },
  //         ].filter((obj) => Object.values(obj)[0] != null);
  //       } else {
  //         allGrids = [
  //           { [this.gridComponent.gridId()]: this?.gridComponent?.dataGrid() },
  //         ].filter((obj) => Object.values(obj)[0] != null);
  //       }
  //       childconfigObj = this.formConfig.detailTabConfig?.[0];
  //       childGridData = eventData.childGridData;
  //     }

  //     const key = target?.gridKey?.includes('_')
  //       ? target.gridKey?.substring(target.gridKey.indexOf('_') + 1)
  //       : target?.gridKey;
  //     const currentGrid: any = allGrids.find(
  //       (x: any) => Object.keys(x)[0] == key,
  //     )?.[key];

  //     const targetColumn: GRID = currentGrid.find(
  //       (x: any) => x.dataField == target.field,
  //     );
  //     let currentChildGrid: any;
  //     const sourceRow =
  //       eventData.selectedGroup?.[targetGridKey?.split('_')[1]]?.[0];

  //     if (isfromHeader) {
  //       targetedData = childGridData;
  //     } else {
  //       targetedData =
  //         eventData.selectedGroup?.[
  //           target.gridKey?.substring(target.gridKey?.indexOf('_') + 1)
  //         ];
  //     }

  //     targetedData?.forEach((x: any) => {
  //       currentChildGrid =
  //         targetedData?.filter((childRow: any) =>
  //           childconfigObj?.relations?.every(
  //             (rel: RELATION) =>
  //               sourceRow[rel.parentDataField] === childRow[rel.childDataField],
  //           ),
  //         ) ?? [];
  //     });

  //     targetedData?.forEach((x: any) => {
  //       currentChildGrid.forEach((childTargetRow: any) => {
  //         const visitTargetKey = `${targetGridKey}.${childTargetRow.parentRowId ?? childTargetRow?.rowid}${targetColumn.dataField}`;

  //         if (visited.has(visitTargetKey)) return;
  //         visited.add(visitTargetKey);

  //         let baseDate: any;
  //         const expression = targetColumn?.calculationFormula?.replace(
  //           /\{\{([^}]+)\}\}/g,
  //           (_, token) => {
  //             let value: any;

  //             // Explicit grid reference {{Grid.Field}}
  //             if (token.includes('.')) {
  //               const [refGrid, refField] = token.split('.');
  //               value = eventData.selectedGroup?.[refGrid]?.[0]?.[refField];
  //             }
  //             // Implicit same-grid reference {{Field}}
  //             else {
  //               value =
  //                 eventData.selectedGroup?.[
  //                   targetGridKey?.includes('_')
  //                     ? targetGridKey.split('_')?.[1]
  //                     : targetGridKey
  //                 ]?.[0]?.[token];
  //             }

  //             if (isDateValue(value)) {
  //               if (!baseDate) {
  //                 baseDate = new Date(structuredClone(value));
  //               }
  //               return '0';
  //             }

  //             const v = Number(value);
  //             return isNaN(v) ? '0' : v.toString();
  //           },
  //         );

  //         if (!baseDate || isNaN(baseDate.getTime())) return;

  //         let offsetDays = 0;
  //         try {
  //           offsetDays = Number(Function(`return (${expression})`)());
  //           if (isNaN(offsetDays)) return;
  //         } catch {
  //           return;
  //         }

  //         const resultDate = structuredClone(baseDate);
  //         resultDate.setDate(resultDate.getDate() + offsetDays);
  //         childTargetRow[targetColumn.dataField] = resultDate;

  //         // ── ADD: notify service of formula-computed date value
  //         const computedGridId = targetGridKey?.includes('_')
  //           ? targetGridKey.substring(targetGridKey.indexOf('_') + 1)
  //           : targetGridKey;
  //         this.pageService?.onGridCellDataInput?.(
  //           targetColumn.dataField,
  //           childTargetRow[targetColumn.dataField],
  //           childTargetRow,
  //           computedGridId,
  //         );

  //         this.CalculateNesteadDateValues(
  //           dataGrid,
  //           targetColumn.dataField,
  //           {
  //             ...eventData,
  //             activeGridId: targetGridKey,
  //           },
  //           isMultiGrid,
  //           isfromHeader,
  //           visited,
  //         );
  //       });
  //     });
  //   });
  // }

  // CalculateNesteadNumericValues(
  //   dataGrid: any,
  //   dataField: string,
  //   eventData: any,
  //   isMultiGrid?: boolean,
  //   isfromHeader?: boolean,
  //   visited = new Set<string>(),
  // ) {
  //   let gridKey = eventData?.activeGridId?.includes('_')
  //     ? eventData?.activeGridId?.split('_')?.[1]
  //     : eventData?.activeGridId;
  //   if (isMultiGrid) {
  //     for (const element of this.getAllApiObjNames(eventData.dataGridGroup)) {
  //       if (gridKey === Object.keys(element)[0]) {
  //         gridKey = element[gridKey];
  //         break;
  //       }
  //     }
  //   }
  //   if (!gridKey) return;

  //   const dependencyKey = `${gridKey}.${dataField}`;
  //   // Pooja Maru: Prevent infinite loop (for calculate Discount Amount and Discount Rate)
  //   if (visited.has(dependencyKey)) {
  //     return;
  //   }
  //   visited.add(dependencyKey);
  //   const targets = this.formulaDependencyMapMultiGrid.get(dependencyKey);
  //   if (!targets?.length) return;
  //   targets.forEach((target: any) => {
  //     const targetGridKey = target.gridKey;

  //     let allGrids: any;
  //     let childconfigObj: any;
  //     let childGridData: any;
  //     let targetedData: any;

  //     if (isMultiGrid) {
  //       allGrids = this.getAllGrids(eventData.dataGridGroup);
  //       childconfigObj = this.findGridInfo(
  //         eventData?.dataGridGroup,
  //         target.gridKey?.substring(target.gridKey.indexOf('_') + 1),
  //       );
  //       childGridData =
  //         eventData.childGridData?.[
  //           target.gridKey?.substring(target.gridKey.indexOf('_') + 1)
  //         ];
  //     } else {
  //       if (gridKey !== this.gridComponent.gridId()) {
  //         allGrids = [
  //           { [gridKey]: eventData?.dataGridGroup?.entryHeaderFormFields },
  //           { [this.gridComponent.gridId()]: this?.gridComponent?.dataGrid() },
  //         ].filter((obj) => Object.values(obj)[0] != null);
  //       } else {
  //         allGrids = [
  //           { [this.gridComponent.gridId()]: this?.gridComponent?.dataGrid() },
  //         ].filter((obj) => Object.values(obj)[0] != null);
  //       }
  //       childconfigObj = this.formConfig.detailTabConfig?.[0];
  //       childGridData = eventData.childGridData;
  //     }

  //     const key = isMultiGrid
  //       ? target?.gridKey
  //       : target?.gridKey?.includes('_')
  //         ? target.gridKey?.substring(target.gridKey.indexOf('_') + 1)
  //         : target?.gridKey;
  //     const currentGrid: any = allGrids.find(
  //       (x: any) => Object.keys(x)[0] == key,
  //     )?.[key];
  //     const targetColumn: GRID = currentGrid.find(
  //       (x: any) => x.dataField == target.field,
  //     );

  //     let currentChildGrid: any;
  //     const sourceRow =
  //       eventData.selectedGroup?.[targetGridKey?.split('_')[1]]?.[0];

  //     if (isfromHeader) {
  //       targetedData = childGridData;
  //     } else {
  //       targetedData =
  //         eventData.selectedGroup?.[
  //           target.gridKey?.substring(target.gridKey?.indexOf('_') + 1)
  //         ];
  //     }

  //     targetedData?.forEach((x: any) => {
  //       currentChildGrid =
  //         targetedData?.filter((childRow: any) =>
  //           childconfigObj?.relations?.every(
  //             (rel: RELATION) =>
  //               sourceRow[rel.parentDataField] === childRow[rel.childDataField],
  //           ),
  //         ) ?? [];
  //     });

  //     targetedData?.forEach((x: any) => {
  //       currentChildGrid?.forEach((childtargetRow: any) => {
  //         const visitTargetKey = `${targetGridKey}.${childtargetRow.parentRowId ?? childtargetRow?.rowid}${targetColumn.dataField}`;

  //         if (visited.has(visitTargetKey)) return;
  //         visited.add(visitTargetKey);

  //         const expression = targetColumn.calculationFormula
  //           ?.replace(/\{\{([^}]+)\}\}/g, (_, token) => {
  //             if (token.includes('.')) {
  //               const [refGrid, refField] = token.split('.');
  //               const refRow = eventData.selectedGroup?.[refGrid]?.[0];
  //               const v = Number(refRow?.[refField]);
  //               return isNaN(v) ? '0' : v.toString();
  //             }

  //             const selfRow = sourceRow;
  //             const v = Number(selfRow?.[token]);
  //             return isNaN(v) ? '0' : v.toString();
  //           })
  //           ?.replace(/\/\s*(0+\.?0*|null|undefined)\b/g, '/ 1');

  //         try {
  //           // childtargetRow[targetColumn.dataField] =
  //           //   Function(`return (${expression})`)();
  //           const rawValue = Function(`return (${expression})`)();

  //           const scale = this.getScale(targetColumn, 3);

  //           childtargetRow[targetColumn.dataField] = Number(
  //             Number(rawValue).toFixed(scale),
  //           );

  //           const grid = this.getActiveGrid();
  //           if (!grid) return;
  //           const allRows = grid.getGridData();
  //           const index = allRows.findIndex(
  //             (r: { rowid: any }) => r.rowid === childtargetRow.rowid,
  //           );

  //           if (index !== -1) {
  //             allRows[index] = {
  //               ...allRows[index],
  //               ...childtargetRow,
  //             };
  //           }

  //           // ── ADD: notify service of formula-computed numeric value
  //           const computedGridId = targetGridKey?.includes('_')
  //             ? targetGridKey.substring(targetGridKey.indexOf('_') + 1)
  //             : targetGridKey;
  //           this.pageService?.onGridCellDataInput?.(
  //             targetColumn.dataField,
  //             childtargetRow[targetColumn.dataField],
  //             childtargetRow,
  //             computedGridId,
  //           );
  //         } catch {
  //           return;
  //         }
  //       });
  //     });

  //     this.CalculateNesteadNumericValues(
  //       dataGrid,
  //       targetColumn.dataField,
  //       {
  //         ...eventData,
  //         activeGridId: targetGridKey,
  //       },
  //       isMultiGrid,
  //       isfromHeader,
  //       visited,
  //     );
  //   });
  // }

  // childOperationsNested(
  //   dataField: string,
  //   eventData: {
  //     activeGridId: string;
  //     selectedGroup: any;
  //     dataGridGroup: any;
  //     childGridData: any;
  //   },
  //   isMultiGrid?: boolean,
  //   isfromHeader?: boolean,
  //   dataGrid?: any,
  // ) {
  //   const gridKey = eventData?.activeGridId;
  //   if (!gridKey) return;

  //   const dependencyKey = `${gridKey}.${dataField}`;

  //   let allGrids: any;

  //   if (isMultiGrid) {
  //     allGrids = this.getAllGrids(eventData.dataGridGroup);

  //     if (isfromHeader) {
  //       var gridConfig = this.getAllGrids(eventData.dataGridGroup);
  //       gridConfig.push({ [gridKey]: dataGrid });
  //       allGrids = gridConfig;
  //     }
  //   } else {
  //     allGrids = [
  //       { [gridKey]: eventData?.dataGridGroup?.entryHeaderFormFields },
  //       { [this.gridComponent.gridId()]: this?.gridComponent?.dataGrid() },
  //     ].filter((obj) => Object.values(obj)[0] != null);
  //   }

  //   const targets =
  //     this.childOperationDependencyMapMultiGrid.get(dependencyKey);
  //   if (!targets?.length) return;

  //   targets.forEach((t) => {
  //     const sourceValue =
  //       eventData.selectedGroup?.[gridKey]?.[0]?.[
  //         t.rule.sourceField?.includes('.')
  //           ? t.rule.sourceField.split('.')[1]
  //           : t.rule.sourceField
  //       ];

  //     if (t.rule.actionName === 'readOnly') {
  //       let childconfigObj: any;
  //       let childGridData: any;
  //       let targetedData: any;

  //       if (isMultiGrid) {
  //         childconfigObj = this.findGridInfo(
  //           eventData?.dataGridGroup,
  //           t.gridKey?.substring(t.gridKey.indexOf('_') + 1),
  //         );
  //         childGridData =
  //           eventData.childGridData?.[
  //             t.gridKey?.substring(t.gridKey.indexOf('_') + 1)
  //           ];
  //         if (!childconfigObj && dataGrid) {
  //           childconfigObj = dataGrid;
  //         }
  //       } else {
  //         childconfigObj = this.formConfig.detailTabConfig?.[0];
  //         childGridData = eventData.childGridData;
  //       }

  //       if (isfromHeader && dataGrid) {
  //         if (
  //           sourceValue == t.rule.value?.toString() ||
  //           sourceValue == (t.rule.value === true ? '1' : '0')
  //         ) {
  //           const column = dataGrid.find(
  //             (x: any) => x.dataField === t.targetField,
  //           );
  //           if (column) {
  //             (column as any).isEditable = false;
  //           }
  //         } else {
  //           const column = dataGrid.find(
  //             (x: any) => x.dataField === t.targetField,
  //           );
  //           if (column) {
  //             (column as any).isEditable = true;
  //           }
  //         }
  //       } else {
  //         targetedData =
  //           eventData.selectedGroup?.[
  //             t.gridKey?.substring(t.gridKey?.indexOf('_') + 1)
  //           ];

  //         targetedData.forEach((targetRow: any) => {
  //           if (
  //             sourceValue == t.rule.value?.toString() ||
  //             sourceValue == (t.rule.value === true ? '1' : '0')
  //           ) {
  //             if (
  //               !targetRow.childOperations ||
  //               typeof targetRow.childOperations !== 'object'
  //             ) {
  //               targetRow.childOperations = {};
  //             }
  //             if (!Array.isArray(targetRow.childOperations.disabledFields)) {
  //               targetRow.childOperations.disabledFields = [];
  //             }
  //             if (
  //               !targetRow?.childOperations?.disabledFields.includes(
  //                 t.targetField,
  //               )
  //             ) {
  //               targetRow.childOperations.disabledFields.push(t.targetField);
  //             }
  //           } else {
  //             if (Array.isArray(targetRow?.childOperations?.disabledFields)) {
  //               targetRow.childOperations.disabledFields =
  //                 targetRow.childOperations.disabledFields.filter(
  //                   (x: any) => x !== t.targetField,
  //                 );
  //             }
  //           }
  //         });
  //       }
  //     } else if (t?.rule?.actionName == 'filter') {
  //       const sourceRow =
  //         eventData.selectedGroup?.[
  //           t?.rule?.sourceField?.includes('.')
  //             ? t?.rule?.sourceField?.split('.')?.[0]
  //             : t.gridKey?.substring(t.gridKey.indexOf('_') + 1)
  //         ];
  //       if (sourceRow?.[0]?.[dataField] == t?.rule?.value?.toString()) {
  //         allGrids.forEach((gridObj: any) => {
  //           let currentChildGrid;
  //           let childconfigObj: any;
  //           let childGridData: any;
  //           let targetedData: any;

  //           if (isMultiGrid) {
  //             childconfigObj = this.findGridInfo(
  //               eventData?.dataGridGroup,
  //               t.gridKey?.substring(t.gridKey.indexOf('_') + 1),
  //             );
  //             childGridData =
  //               eventData.childGridData?.[
  //                 t.gridKey?.substring(t.gridKey.indexOf('_') + 1)
  //               ];
  //           } else {
  //             childconfigObj = this.formConfig.detailTabConfig?.[0];
  //             childGridData = eventData.childGridData;
  //           }

  //           if (isfromHeader) {
  //             targetedData = childGridData;
  //           } else {
  //             targetedData =
  //               eventData.selectedGroup?.[
  //                 t.gridKey?.substring(t.gridKey?.indexOf('_') + 1)
  //               ];
  //           }

  //           targetedData?.forEach((x: any) => {
  //             currentChildGrid =
  //               targetedData?.filter((childRow: any) =>
  //                 childconfigObj?.relations.every(
  //                   (rel: RELATION) =>
  //                     sourceRow?.[0]?.[rel.parentDataField] ===
  //                     childRow[rel.childDataField],
  //                 ),
  //               ) ?? [];

  //             const key = isMultiGrid
  //               ? t?.gridKey
  //               : t?.gridKey?.includes('_')
  //                 ? t.gridKey?.substring(t.gridKey.indexOf('_') + 1)
  //                 : t?.gridKey;
  //             const targetGrid: any = allGrids.find(
  //               (x: any) => Object.keys(x)[0] == key,
  //             )?.[key];

  //             currentChildGrid?.forEach((childtargetRow: any) => {
  //               targetGrid.find((x: any) => {
  //                 if (x.dataField == t.targetField) {
  //                   const updatedMemberList = x.memberList.filter(
  //                     (x: any) => x.code == t.rule.value,
  //                   );
  //                   if (
  //                     !childtargetRow.childOperations ||
  //                     typeof childtargetRow.childOperations !== 'object'
  //                   ) {
  //                     childtargetRow.childOperations = {};
  //                   }
  //                   if (
  //                     !Array.isArray(
  //                       childtargetRow.childOperations.FilterFields,
  //                     )
  //                   ) {
  //                     childtargetRow.childOperations.FilterFields = [];
  //                   }
  //                   const filterData = {
  //                     targetDataField: t.targetField,
  //                     updatedField: 'memberList',
  //                     updatedValue: updatedMemberList,
  //                   };
  //                   let existingData =
  //                     childtargetRow.childOperations.FilterFields?.find(
  //                       (x: any) => x.targetDataField == t.targetField,
  //                     );
  //                   if (existingData) {
  //                     existingData.updatedValue = filterData.updatedValue;
  //                   } else {
  //                     childtargetRow.childOperations.FilterFields.push(
  //                       filterData,
  //                     );
  //                   }
  //                 }
  //               });
  //             });
  //           });
  //         });
  //       } else {
  //         let childconfigObj: any;
  //         let childGridData: any;
  //         let targetedData: any;

  //         if (isMultiGrid) {
  //           childconfigObj = this.findGridInfo(
  //             eventData?.dataGridGroup,
  //             t.gridKey?.substring(t.gridKey.indexOf('_') + 1),
  //           );
  //           childGridData =
  //             eventData.childGridData?.[
  //               t.gridKey?.substring(t.gridKey.indexOf('_') + 1)
  //             ];
  //         } else {
  //           childconfigObj = this.formConfig.detailTabConfig?.[0];
  //           childGridData = eventData.childGridData;
  //         }

  //         // Determine which rows to update
  //         if (isfromHeader) {
  //           targetedData = childGridData; // Update ALL rows
  //         } else {
  //           targetedData =
  //             eventData.selectedGroup?.[
  //               t.gridKey?.substring(t.gridKey?.indexOf('_') + 1)
  //             ]; // Update only selected rows
  //         }

  //         targetedData?.forEach((x: any) => {
  //           const currentChildGrid =
  //             targetedData?.filter((childRow: any) =>
  //               childconfigObj?.relations?.every(
  //                 (rel: RELATION) =>
  //                   sourceRow?.[0]?.[rel.parentDataField] ===
  //                   childRow[rel.childDataField],
  //               ),
  //             ) ?? [];

  //           currentChildGrid?.forEach((childtargetRow: any) => {
  //             if (childtargetRow.childOperations?.FilterFields) {
  //               childtargetRow.childOperations.FilterFields =
  //                 childtargetRow.childOperations.FilterFields.filter(
  //                   (filterItem: any) =>
  //                     filterItem.targetDataField !== t.targetField,
  //                 );
  //             }
  //           });
  //         });
  //       }
  //     } else if (t?.rule?.actionName === 'required') {
  //       const toBit = (v: any): string => {
  //         if (v === true || v === 'true' || v === '1') return '1';
  //         if (v === false || v === 'false' || v === '0') return '0';
  //         return v?.toString() ?? '';
  //       };
  //       const requiredValueMatches = toBit(sourceValue) === toBit(t.rule.value);

  //       // isfromHeader=true AND dataGrid exists → header form field (mutate column metadata)
  //       // isfromHeader=true AND dataGrid is undefined → parent-child grid (mutate row childOperations)
  //       // isfromHeader=false → regular grid (mutate row childOperations)
  //       if (isfromHeader && dataGrid) {
  //         if (sourceValue !== null && sourceValue !== undefined) {
  //           const column = dataGrid.find(
  //             (x: any) => x.dataField === t.targetField,
  //           );
  //           if (column) {
  //             (column as any).isRequired = requiredValueMatches;
  //           }
  //         }
  //       } else {
  //         const targetedData =
  //           eventData.selectedGroup?.[
  //             t.gridKey?.substring(t.gridKey?.indexOf('_') + 1)
  //           ];

  //         targetedData?.forEach((targetRow: any) => {
  //           if (requiredValueMatches) {
  //             if (
  //               !targetRow.childOperations ||
  //               typeof targetRow.childOperations !== 'object'
  //             ) {
  //               targetRow.childOperations = {};
  //             }
  //             if (!Array.isArray(targetRow.childOperations.requiredFields)) {
  //               targetRow.childOperations.requiredFields = [];
  //             }
  //             if (
  //               !targetRow?.childOperations?.requiredFields.includes(
  //                 t.targetField,
  //               )
  //             ) {
  //               targetRow.childOperations.requiredFields.push(t.targetField);
  //             }
  //           } else {
  //             if (Array.isArray(targetRow?.childOperations?.requiredFields)) {
  //               targetRow.childOperations.requiredFields =
  //                 targetRow.childOperations.requiredFields.filter(
  //                   (x: any) => x !== t.targetField,
  //                 );
  //             }
  //           }
  //         });
  //       }
  //     }
  //   });
  // }

  // getScale(column: GRID, defaultScale = 3): number {
  //   const n = Number(column.dataScale);

  //   // Number('') = 0
  //   // Number(null) = 0
  //   // Number(undefined) = NaN

  //   if (!column.dataScale || isNaN(n)) {
  //     return defaultScale;
  //   }

  //   return n;
  // }

  getAllApiObjNames(tab: any): Array<Record<string, string>> {
    const res: Array<Record<string, string>> = [];

    const walk = (g: any): void => {
      g.gridId && g.apiObjectName && res.push({ [g.gridId]: g.apiObjectName });
      g.childGridInfo?.forEach(walk);
    };

    walk(tab?.gridInfo ?? tab);
    return res;
  }

  /**
   * function will set refScreenOnRowData which is used for getting reference data without opening the reference screen
   * @param column
   * @param tabId
   */
  setRefScreenRowData(column: columnInfo): void {
    // 1. Get the specific form
    const form = this.formGroupsDictionarysignal();

    // Safety check
    if (!form) return;

    const controlValue = form.get(column.dataField)?.value;

    // 2. Check if value exists
    if (column && controlValue !== null && controlValue !== '') {
      this.refScreenOnRowData.set({
        referenceScreenId: column.referenceScreenId ?? '',
        rowId: -1,
        gridId: '',
        tabId: this.tabId(),
        refForColumn: column.dataField,
        selectedValue: controlValue, // Use the value from the specific form
        refRelations: column.refRelations ?? [],
      });
    } else if (column) {
      // 3. Clear dependent fields if value is empty
      column.refRelations?.forEach((refRelation: refScreenRelations) => {
        if (refRelation.mainScreenColumnName) {
          // Get the name of the dependent form control to clear.
          const dependentFieldName = refRelation.mainScreenColumnName.replace(
            /\b\w/g,
            (char) => char.toUpperCase(),
          );

          // Clear the value on the specific form
          form.get(dependentFieldName)?.setValue(null);
        }
      });
    }
  }

  /**
   *
   * @param column
   * @returns
   */
  onInputValueChange(column: columnInfo, isToValue :boolean = false): void {
    if (column === undefined) {
      return;
    }

    // Get the specific form for this tab
    const form = this.formGroupsDictionarysignal();

    if (!form) return;

    const reqType = column.searchRequired; // "From", "TO", "BOTH", "ANY", ""
    const fieldName = !isToValue ? column.dataField : column.dataField + '_To';
    const otherFieldName = isToValue ? column.dataField : column.dataField + '_To';
    const value = form.get(fieldName)?.value;

    // 1. If the user typed something valid
    if (value !== null && value !== undefined && value !== '') {
      
      // Clear the error for the current input
      this.columnValidationState[fieldName] = false;
      this.formValidateDictionary?.delete(fieldName);

      // 2. SPECIAL LOGIC FOR "ANY": 
      // If one side has a value, the "ANY" requirement is satisfied for BOTH sides.
      if (reqType === 'ANY') {
        this.columnValidationState[otherFieldName] = false;
        this.formValidateDictionary?.delete(otherFieldName);
      }
    }
  }

  isRequiredFormField(column: columnInfo): boolean {
    if(this.isMaterialFilter()){
      return false;
    }
    // Get the target form group using the tabId key
    const targetForm: FormGroup<any> | undefined =
      this.formGroupsDictionarysignal();

    if (!targetForm || !targetForm.value) {
      return false;
    }

    const columnDataField: string = column.dataField;

    // Check the requirement conditions
    if (column.isRequired && !this.isAutoGenerateFormField(column)) {
      // Check the value against the target form group's value
      const fieldValue = targetForm?.get(column.dataField)?.value;

      // The field is required if its value is null or an empty string ('')
      if (fieldValue === null || fieldValue === '') {
        return true;
      }
    }

    // If any check failed (not required, is auto-generated, or has a value)
    return false;
  }

  isAutoGenerateFormField(column: columnInfo): boolean {
    return column.isAutoGenerate ?? false;
  }

  /**
   * Return the boolean value if data is change of that field
   * @param column
   * @returns
   */
  onRowDataUpdate(
    column: columnInfo,
    isToValue :boolean = false
  ): void {
    //removes bind with ngModelChange
    this.onInputValueChange(column,isToValue);
    const form = this.formGroupsDictionarysignal(); //this.formGroupsDictionary.get(tabId);

    if (!form) return;
    if (!this.initialFormData) return;

    let originalValue = (!isToValue ?  this.initialFormData()?.[column?.dataField] : this.initialFormData()?.[column?.dataField+'_To']) ?? ''; //[tab?.apiObjectName ?? '']?.[column?.dataField];
    let updateValue = !isToValue ? form.get(column.dataField)?.value : form.get(column.dataField+'_To')?.value;

    if (column.editorType == '3') {
      originalValue = new Date(
        originalValue);
      //add timezone in get data from API so that old value and new value format remaing same
      /*const date = new Date(originalValue);
      originalValue = LuxonDateTime.fromJSDate(date)
        .setZone(this.plantTimeZone(), { keepLocalTime: true })
        .toJSDate();*/
      updateValue = new Date(
        updateValue);
    }

    const isChanged = String(originalValue ?? '') !== String(updateValue ?? '');
    let updatedFields = this.updatedFields; //.get(tabId);

    if (isChanged && !this.isMaterialFilter()) {
      // Initialize as a new Set if it doesn't exist
      // Simply .add(). If the field is already there, Set ignores it automatically.
      updatedFields.add(column.dataField);
      this.addInGlobalInDetection(column.dataField);
    } else if (updatedFields) {
      // .delete() returns true if the item was found and removed
      updatedFields.delete(column.dataField);
      this.removeFromGlobalInDetection(column.dataField);

      // Use .size to check if the Set is empty
      if (updatedFields.size === 0) {
        this.updatedFields.clear();
      }
    }

    // if (tabGroup === 'detail') {
    //   this.calculateHeaderAggregations(tabId, column.dataField);
    // }
  }

  addInGlobalInDetection(columnName: string): void {
    // ColumnName_tabId
    const identifier: string = columnName + '_';
    this.DataChangeDetected.dataChangeListPush(identifier);
  }

  removeFromGlobalInDetection(columnName: string): void {
    // ColumnName_tabId
    const identifier: string = columnName + '_';
    this.DataChangeDetected.dataChangeListRemove(identifier);
  }

  getReferenceRelation(relation :any){
    return relation ?? []
  }
  onReferenceSelected(event: any, datafield: string,isToValue : boolean = false) {
    if(this.isMaterialFilter()){
      if(event.rowId === -1){
        this.formGroupsDictionarysignal()?.get(event.refForColumn)?.setValue(event.selectedValue);
        return;
      }
    }
    // this.formGroupsDictionarysignal()?.forEach((key) => {
    // Retrieve the specific form for this tab
    const form = this.formGroupsDictionarysignal();
    // Get field metadata using the passed tabId (instead of activeHeaderTab)
    const fields = this.formConfigData() ?? []; //this.entryTabs().get(tabId)?.entryHeaderFormFields ?? [];
    const fieldMeta = fields.find(
      (f: columnInfo) => f.dataField === event.refForColumn,
    );

    // Safety check: if form doesn't exist, stop
    if (!form || event.tabId !== this.tabId() || event.rowId !== -1) return;

    this.refScreenOnRowData.set({
    referenceScreenId: '',
    rowId: -1,
    gridId: '',
    tabId: '',
    refForColumn: '',
    selectedValue: '',
    refRelations: [],
  });


    // Set the selected value on the specific form
    form.get(!isToValue ? event.refForColumn : event.refForColumn+'_To')?.setValue(event.selectedValue);

    if (
      event.mainScreenColumnValues &&
      event.mainScreenColumnValues.length > 0
    ) {
      event.mainScreenColumnValues.forEach((col: any) => {
        const key = col.key;
        const value = col.value;

        // if (key == datafield){
        if (value === undefined || value === '' || value === null) {
          //  SET ERROR
          this.formValidateDictionary.set(event.refForColumn, {
            message: 'MESSAGE.COM_E0015',
            params: {
              refTitleCaption: this.translate.instant(event.refTitleCaption),
            },
          });
          if (key) {
            const dependentFieldName = key.replace(/\b\w/g, (char: string) =>
              char.toUpperCase(),
            );
            // Update dependent field in the specific form
            form.get(dependentFieldName)?.setValue(null);
            // if (fieldMeta) {
            //   this.onInputFinished(fieldMeta, tabId, true);
            // }
          }
        } else {
          /** Convert key to match form control (first letter capital) */
          // const capitalizedKey = !isToValue ? key.charAt(0).toUpperCase() + key.slice(1) : (key.charAt(0).toUpperCase() + key.slice(1))+'_To';
          const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);

          /** Check if this field exists in the specific form */
          if (form.get(capitalizedKey)) {
            form.get(capitalizedKey)?.setValue(value);
            // if (fieldMeta) {
            //   this.onInputFinished(fieldMeta,tabId, true);
            // }
          }
        }
        // }
      });
    }

    if (!fieldMeta) return;

    this.onHeaderValueChange(event.selectedValue, fieldMeta);
    // if (
    //   this.screenName === 'SalesQuotationEntry' &&
    //   event.gridId === 'QuotationDetail' &&
    //   event.refForColumn === 'TAX_GRP_CD'
    // ) {
    //   const header = this.formGroupsDictionarysignal()?.value;

    //   this.parentChildComponent.rowSelectionChanges[0].TAX_GRP_CD =
    //     event.selectedValue;
    //   // Only when Item-wise tax is enabled
    //   if (header?.ISITEMWSTAX_FLG === '1') {
    //     this.pageService?.applyRowWiseTaxUpdate?.(
    //       this.parentChildComponent.rowSelectionChanges[0],
    //       this,
    //     );
    //   }
    // }

    this.formReferenceSelected.emit(event);
  }

  getColumnTooltip(column: string): string {
    return '';
  }

  getKBNNmUsingKey(code: any, column: columnInfo): string | undefined {
    // Implement your KBN name lookup logic
    const codeStr = String(code);
    return column?.memberList?.find(
      (item: any) => String(item.code) === codeStr,
    )?.caption;
  }

  onCheckboxValueChange(
    formValue: any,
    dataField: string,
    newValue: string,
    tabId: string,
  ): void {
    // 1. Get the specific form for this tab
    const form = this.formGroupsDictionarysignal();

    // 2. Patch the value only on that specific form
    if (form) {
      form.patchValue({ [dataField]: newValue });
    }
  }

  // to get radio with its checked state
  getChildren(field: {
    memberList?: { caption: string; code: any; checked?: boolean }[];
  }): { caption: string; code: any; checked?: boolean }[] {
    return (
      field.memberList?.map(
        (opt: { caption: string; code: any; checked?: boolean }) => ({
          caption: opt.caption,
          code: opt.code,
          checked: opt.checked ?? false,
        }),
      ) ?? []
    );
  }

    /** 
   * before save: validate all required fields in all tabs
   */
  validateAllForm(): boolean {
    let isValid = true;

    // clear previous state
    // this.formValidateDictionary.clear();

    const form = this.formGroupsDictionarysignal();
    if (!form || !Array.isArray(this.formConfigData())) return false;

    let tabInvalid = false;
    const entryHeaderFormFields = this.formConfigData() ?? [];

    entryHeaderFormFields
      .filter(f => {
          if (this.isMaterialFilter()) {
            // 1. Search Context: Include if searchRequired has any value ('FROM', 'TO', etc.)
            return !!f.searchRequired; 
          } else {
            // 2. Entry Context: Include if isRequired is true and NOT an auto-generated field
            return f.isRequired === true && !f.isAutoGenerate;
          }
        })
      .forEach(f => {
        //  Advanced Search Logic ---
        if (this.isMaterialFilter() && f?.showMatchType) {
          const reqType = f.searchRequired; // 'FROM' | 'TO' | 'BOTH' | 'ANY' | ''
          if (!reqType) return; // Skip if no requirement set

          const fromValue = form.get(f.dataField)?.value;
          const toValue = form.get(f.dataField + '_To')?.value;

          const isFromEmpty = fromValue === null || fromValue === undefined || fromValue === '';
          const isToEmpty = toValue === null || toValue === undefined || toValue === '';
          const isRangeMode = form.get(f.dataField + '_Conditions')?.value === 'TASK.Search.~';

          let fromError = false;
          let toError = false;

          // Logic for "From" Validation
          if (reqType === 'FROM' || reqType === 'BOTH' || reqType === 'ANY') {
            if (isFromEmpty) {
              // ANY only errors if BOTH are empty
              fromError = reqType === 'ANY' ? (isRangeMode ? isToEmpty : true) : true;
            }
          }

          // Logic for "To" Validation (Only if in Range Mode)
          if (isRangeMode) {
            if (reqType === 'TO' || reqType === 'BOTH' || reqType === 'ANY') {
              if (isToEmpty) {
                // ANY only errors if BOTH are empty
                toError = reqType === 'ANY' ? isFromEmpty : true;
              }
            }
          }

          // Update Dictionary for From Field
          if (fromError) {
            isValid = false;
            tabInvalid = true;
            this.formValidateDictionary.set(f.dataField, { message: 'MESSAGE.COM_E0006' });
            form.get(f.dataField)?.markAsTouched();
          } else {
            this.formValidateDictionary.delete(f.dataField);
          }

          // Update Dictionary for To Field
          if (toError) {
            isValid = false;
            tabInvalid = true;
            this.formValidateDictionary.set(f.dataField + '_To', { message: 'MESSAGE.COM_E0006' });
            form.get(f.dataField + '_To')?.markAsTouched();
          } else {
            this.formValidateDictionary.delete(f.dataField + '_To');
          }
        }         
        //  Entry Form Logic ---
        else {
          const value = form.get(f.dataField)?.value;
          const isEmpty = value === null || value === undefined || value === '';

          if (f.isRequired && isEmpty) {
            isValid = false;
            tabInvalid = true;
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


  private getDefaultValueColumnName(fields: columnInfo[]): void {
      if (!Array.isArray(fields)) return;
      fields.forEach((field) => {
        // Iterate over refRelations instead of refColumns
        field.refRelations?.forEach((relation: refScreenRelations) => {
          let columnNames: string[] = [];
          // Directly access fromColName and toColName from the relation object
          if (relation?.fromColName) {
            columnNames.push(relation.fromColName);
          }
          if (relation?.toColName) {
            columnNames.push(relation.toColName);
          }
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
    return this?.dateConditionOptions?.map((x) => {
      return { ...x, text: this.translate.instant('TASK.Search.' + x.text) };
    });
  }

  conditionFocusOut(field:any){
    this.datePickerForm?.patchValue({ [field.condition?.split('_')?.[0] + '_value']: null });
  }

  getHint(fieldLabel: string): MessageDisplayOption | undefined {
    switch (fieldLabel) {
      case 'Year': return this.yearHint;
      case 'Month': return this.monthHint;
      case 'Day': return this.dayHint;
      default: return undefined;
    }
  }

  onDateConditionUpdated(value: number, field: any) {
    this.datePickerForm?.get(field.condition)?.setValue(value);
    if (value && value > 0) {
      if (value != 2) {
        // Value min/max validations
        if (value == 1 && field.label != 'Year') {
          const fieldToUpdate = this.datePickerFields.find(x => x.label == field.label);
          if (fieldToUpdate) {
            fieldToUpdate.max = this.initialDatePickerFields.find(x => x.label == field.label)?.max;
          }
        } else if ((value == 3 || value == 4) && field.label != 'Year') {
          const fieldToUpdate = this.datePickerFields.find(x => x.label == field.label);
          if (fieldToUpdate) {
            fieldToUpdate.max = 99;
          }
        }
      }
      this.applyDate(field?.label);
    }
    this.yearHint = undefined;
    this.monthHint = undefined;
    this.dayHint = undefined;  
  }

  applyDate(field?:any) {
    this.yearHint = undefined;
    this.monthHint = undefined;
    this.dayHint = undefined;  
    const f = this.datePickerForm.value;
    switch (field) {
      case "Year":
        {
          if (f?.year_condition == '1') {
            if (f.year_value !== null && f.year_value !== undefined && f.year_value < 1900){
              this.yearHint = { message: "MESSAGE.COM_E0017", type: 'error', params:{value : 1900} };
            } else if (f.year_value !== null && f.year_value !== undefined && f.year_value > 2099){
              this.yearHint = { message: "MESSAGE.COM_E0018", type: 'error', params:{value : 2099} };
            }
            else{
              this.yearHint = undefined;
            }
          }
        } break;
      case "Month":
        {
          if (f?.month_condition == '1') {
            if (f.month_value !== null && f.month_value !== undefined && f.month_value < 1) {
              this.monthHint = { message: "MESSAGE.COM_E0017", type: 'error' , params:{value : 1} };
            } else if (f.month_value !== null && f.month_value !== undefined &&  f.month_value > 12) {
              this.monthHint = { message: "MESSAGE.COM_E0018", type: 'error' , params:{value : 12} };
            }
            else{
              this.monthHint = undefined;
            }
          }
        } break;
      case "Day":
        {
          if (f?.day_condition == '1') {
            if (f.day_value !== null && f.day_value !== undefined && f.day_value < 1) {
              this.dayHint = { message: "MESSAGE.COM_E0017", type: 'error', params:{value : 1} };
            } else if (f.day_value !== null && f.day_value !== undefined && f.day_value > 31) {
              this.dayHint = { message: "MESSAGE.COM_E0018", type: 'error', params:{value : 31}  };
            }
            else{
              this.dayHint = undefined;
            }
          }
        } break;
    }

    if (this.yearHint?.message != undefined || this.monthHint?.message != undefined || this.dayHint?.message != undefined){
      const selectedfield = this.selectedDateField();
      if (selectedfield && this?.formGroupsDictionarysignal()?.contains(selectedfield)) {
        this?.formGroupsDictionarysignal()?.patchValue({
          ...(selectedfield.includes('_To')
            ? { [selectedfield]: null, [`${selectedfield}_expression`]: null }
            : { [selectedfield]: null, [`${selectedfield}_From_expression`]: null })
        });
      }
    } else{
      const build = (
        cond: string | null | undefined,
        val: number | null | undefined,
        unit: 'Y' | 'M' | 'D' | null | undefined
      ) => {
        const c = cond ?? '1';
        const v = val ?? undefined;

        if (c === '1') return v ? `${v}` : '';
        if (c === '2') return unit;
        if (c === '3') return `${unit}-${v || 0}`;
        if (c === '4') return `${unit}+${v || 0}`;
        return unit;
      };

      if (
        ((f?.year_condition == '2') || (f?.year_value != undefined && f.year_value != null && f.year_value > 0)) &&
        ((f?.month_condition == '2') || (f?.month_value != undefined && f.month_value != null && f.month_value > 0)) &&
        ((f?.day_condition == '2') || (f?.day_value != undefined && f.day_value != null && f.day_value > 0))
      ){
        let expr = `${build(f?.year_condition, f?.year_value, 'Y')}/` +
          `${build(f?.month_condition, f?.month_value, 'M')}/` +
          `${build(f?.day_condition, f?.day_value, 'D')}`;
        expr = expr  == '//' ? '' : expr;

        if (expr && expr?.length > 0){
          const finalDate = new Date(this.formatDate(expr));
          if (finalDate?.getFullYear() < 1900){
            this.yearHint = { message: "MESSAGE.COM_E0017", type: 'error', params:{value : 1900} };
          } else if (finalDate?.getFullYear() > 2099) {
            this.yearHint = { message: "MESSAGE.COM_E0018", type: 'error', params: {value : 2099} };
          }

            if((this.yearHint?.message == undefined && this.monthHint?.message == undefined && this.dayHint?.message == undefined) ){
            const selectedfield = this.selectedDateField();
            if (selectedfield && this?.formGroupsDictionarysignal()?.contains(selectedfield)) {
              this?.formGroupsDictionarysignal()?.patchValue({
                ...(selectedfield.includes('_To')
                  ? { [selectedfield]: new Date(finalDate), [`${selectedfield}_expression`]: expr }
                  : { [selectedfield]: new Date(finalDate), [`${selectedfield}_From_expression`]: expr })
              });
            }
          }
        }
      } else{
        const selectedfield = this.selectedDateField();
        if (selectedfield && this?.formGroupsDictionarysignal()?.contains(selectedfield)) {
          this?.formGroupsDictionarysignal()?.patchValue({
            ...(selectedfield.includes('_To')
              ? { [selectedfield]: null, [`${selectedfield}_expression`]: null }
              : { [selectedfield]: null, [`${selectedfield}_From_expression`]: null })
          });
        }
      }

      if (this.yearHint?.message != undefined || this.monthHint?.message != undefined || this.dayHint?.message != undefined) {
        const selectedfield = this.selectedDateField();
        if (selectedfield && this?.formGroupsDictionarysignal()?.contains(selectedfield)) {
          this?.formGroupsDictionarysignal()?.patchValue({
            ...(selectedfield.includes('_To')
              ? { [selectedfield]: null, [`${selectedfield}_expression`]: null }
              : { [selectedfield]: null, [`${selectedfield}_From_expression`]: null })
          });
        }
      }
    }
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
      const numericVal = Number(val);

      return operator === '+' ? base + numericVal : base - numericVal;
    };

    // 1. Calculate the raw values
    const year = parsePart(y, now.getFullYear());
    // Use 1-based month for the calc, then subtract 1 for the Date constructor
    const month = parsePart(m, now.getMonth() + 1) - 1;
    const day = parsePart(d, now.getDate());

    // 2. Let JS handle the overflow/underflow naturally
    const result = new Date(year, month, day);

    return `${result.getFullYear()}/` +
          `${String(result.getMonth() + 1).padStart(2, '0')}/` +
          `${String(result.getDate()).padStart(2, '0')}`;
  }

  async openCustomDatePicker(field:string){
    this.selectedDateField.set(field);
     this.isCustomDatePickerOpen.set(true);
    // this.isCustomDatePickerOpen.set(true);    
    if(field?.includes('_To')){
      this.resetDatePickerForm();
      this.bindDatepickerData(this.formGroupsDictionarysignal()?.value[field + '_expression']).then(
        (data: any) => {
            if (this?.datePickerForm) {
              this.datePickerForm.setValue(data);
            }
        }
      );
    } else{
      this.resetDatePickerForm();
      this.bindDatepickerData(this.formGroupsDictionarysignal()?.value[field + '_From_expression']).then(
        (data: any) => {
            if (this?.datePickerForm) {
              this.datePickerForm.setValue(data);
            }
        }
      );
    }
  }

  async bindDatepickerData(expr:string){
    if (expr && expr?.length > 0){
      const [yExp, mExp, dExp] = expr.split('/');

      const parse = (part: string, unit: 'Y' | 'M' | 'D') => {
        // Case: Plain number → Inserted
        if (!isNaN(Number(part))) {
          return { condition: 1, value: Number(part) };
        }
        // Case: Y / M / D → Current
        if (part.length === 1) {
          return { condition: 2, value: null };
        }
        // Case: Y-5 / M+2 / D-10 → Previous / Next
        const operator = part[1];
        const val = Number(part.slice(2));
        if (operator === '-') {
          return { condition: 3, value: val }; // Previous
        }
        if (operator === '+') {
          return { condition: 4, value: val }; // Next
        }
        return { condition: 2, value: null }; // fallback
      };

      const y = parse(yExp, 'Y');
      const m = parse(mExp, 'M');
      const d = parse(dExp, 'D');

      return {
        year_condition: y.condition,
        year_value: y.value,
        month_condition: m.condition,
        month_value: m.value,
        day_condition: d.condition,
        day_value: d.value
      };
    } else{
      return this.initialDatePickerValues;
    }
  }
  resetDatePickerForm(): void {
    this.datePickerForm.setValue(this.initialDatePickerValues);
  }

  onDatePickerOverlayClick(): void {
    this.selectedDateField.set('');
    this.yearHint = undefined;
    this.monthHint = undefined;
    this.dayHint = undefined;
     
    if(this.isCustomDatePickerOpen() === true){
      this.isCustomDatePickerOpen.set(false);  
    }
  }

  toggleSelectAll(event: boolean | { parent: boolean; children: any[] }, fields: FormGroup<any>) {
    
       
    // 1. Determine the checked state
      const isChecked = typeof event === 'boolean' ? event : event.parent;

      // 2. Iterate through the controls inside the FormGroup
      Object.keys(fields.controls).forEach(controlName => {
        const column = this.formConfigData()?.find(item => controlName.startsWith(item.dataField) && controlName.endsWith('_defaultVisible'))
        const control = fields.get(controlName);

        // 3. Logic: Only toggle if the control exists and isn't disabled
        // We check control.disabled instead of field.isDisable since we are looking at the FormGroup
        if (control && !control.disabled) {
          
          // Optional: If you only want to target specific fields (like those ending in _defaultVisible)
          // search required column then that is not toggle and always check
          if (controlName.endsWith('_defaultVisible') && !column?.searchRequired) {
            control.setValue(isChecked);
          }
        }
      });

      // Trigger update once after all values are set to improve performance
      fields.updateValueAndValidity();
  }

  //cehckbox disable in condition-setting's when serarch is required
  isRequiredColumnForSearch(column: string){
    const fields = this.formConfigData() ?? []; //configGroup.get(tabId)?.entryHeaderFormFields ?? [];

    const gridColumn = fields.find(
      (col: columnInfo) => col.dataField === column,
    );
    return !!gridColumn && !!gridColumn.searchRequired;
  }

  //ALL checkbox is check then SelectAll chekcbox is check in condition settig's
  isAllCheckBoxCheck(): boolean {
    const values = this.formGroupsDictionarysignal()?.value;

    return Object.keys(values)
      .filter(key => key.endsWith('_defaultVisible'))
      .every(key => values[key] === true);
  }
 
  scrollToField(fieldName: string) {
    const element = this.fieldRows.find(
      (el) => el.nativeElement.getAttribute('data-field') === fieldName
    );

    if (element) {
      element.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
  scrollToFirstError() {
    // Use requestAnimationFrame to ensure Angular has updated the DOM with error messages
    requestAnimationFrame(() => {
      // 2. Get the first field name from the dictionary (e.g., "itemName" or "price_To")
      const errorKeys = Array.from(this.formValidateDictionary.keys());
      
      if (errorKeys.length > 0) {
        const firstErrorField = errorKeys[0];

        // 3. Call focusField to do the actual work
        this.scrollToField(firstErrorField);
      }
    });
  }
}
