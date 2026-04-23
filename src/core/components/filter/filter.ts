import { Component } from '@angular/core';

@Component({
  selector: 'app-filter',
  imports: [],
  templateUrl: './filter.html',
  styleUrl: './filter.scss',
})
export class Filter implements OnInit, OnChanges {
  @ViewChild('filterForm') filterForm!: FormComponent;

  dispCondSettingService = inject(ConditionSettingDisplayService);
  AutomaticAdjustmentService = inject(AutomaticAdjustmentService);
  ActyCommonService = inject(ActyCommonService);

  userId = input.required<string>();
  formID = input.required<string>();
  filterTitle = input.required<string>();
  isBackGroundOn = input<boolean>();
  
  // Now strictly using FormColumn
  searchListInp = input.required<FormColumn[]>();
  showDisplayConditionSetting = input<boolean>(true);
  showAutomaticAdjustment = input<boolean>(true);

  searchListChanged = output<FormColumn[]>();
  splitterToggle = output<boolean>();
  getDataTriggered = output<void>();

  textContent: any = FILTER_TEXT;
  textContentCommon: any = COMMON;

  searchList = signal<FormColumn[]>([]);
  initialSearchList: FormColumn[] = [];
  isShowFilter = signal<boolean>(true);
  conditionAdjustmentKBN = signal<string>('1');

  async ngOnInit(): Promise<void> {
    await this.getLastConditionSettingData();
    
    this.AutomaticAdjustmentService.GetAutoAdjustmenData(this.formID()).then(
      (autoAdjustKBN: string) => {
        this.conditionAdjustmentKBN.set(autoAdjustKBN);
      }
    );

    const clonedList = structuredClone(this.searchList());
    this.initialSearchList = clonedList;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchListInp']) {
      this.searchList.set(this.searchListInp());
      this.searchListChanged.emit(this.searchList());
    }
  }

  getData(): void {
    // Delegate validation to the Unified Form Component
    if (this.filterForm && !this.filterForm.validateAllForm()) {
      return; // Stop search if required fields are missing
    }

    this.getDataTriggered.emit();

    if (this.conditionAdjustmentKBN() === '1') {
      this.isShowFilter.set(false);
      this.splitterToggle.emit(false);
    }
  }
  
  resetFilter(): void {
    const clonedList = structuredClone(this.initialSearchList);
    this.searchList.set(clonedList);
    this.searchListChanged.emit(this.searchList());
    
    // Reset Form State internally
    if (this.filterForm) {
      this.filterForm.buildSingleForm({});
    }
  }

  toggleFilter(): void {
    this.isShowFilter.set(!this.isShowFilter());
    this.splitterToggle.emit(this.isShowFilter());
  }

  conditionSettingsLoad(searchCols: FormColumn[]): void {
    this.searchList.set(searchCols);
    this.searchListChanged.emit(this.searchList());

    const clonedList = structuredClone(searchCols);
    this.initialSearchList = clonedList;

    setTimeout(() => this.getData(), 10);
  }

  conditionAdjustmentKBNChanged(adjustmentKBN: string): void {
    this.conditionAdjustmentKBN.set(adjustmentKBN);
  }

  onGetDataTriggered(event: boolean): void {
    this.getDataTriggered.emit();
  }

  async getLastConditionSettingData(): Promise<void> {
    const lastConditionSettingData = await this.dispCondSettingService.getLastConditionSetting(
      this.userId(),
      this.formID(),
      this.searchList()
    );
    if (lastConditionSettingData && lastConditionSettingData.length > 0) {
      this.searchList.set(lastConditionSettingData);
    }
  }

  // Pass-through events from the Form
  onFormValuesChanged(event: any) {}
  onFieldInputFinished(event: any) {}
  onReferenceSelected(event: any) {
    // Reference screen mappings are handled by the Form Component natively now!
  }
}
