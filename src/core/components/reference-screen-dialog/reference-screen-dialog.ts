import {
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
  ViewContainerRef,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { DialogBox } from '../dialogbox/dialogbox';
import { ReferenceScreenService } from 'src/core/services/reference-screen-service';
import { FILTER } from 'src/core/models/filter.type';
import { Grid } from '../grid/grid';
import { SplitPanel, Splitter } from '../splitter/splitter';

import { MatIconModule } from '@angular/material/icon';
import { CORE_CONFIG } from 'src/core/core.config.token';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Button } from '../button/button';
import { ReferenceInitialSearchkbn } from '../reference-initial-searchkbn/reference-initial-searchkbn';
import { BTN_TYPE, buttonEmitType } from 'src/core/models/extraButton.type';
import { ActyCommon } from 'src/core/services/acty-common';
import { notify } from 'src/core/services/toast.service';
import { Loader } from '../loader/loader';
import { LoaderService } from 'src/core/services/loader-service';
import { firstValueFrom, Subject, take } from 'rxjs';
import { refScreenColumns, refScreenRelations, refScreenType } from 'src/core/models/refScreen.type';
import { GRID } from 'src/core/models/grid.type';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'acty-reference-screen-dialog',
  imports: [
    DialogBox,
    Grid,
    Splitter,
    SplitPanel,
    MatIconModule,
    TranslateModule,
    Button,
    ReferenceInitialSearchkbn,
    Loader,
    A11yModule
  ],
  templateUrl: './reference-screen-dialog.html',
  styleUrl: './reference-screen-dialog.scss',
})
export class ReferenceScreenDialog implements OnInit, OnDestroy {
  @ViewChild('dropdownRef') dropdownRef: any;
  @ViewChild('refInitialSearchKBN') refInitialSearchKBN: any;
  @ViewChild('RefScreen') dialogBox!: DialogBox;
  @ViewChild('filterWrapper') filterWrapper!: ElementRef;
  @ViewChild('splitter', { static: true }) splitter!: Splitter;
  @ViewChild('mainDiv', { static: false }) mainDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('titleBar', { static: false })
  titleBar!: ElementRef<HTMLDivElement>;
  @ViewChild(Grid) gridComponent!: Grid;
  @ViewChild('splitter', { read: ElementRef }) splitterContainer!: ElementRef;
  @ViewChild('materialFilter', { read: ElementRef }) filterContainer!: ElementRef;

  referenceScreenService = inject(ReferenceScreenService);
  coreConfig = inject(CORE_CONFIG);
  translate = inject(TranslateService);
  viewContainerRef = inject(ViewContainerRef);
  ActyCommonService = inject(ActyCommon);
  loader = inject(LoaderService);
  ngZone = inject(NgZone);

  hasSelectedRow: boolean = false;

  pageSize = [25, 50, 75, 100];
  FilertText: any = '';
  textContent: any = '';
  ReferenceSettingText: any = '';

  referenceScreenId = signal<string>('');
  refTableName: string = '';
  queryID: string = '';
  refTitleCaption: string = '';
  refRelations: refScreenRelations[] = [];
  formId: string = '';
  userId: string = '';
  refColumns: refScreenColumns[] = [];
  refForColumn: string = '';
  selectedValue: string | string[] = '';
  rowId: number = -1;
  tabId: string = '';
  gridId: string = '';
  customFilters: any[] = [];
  dataGrid: GRID[] = [];
  firstPanelSize = 0;
  firstPanelMaxPercent = 30;
  firstPanelMinPercent = 7;
  firstPanelMinSize = 0;
  firstPanelMinDrag = 7;
  AddtionalData: any;
  gridFilters: any;
  showFilter = true;
  currentPageIndex = 0;
  openReferenceInitialDailog: boolean = false;
  getDataUrl = this.coreConfig.getReferenceScreenDataAPI;
  formLoaderKey = signal<string>('');
  filterExtraBtns: BTN_TYPE[] = [
    {
      caption: 'CORE.REFERENCESCREEN.ReferencesSettingOpenBtn',
      type: 'outlined',
      btnClass: '',
      leftIcon: 'settings',
      severity: 'primary',
      rightIcon: '',
      disabled: false,
      IsVisible: true,
      btnId: 'Ref_id',
    },
  ];

  GridBtns: BTN_TYPE[] = [
    {
      caption: 'CORE.REFERENCESCREEN.SelectRefRow',
      type: 'outlined',
      btnClass: '',
      leftIcon: 'done_all',
      severity: 'primary',
      rightIcon: '',
      disabled: false,
      IsVisible: true,
      btnId: 'refBtn_selectRow',
    },
  ];
  initialconditionkbn : string = '0';

  // if the column name with its value is given then it'll use it every time. The value comes from form.
  // gridRefData is for setting data without opening reference dialog
  gridRefData: {
    referenceScreenId: string;
    refRelations: refScreenRelations[];
    rowId: number;
    gridId?: string;
    tabId?: string;
    refForColumn: string;
    selectedValue: string | string[];
  } | null = null;

  conditionOperatorMap: { [key: string]: string } = {
    '~': '1',
    'IsEqualTo': '2',
    'NotEqualTo': '3',
    'StartsWith': '4',
    'DoesNotStartsWith': '5',
    'EndsWith': '6',
    'ItDoesNotEndsWith': '7',
    'Contains': '8',
    'DoesNotInclude': '9',
    'IsBlank': '10',
    'IsNotBlank': '11',
  };

  // signals
  // Component state
  visible = signal(false);
  gridData = signal<any[]>([]);
  searchList = signal<FILTER[]>([]);
  isShowFilter = signal(true);
  // to show increament by 1 this.isLoading.update((n) => n + 1);
  // to hide decreament by 1 till 0 this.isLoading.update((n) => Math.max(n - 1, 0));
  pageSizeDrpDown = signal(this.pageSize[0]);
  rows = signal(this.pageSize[0]);

  private filterObserver: ResizeObserver | null = null;
  private _lastMeasuredFilterHeightPx: number | null = null;
  private _measurementAttempts = 0;
  private _initialObserverTimeout: any = null;
  referenceScreenData!: refScreenType;

  constructor() {
    // save previous to check which variable is changed
    let prev: {
      visible: boolean;
      referenceScreenId: string,
      formId: string;
      userId: string;
      refForColumn: string;
      selectedValue: string | string[];
      refRelations: refScreenRelations[];
      rowId: number;
      tabId?: string;
      gridId: string;
      gridRefData: {
        referenceScreenId: string,
        rowId: number;
        gridId?: string;
        tabId?: string;
        refForColumn: string;
        selectedValue: string | string[];
        refRelations: { [key: string]: any };
      } | null;
    } = {
      visible: this.referenceScreenService.isVisible(),
      referenceScreenId: this.referenceScreenService.referenceScreenId(),
      formId: this.referenceScreenService.formId(),
      userId: this.referenceScreenService.userId(),
      refForColumn: this.referenceScreenService.refForColumn(),
      selectedValue: this.referenceScreenService.selectedValue() ?? '',
      refRelations: this.referenceScreenService.refRelations(),
      rowId: this.referenceScreenService.rowId(),
      tabId: this.referenceScreenService.tabId(),
      gridId: this.referenceScreenService.gridId(),
      gridRefData: this.referenceScreenService.gridRefData(),
    };
    effect(async () => {
      this.formLoaderKey.set(this.formId + '_' + this.refTableName + '_loader');
      // match current state with previous state to check which variable is changed
      const current: {
        visible: boolean;
        referenceScreenId: string;
        formId: string;
        userId: string;
        refForColumn: string;
        selectedValue: string | string[];
        refRelations: refScreenRelations[];
        rowId: number;
        tabId?: string;
        gridId: string;
        gridRefData: {
          referenceScreenId: string;
          rowId: number;
          gridId?: string;
          tabId?: string;
          refForColumn: string;
          selectedValue: string | string[];
          refRelations: refScreenRelations[];
        } | null;
      } = {
        visible: this.referenceScreenService.isVisible(),
        referenceScreenId: this.referenceScreenService.referenceScreenId(),
        formId: this.referenceScreenService.formId(),
        userId: this.referenceScreenService.userId(),
        refForColumn: this.referenceScreenService.refForColumn(),
        selectedValue: this.referenceScreenService.selectedValue() ?? '',
        refRelations: this.referenceScreenService.refRelations() ?? [],
        rowId: this.referenceScreenService.rowId(),
        tabId: this.referenceScreenService.tabId(),
        gridId: this.referenceScreenService.gridId(),
        gridRefData: this.referenceScreenService.gridRefData(),
      };
      if (prev.visible !== current.visible) {
        this.visible.set(current.visible);
        if (current.visible === true) {
          this.referenceScreenData = await this.referenceScreenService.getReferenceData(this.referenceScreenId());
          this.dialogBox.openDialog();
          this.showDialog();
        }
      }
      
      /// All dependent variables are updated only when the referenceScreenId changes. 
      // The referenceScreenId itself is reset whenever the dialog closes.
      if (prev.referenceScreenId !== current.referenceScreenId) {
        this.referenceScreenId.set(current.referenceScreenId);
        if (prev.formId !== current.formId) {
          this.formId = current.formId;
        }
        if (prev.userId !== current.userId) {
          this.userId = current.userId;
        }
        if (prev.refForColumn !== current.refForColumn) {
          this.refForColumn = current.refForColumn;
        }
        if (prev.selectedValue !== current.selectedValue) {
          this.selectedValue = current.selectedValue;
        }
        if (prev.refRelations !== current.refRelations) {
          this.refRelations = current.refRelations;
        }
        if (prev.rowId !== current.rowId) {
          this.rowId = current.rowId;
        }
        if (prev.gridId !== current.gridId) {
          this.gridId = current.gridId;
        }
        if(prev.tabId !== current.tabId){
          this.tabId = current.tabId?? '';
        }
      }

      /**
       * If gridRefData is changed then set the necessary data for reference search.
       * Once the data is fetched then call the handleRowDoubleClick which sends the selected data.
       */
      if (current.gridRefData && prev.gridRefData !== current.gridRefData) {
        this.gridRefData = current.gridRefData;
        if (this.gridRefData?.refForColumn != '') {
          this.referenceScreenId.set(this.gridRefData?.referenceScreenId ?? '');
          this.refForColumn = this.gridRefData?.refForColumn ?? '';
          // The toString is required because when the number component emits it emits the string value of the number
          // But here we will take value from formControl directly so need to do toString
          this.selectedValue = this.gridRefData?.selectedValue?.toString() ?? '';
          this.refRelations = this.gridRefData?.refRelations ?? [];
          this.rowId = this.gridRefData?.rowId ?? -1;
          this.gridId = this.gridRefData?.gridId ?? '';
          this.tabId = this.gridRefData?.tabId ?? '';

          // current.referenceScreenId = this.referenceScreenId();
          // current.refForColumn = this.refForColumn;
          // current.selectedValue = this.selectedValue;
          // current.refRelations = this.refRelations;
          // current.rowId = this.rowId;
          // current.gridId = this.gridId;
          // current.tabId = this.tabId;

          try {
            await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
            this.referenceScreenData = await this.referenceScreenService.getReferenceData(this.referenceScreenId());

            this.refColumns = this.referenceScreenData.refColumns;
            this.refTableName = this.referenceScreenData.refTableName;
            this.queryID = this.referenceScreenData.refQueryID;
            this.refTitleCaption = this.referenceScreenData.refTitleCaption;
          

            this.initializeSearchList('2');
            const componentRef = this.viewContainerRef.createComponent(Grid);

            componentRef.setInput('formId', this.formId);
            componentRef.setInput('userId', this.userId);
            componentRef.setInput('dataGrid', this.dataGrid);
            componentRef.setInput('getDataUrl', this.getDataUrl);
            componentRef.setInput('isEditableGrid', false);
            componentRef.setInput('GridMenuBtns', []);
            componentRef.setInput('apiObjectName', 'ReferenceScreenRecords');
            componentRef.setInput(
              'additionalSearchData',
              this.getAddtionalData(),
            );
            componentRef.setInput('formLoaderKey', this.formLoaderKey());

            componentRef.instance.ngOnInit?.();

            (async () => {
              try {
                componentRef.changeDetectorRef.detectChanges();
                // triggers async fetch
                await componentRef.instance.getData();
                const firstValue = componentRef.instance.dataList()[0];
                if (firstValue === null || firstValue === undefined) {
                  //this.notification.notify('warning','There is no relevant data.')
                  notify({ message: 'MESSAGE.COM_E0002' });
                }
                if (componentRef.instance.dataList().length > 0) {
                  this.handleRowDoubleClick(componentRef.instance.dataList()[0]);
                } else {
                  const nullRowData: { [key: string]: any } = {};
                  this.refColumns.forEach((col) => {
                    nullRowData[col.columnName] = null;
                  });
                  this.handleRowDoubleClick(nullRowData);
                }
              }
              catch (error) {
              } finally {
                await componentRef.destroy();
              }

            })();
          }
          catch (error) {
            this.referenceScreenService.backgroundTaskCompleted$.next();
          }
        }
      }
      // update prev
      prev = current;
    });
  }

  //get Addtioanl Data for References Screen
  getAddtionalData() {
    return (this.AddtionalData = {
      TableName: this.refTableName?? '',
      QueryID: this.queryID ?? '',
      Columns: this.getColumnList(),
      FilterValues: this.searchList(),
    });
  }

  //return Column list for Grid and Filter Component
  getColumnList() {
    //Create List For Generating Column
    return this.refColumns.map((col: any) => ({
      Name: col.columnName,
      Datatype: Number(col.editorType),
      queryOrderBySeq: col.queryOrderBySeq,
    }));
  }

  //Below method is based on MES project structure and wont work for master filter component
  /*private initializeSearchList(
    searchType?: string,
    searchValues?: string
  ): void {
    const updatedSearchList: FILTER[] = this.refColumns.map((column): any => ({
      Name: column.columnName,
      Displayname: column.caption,
      colMetadataKey: {
        tableName: this.refTableName,
        columnName: column.columnName,
      },
      visible: column.IsVisibleInSearch,
      isRequired: false, // Default to false unless specified
      Valuefrom:
        column?.defaultValueColumnName &&
        column.defaultValueColumnName in this.defaultValue
          ? this.defaultValue[column.defaultValueColumnName]
          : column?.mainScreenColumnName === this.refForColumn
          ? this.selectedValue ??
            (column.editorType === '4' && column.memberList
              ? column.memberList.map((m) => m.code)
              : [])
          : '',

      Valueto: '',
      Matchtype: Number(
        column?.defaultValueColumnName &&
          column.defaultValueColumnName in this.defaultValue &&
          this.defaultValue[column.defaultValueColumnName]
          ? '2'
          : searchType ?? (column.editorType === '1' ? '4' : '1')
      ),
      Datatype: Number(column.editorType),
      memberList: column.memberList || [],
      Inputtype: Number(column.editorType),
      invalidInput: false,
      isReferenceScreen: false,
    }));
    this.searchList.set(updatedSearchList);
  }*/

  // For adding value to searchList need to put it in "value" key
  private initializeSearchList(searchType?: string): void {
      // Create lookup maps for performance
      const columnMap = new Map(this.refColumns.map((c) => [c.columnName, c]));
      const relationMap = new Map(this.refRelations.map((r) => [r.refColumnName, r]));
      // We look for a column where the 'mainScreenColumnName' matches the passed 'refForColumn'
      const targetColumnDef = this.refRelations.find(
        (c) => c.mainScreenColumnName === this.refForColumn
      );
      const filters = structuredClone(this.customFilters);
      filters.forEach((block) => {
        block.fields.forEach((field: any) => {
          const currentColumn = columnMap.get(field.dataField);
          const currentRelation = relationMap.get(field.dataField); // Get matching relation
          if (currentColumn) {
            let calculatedValueFrom: any = '';
            let calculatedValueTo: any = '';
            let isDisable: boolean = false;
            let hasDefaultValue: boolean = false;

            // Use currentRelation instead of currentColumn.defaultValue
            if (currentRelation && (currentRelation.fromColName || currentRelation.toColName)) {
              isDisable = true;
              hasDefaultValue = true;
              field.matchtype = currentRelation.matchType;
            }
            if(hasDefaultValue && !this.referenceScreenService.skipMasterFilterDefaultValue()){
              // Priority 1: Default Value from fromColName/toColName in relations
            if (
              currentRelation?.fromColName &&
              currentRelation.fromColName in this.referenceScreenService.defaultValue()
            ) {
              calculatedValueFrom = (currentRelation.fromColName === this.refForColumn && this.initialconditionkbn  === '1') ? '' :
                this.referenceScreenService.defaultValue()[currentRelation.fromColName];
            }
            
            if(this.referenceScreenService.skipMasterFilterDefaultValue() && currentRelation?.fromColName && currentRelation.fromColName.startsWith('fw_'))
            {
               calculatedValueFrom = this.referenceScreenService.defaultValue()[currentRelation.fromColName];
            }
            if (
              currentRelation?.toColName &&
              currentRelation.toColName in this.referenceScreenService.defaultValue()
            ) {
              calculatedValueTo =
                this.referenceScreenService.defaultValue()[currentRelation.toColName];
            }
             if(this.referenceScreenService.skipMasterFilterDefaultValue() && currentRelation?.toColName && currentRelation.toColName.startsWith('fw_'))
            {
              calculatedValueTo = this.referenceScreenService.defaultValue()[currentRelation.toColName];
            }
            }
            // Priority 2: Check if this field corresponds to our target column
            else if (
              targetColumnDef &&
              field.dataField === targetColumnDef.refColumnName
            ) {
              calculatedValueFrom =
                this.selectedValue ??
                (currentColumn.editorType === '4' && currentColumn.memberList
                  ? currentColumn.memberList.map((m) => m.code)
                  : []);
            }

            field.value = calculatedValueFrom;
            field.value_to = calculatedValueTo;
            field.isDisable = isDisable;
            field.hasDefaultValue = hasDefaultValue;
          }
        });
      });

      this.customFilters = filters;

      // ==========================================
      // 2. UPDATE SEARCH LIST
      // ==========================================
      // Note: This maps through refRelations. If you want to show columns that DO NOT 
      // have relations in your search list, you should map through 'this.refColumns' instead.
      const updatedSearchList: FILTER[] = this.refRelations.map((column): any => {
        const refColObj = columnMap.get(column.refColumnName);

        let calculatedValueFrom: any = '';
        let calculatedValueTo: any = '';
        let isDisable: boolean = false;
        let hasDefaultValue: boolean = false;

        // Use currentRelation instead of currentColumn.defaultValue
        if (column && (column.fromColName || column.toColName)) {
          isDisable = true;
          hasDefaultValue = true;
        }
        if(hasDefaultValue && !this.referenceScreenService.skipMasterFilterDefaultValue()){
          // Priority 1: Default Value from fromColName/toColName in relations
        if (
          column?.fromColName &&
          column.fromColName in this.referenceScreenService.defaultValue()
        ) {
          calculatedValueFrom =
            this.referenceScreenService.defaultValue()[column.fromColName];
        }
        
        if(this.referenceScreenService.skipMasterFilterDefaultValue() && column?.fromColName && column.fromColName.startsWith('fw_')  )
        {
          calculatedValueFrom = this.referenceScreenService.defaultValue()[column.fromColName];
        }
        if (
          column?.toColName &&
          column.toColName in this.referenceScreenService.defaultValue()
        ) {
          calculatedValueTo =
            this.referenceScreenService.defaultValue()[column.toColName];
        }
        if(this.referenceScreenService.skipMasterFilterDefaultValue() && column?.toColName && column.toColName.startsWith('fw_')  )
        {
          calculatedValueTo = this.referenceScreenService.defaultValue()[column.toColName];
        }
        }
        // Priority 2: Check if this field corresponds to our target column
        else if (
          targetColumnDef &&
          column.refColumnName === targetColumnDef.refColumnName
        ) {
          calculatedValueFrom =
            this.selectedValue ??
            (refColObj?.editorType === '4' && refColObj?.memberList
              ? refColObj.memberList.map((m: any) => m.code)
              : []);
        }

        return {
          Name: column.refColumnName,
          Displayname: refColObj?.caption,
          colMetadataKey: {
            tableName: this.refTableName,
            columnName: column.refColumnName,
          },
          visible: refColObj?.IsVisibleInSearch,
          isRequired: false, // Default to false unless specified
          Valuefrom: calculatedValueFrom,
          Valueto: calculatedValueTo,
          Matchtype: Number(
            (column?.fromColName || column?.toColName) &&
            (column.fromColName in this.referenceScreenService.defaultValue() ||
            column?.toColName in this.referenceScreenService.defaultValue()) &&
            (this.referenceScreenService.defaultValue()[column.fromColName] ||
            this.referenceScreenService.defaultValue()[column.toColName])
              ? this.conditionOperatorMap[column.matchType]
              : searchType ?? (refColObj?.editorType === '1' ? '4' : '1')
          ),
          Datatype: Number(refColObj?.editorType),
          memberList: refColObj?.memberList || [],
          Inputtype: Number(refColObj?.editorType),
          invalidInput: false,
          isReferenceScreen: false,
        };
      });

      this.searchList.set(updatedSearchList);
  }

  /*// For adding value to searchList need to put it in "value" key
private initializeSearchList(searchType?: string,): void {
  //Set Value In customFilters For Filterdata in material-filter Reference Screen.  
  // Create a lookup map for
    const columnMap = new Map(this.refColumns.map((c) => [c.columnName, c]));

    const refForColumn = this?.refForColumn?.replace("_to","");

    // We look for a column where the 'mainScreenColumnName' matches the passed 'refForColumn'
    const targetColumnDef = this.refRelations.find(
      (c) => c.mainScreenColumnName === refForColumn,
    );
    const filters = structuredClone(this.customFilters);
    filters.forEach((block) => {
      block.fields.forEach((field: any) => {
        const currentColumn = columnMap.get(field.dataField);
        if (currentColumn) {
          let calculatedValueFrom: any = '';
          let calculatedValueTo: any = '';
          let isDisable :boolean = false;
          let hasDefaultValue :boolean = false;
 
          if (currentColumn.defaultValue?.fromColName || currentColumn.defaultValue?.toColName ){
              isDisable = true;
              hasDefaultValue = true
              field.matchtype = currentColumn.defaultValue?.matchType;
          }
          // Priority 1: Default Value from defaultValueColumnName
          if (
            currentColumn.defaultValue?.fromColName &&
            currentColumn.defaultValue?.fromColName in this.referenceScreenService.defaultValue() 
          ) {
            calculatedValueFrom =
              this.referenceScreenService.defaultValue()[currentColumn.defaultValue?.fromColName];
          }
          if (
            currentColumn.defaultValue?.toColName &&
            currentColumn.defaultValue?.toColName in this.referenceScreenService.defaultValue() 
          ) {
            calculatedValueTo =
              this.referenceScreenService.defaultValue()[currentColumn.defaultValue?.toColName];
          }
          // Priority 2: Check if this field corresponds to our target column
          // We compare the field's dataField (columnName) to the target column's name we found earlier
          else if (
            targetColumnDef &&
            field.dataField === targetColumnDef.refColumnName
          ) {
            calculatedValueFrom =
              this.selectedValue ??
              (currentColumn.editorType === '4' && currentColumn.memberList
                ? currentColumn.memberList.map((m) => m.code)
                : []);
          }
          field.value = calculatedValueFrom;
          field.value_to = calculatedValueTo;
          field.isDisable = isDisable;
          field.hasDefaultValue = hasDefaultValue;
        }
      });
    });
 
    this.customFilters = filters;

    //Set Value In SearchList For Filterdata in Form Control's Reference Screen.
    const updatedSearchList: FILTER[] = this.refColumns.map((column): any => ({
      Name: column.columnName,
      Displayname: column.caption,
      colMetadataKey: {
        tableName: this.refTableName,
        columnName: column.columnName,
      },
      visible: column.IsVisibleInSearch,
      isRequired: false, // Default to false unless specified
      Valuefrom:
        column?.defaultValue?.fromColName &&
        column.defaultValue?.fromColName in this.referenceScreenService.defaultValue() 
          ? this.referenceScreenService.defaultValue()[column.defaultValue?.fromColName]
          : column?.mainScreenColumnName === refForColumn
          ? this.selectedValue ??
            (column.editorType === '4' && column.memberList
              ? column.memberList.map((m) => m.code)
              : [])
          : '',

      Valueto: 
          column?.defaultValue?.toColName &&
        column.defaultValue?.toColName in this.referenceScreenService.defaultValue() 
          ? this.referenceScreenService.defaultValue()[column.defaultValue?.toColName]
          : '',
      Matchtype: Number(
        (column?.defaultValue?.fromColName || column?.defaultValue?.toColName) &&
          (column.defaultValue?.fromColName in this.referenceScreenService.defaultValue()  || column.defaultValue?.toColName in this.referenceScreenService.defaultValue() ) &&
          (this.referenceScreenService.defaultValue()[column.defaultValue?.fromColName] || this.referenceScreenService.defaultValue()[column.defaultValue?.toColName]  )
          ? this.conditionOperatorMap[column.defaultValue.matchType]
          : searchType ?? (column.editorType === '1' ? '4' : '1')
      ),
      Datatype: Number(column.editorType),
      memberList: column.memberList || [],
      Inputtype: Number(column.editorType),
      invalidInput: false,
      isReferenceScreen: false,
    }));
    this.searchList.set(updatedSearchList);
  }*/

  //When click on extra button of filter component
  extraFilterbtnClick(button: any) {
    if (button.name === 'Ref_id') {
      this.openReferenceInitialDailog = true;
    }
    else if(button.name === 'refBtn_selectRow'){
      if(this.gridComponent.selectedRows.length > 0){
        this.handleRowDoubleClick(this.gridComponent.selectedRows[0]);
      }
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.adjustFirstPanelHeight();
    // this.updateGridScrollHeight();
    this.DOMAdjustments();
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.referenceScreenService.resetDefaultValue();
  }

  /**
   * Write all dom related stuff in this function so that finding it will be easy.
   * The stuff which needs to be calculated and updated on window resize and afterviewinit
   */
  private DOMAdjustments(): void {}

  onGridSelectionChanged(selectedRows: any[]) {
    this.hasSelectedRow = selectedRows.length > 0;
  }

  onButtonClicked($event: buttonEmitType) {
    if(this.gridComponent.selectedRows.length > 0){
      this.handleRowDoubleClick(this.gridComponent.selectedRows[0]);
    }
  }

  isGridButtonDisabled(btn: any): boolean {
    if(btn.btnId = "refBtn_selectRow"){
      return !this.hasSelectedRow;
    }
    return false;
  }

  // Pagination handler
  onPageChange(event: any) {
    this.currentPageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    //this.dataSource.paginator = this.paginator;
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
    // if (this.showFilter) {
    //   this.adjustFirstPanelHeight();
    // } else {
    //   this.firstPanelSize = this.firstPanelMinPercent;
    // }
    let sizes = null;
    if (this.showFilter) {
      sizes = this.ActyCommonService.adjustFilterSplitterSize(this.splitterContainer, this.filterContainer,3);
    } else {
      sizes = this.ActyCommonService.adjustFilterSplitterSize(this.splitterContainer, this.filterContainer, 0);
    }

    if(sizes){
      this.firstPanelSize = sizes[0];
    }
    this.updateGridScrollHeight();
  }

  updateGridScrollHeight() {
    if (this.gridComponent) {
      this.gridComponent.updateScrollHeight();
    }
  }

  onSizeChange(sizes: number[]) {
    Promise.resolve().then(() => {
      /*this.firstPanelSize = Math.max(
        this.firstPanelMinPercent,
        // Math.min(sizes[0], this.firstPanelMaxPercent)
        sizes[0]
      );*/
      this.adjustFirstPanelHeight();
      // this.updateGridScrollHeight();
    });
  }

  adjustFirstPanelHeight() {
    // if (!this.filterWrapper || !this.splitter) return;
    // this.ngZone.runOutsideAngular(() => {

    // // Get the splitter container's height
    // const containerHeight = this.splitter.splitContainer.nativeElement.offsetHeight;

    //   requestAnimationFrame(() => {
    //   const filterHeightPx = this.filterWrapper.nativeElement.querySelector('.filter-panel-group')?.scrollHeight || 0;
    //   const filterHeightPercent = (filterHeightPx / containerHeight) * 100;

    //   // await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
    //     this.firstPanelSize = Math.max(
    //       this.firstPanelMinPercent,
    //       Math.min(filterHeightPercent, this.firstPanelMaxPercent)
    //     );
    //     this.updateGridScrollHeight();
    //   });
    // });
    // this.updateGridScrollHeight();
    requestAnimationFrame(() => {
      let sizes = null;
      if (this.showFilter) {
        sizes = this.ActyCommonService.adjustFilterSplitterSize(this.splitterContainer, this.filterContainer,3);
      } else {
        sizes = this.ActyCommonService.adjustFilterSplitterSize(this.splitterContainer, this.filterContainer, 0);
      }

      if(sizes){
        this.firstPanelSize = sizes[0];
      }
      this.updateGridScrollHeight();
      });
  }

  //when click on dialog close button
  onDialogClose() {
    this.closeDialog();
  }

  //initialize the grid  and filter component
  private initializeComponent(): void {
    if (this?.referenceScreenData){
      // //Create List For Genereating Gird Compoent
      // this.dataGrid = this.refColumns.map((col: any) => ({
      //   dataField: col.columnName,
      //   caption: col.caption,
      //   editorType: col.editorType,
      //   IsVisibleInGrid: col.IsVisibleInGrid,
      // }));

      // initialize with current value in the service which will be set from the button click
      this.refColumns = this.referenceScreenData?.refColumns;
      this.referenceScreenId.set(this.referenceScreenData.referenceScreenId);
      this.refTableName = this.referenceScreenData.refTableName;
      this.queryID = this.referenceScreenData?.refQueryID ?? '';
      this.refTitleCaption = this.referenceScreenData.refTitleCaption;
      this.formId = this.referenceScreenService.formId();
      ((this.userId = this.referenceScreenService.userId()),
        (this.refForColumn = this.referenceScreenService.refForColumn()));
      this.refRelations = this.referenceScreenService.refRelations();
      this.selectedValue = this.referenceScreenService.selectedValue() ?? '';
      this.rowId = this.referenceScreenService.rowId();
      this.gridId = this.referenceScreenService.gridId();
      this.tabId = this.referenceScreenService.tabId() ?? '';

      this.customFilters = [
        {
          fields: [],
        },
      ];
      const FilterValueConditionforText = [
        { option: 'TASK.Search.~' },
        { option: 'TASK.Search.IsEqualTo' },
        { option: 'TASK.Search.NotEqualTo' },
        { option: 'TASK.Search.StartsWith' },
        { option: 'TASK.Search.DoesNotStartsWith' },
        { option: 'TASK.Search.EndsWith' },
        { option: 'TASK.Search.ItDoesNotEndsWith' },
        { option: 'TASK.Search.Contains' },
        { option: 'TASK.Search.DoesNotInclude' },
        { option: 'TASK.Search.IsBlank' },
        { option: 'TASK.Search.IsNotBlank' },
      ];

      const FilterValueConditionForNumber = [
        { option: 'TASK.Search.~' },
        { option: 'TASK.Search.IsEqualTo' },
        { option: 'TASK.Search.NotEqualTo' },
        { option: 'TASK.Search.IsBlank' },
        { option: 'TASK.Search.IsNotBlank' },
      ];

      const editorTypeMap: { [key: number]: string } = {
        1: 'text',
        2: 'text',
        3: 'date',
        4: 'select',
        5: 'checkbox(boolean)',
        6: 'radiobutton',
        7: 'checkbox',
        8: 'textarea',
      };

      //Cretae List For Generating Filter Component
      this.customFilters[0].fields = this.refColumns
        .filter((col: any) => col.IsVisibleInSearch === true) // keep only isVisibleInSearch true
        .map((col: any) => ({
          editorType: col.editorType,
          caption: col.caption,
          dataField: col.columnName,
          IsVisibleInGrid: col.IsVisibleInGrid,
          filterConditions:
            col.editorType === '2'
              ? FilterValueConditionForNumber
              : FilterValueConditionforText,
          IsVisibleInSearch: col.IsVisibleInSearch,
          queryOrderBySeq: col.queryOrderBySeq,
          mainScreenColumn: col.mainScreenColumnName,
          maxLength: col.maxLength,
          dataPrecision: col.dataPrecision,
          dataScale: col.dataScale,
          showMatchType: true,
          memberList: col.memberList,
          isVisible: col.IsVisibleInGrid,
          isEditable : true,
        }));
      if (this.selectedValue) {
        const dataFields = this.refForColumn
          .replace(/_from|_to|_To$/, '')
          .toLowerCase();
          setTimeout(() => {
        this.customFilters.forEach((block) => {
          block.fields.forEach((field: any) => {
            if (field.dataField === dataFields) {
              field.value = this.selectedValue;
            }
          });
        });
      });
      }

      //Create List For Genereating Gird Compoent
      this.dataGrid = this.refColumns.map((col: refScreenColumns): GRID => ({
        dataField: col.columnName,
        dbColName: col.columnName,
        tableName: this.refTableName, 
        caption: col.caption,
        editorType: col.editorType,
        IsVisibleInGrid: col.IsVisibleInGrid,
        IsVisibleInSearch: col.IsVisibleInSearch,
        memberList: col.memberList,
        maxLength: col.maxLength,
        maxValue: col.maxValue,
        minValue: col.minValue,
        dataPrecision: col.dataPrecision,
        dataScale: col.dataScale
      }));

      //create list for addtional data
      this.getAddtionalData();
      this.initializeSearchList();
    } 
  }

  async getDataSearch(filters: FILTER[]) {
    if (filters.length !== undefined) {
      if (this.gridComponent) {
        //passing data from filters
        const getSearchListFromFilter = filters.map((col: any) => ({
          Datatype: Number(col.data_type),
          Displayname: col.displayName,
          Inputtype: Number(col.data_type),
          Matchtype: Number(col.match_type),
          Name: col.name,
          Valuefrom: col.value_from,
          Valueto: col.value_to,
        }));
        this.gridFilters = getSearchListFromFilter;
      }
      this.searchList.set(this.gridFilters);
      if (this.gridComponent) {
        await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
        this.hasSelectedRow = false;
        this.gridComponent?.getData();
      }
      this.AddtionalData.FilterValues = this.searchList();
    }
  }

  async showDialog(): Promise<void> {
    //when default search or not in references screen dialog open
    const ReferencesKbns = await this.refInitialSearchKBN.getData();
    const initialsearchkbn = ReferencesKbns.initialsearchkbn;
    this.initialconditionkbn = ReferencesKbns.initialconditionkbn.toString();
    if (this.initialconditionkbn === '1'){
      //remove selected value, as data is not being search on opening popup
      this.referenceScreenService.selectedValue.set('');
    }
    this.updateGridScrollHeight();
    this.adjustFirstPanelHeight();
    this.DOMAdjustments();

    this.initializeComponent();
    if (initialsearchkbn === '0') {
      setTimeout(() => { 
        this.updateGridScrollHeight();
      },100);
    }

    try {
      const node = this.filterWrapper?.nativeElement;
      if (node && 'ResizeObserver' in window) {
        // Reset measurement state
        this._measurementAttempts = 0;
        this._lastMeasuredFilterHeightPx = null;

        // Observe until the filter height stabilizes, then disconnect.
        this.filterObserver = new ResizeObserver(() => {
          try {
            const height = node.scrollHeight;

            // If first time, record and measure
            if (this._lastMeasuredFilterHeightPx === null) {
              this._lastMeasuredFilterHeightPx = height;
              this._measurementAttempts = 0;
              this.adjustFirstPanelHeight();
              return;
            }

            const diff = Math.abs(height - this._lastMeasuredFilterHeightPx);
            // small changes are considered stable
            if (diff <= 2) {
              this._measurementAttempts++;
            } else {
              this._measurementAttempts = 0;
              this._lastMeasuredFilterHeightPx = height;
            }

            this.adjustFirstPanelHeight();

            // When we observed stability for two consecutive callbacks, stop observing
            if (this._measurementAttempts >= 2) {
              try {
                this.filterObserver?.disconnect();
              } catch (e) {}
              this.filterObserver = null;
              if (this._initialObserverTimeout) {
                clearTimeout(this._initialObserverTimeout);
                this._initialObserverTimeout = null;
              }
            }
          } catch (e) {
            // ignore measurement errors
          }
        });
        this.filterObserver.observe(node);

        // Fallback: if observer doesn't stabilize within 2s, run one final measurement and stop
        this._initialObserverTimeout = setTimeout(() => {
          try {
            this.filterObserver?.disconnect();
          } catch (e) {}
          this.filterObserver = null;
          this.adjustFirstPanelHeight();
          this._initialObserverTimeout = null;
        }, 1000);
      }


    } catch (e) {
      // ignore
    }
  }

  onClickVisibleInitialDialog() {
    this.openReferenceInitialDailog = true;
  }
  onCloseReferenceInitialDialog() {
    this.openReferenceInitialDailog = false;
  }
  /**
   * sets the rowData as selected one and passes down
   * @param rowData
   */
  handleRowDoubleClick(rowData: any): void {
    const mainScreenColumnValues: { key: string; value: string }[] =
      this.setMainScreenColumnValues(rowData);

    const refForColumn = this?.refForColumn?.length > 0 ? this.refForColumn : '';
    // const refForColumn = this?.refForColumn?.length > 0 ? this.refForColumn : this?.gridRefData?.refForColumn ?? '';

    let baseColumnName: string = refForColumn.replace(/_from|_to|_To$/, '');

    // Check if refForColumn exists directly in refColumns
    const isDirectMatch = this.refColumns.some(
      (col) => col.columnName === baseColumnName
    );

    // If not found, find column where mainScreenColumnName equals refForColumn
    if (!isDirectMatch) {
      const mappedColumn = this.refRelations.find(
        (col) => col.mainScreenColumnName === baseColumnName
      );

      // If a mapping is found, use that column's name instead
      if (mappedColumn) {
        baseColumnName = mappedColumn.refColumnName;
      }
    }

    const selectedValue: string =
      rowData[baseColumnName.toLowerCase()]?.toString() || '';

    // Validate default values if required
    for (const column of this.refColumns) {
      //this.dialogBox.onClose();
    }
    
    this.referenceScreenService.referenceSelected.set({
      refForColumn: refForColumn,
      selectedValue: selectedValue,
      mainScreenColumnValues: mainScreenColumnValues,
      // rowId: this?.rowId > 0 ? this.rowId : this?.gridRefData?.rowId ?? 0,
      // gridId: this?.gridId?.length > 0 ? this.gridId : this?.gridRefData?.gridId ?? '',
      rowId: this?.rowId,
      tabId: this?.tabId ?? '',
      gridId: this?.gridId ?? '',
      refTitleCaption: this.refTitleCaption,
    });
    this.closeDialog();
  }

  /**
   * this.refColumns() will have mainScreenColumn prop which will have mainscreen column name
   * so below function will make key value pair form those refColumns
   * @param rowData
   * @returns dictionary for mainscreen refColumns
   */
  setMainScreenColumnValues(rowData: any): { key: string; value: string }[] {
    return this.refRelations
      .filter((column: refScreenRelations) => column.mainScreenColumnName)
      .map((column: refScreenRelations) => ({
        key: column.mainScreenColumnName!,
        value: rowData[column.refColumnName]?.toString() || '',
      }));
  }

  /**
   * fills up the remaining height of the screen with the grid by setting its height with that much px
   * @returns
   */
  /*updateScrollHeight(): void {
    const dataDiv: HTMLElement = document.querySelector(
      '.refDataDiv',
    ) as HTMLElement;
    if (!dataDiv) return;

    const paginator: HTMLElement = dataDiv.querySelector(
      '.p-paginator',
    ) as HTMLElement;

    const paginationHeight: number = paginator.clientHeight;

    const availableHeight: number = dataDiv.clientHeight - paginationHeight;

    const tableContainer: HTMLElement = dataDiv.querySelector(
      '.p-datatable-table-container',
    ) as HTMLElement;
    if (tableContainer) {
      tableContainer.style.height = `${availableHeight}px`;
      tableContainer.style.maxHeight = `${availableHeight}px`;
    }
  }*/

  private resetReferenceScreen(): void {
    // 1. Reset Child Components
    if (this.gridComponent) {
      this.gridComponent.resetGrid();
    }

    // 2. Clear Signals
    this.gridData.set([]);
    this.referenceScreenId.set('');
    this.searchList.set([]);
    this.formLoaderKey.set('');
    this.isShowFilter.set(true);

    // 3. Reset Local State Properties
    this.hasSelectedRow = false;
    this.FilertText = '';
    this.textContent = '';
    this.ReferenceSettingText = '';
    this.currentPageIndex = 0;
    
    // 4. Clear Reference/Grid Identifiers
    this.refTableName = '';
    this.queryID = '';
    this.refTitleCaption = '';
    this.formId = '';
    this.userId = '';
    this.refForColumn = '';
    this.selectedValue = '';
    this.rowId = -1;
    this.tabId = '';
    this.gridId = '';
    this.initialconditionkbn = '0';
    
    // 5. Clear Objects
    this.gridRefData = null;
    this.AddtionalData = undefined;
    this.gridFilters = undefined;
    this.referenceScreenData = undefined as any; 

    // 6. Clear Configuration Arrays 
    // This prevents the UI from briefly showing old columns/filters 
    // when the dialog re-opens for a different reference.
    this.customFilters = [{ fields: [] }];
    this.dataGrid = [];
    this.refColumns = [];
    this.refRelations = [];
    
    // 7. Reset UI Toggles
    this.showFilter = true;
    this.openReferenceInitialDailog = false;
    this.firstPanelSize = 0;
  }

  //when click on close dialog
  closeDialog(): void {
    this.resetReferenceScreen();
    this.referenceScreenService.closeRefScreen();
    this.dialogBox.onClose();
    this.referenceScreenService.backgroundTaskCompleted$.next();
    try {
      this.filterObserver?.disconnect();
    } catch (e) {
      // ignore
    }
  }

  async handleGridActionRequest(event: { notifier: Subject<boolean> }): Promise<void> {
  }
}
