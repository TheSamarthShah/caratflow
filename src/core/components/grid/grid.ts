import {
  AfterViewInit,
  Component,
  ElementRef,
  computed,
  HostListener,
  inject,
  input,
  OnChanges,
  OnInit,
  output,
  QueryList,
  signal,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  NgZone,
  ChangeDetectorRef,
  OnDestroy,
  model,
  Injector,
  effect,
  untracked,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import {
  MatCell,
  MatHeaderCell,
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core'; // Needed for mat-option
import { MatIconModule } from '@angular/material/icon'; // Optional
import { MatButtonModule } from '@angular/material/button'; // Optional
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FILTER } from '../../models/filter.type';
import {
  ColumnFilterState,
  detailViewConfig,
  FilterCondition,
  GRID,
  GridActionRequest,
} from '../../models/grid.type';
import { buttonEmitType, BTN_TYPE } from 'src/core/models/extraButton.type';
import { SwapColumns } from 'src/core/models/swapcolumns.type';
import { GridServices } from 'src/core/services/grid-services';
import { GRID_TEXT } from '../../shared/jp-text';
import { Button } from '../button/button';
import { Multiselect } from '../multiselect/multiselect';
import { SelectOnFocus } from '../../directive/select-on-focus';
import { TabControl } from '../tabcontrol/tabcontrol';
import { TextInput } from '../text-input/text-input';
import { NumberInput } from '../number-input/number-input';
import { Checkbox } from '../checkbox/checkbox';

import {
  LangChangeEvent,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CellSummary } from '../cell-summary/cell-summary';
import { SortData } from '../sort-data/sort-data';
import { Export } from '../export/export';
import { SwapColumn } from '../swap-column/swap-column';
import { SwapColumnServices } from 'src/core/services/swap-column-services';
import { ActyDatePipe } from '../../pipe/acty-date-pipe';
import { ActyNumberPipe } from 'src/core/pipe/acty-number-pipe';
import { notify } from 'src/core/services/toast.service';
import {
  firstValueFrom,
  isEmpty,
  Observable,
  Subject,
  Subscription,
  take,
} from 'rxjs';
import { SaveData } from 'src/core/models/save-data.type';
import { DataChangeDetectedService } from 'src/core/services/data-change-detected-service';
import { DropDown } from '../dropdown/dropdown';
import { changesReturn } from 'src/core/models/confimChangesGuardsProps.type';
import { MessageDialogService } from 'src/core/services/message-dialog-service';
import { ReferenceScreenButton } from '../reference-screen-button/reference-screen-button';
import { ActyCommon } from 'src/core/services/acty-common';
import { LoaderService } from 'src/core/services/loader-service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SyncMinWidth } from 'src/core/directive/sync-min-width';
import { ButtonWrapper } from '../button-wrapper/button-wrapper';
import {
  MessageDisplayOption,
  MessageType,
} from 'src/core/models/MessageDisplayOption.type';
import { ShowTooltipIfTruncatedDirective } from 'src/core/directive/show-tooltip-if-truncated';
import { DateTime } from '../datetime/datetime';
import { FieldHighlightDirective } from 'src/core/directive/field-highlight';
import { MultiselectOption } from 'src/core/models/MultiselectOption.type';
import { HttpClient } from '@angular/common/http';
import { DateTime as LuxonDateTime } from 'luxon';
import { entryScreenMode, RELATION } from 'src/core/models/entryScreen.type';
import { ReferenceScreenService } from 'src/core/services/reference-screen-service';
import { refScreenRelations } from 'src/core/models/refScreen.type';
import { MessageResponseModel } from 'src/core/models/MessageResponseModel.type';
import { requestAnimFrame } from 'chart.js/helpers';
import { Languages } from 'src/core/models/languages.config';
@Component({
  selector: 'acty-grid',
  imports: [
    CommonModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatOptionModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatDatepickerModule,
    MatPaginatorModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    Button,
    Multiselect,
    SelectOnFocus,
    TextInput,
    NumberInput,
    Checkbox,
    DateTime,
    TranslateModule,
    MatProgressSpinnerModule,
    CellSummary,
    SortData,
    Export,
    SwapColumn,
    ActyDatePipe,
    DropDown,
    ReferenceScreenButton,
    MatTooltipModule,
    SyncMinWidth,
    ButtonWrapper,
    ShowTooltipIfTruncatedDirective,
    FieldHighlightDirective,
    TabControl,
    ActyNumberPipe
  ],
  templateUrl: './grid.html',
  styleUrl: './grid.scss',
})
export class Grid implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatTable) actyGridTable!: MatTable<any>;
  @ViewChild(MatTable, { read: ElementRef })
  actyGridTableElement!: ElementRef<HTMLTableElement>;
  @ViewChild('filterMenuTrigger') filterMenuTrigger!: MatMenuTrigger;
  @ViewChild('detailViewContainer', { static: false })
  detailViewContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('paginatorContainer', { static: false })
  paginatorContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('tableContainer', { static: false })
  tableContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('actyGrid', { static: false })
  actyGrid!: ElementRef<HTMLDivElement>;
  @ViewChildren(MatHeaderCell, { read: ElementRef }) headerCells!: QueryList<
    ElementRef<HTMLTableCellElement>
  >;
  @ViewChildren(MatCell, { read: ElementRef }) bodyCells!: QueryList<
    ElementRef<HTMLTableCellElement>
  >;
  @ViewChildren('dateTime') dateTimeList!: QueryList<DateTime>;
  @ViewChildren('dateTime', { read: ElementRef })
  dateTimeElements!: QueryList<ElementRef>;
  @ViewChildren('focusableCell', { read: ElementRef })
  focusableCells!: QueryList<ElementRef>;
  @ViewChildren('dropDown') dropDownList!: QueryList<DropDown>;
  @ViewChildren('dropDown', { read: ElementRef })
  dropDownElements!: QueryList<ElementRef>;
  @ViewChild('buttonWrapper') buttonWrapper!: ButtonWrapper;
  @ViewChild('paginator', { read: ElementRef }) paginatorEl!: ElementRef;

  service = inject(GridServices);
  injector = inject(Injector);
  msgDialogService = inject(MessageDialogService);
  //for swap data
  swapColumnService = inject(SwapColumnServices);
  translate = inject(TranslateService);
  host = inject(ElementRef);
  ngZone = inject(NgZone);
  DataChangeDetected = inject(DataChangeDetectedService);
  ActyCommonService = inject(ActyCommon);
  loader = inject(LoaderService);
  cdr = inject(ChangeDetectorRef);
  referenceScreenService = inject(ReferenceScreenService);
  private langChangeSubscription: Subscription | undefined;
  el = inject(ElementRef);

  dataGrid = input.required<GRID[]>();
  GridMenuBtns = input<BTN_TYPE[]>([]);
  GeneralBtns = input<BTN_TYPE[]>([]);
  secondaryBtn = input<Record<string, BTN_TYPE[]>>({});
  blockRowSelectionChange = input<boolean>(false);
  lastSelectedCell: { rowIndex: number; column: GRID } | null = null;
  exportURL = input<string>('');
  visibleDataList = new MatTableDataSource<any>([]);
  getDataUrl = input<string>('');
  historyTableId = input<string>('');
  saveDataUrl = input<string>('');
  searchList = input<Array<FILTER> | undefined>([]);
  additionalSearchData = input<any>(null);
  screenName = input<string>('');
  relationList = input<{ [key: string]: RELATION[] }>({});
  getDataMethod = input<string>('GetData');
  currPkData = input<{ [key: string]: any } | null>(null);
  pageSizes = input<number[]>([25, 50, 75, 100]);
  apiObjectName = input<string>('');
  isEditableGrid = input.required<boolean>();
  isDetailViewEditable = input<boolean>(false);
  selectionMode = input<'single' | 'multiple'>('single');
  detailViewTab = input<detailViewConfig[]>([]);
  userId = input.required<string>();
  formId = input.required<string>();
  isParentChild = input<boolean>(false);
  isParentChildHorizontalSplitter = input<boolean>(true);
  gridActions = output<any>();
  isActionsVisible = input<boolean>(false);
  resizableCols = input<boolean>(false);
  showPaginator = input<boolean>(true);
  showGridButtonContainer = input<boolean>(true);
  formLoaderKey = input.required<string>();
  isActiveGrid = input<boolean>(false);
  // rowFormat = input<boolean | undefined>(true);
  gridFormat = input<'normal' | 'tabular' | 'treeview' | undefined>('normal');
  doubleClickedRow = output<any>();
  SelecteChange = output<any>();
  //when row is updated
  //when row is deleted
  deleteValues = output<any>();
  //when added row
  addedValues = output<any>();
  dataListInp = input<{ list: any[]; total?: number }>();
  onClickSaveBtn = output<boolean>();
  pasteRowValue = output<any>();
  stickyHeader = input<boolean>(true);
  letParentMaintainCellChanges = input<boolean>(false);
  letParentMaintainButtonClicks = input<boolean>(false);
  isButtonDisabledInp = input<(btn: any) => boolean | undefined>();
  gridId = input<string>('');
  buttonSettingVisible = input<boolean>(true);
  buttonOrder = input<string | null>(null);
  isAllDataLoad = input<boolean>(false);
  //store timezone value which is pass from inquiry screen
  plantTimeZone = input<string>();
  skipMasterFilterValidation = input<boolean>(false);
  passSelectedRowForSave = input<boolean>(false);
  tabId = input<string>('');
  referenceDefaultValueColNames = model<string[]>([]);
  ignoreButtonSetting = input<boolean>(false);
  addTotalRow = input<boolean>(false);
  addTotalColumn = input<boolean>(false);
  entryScreenMode = input<entryScreenMode | undefined>(undefined);

  //for infom to the servies
  onGridCellChanges = output<any>();
  onCellFocusChange = output<any>();
  onButtonClicked = output<buttonEmitType>();
  // getSearchData = output<boolean>();
  requestFilterValue = output<void>();
  triggerGetdata = output<void>();
  parentChildGetData = output<{
    pageSize: number;
    pageIndex: number;
    sortType: any;
    sortColumn: any;
    gridFilters: any;
    previousPageIndex: number;
  }>();
  entryGetData = output<{
    pageSize: number;
    pageIndex: number;
    sortType: any;
    sortColumn: any;
    gridFilters: any;
    previousPageIndex: number;
  }>();
  afterSave = output<void>();
  onGridActionRequest = output<GridActionRequest>();
  addNewGridRow = output<any>();

  selectedCellSummary = signal<string>('2,3,4,5,6,7');
  currentPageSize = signal<number>(25);
  isCellModeEnabled = signal<boolean>(false);
  selectedCells = signal<Set<string>>(new Set());
  gridFilter = signal<ColumnFilterState[]>([]);
  //changes data when insert,update or delete in grid
  dataList = signal<any[]>([]);
  //the data can not be changes when changes in grid
  _dataList = signal<any[]>([]);
  _dataGrid = signal<GRID[]>([]);
  isBackgroundLoadingOn = signal<boolean>(false);
  paginatorValues = signal<any>({});
  setCellSummaryPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  buttonVisibility = signal<Record<string, boolean>>({});
  gridOpsToggleState: 'active' | 'inactive' = 'inactive';
  private cachedColumnWidths = new Map<string, number>();
  private iconWidthInInputsInPxForWidthCalculation = 36;
  private WCharacterWidthInPxForWidthCalculation = 13;
  //for dropdown icon width
  private dropDowniconWidthInInputsInPxForWidthCalculation = 24;
  //18px icon rigth icon size and rigth side padding in dropdown list
  private rigthIconWidthAndPaddingInDropDownInPxForWidthCalculation = 36;
  // Cache Storage for _dataGrid columns for tabular grid
  // we can do this because _dataGrid in tabular cant be changed once loaded
  private cachedColumnGroups: number[] = [1];
  private cachedRowsByGroup = new Map<number, number[]>();
  private cachedFieldsKeyMap = new Map<string, any[]>(); // Key: "Group_Row"
  private cachedAllRows: number[] = [];
  private columnDepthMap = new Map<string, number>();

  refScreenOnRowData = signal<{
    referenceScreenId: string;
    rowId: number;
    refForColumn: string;
    selectedValue: any;
    gridId: string;
    tabId?: string;
    refRelations: refScreenRelations[];
  }>({
    referenceScreenId: '',
    rowId: -1,
    refForColumn: '',
    selectedValue: '',
    gridId: '',
    tabId: '',
    refRelations: [],
  });
  copiedRows: any = [];
  //showColumnSwapdialog = signal<boolean>(false);

  showColumnSwapdialog: boolean = false;
  showSortDatadialog: boolean = false;
  showExportDatadialog: boolean = false;
  showGridOperationBtns: boolean = false;
  isCtrlPressed: boolean = false;
  isShiftPressed: boolean = false;
  isTabPressed: boolean = false;
  isMouseDownOnCell: boolean = false;
  isDragged: boolean = false;
  resetDefaultSelectedRow: number | null = null;
  primaryKeyColumns: string[] = [];
  gridtext: any[] | undefined;
  // swapData - determined the order, visibility and frozen properties of grid
  swapData: SwapColumns[] = [];
  showDetailView: boolean = false;
  displayedColumns: string[] = [];
  editableMap: { [key: string]: boolean } = {};
  nextRowId: number = 1;
  isBlockResetRowSelection: boolean = false;
  selection = signal<SelectionModel<number>>(
    new SelectionModel<number>(
      this.selectionMode() !== 'single' ? true : false, // true = multi-select, false = single-select
      [],
    ),
  );
  isButtonDisabledFn: (btn: any) => boolean | undefined;
  textContent: any = GRID_TEXT;
  sortColumn: string = '';
  sortDirection: '' | 'asc' | 'desc' = '';
  saveList: SaveData = {
    AddList: [],
    UpdateList: [],
    DeleteList: [],
  };
  invalidCellRowIds = signal<number[]>([]);
  selectedData: any[] = [];
  currLanguage: Languages = 'en';

  conditions_string: {
    value: FilterCondition;
    display: string;
  }[] = [
      {
        value: 'startsWith',
        display: 'CORE.GRID.FilterMatchConditions.StartsWith',
      },
      { value: 'contains', display: 'CORE.GRID.FilterMatchConditions.Contains' },
      {
        value: 'notContains',
        display: 'CORE.GRID.FilterMatchConditions.NotContains',
      },
      { value: 'endsWith', display: 'CORE.GRID.FilterMatchConditions.EndsWith' },
      { value: 'equals', display: 'CORE.GRID.FilterMatchConditions.Equals' },
      {
        value: 'notEquals',
        display: 'CORE.GRID.FilterMatchConditions.NotEquals',
      },
    ];
  conditions_number: {
    value: FilterCondition;
    display: string;
  }[] = [
      { value: 'equals', display: 'CORE.GRID.FilterMatchConditions.Equals' },
      {
        value: 'notEquals',
        display: 'CORE.GRID.FilterMatchConditions.NotEquals',
      },
      { value: 'lessThan', display: 'CORE.GRID.FilterMatchConditions.LessThan' },
      {
        value: 'greaterThan',
        display: 'CORE.GRID.FilterMatchConditions.GreaterThan',
      },
    ];
  conditions_date: {
    value: FilterCondition;
    display: string;
  }[] = [
      { value: 'dateIs', display: 'CORE.GRID.FilterMatchConditions.DateIs' },
      {
        value: 'dateIsNot',
        display: 'CORE.GRID.FilterMatchConditions.DateIsNot',
      },
      {
        value: 'dateIsBefore',
        display: 'CORE.GRID.FilterMatchConditions.DateBefore',
      },
      {
        value: 'dateIsAfter',
        display: 'CORE.GRID.FilterMatchConditions.DateAfter',
      },
    ];
  currentResizing: {
    column: string;
    startX: number;
    startWidth: number;
    headerEl: HTMLElement;
    bodyEls: HTMLElement[];
  } | null = null;
  columnFilterType = [
    {
      displayExpr: 'CORE.GRID.FilterMatchConditions.MatchAll',
      valueExpr: 'all',
    },
    {
      displayExpr: 'CORE.GRID.FilterMatchConditions.MatchAny',
      valueExpr: 'any',
    },
  ];

  private isWidthInitialized = false;
  private confirmChangesResult: number | null = null;
  private isSaveFromPaginator: boolean = false;
  filterObj: any = {};
  hasInitialLoad = model<boolean>(false);

  @HostListener('window:resize')
  async onResize(): Promise<void> {
    // wait until the button wrapper finish wrapping/unwrapping
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
    this.updateScrollHeight();
  }

  // Host Listeners for key & mouse events
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey) this.isCtrlPressed = true;
    if (event.shiftKey) this.isShiftPressed = true;
  }

  @HostListener('document:keyup', ['$event'])
  onKeyup(event: KeyboardEvent): void {
    if (!event.ctrlKey) this.isCtrlPressed = false;
    if (!event.shiftKey) this.isShiftPressed = false;
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    // If clicked outside the table, reset selection behavior
    if (!(event.target as HTMLElement).closest('table.p-datatable')) {
      this.isMouseDownOnCell = false;
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    this.isMouseDownOnCell = false;
    this.getCellSummaryPosition();
  }

  @HostListener('click', ['$event'])
  onGridClick(event: MouseEvent): void {
    const target: HTMLElement = event.target as HTMLElement;

    // true if click is inside a table cell or header cell
    const insideCell = !!target.closest('.acty-grid-table td.grid-cell ');
    //  check if the click is inside the cell-summary area
    const insideCellSummary = !!target.closest(
      'acty-multiselect, acty-dialog-box',
    );

    // If clicking outside of a data cell, clear selection
    if (!this.isDragged && !insideCell && !insideCellSummary) {
      this.clearSelection();
    } else {
      this.isDragged = false;
      //call copy functionality when Ctrl + C is pressed
      this.copySelectedCellsToClipboard();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      this.isTabPressed = true;
      this.isShiftPressed = event.shiftKey;
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isTabPressed = false;
  }

  constructor() {
    this.isButtonDisabledFn = this.isButtonDisabled.bind(this);
    effect(() => {
      // update visibility of button wrappar when pagination data is updated
      const values = this.paginatorValues();
      untracked(() => {
        this.buttonWrapper?.recalculateVisibility();
      })
    });
  }

  ngOnInit() {
    this.selection.set(
      new SelectionModel<number>(
        this.selectionMode() !== 'single' ? true : false, // true = multi-select, false = single-select
        [],
      ),
    );

    //for change grid heigth when row selected and show in detailview
    /*this.selection().changed.subscribe((change) => {
      //when any row added and removed in selection list then updatescrollheight can not be change
      //when any row added but not remove in selection list then updatescrollheight can be change
      //when any row removed but not added in selection list then updatescrollheight can be change
      if (
        change.added.length !== change.removed.length &&
        this.showDetailView
      ) {
        this.updateScrollHeight();
      }
    });*/
    //if (this.showSwapColumns()) this.getSwapColumnData();
    if (!this.letParentMaintainCellChanges()) {
      this.isButtonDisabledFn = this.isButtonDisabled.bind(this);
    } else {
      this.isButtonDisabledFn =
        this.isButtonDisabledInp() ?? this.isButtonDisabled.bind(this);
    }

    // Subscribe to language changes
    this.langChangeSubscription = this.translate.onLangChange.subscribe(
      (event: LangChangeEvent) => {
        requestAnimationFrame(() => {
          this.initializeColumnWidths();
        });
        this.currLanguage =
          (localStorage.getItem('locale') as Languages) ?? 'en';
      },
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isEditableGrid']) {
      if (this.isEditableGrid() === false) {
        const buttonsToHideInGrid: string[] = [
          'fw_GRID_AddRow',
          'fw_GRID_DeleteRow',
          'fw_GRID_CopyRow',
          'fw_GRID_PasteRow',
        ];
      }
      this.setEditableMapList(this.dataGrid());
    }
    if (changes['GridMenuBtns'] || changes['isEditableGrid']) {
      const showInEditableBtnIds = [
        'fw_GRID_AddRow',
        'fw_GRID_DeleteRow',
        'fw_GRID_PasteRow',
      ];
      const showInNonEditableBtnIds = ['fw_GRID_CellSummaryBtn'];
      this.changeIsVisibleStateOfBtn(
        showInEditableBtnIds,
        showInNonEditableBtnIds,
        this.isEditableGrid(),
      );
    }
    if (changes['stickyHeader'] || changes['gridFormat']) {
      this.cdr.detectChanges();
    }
    if (changes['dataListInp'] && this.dataListInp() !== undefined) {
      const { list, total } = this.dataListInp()!;

      // Done need to reset as we are calling modifyDataList method
      //this.resetDataList();
      this.actyGridTable.renderRows();
      if (list !== undefined && Array.isArray(list)) {
        this._dataList.set(list);
        this.paginatorValues.set({ TotalData: total });
        this.modifyDataList();
      } else {
        //this.SelecteChange.emit([]);
        this._dataList.set([]);
        this.paginatorValues.set({ TotalData: 0 });
        this.modifyDataList();
      }
    }
    if (changes['selectionMode']) {
      this.selection.set(
        new SelectionModel<number>(
          this.selectionMode() !== 'single' ? true : false, // true = multi-select, false = single-select
          [],
        ),
      );
    }
    if (
      (changes['GridMenuBtns'] || changes['dataGrid']) &&
      this.dataGrid() &&
      this.dataGrid().length > 0
    ) {
      const sortedDataGrid = this.sortGridColumns(this.dataGrid());

      const isSwapColumnVisible =
        this.GridMenuBtns()?.find((b) => b.btnId === 'fw_GRID_SwapColumns')
          ?.IsVisible === true;
      if (isSwapColumnVisible) {
        this.getSwapColumnData(sortedDataGrid);
      } else {
        this._dataGridSetup(sortedDataGrid);
      }
    }
    if (changes['pageSizes']) {
      if (this.pageSizes() && this.pageSizes().length > 0) {
        this.currentPageSize.set(this.pageSizes()[0]);
      }
    }
    if (changes['isButtonDisabledInp']) {
      this.isButtonDisabledFn =
        this.isButtonDisabledInp() ?? this.isButtonDisabled.bind(this);
    }
  }

  ngAfterViewInit() {
    const table = this.actyGridTableElement?.nativeElement;
    if (!table) return;

    this.headerCells.changes.subscribe(() => {
      if (this.headerCells.length > 0 && !this.isWidthInitialized) {
        this.initializeColumnWidths();
      }
    });

    const observer = new MutationObserver((mutations) => {
      const stickyChanged = mutations.some(m =>
        m.type === 'attributes' &&
        m.attributeName === 'class' &&
        (m.target as HTMLElement).classList.contains('mat-mdc-table-sticky')
      );

      if (stickyChanged) {
        this.syncStickyChildHeaders();
      }
    });

    observer.observe(table, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    });

    /* const thead = table.querySelector('thead');
    if (thead) {
      const headerObserver = new MutationObserver((mutations) => {
        const contentChanged = mutations.some(m =>
          m.type === 'childList' || // elements added/removed
          (m.type === 'characterData') // text content changed
        );

        if (contentChanged && this.isWidthInitialized) {
          // Reset flag so initializeColumnWidths runs again
          this.isWidthInitialized = false;
          this.initializeColumnWidths();
        }
      });

      headerObserver.observe(thead, {
        childList: true,
        subtree: true,
        characterData: true
      });
    } */

    this.updateScrollHeight();
  }

  private syncStickyChildHeaders(): void {
    if (!this.actyGridTableElement?.nativeElement) return;

    const table = this.actyGridTableElement.nativeElement;
    const headerRows = Array.from(
      table.querySelectorAll<HTMLElement>('tr.mat-mdc-header-row, tr.mat-header-row')
    );
    if (headerRows.length <= 1) return;

    const getCol = (el: HTMLElement): string | undefined =>
      Array.from(el.classList)
        .find(c => c.startsWith('mat-column-'))
        ?.replace('mat-column-', '');

    const getThWidth = (dataField: string): number =>
      table.querySelector<HTMLElement>(`th.mat-column-${dataField}`)?.offsetWidth ?? 0;

    const leftMap = new Map<string, number>();

    const calcChildLeft = (cols: any[], startLeft: number): void => {
      let cumulativeLeft = startLeft;
      cols.forEach(child => {
        leftMap.set(child.dataField, cumulativeLeft);
        if (child.childColumns?.length) calcChildLeft(child.childColumns, cumulativeLeft);
        cumulativeLeft += getThWidth(child.dataField);
      });
    };
    requestAnimFrame(() => {
      // Build left map from row 0 sticky th
      headerRows[0]
        .querySelectorAll<HTMLElement>('th.mat-mdc-table-sticky, th.mat-table-sticky')
        .forEach(th => {
          const col = getCol(th);
          const parentLeft = col ? parseFloat(th.style.left) : NaN;
          if (!col || isNaN(parentLeft)) return;

          const parentCol = this._dataGrid().find(c => c.dataField === col);
          if (!parentCol) return;

          leftMap.set(col, parentLeft);
          if (parentCol.childColumns?.length) calcChildLeft(parentCol.childColumns, parentLeft);
        });
      if (leftMap.size === 0) return;

      // Apply left to all th in subsequent header rows
      headerRows.slice(1).forEach(row =>
        row.querySelectorAll<HTMLElement>('th').forEach(th => {
          const col = getCol(th);
          if (!col) return;
          const left = leftMap.get(col);
          if (left !== undefined) {
            th.style.position = 'sticky';
            th.style.setProperty('left', `${left}px`);
          }
        })
      );
    });
  }

  ngOnDestroy(): void {
    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
  }

  public setGridData(list: any[], total: number, shouldResetRowSelection: boolean = true): void {
    this._dataList.set(list);
    this.modifyDataList(shouldResetRowSelection);
    this.updateScrollHeight();
  }

  resetGrid(): void {
    this.actyGridTable.renderRows();
    // --- Reset Data ---
    this.visibleDataList = new MatTableDataSource<any>([]);
    this.dataList.set([]);
    this._dataList.set([]);

    // --- Reset Signals ---
    this.isCellModeEnabled.set(false);
    this.selectedCells.set(new Set());
    this.gridFilter.set([]);
    this._dataGrid.set([]);
    this.isBackgroundLoadingOn.set(false);
    this.refScreenOnRowData.set({
      referenceScreenId: '',
      refRelations: [],
      rowId: -1,
      refForColumn: '',
      gridId: '',
      tabId: '',
      selectedValue: '',
    });
    this.invalidCellRowIds.set([]);

    // --- Reset UI State & Toggles ---
    this.gridOpsToggleState = 'inactive';
    this.showColumnSwapdialog = false;
    this.showSortDatadialog = false;
    this.showExportDatadialog = false;
    this.showGridOperationBtns = false;
    this.showDetailView = false;
    if (this.cachedColumnWidths) {
      this.cachedColumnWidths.clear();
    }

    // --- Reset Interaction State ---
    this.isCtrlPressed = false;
    this.isShiftPressed = false;
    this.isMouseDownOnCell = false;
    this.isDragged = false;
    this.currentResizing = null;

    // --- Reset Selection ---
    this.selection().clear();
    this.selectedData = [];
    this.copiedRows = [];

    // --- Reset Config/Metadata ---
    this.resetDefaultSelectedRow = null;
    this.primaryKeyColumns = []; // This might need to be preserved, depending on logic
    this.swapData = [];
    this.displayedColumns = [];
    this.editableMap = {};
    this.nextRowId = 1;
    this.isWidthInitialized = false;

    // --- Reset Sorting ---
    this.sortColumn = '';
    this.sortDirection = '';

    // --- Reset Save State ---
    this.saveList = {
      AddList: [],
      UpdateList: [],
      DeleteList: [],
    };

    if (this.actyGridTable) {
      this.actyGridTable.renderRows();
    }
  }

  private _dataGridSetup(dataGrid: GRID[]): void {
    // Create a deep clone to work with
    const dataGridClone = structuredClone(dataGrid);

    // Initialize filter states for each column and modify the clone
    let newGridFilters: ColumnFilterState[] = [];

    const addFilterState = (col: GRID) => {
      if (col.childColumns && col.childColumns.length > 0) {
        col.childColumns.forEach(addFilterState);
      } else {
        let defaultCondition: FilterCondition;
        if (col.editorType === '1') {
          defaultCondition = this.conditions_string[0].value as FilterCondition;
        } else if (col.editorType === '2') {
          defaultCondition = this.conditions_number[0].value as FilterCondition;
        } else if (col.editorType === '4' || col.editorType === '5' || col.editorType === '6' || col.editorType === '7') {
          defaultCondition = this.conditions_string[4].value as FilterCondition;
        } else {
          defaultCondition = this.conditions_date[0].value as FilterCondition;
        }

        newGridFilters.push({
          columnname: col.dataField,
          matchMode: 'all',
          rules: [{ condition: defaultCondition, value: '' }],
          editorType: col.editorType,
        });
      }
    };

    const modifiedColumns = dataGridClone.map((column) => {
      addFilterState(column);

      // Create a modified column object
      const modifiedColumn = { ...column };

      // Default set true for isSortable column in DataGrid
      if (modifiedColumn.IsSortable === undefined) {
        modifiedColumn.IsSortable = true;
      }

      // Default set true for isFilterable column in grid
      if (modifiedColumn.IsFilterable === undefined) {
        modifiedColumn.IsFilterable = true;
      }
      // Primary Key → Required (unless auto-generated)
      if (
        modifiedColumn.isPrimaryKey === true &&
        (modifiedColumn.isAutoGenerate == false ||
          modifiedColumn.isAutoGenerate == undefined)
      ) {
        modifiedColumn.isRequired = true;
      }

      // Set default alignment for input (for number align right and other all left)
      if (
        modifiedColumn.alignment === undefined ||
        modifiedColumn.alignment === null ||
        modifiedColumn.alignment === ''
      ) {
        modifiedColumn.alignment =
          modifiedColumn.editorType === '2' ? 'right' : 'left';
      }

      return modifiedColumn;
    });

    this.gridFilter.set([...this.gridFilter(), ...newGridFilters]);

    // Set _dataGrid only once with the fully modified columns
    if (this.addTotalColumn()) {
      const totalCol: GRID = {
        dataField: 'horizontalTotal',
        caption: 'CORE.GRID.TotalColumn',
        dbColName: '',
        tableName: '',
        editorType: '2',
        IsVisibleInGrid: true,
        IsVisibleInSearch: false,
        isEditable: false,
        IsSortable: false,
        IsFilterable: false,
        alignment: 'right',
      };
      modifiedColumns.push(totalCol);
    }

    this._dataGrid.set(modifiedColumns);

    this.columnDepthMap.clear();
    this.calculateColumnDepths(modifiedColumns);

    if (this.gridFormat() !== 'normal') {
      this.calculateTabularLayoutData(modifiedColumns);
    }

    this.displayedColumns = modifiedColumns
      .filter((col: GRID) => col.IsVisibleInGrid && !col.isGridIgnore)
      .sort(
        (a: GRID, b: GRID) =>
          (a.displayOrderForGrid ?? 999) - (b.displayOrderForGrid ?? 999),
      )
      .map((col: GRID) => col.dataField);

    if (this.isEditableGrid()) {
      this.editableMap = modifiedColumns.reduce(
        (acc, col: GRID) => {
          acc[col.dataField] = col.isEditable ?? false;
          return acc;
        },
        {} as { [key: string]: boolean },
      );
    }

    this.primaryKeyColumns = this.dataGrid()
      .filter(
        (col: GRID) => col.isPrimaryKey && col?.ignorePrimaryKeyinPC !== true,
      )
      .map((col: GRID) => col.dataField);

    this.generateColumnMaxLengthWidth();
  }

  private sortGridColumns(columns: GRID[]): GRID[] {
    return [...columns].sort((a: GRID, b: GRID) => {

      return (a.displayOrderForGrid ?? 999) - (b.displayOrderForGrid ?? 999);
    });
  }

  private calculateTabularLayoutData(columns: GRID[]): void {
    // Reset Caches
    this.cachedColumnGroups = [];
    this.cachedRowsByGroup.clear();
    this.cachedFieldsKeyMap.clear();

    const uniqueGroups = new Set<number>();
    const rowsMap = new Map<number, Set<number>>();

    columns.forEach((col) => {
      const isValidColumn = col.IsVisibleInGrid !== false && !col.isGridIgnore;

      if (isValidColumn && col.columnGroupNumber) {
        const gNo = Number(col.columnGroupNumber);
        const rNo = Number(col.rowIndex);

        if (!isNaN(gNo)) {
          // Track unique Group
          uniqueGroups.add(gNo);

          // Track unique Row for this Group
          if (!rowsMap.has(gNo)) {
            rowsMap.set(gNo, new Set<number>());
          }
          rowsMap.get(gNo)?.add(rNo);

          // Track Fields for this Row+Group combination
          // We create a unique string key "Group_Row" for fast lookup
          const mapKey = `${gNo}_${rNo}`;
          if (!this.cachedFieldsKeyMap.has(mapKey)) {
            this.cachedFieldsKeyMap.set(mapKey, []);
          }
          this.cachedFieldsKeyMap.get(mapKey)?.push(col);
        }
      }
    });

    // Finalize Arrays (Sort and Store)

    // Groups
    this.cachedColumnGroups = Array.from(uniqueGroups).sort((a, b) => a - b);
    if (this.cachedColumnGroups.length === 0) {
      this.cachedColumnGroups = [1];
    }

    // Rows per Group
    rowsMap.forEach((rowSet, groupNo) => {
      const sortedRows = Array.from(rowSet).sort((a, b) => a - b);
      this.cachedRowsByGroup.set(groupNo, sortedRows);
    });

    const allRowsSet = new Set<number>();

    rowsMap.forEach((rowSet) => {
      rowSet.forEach((row) => allRowsSet.add(row));
    });

    this.cachedAllRows = Array.from(allRowsSet).sort((a, b) => a - b);

    if (this.cachedAllRows.length === 0) {
      this.cachedAllRows = [1];
    }
  }

  setEditableMapList(dataGrid: GRID[]) {
    this.primaryKeyColumns = [];
    this.editableMap = {};
    // Create a deep clone to work with
    const dataGridClone = structuredClone(dataGrid);

    // Initialize filter states for each column and modify the clone
    let newGridFilters: ColumnFilterState[] = [];

    const addFilterState = (col: GRID) => {
      if (col.childColumns && col.childColumns.length > 0) {
        col.childColumns.forEach(addFilterState);
      } else {
        let defaultCondition: FilterCondition;
        if (col.editorType === '1') {
          defaultCondition = this.conditions_string[0].value as FilterCondition;
        } else if (col.editorType === '2') {
          defaultCondition = this.conditions_number[0].value as FilterCondition;
        } else if (col.editorType === '4' || col.editorType === '5' || col.editorType === '6' || col.editorType === '7') {
          defaultCondition = this.conditions_string[4].value as FilterCondition;
        } else {
          defaultCondition = this.conditions_date[0].value as FilterCondition;
        }

        newGridFilters.push({
          columnname: col.dataField,
          matchMode: 'all',
          rules: [{ condition: defaultCondition, value: '' }],
          editorType: col.editorType,
        });
      }
    };

    const modifiedColumns = dataGridClone.map((column) => {
      addFilterState(column);

      // Create a modified column object
      const modifiedColumn = { ...column };

      // Default set true for isSortable column in DataGrid
      if (modifiedColumn.IsSortable === undefined) {
        modifiedColumn.IsSortable = true;
      }

      // Default set true for isFilterable column in grid
      if (modifiedColumn.IsFilterable === undefined) {
        modifiedColumn.IsFilterable = true;
      }

      // Set default alignment for input (for number align right and other all left)
      if (
        modifiedColumn.alignment === undefined ||
        modifiedColumn.alignment === null ||
        modifiedColumn.alignment === ''
      ) {
        modifiedColumn.alignment =
          modifiedColumn.editorType === '2' ? 'right' : 'left';
      }

      return modifiedColumn;
    });

    this.gridFilter.set([...this.gridFilter(), ...newGridFilters]);

    if (this.isEditableGrid()) {
      this.editableMap = modifiedColumns.reduce(
        (acc, col: GRID) => {
          acc[col.dataField] = col.isEditable ?? false;
          return acc;
        },
        {} as { [key: string]: boolean },
      );
    }

    this.primaryKeyColumns = this.dataGrid()
      .filter((col: GRID) => col.isPrimaryKey)
      .map((col: GRID) => col.dataField);
  }

  // returns the name and display name for all columns(visible or not) for the grid
  gridColumnNameAndDisplayNameListAll(): any {
    return (
      this._dataGrid()
        .filter(({ isGridIgnore }: GRID) => isGridIgnore !== true)
        // This is Sort a Column Config Base on a displayOrderForGrid
        .sort((a: GRID, b: GRID) => {
          if (a.displayOrderForGrid == null && b.displayOrderForGrid == null)
            return 0;
          if (a.displayOrderForGrid == null) return 1;
          if (b.displayOrderForGrid == null) return -1;

          return a.displayOrderForGrid - b.displayOrderForGrid;
        })
        .map(({ dataField, caption }: GRID) => ({
          dataField,
          displayName: this.getColumnDisplayName(dataField),
        }))
    );
  }

  getColumnDisplayName(columnName: string): string {
    const column = this._dataGrid().find((c: GRID) => c.dataField === columnName);
    if (!column) return columnName;
    // For child columns, they have their own caption
    return column.caption ?? columnName;
  }

  getColumnConfig(columnName: string): GRID | undefined {
    return this._dataGrid().find((c: GRID) => c.dataField === columnName);
  }

  //get value of selected kbn in dropdown(mat-select)
  getKBNNmUsingKey(code: string | number, column: GRID): string | undefined {
    //return name from memberlist which is match with code
    const codeStr = String(code);
    return column?.memberList?.find(
      (item: any) => String(item.code) === codeStr,
    )?.caption;
  }

  //in which tab show column in tabcontrol
  isColumnInDetailViewTab(columnName: string, tabCaption: string): boolean {
    //get column all value from _dataGrid which is match with columnName
    const column = this._dataGrid().find(
      (col: GRID) => col.dataField === columnName,
    );
    if (column?.tabGroup === undefined || column?.tabGroup === null)
      return false;
    //column tabGroup match with TabName,return ture or false
    return column.tabGroup.tabCaption === tabCaption;
  }

  //get column span size from for detailview
  getSizeofSpan(columnName: string) {
    const column = this._dataGrid().find(
      (col: GRID) => col.dataField === columnName,
    );
    //when column not define tabGroup then return null
    if (column?.tabGroup === undefined) return null;
    //return colspan of column(number)
    return column?.tabGroup.colSpan ?? 1;
  }

  // Get a Table Name For max-length directive
  getTableNameByColumn(column: GRID): string {
    return column?.tableName ?? '';
  }

  isSelectedCell(rowIndex: number, columnName: string): boolean {
    // return this.selectedCells().has(`${rowIndex}-${columnName}`);
    const key = `${rowIndex}-${columnName}`;
    const result = this.selectedCells().has(`${rowIndex}-${columnName}`);

    return result;
  }
  // Clear all selected cells and emit empty selection
  private clearSelection(): void {
    this.selectedCells.set(new Set());
    this.lastSelectedCell = null;
  }

  onCellClickedFocusInTabularGrid(
    event: MouseEvent,
    rowid: number,
    columnName: string,
  ) {
    if (event.defaultPrevented) return;
    // --- Focus Logic ---
    // Only proceed if we found a valid column AND the row is selected
    const target = event.target as HTMLElement;
    const cell = target.closest('td');
    requestAnimationFrame(() => {
      if (columnName && this.selection().isSelected(rowid)) {
        const clickedGridId = cell
          ?.querySelector('[grid-id]')
          ?.getAttribute('grid-id');
        // Precise Selector:
        // Find the specific ROW -> Find the specific COMPONENT -> Find the INPUT
        if (clickedGridId !== undefined) {
          const selector = `tr[data-row-id="${rowid}"] [data-col="${columnName}"][grid-id="${clickedGridId}"] input`;
          const inputElement = document.querySelector(selector) as HTMLElement;
          inputElement?.focus();
        }
      }
    });
  }

  /**
   * Handles multiple cases when a cell is clicked. Cases like select call and if shift is presses then select all cells in between previous and current selected cell
   * and if ctrl is pressed then toggle the selection for that cell
   * @param rowData
   * @param column
   * @param rowIndex
   * @param event
   * @returns
   */
  onCellClick(
    rowData: GRID,
    column: GRID,
    rowIndex: number,
    event: MouseEvent,
  ): void {
    event.stopPropagation();
    if (!this.isCellModeEnabled()) {
      this.clearSelection();
      return;
    }

    const cellKey: string = `${rowIndex}-${column.dataField}`;
    let currentSelectedCells: Set<string> = new Set(this.selectedCells());

    //This condition is for the press shift kry then click to select multiple cells
    if (this.isShiftPressed) {
      // Shift + Click: Select range of cells
      if (this.lastSelectedCell) {
        const startRow: number = Math.min(
          this.lastSelectedCell!.rowIndex,
          rowIndex,
        );
        const endRow: number = Math.max(
          this.lastSelectedCell!.rowIndex,
          rowIndex,
        );
        const startColumn: number =
          this._dataGrid().find(
            (col: GRID) =>
              col.dataField === this.lastSelectedCell!.column.dataField,
          )?.displayOrderForGrid ?? 0;
        const endColumn: number = column?.displayOrderForGrid ?? -1;

        for (let r: number = startRow; r <= endRow; r++) {
          for (
            let c: number = Math.min(startColumn, endColumn);
            c <= Math.max(startColumn, endColumn);
            c++
          ) {
            const columnByOrder = this._dataGrid().find(
              (col) => col.displayOrderForGrid === c,
            );
            const rangeCellKey = `${r}-${columnByOrder?.dataField}`;
            currentSelectedCells.add(rangeCellKey);
          }
        }
      }
    } else if (this.isCtrlPressed) {
      // Ctrl + Click: Multi-select
      currentSelectedCells.has(cellKey)
        ? currentSelectedCells.delete(cellKey)
        : currentSelectedCells.add(cellKey);
    } else {
      // Normal Click: Select single cell
      currentSelectedCells.clear();
      currentSelectedCells.add(cellKey);
    }

    if (!this.isShiftPressed) {
      // Store last selected cell
      this.lastSelectedCell = { rowIndex, column: column };
    }

    // Mark that the mouse is down on a valid cell
    this.isMouseDownOnCell = true;

    this.updateSelection(currentSelectedCells, rowData, column);
  }

  // Update selection and emit related events
  private updateSelection(
    newSelection: Set<string>,
    rowData: any,
    column: GRID,
  ): void {
    this.selectedCells.set(newSelection);
  }

  /**
   * Event triggers when cursor enters the cell area.
   * Used to drag select the cells when mouse is clicked.
   * @param rowIndex
   * @param columnName
   * @returns
   */
  onCellMouseEnter(rowIndex: number, column: GRID): void {
    if (this.isMouseDownOnCell) {
      const lastCell = this.lastSelectedCell;
      if (!lastCell) return;

      const startRow: number = Math.min(lastCell.rowIndex, rowIndex);
      const endRow: number = Math.max(lastCell.rowIndex, rowIndex);
      const startColumn: number =
        this._dataGrid().find(
          (col: GRID) => col.dataField === lastCell.column.dataField,
        )?.displayOrderForGrid ?? -1;
      const endColumn: number = column.displayOrderForGrid ?? -1;

      let newSelectedCells: Set<string> = new Set<string>();

      // Select only the cells within the drag range
      for (let r: number = startRow; r <= endRow; r++) {
        for (
          let c: number = Math.min(startColumn, endColumn);
          c <= Math.max(startColumn, endColumn);
          c++
        ) {
          newSelectedCells.add(
            `${r}-${this._dataGrid().find(
              (col: GRID) => col.displayOrderForGrid === c,
            )?.dataField ?? ''
            }`,
          );
        }
      }

      // Update selected cells and emit changes
      this.selectedCells.set(newSelectedCells);
      this.isDragged = true;
    }
  }

  /**
   * To copy the selected cell values in tab-separated format
   * @returns
   */
  private copySelectedCellsToClipboard(): void {
    if (this.selectedCells().size === 0) return;

    // Format data as tab-separated values (for Excel-like pasting)
    const selectedValues: any = this.selectedValues();
    let clipboardData: string = '';

    // Group values by row (for multi-cell selection)
    const rows: Map<number, any[]> = new Map<number, any[]>();

    selectedValues.forEach((cell: any) => {
      const rowIndex: number = Number(cell.row); // Ensure correct row reference
      if (!rows.has(rowIndex)) {
        rows.set(rowIndex, []);
      }

      let cellValue: any = cell.value;

      // If the data type is '3', format it as yyyy/mm/dd
      if (cell.dataType === '3' && cellValue instanceof Date) {
        const year: number = cellValue.getFullYear();
        const month: string = String(cellValue.getMonth() + 1).padStart(2, '0');
        const day: string = String(cellValue.getDate()).padStart(2, '0');
        cellValue = `${year}/${month}/${day}`;
      }

      // If the data type is '4', match key from memberList
      if (cell.dataType === '4') {
        const matchedItem: { key: string; value: string } =
          cell.memberList.find(
            (item: { key: string; value: string }) =>
              item.key === String(cellValue),
          );
        if (matchedItem) {
          cellValue = matchedItem.value;
        }
      }

      rows.get(rowIndex)!.push(cellValue);
    });

    // Convert to TSV format with new line when row changes
    rows.forEach((rowValues) => {
      clipboardData += rowValues.join('\t') + '\n';
    });

    // Copy to clipboard
    navigator.clipboard.writeText(clipboardData.trim());
  }

  onSortDataChange(): void {
    // set little timeout for loader as sort data component will emit a false value for loading
    setTimeout(() => {
      if (this.getDataUrl() !== '') {
        this.getData();
      } else {
        this.triggerGetdata.emit();
      }
    }, 50);
  }

  // returns the name and display name for visible columns in the grid
  gridColumnNameAndDisplayNameList(): any {
    const result: any[] = [];

    const getLeafColumns = (column: GRID): GRID[] => {
      if (column.isGridIgnore) return [];

      const hasChildren =
        Array.isArray(column.childColumns) && column.childColumns.length > 0;

      if (hasChildren) {
        let leafs: GRID[] = [];
        column.childColumns!.forEach(child => {
          leafs.push(...getLeafColumns(child));
        });
        return leafs;
      }
      return column.IsVisibleInGrid ? [column] : [];
    };

    // process full grid
    this._dataGrid().forEach((col: GRID) => {
      const leafColumns = getLeafColumns(col);
      leafColumns.forEach((leaf: GRID) => {
        result.push({
          dataField: leaf.dataField,
          caption: this.translate.instant(leaf.caption),
          dateFormat: leaf.dateFormat ? leaf.dateFormat : 'yyyy/MM/dd',
        });
      });
    });

    return result;
  }

  //get list of tab name
  get DetailViewTabList() {
    return this.detailViewTab().map((item) => ({
      label: item.tabCaption,
      hidden: false,
      disabled: false,
    }));
  }

  //get column is sortable or not(return boolean)
  isSortable(column: GRID): boolean {
    return column?.IsSortable !== undefined ? column.IsSortable : false;
  }

  //get column is filterable or not(return boolean)
  isFilterable(column: GRID): boolean {
    return column?.IsFilterable !== undefined ? column.IsFilterable : false;
  }

  onEditChange(row: any, column: string, value: any) {
    row[column] = value;
    const config = this.getColumnConfig(column);
    config?.onChangeCallback?.(row);
  }

  //gird button is disable or not
  isButtonDisabled(nameOfBtn: any): boolean {
    //paste row button is disable whenever any row is not copy
    if (nameOfBtn.btnId === 'fw_GRID_PasteRow') {
      /*if (this.selectedData.length !== 0) return false;
      else*/ return false;
    }
    if (
      nameOfBtn.btnId === 'fw_GRID_DeleteRow' ||
      nameOfBtn.btnId === 'fw_GRID_CopyRow' ||
      nameOfBtn.btnId === 'fw_GENERAL_CopyData' ||
      nameOfBtn.btnId === 'fw_GENERAL_EditData'
    ) {
      return !this.selection().hasValue();
    } else if (
      nameOfBtn.btnId === 'fw_GENERAL_DetailData' ||
      nameOfBtn.btnId === 'fw_GENERAL_EditData' ||
      nameOfBtn.btnId === 'fw_GRID_DetailView'
    ) {
      return !this.selection().hasValue();
    } else return false; //default disable false
  }

  //which button is click of gird
  buttonClicked(nameOfButton: string) {
    //emit when button is clicked
    if (!this.letParentMaintainButtonClicks()) {
      if (nameOfButton === 'fw_GRID_AddRow') this.addNewRow();
      if (nameOfButton === 'fw_GRID_PasteRow') this.pasteRowsFromClipboard();
      if ('fw_GRID_ExportData' === nameOfButton) {
        const data = this.currPkData();
        const isOpenDialog =
          data === null ||
          (data !== null &&
            Object.values(data).some((v) => v !== null && v !== undefined));
        if (isOpenDialog) {
          this.requestFilterValue.emit();
          this.openExportDataDialog();
        }
      }
      if (nameOfButton === 'fw_GENERAL_SaveBtn') this.saveData();
    }
    if (nameOfButton === 'fw_GRID_CopyRow') this.copyRowsToClipboard();
    if (nameOfButton === 'fw_GRID_DetailView') this.detailViewToggle();
    if (nameOfButton === 'fw_GRID_DeleteRow') this.deleteRowData();
    if (nameOfButton === 'fw_GRID_FilterReset') this.resetGridFilter();
    //2026/01/12 - changed the copy paste functions to function using clipboard. Old functions are as it is.
    if ('fw_GRID_SwapColumns' === nameOfButton) this.openColumnSwapDialog();
    if ('fw_GRID_SortData' === nameOfButton) this.openSortDataDialog();
    this.onButtonClicked.emit({
      type: 'button',
      normalButtonData: nameOfButton,
    });
  }

  onClickToggleBtn(event: any, btnName: string) {
    if (!this.letParentMaintainButtonClicks()) {
      if (btnName === 'fw_GRID_GridFilterSort') {
        this.onGridOpsToggle(event);
      }
    }
    this.onButtonClicked.emit({
      type: 'toggleButton',
      toggleButtonData: { btnId: btnName, state: event },
    });
  }
  onGridOpsToggle(state: 'active' | 'inactive'): void {
    this.showGridOperationBtns = state === 'active';
    this.initializeColumnWidths();
  }

  //extra button click of gird
  extraButtonClicked(btnId: string, menu?: any) {
    if (!this.letParentMaintainButtonClicks()) {
      // if (btnId === 'fw_GRID_TableOptions') {
      //   this.onTableOptionsClick(menu);
      // } else
      if (btnId === 'fw_GRID_CellSummaryBtn') {
        this.getCellSummaryPosition();
        this.selectedCellSummary.set(menu);
      }
    }
    this.onButtonClicked.emit({
      type: 'menuAndSpiltButton',
      menuAndspiltButtonData: {
        btnId: btnId,
        menuButtonId: menu?.menuId ?? menu?.label ?? menu,
      },
    });
  }

  //get column is sticky or not
  getColumnisSticky(column: GRID): boolean {
    return column.isFrozen === true || this.hasAnyFrozenAncestor(column.dataField, this._dataGrid());
  }

  private hasAnyFrozenAncestor(dataField: string, cols: GRID[]): boolean {
    for (const col of cols) {
      const children = col.childColumns ?? [];
      if (children.some(c => c.dataField === dataField)) {
        if (col.isFrozen === true) return true;
        return this.hasAnyFrozenAncestor(col.dataField, this._dataGrid());
      }
      // Search deeper childs
      if (children.length) {
        if (this.hasAnyFrozenAncestor(dataField, children)) return true;
      }
    }
    return false;
  }

  //when click on Save Dialog
  async onSwapDataUpdate(newSwapData: Array<SwapColumns>): Promise<void> {
    this.swapData = newSwapData;
    await this.getSwapColumnData(this._dataGrid());
    this.showColumnSwapdialog = false;
    this.initializeColumnWidths();
    // 2025/11/14 - commented because renderRows can sometimes gives error when matTable is processing dataSource
    //this.actyGridTable.renderRows();
  }

  //when close the dialig
  closeSwapColumn(): void {
    this.showColumnSwapdialog = false;
  }

  closeSortData(): void {
    this.showSortDatadialog = false;
  }

  closeExportData(): void {
    this.showExportDatadialog = false;
  }

  openColumnSwapDialog() {
    this.showColumnSwapdialog = true;
  }

  openSortDataDialog() {
    this.showSortDatadialog = true;
  }

  openExportDataDialog() {
    this.showExportDatadialog = true;
  }

  /**
   * get the column swap data from db
   */
  async getSwapColumnData(dataGrid: GRID[]): Promise<void> {
    try {
      this.swapData = await this.swapColumnService.getSwapDataOfForm(
        this.userId(),
        this.formId(),
        this.gridId(),
      );

      // Data fetched successfully, now update the grid
      await this.updateGridSwapData(dataGrid);
    } catch (error) {
      // Fallback: Setup grid with raw data if DB fetch fails
      this._dataGridSetup(dataGrid);
    }
  }

  /**
   * Applies this.swapData() to current grid
   */
  async updateGridSwapData(dataGrid: GRID[]): Promise<void> {
    // Use structuredClone to create a deep copy to avoid mutating the signal directly
    const originalGrid = structuredClone(dataGrid);
    const swapData = this.swapData;

    // If no swap data exists, setup with original grid
    if (!swapData || swapData.length === 0) {
      this._dataGridSetup(originalGrid);
      return;
    }

    // Map: Create new objects with updated properties based on swapData
    const updatedGrid = originalGrid.map((gridItem) => {
      const match = swapData.find((s) => s.colnm === gridItem.dataField);

      if (match) {
        return {
          ...gridItem,
          displayOrderForGrid: match.dispcolno,
          isFrozen: match.frozen === '1', // compare with '1' for true
          IsVisibleInGrid: match.visible === '1', // compare with '1' for true
        };
      }
      return gridItem;
    });

    // Sort: Frozen columns first, then by displayOrderForGrid
    updatedGrid.sort((a, b) => {
      if (a.isFrozen !== b.isFrozen) {
        return a.isFrozen ? -1 : 1; // Frozen items bubble to top
      }
      return (a.displayOrderForGrid ?? 0) - (b.displayOrderForGrid ?? 0);
    });
    // Final Setup
    this._dataGridSetup(updatedGrid);
    this.displayColumnList();
  }

  displayColumnList() {
    this.displayedColumns = [];
    this.displayedColumns = this._dataGrid()
      .filter((item: GRID) => item.IsVisibleInGrid === true)
      .map((item: GRID) => item.dataField);
  }

  resetDataList() {
    this.dataList.set([]);
    this.visibleDataList.data = [];
    this._dataList.set([]);
  }

  modifyDataList(shouldResetRowSelection: boolean = true) {
    let startRow: any;
    if (this.paginator) {
      startRow = this.paginator.pageIndex * this.paginator.pageSize + 1;
    } else {
      startRow = 1;
    }

    let currentList = this._dataList();

    if (this.entryScreenMode() === 'Copy' && currentList !== undefined && Array.isArray(currentList)) {
      currentList = currentList.map((row: any) => {
        const newRow = { ...row };
        this.dataGrid().forEach((col: GRID) => {
          if (col.isAutoGenerate) {
            newRow[col.dataField] = null;
          } else if (col.useValueWhenCopy && col.useValueWhenCopy !== 'copiedDataValue') {
            const copyValueKey = col.useValueWhenCopy as keyof GRID;
            newRow[col.dataField] = col[copyValueKey];
          }
        });
        newRow._isNew = true;
        return newRow;
      });
    }

    //assigning a unique rowid to every row and also changing data format of date columns
    const updatedList = currentList?.map((item) => ({
      ...item,
      rowid: startRow++,
    }));

    if (this.addTotalColumn() && updatedList && updatedList.length > 0) {
      updatedList.forEach((row) => {
        let hSum = 0;
        this._dataGrid().forEach((col) => {
          if (
            col.editorType === '2' &&
            col.dataField !== 'horizontalTotal' &&
            !col.isGridIgnore
          ) {
            const val = row[col.dataField];
            if (
              val !== null &&
              val !== undefined &&
              val !== '' &&
              !isNaN(Number(val))
            ) {
              hSum += Number(val);
            }
          }
        });
        row['horizontalTotal'] = hSum;
      });
    }

    if (this.addTotalRow() && updatedList && updatedList.length > 0) {
      const totalRowInfo: any = { isTotalRow: true };
      this._dataGrid().forEach((col) => {
        if (col.editorType === '2' && col.dataField) {
          let sum = 0;
          updatedList.forEach((row) => {
            const val = row[col.dataField];
            if (
              val !== null &&
              val !== undefined &&
              val !== '' &&
              !isNaN(Number(val))
            ) {
              sum += Number(val);
            }
          });
          totalRowInfo[col.dataField] = sum;
        } else {
          totalRowInfo[col.dataField] = null;
        }
      });
      totalRowInfo.rowid = startRow++;
      updatedList.push(totalRowInfo);
    }
    this.nextRowId = startRow;
    this._dataList.set(structuredClone(updatedList));
    this.dataList.set(structuredClone(updatedList));

    this.visibleDataList.data = updatedList;

    // Update default values for the reference screen when the row is not editable
    const currentTabId = this.tabId();
    const currentGridId = this.gridId();
    if (updatedList && updatedList.length && currentTabId && currentGridId) {
      for (const row of updatedList) {
        this.updateRefScreenDefaultValue(row, currentTabId, currentGridId);
      }
    }

    if (this.isAllDataLoad()) {
      this.visibleDataList = new MatTableDataSource<any>(
        structuredClone(this.applyFilter(updatedList)),
      );
      this.sortData(this.sortColumn, false);
    }

    this.initializeColumnWidths();
    if (shouldResetRowSelection) {
      this.resetRowSelection();
    }

    if (this.isAllDataLoad()) {
      if (this.showPaginator()) {
        this.visibleDataList.paginator = this.paginator;
        this.buttonWrapper?.recalculateVisibility();
      }
    }

    this.visibleDataList.data.forEach((rowData) => {
      this.dataGrid().forEach((col) => {
        if (col?.editorType !== '5') {
          const rowChangeObj = {
            row: rowData,
            column: col,
            dataGrid: this.dataGrid()
          };

          this.onCellFocusChange.emit(rowChangeObj);
        }
      })
    })
  }

  offSet = 0;
  async getData(afterSave: boolean = false): Promise<void> {
    if (!afterSave) {
      const result = await this.confirmChanges();

      if (result.proceed === false) {
        return;
      }
    }

    if (!this.isAllDataLoad()) {
      if (this.isSaveFromPaginator) {
        this.isSaveFromPaginator = false;
        return;
      }
    }

    this.loader.increment(this.formLoaderKey());
    // Done need to reset as we are calling modifyDataList method regardless of data found.
    //this.resetDataList();
    // Clear a Cell When New Data Load
    this.selectedCells().clear();

    let GridEditorType: any = '';

    this.gridFilter().forEach((filterState) => {
      if (!filterState?.rules?.length) return;

      const rules = filterState.rules
        .filter((r) => r?.value?.length > 0)
        .map((r) => ({
          Value: r.value,
          Type: this.conditionOperatorMap[r.condition?.toLowerCase()] || 0,
        }));

      if (
        filterState.editorType == '5' ||
        filterState.editorType == '6' ||
        filterState.editorType == '7'
      ) {
        GridEditorType = '4';
      } else if (filterState.editorType == '8') {
        GridEditorType = '1';
      } else {
        GridEditorType = filterState.editorType;
      }
      if (rules.length > 0) {
        this.filterObj[filterState.columnname] = {
          MatchType: this.matchModeMap[filterState.matchMode],
          Rules: rules,
          InputType: Number(GridEditorType),
        };
      }
    });

    if (this.isAllDataLoad()) {
      return new Promise((resolve, reject) => {
        this.service
          .getDataOfPage(
            this.searchList() ? this.searchList() : [],
            this.userId(),
            this.formId(),
            this.getDataUrl(),
            0,
            this.showPaginator() ? this.paginator.pageSize : null,
            this.additionalSearchData(),
            { [this.apiObjectName()]: this.gridId() },
          )
          .subscribe({
            next: (res) => {
              let dataCount: number = 0;
              if (res.Messagecode === null && res.Message === null) {
                this._dataList.set(res.Data[this.apiObjectName()]);
                dataCount = this._dataList().length;
                this.modifyDataList();
                this.hasInitialLoad.set(true);
                //this.updateScrollHeight();
                //this.updateGridData(res);
              } // TODO add proper message code
              else if (res.Messagecode === 'COM_I0005') {
                this._dataList.set([]);
                this.modifyDataList();
                notify({ message: 'MESSAGE.COM_I0001' });
              }
              this.loader.decrement(this.formLoaderKey());
              //this.offSet = 0;
              // no need to search for more data if first round gives less than page rows
              // this check is needed for reference selection without dialog opening and also it is efficient
              if (
                this.showPaginator() &&
                dataCount >= this.paginator.pageSize
              ) {
                //send request for remaining data
                this.fetchRemainingData(this.getDataUrl())
                  .then(() => {
                    resolve();
                    this.resetDefaultSelectedRow = null;
                  })
                  .catch((err) => {
                    // always pass err object in reject as it does console.error
                    // which makes a toast from toast-error.service and http errors are skipped
                    reject(err);
                  });
              } else {
                resolve();
                this.resetDefaultSelectedRow = null;
              }
            },
            error: (err) => {
              //set loading to false to hide the loader at the time of end of data fetch
              this.loader.decrement(this.formLoaderKey());
              // always pass err object in reject as it does console.error
              // which makes a toast from toast-error.service and http errors are skipped
              reject(err);
            },
          });
      });
    } else {
      if (this.isParentChild()) {
        this.parentChildGetData.emit({
          pageSize: this.paginator.pageSize,
          pageIndex: this.paginator.pageIndex,
          sortType: this.sortDirection,
          sortColumn: this.sortColumn,
          gridFilters: this.filterObj,
          previousPageIndex: 0,
        });
      } else {
        if (this.getDataUrl()) {
          return new Promise((resolve, reject) => {
            this.service
              .getDataOfPage(
                this.searchList() ? this.searchList() : [],
                this.userId(),
                this.formId(),
                this.getDataUrl(),
                this.paginator
                  ? this.paginator.pageIndex * this.paginator.pageSize
                  : 0,
                this.showPaginator() ? this?.paginator.pageSize : null,
                this.additionalSearchData(),
                { [this.apiObjectName()]: this.gridId() },
                this.sortDirection,
                this.sortColumn,
                this.filterObj,
              )
              .subscribe({
                next: (res) => {
                  let dataCount: number = 0;
                  if (res.Messagecode === null && res.Message === null) {
                    this.updateGridData(res);
                    this.hasInitialLoad.set(true);
                  } // TODO add proper message code
                  else if (res.Messagecode === 'COM_I0005') {
                    this._dataList.set([]);
                    this.modifyDataList();
                    notify({ message: 'MESSAGE.COM_I0001' });
                  }
                  this.loader.decrement(this.formLoaderKey());
                  this.offSet = 0;
                  // no need to search for more data if first round gives less than page rows
                  // this check is needed for reference selection without dialog opening and also it is efficient
                  if (
                    this.showPaginator() &&
                    dataCount >= this.paginator.pageSize
                  ) {
                    //send request for remaining data
                  } else {
                    resolve();
                    this.resetDefaultSelectedRow = null;
                  }
                },
                error: (err) => {
                  //set loading to false to hide the loader at the time of end of data fetch
                  this.loader.decrement(this.formLoaderKey());
                  // always pass err object in reject as it does console.error
                  // which makes a toast from toast-error.service and http errors are skipped
                  reject(err);
                },
              });
          });
        } else {
          this.entryGetData.emit({
            pageSize: this.paginator.pageSize,
            pageIndex: this.paginator.pageIndex,
            sortType: this.sortDirection,
            sortColumn: this.sortColumn,
            gridFilters: this.filterObj,
            previousPageIndex: 0,
          });
        }
      }
    }
  }

  async fetchRemainingData(formGetUrl: string): Promise<void> {
    this.isBackgroundLoadingOn.set(true);

    let GridEditorType: any = '';

    this.gridFilter().forEach((filterState) => {
      if (!filterState?.rules?.length) return;

      const rules = filterState.rules
        .filter((r) => r?.value?.length > 0)
        .map((r) => ({
          Value: r.value,
          Type: this.conditionOperatorMap[r.condition?.toLowerCase()] || 0,
        }));

      if (
        filterState.editorType == '5' ||
        filterState.editorType == '6' ||
        filterState.editorType == '7'
      ) {
        GridEditorType = '4';
      } else if (filterState.editorType == '8') {
        GridEditorType = '1';
      } else {
        GridEditorType = filterState.editorType;
      }
      if (rules.length > 0) {
        this.filterObj[filterState.columnname] = {
          MatchType: this.matchModeMap[filterState.matchMode],
          Rules: rules,
          InputType: Number(GridEditorType),
        };
      }
    });

    if (this.isAllDataLoad()) {
      return new Promise((resolve, reject) => {
        this.service
          .getDataOfPage(
            this.searchList() ? this.searchList() : [],
            this.userId(),
            this.formId(),
            this.getDataUrl(),
            this.paginator.pageSize,
            null,
            this.additionalSearchData(),
            { [this.apiObjectName()]: this.gridId() },
            this.sortDirection,
            this.filterObj,
          )
          .subscribe({
            next: (res) => {
              if (res.Messagecode === null && res.Message === null) {
                const completeData = this.dataList().concat(
                  res.Data[this.apiObjectName()],
                );
                this._dataList.set(completeData);
                this.modifyDataList(false);
              }
              this.isBackgroundLoadingOn.set(false);
              resolve();
            },
            error: (err) => {
              this.isBackgroundLoadingOn.set(false);
              // always pass err object in reject as it does console.error
              // which makes a toast from toast-error.service and http errors are skipped
              reject(err);
            },
          });
      });
    } else {
      if (this.getDataUrl()) {
        return new Promise((resolve, reject) => {
          this.service
            .getDataOfPage(
              this.searchList() ? this.searchList() : [],
              this.userId(),
              this.formId(),
              this.getDataUrl(),
              this.paginator.pageIndex * this.paginator.pageSize,
              this.paginator.pageSize,
              this.additionalSearchData(),
              { [this.apiObjectName()]: this.gridId() },
              this.sortDirection,
              this.sortColumn,
              this.filterObj,
            )
            .subscribe({
              next: (res) => {
                if (res.Messagecode === null && res.Message === null) {
                  this._dataList.set(res.Data[this.apiObjectName()]);
                  this.dataList.set(res.Data[this.apiObjectName()]);
                  this.modifyDataList(false);
                  this.paginator.length =
                    res?.Data?.[`TotalData_${this.apiObjectName()}`] ?? 0;
                  this.paginatorValues.set({
                    TotalData: res?.Data?.[`TotalData_${this.apiObjectName()}`],
                  });
                }
                this.isBackgroundLoadingOn.set(false);
                resolve();
              },
              error: (err) => {
                this.isBackgroundLoadingOn.set(false);
                // always pass err object in reject as it does console.error
                // which makes a toast from toast-error.service and http errors are skipped
                reject(err);
              },
            });
        });
      }
    }
  }

  updateScrollHeight(): void {
    if (this.isParentChildHorizontalSplitter() || !this.isParentChild()) {
      this.ngZone.runOutsideAngular(() => {
        // rAF is needed for entry screen switch tab cases.
        // It needs a stable animation frame to get the parent element height
        requestAnimationFrame(() => {
          const parentDiv = this.host.nativeElement
            .parentElement as HTMLElement;
          const parentDivHeight = parentDiv?.offsetHeight || 0;

          const paginationHeight =
            this.paginatorContainer?.nativeElement.offsetHeight || 0;

          const detailViewHeight =
            this.detailViewContainer?.nativeElement.offsetHeight || 0;

          // Calculate available height dynamically
          let availableHeight =
            parentDivHeight - paginationHeight - detailViewHeight;

          const scrollHeight: string = `${availableHeight}px`;

          const tableContainer = this.tableContainer?.nativeElement;
          if (tableContainer) {
            if (availableHeight > 8) {
              tableContainer.style.display = '';
              tableContainer.style.height = scrollHeight;
              tableContainer.style.maxHeight = scrollHeight;
            } else {
              tableContainer.style.display = 'none';
            }
          }
        });
      });
    }
  }

  get renderedColumns(): string[] {
    if (this.gridFormat() === undefined) {
      return [];
    }
    if (this.gridFormat() === 'normal') {
      const grid = this._dataGrid();
      const columns: string[] = ['no'];
      // Add multiselect after no (or after 'no' if no status)
      if (this.selectionMode() === 'multiple') {
        columns.push('select');
      }

      // Recursive function to get all leaf columns
      const getLeafColumns = (column: GRID): string[] => {
        if (column.isGridIgnore || !column.IsVisibleInGrid) {
          return [];
        }

        if (!column.childColumns || column.childColumns.length === 0) {
          return [column.dataField];
        } else {
          const leafColumns: string[] = [];
          column.childColumns.forEach((child: GRID) => {
            leafColumns.push(...getLeafColumns(child));
          });
          return leafColumns;
        }
      };

      // displayedColumns contains parent names, so find them in _dataGrid()
      grid.forEach(parentColumn => {
        const leafColumns = getLeafColumns(parentColumn);
        columns.push(...leafColumns);
      });

      if (this.isActionsVisible()) {
        columns.push('actions');
      }

      return columns;
    } else {
      //for the tabular grid
      const columns = ['no', 'tabularData'];
      if (this.selectionMode() === 'multiple') {
        //insert select as second column when selection mode is multiple
        columns.splice(1, 0, 'select');
      }

      if (this.isActionsVisible()) {
        columns.push('actions');
      }
      return columns;
    }
  }

  handleRowClick(event: MouseEvent, row: any): void {
    // Find the Column Name
    // We look for the parent TD (cell), then find the data-col inside it.
    const target = event.target as HTMLElement;
    const cell = target.closest('td');
    const clickedCol = cell
      ?.querySelector('[data-col]')
      ?.getAttribute('data-col');
    const clickedGridId = cell
      ?.querySelector('[grid-id]')
      ?.getAttribute('grid-id');

    if (event.defaultPrevented) return;

    // --- Selection Logic ---
    const isSelected = this.selection().isSelected(row.rowid);
    //when row is not seleted
    if (!isSelected) {
      if (this.selectionMode() === 'single') {
        if (!isSelected) this.selection().toggle(row.rowid);
      } else {
        this.selection().toggle(row.rowid);
      }
      this.SelecteChange.emit(this.selectedRows);
    } else {
      if (!clickedCol) return;
      //when row selected and click on cells when it is editable then not row toggle but when not row is editable then that is deSeleted
      const isPrimaryColumn = this.primaryKeyColumns.some(
        (item) => item === clickedCol,
      );
      if (
        this.editableMap[clickedCol] !== true ||
        (isPrimaryColumn && row?._isNew !== true)
      ) {
        if (this.selectionMode() !== 'single') {
          this.selection().toggle(row.rowid);
          this.SelecteChange.emit(this.selectedRows);
        }
      }
    }

    if (this.gridFormat() === 'normal') {
      // --- Focus Logic ---
      // Only proceed if we found a valid column AND the row is selected
      if (
        clickedGridId !== undefined &&
        clickedCol &&
        this.selection().isSelected(row.rowid)
      ) {
        setTimeout(() => {
          // Precise Selector:
          // Find the specific ROW -> Find the specific COMPONENT -> Find the INPUT
          const selector = `tr[data-row-id="${row.rowid}"] [data-col="${clickedCol}"][grid-id="${clickedGridId}"] input`;
          const inputElement = document.querySelector(selector) as HTMLElement;

          inputElement?.focus();
        });
      }
    }
  }

  //when row is selected
  onRowDoubleClick(row: any): void {
    this.doubleClickedRow.emit(row);
    // You can now perform actions with the double-clicked row data
  }

  //when click on detailview button then show detailview container
  detailViewToggle() {
    this.showDetailView = !this.showDetailView;
    this.updateScrollHeight();
  }

  onCheckboxChangeOfMultiSelection(
    rowId: number,
    checked: boolean | { parent: boolean; children: any[] },
  ): void {
    if (typeof checked === 'boolean') {
      if (checked) {
        this.selectRow(rowId);
      } else {
        this.selection().deselect(rowId);
      }
    }
    this.SelecteChange.emit(this.selectedRows);
  }

  toggleAllRows(checked: boolean | { parent: boolean; children: any[] }): void {
    if (typeof checked === 'boolean') {
      if (!checked) {
        if (this.isAllSelected()) {
          this.selection().clear();
        }
      } else {
        this.selectRow(this.visibleDataList.data.map((row) => row.rowid));
      }
      this.SelecteChange.emit(this.selectedRows);
    }
    // 2025/11/14 - commented because renderRows can sometimes gives error when matTable is processing dataSource
    //this.actyGridTable.renderRows();
  }

  isAllSelected(): boolean {
    return (
      this.selection().selected.length === this.visibleDataList.data.length
    );
  }

  addNewRow(): void {
    // ------------------------- CREATE NEW ROW -------------------------
    const newRowData = this._dataGrid()
      //commented because needed to set hidden columns like updtdt from reference
      //there is code to set only columns in row data inside onReferenceScreenSelected
      //.filter((column: any) => column.visible === true)
      .reduce((acc: any, column: GRID) => {
        // Handle dropdowns
        if (column.memberList && column.memberList.length > 0) {
          acc[column.dataField] = column.memberList[0].code;
        }
        // Handle checkboxes
        else if (column.editorType === '5') {
          acc[column.dataField] = '0'; //false; // Default checkbox to false (unchecked)
        }
        // All others default to null
        else {
          acc[column.dataField] = null;
        }

        if (column.defaultAddValue !== undefined && column.defaultAddValue !== null) {
          acc[column.dataField] = column.defaultAddValue;
        }
        return acc;
      }, {});
    newRowData._isNew = true;
    newRowData.rowid = this.nextRowId;
    this.nextRowId++;

    // ------------------------- FIND INSERT INDEX -------------------------
    let insertIdx = 0;
    // append row in visibleDataList(use splice because if reassigned then it will detect change in list and reset datatable)
    if (this.selectionMode() === 'single') {
      const selected = this.selection().selected; // this is an array of rowids

      if (selected.length > 0) {
        const selectedId = selected[0]; // rowid = 6

        const index = this.visibleDataList.data.findIndex(
          (row) => row.rowid === selectedId,
        );

        insertIdx = index !== -1 ? index + 1 : 0;
      }
    } else if (this.selectionMode() === 'multiple') {
      insertIdx = 0; // always insert at top
    }

    // ------------------------- INSERT ROW -------------------------
    this.visibleDataList.data.splice(insertIdx, 0, newRowData);
    this.dataList().splice(insertIdx, 0, newRowData);
    if (!this.letParentMaintainCellChanges()) {
      this.DataChangeDetected.netRowChangeCounterIncrement();
    }

    if (!this.isAllDataLoad()) {
      const pageSize = this.paginator?.pageSize;
      if (this.visibleDataList.data.length > pageSize) {
        this.visibleDataList.data.splice(pageSize);
      }

      this.visibleDataList.data = [...this.visibleDataList.data];
    }

    // Update paginator total count
    const currentTotal = this.paginatorValues()?.TotalData ?? 0;
    this.paginatorValues.set({ TotalData: currentTotal + 1 });

    this.visibleDataList._updateChangeSubscription();
    this.selectRow(newRowData.rowid);
    setTimeout(() => {
      this.applyColumnWidths(true);
    });
    // 2025/11/14 - commented because renderRows can sometimes gives error when matTable is processing dataSource
    //this.actyGridTable.renderRows();
    if (this.letParentMaintainCellChanges()) {
      this.addedValues.emit(newRowData);
    }

    // Perform calculations, childOperations & child aggregations for a new row
    const matchedRow = this.visibleDataList?.data?.find(
      rowData => rowData.id === newRowData.rowid
    );

    if (matchedRow) {
      this.dataGrid().forEach((col) => {
        if (col?.editorType !== '5') {
          const rowChangeObj = {
            row: matchedRow,
            column: col,
            dataGrid: this.dataGrid()
          };

          this.onCellFocusChange.emit(rowChangeObj);
        }
      })
    }
    this.addNewGridRow.emit({ row: matchedRow });
  }

  async deleteRowData(rowId?: number): Promise<void> {
    const rowsToDelete =
      rowId != null ? [rowId] : this.selectedRows.map((d) => d.rowid);

    if (!rowId || rowId === null) {
      const result = await this.msgDialogService.show({
        messageData: { message: 'MESSAGE.COM_C0002' },
        header: 'CORE.GRID.confirmation',
        buttons: [
          {
            label: 'いいえ',
            severity: 'primary',
          },
          {
            label: 'はい',
            severity: 'primary',
          },
        ],
      });
      if (result === 0) return;
    }

    if (!rowsToDelete || rowsToDelete.length === 0) return;

    let deletedCount = 0; // Track deleted rows

    for (const rId of rowsToDelete) {
      const dataListIdx = this._dataList().findIndex(
        (d: any) => d.rowid === rId,
      );
      const visibleDataListIdx = this.visibleDataList.data.findIndex(
        (d: any) => d.rowid === rId,
      );
      const row = this.visibleDataList.data.find((d: any) => d.rowid === rId);

      // Handle the change counter based on whether the row was new
      if (row._isNew) {
        if (!this.letParentMaintainCellChanges()) {
          this.DataChangeDetected.netRowChangeCounterDecrement();
        }
      } else {
        if (!this.letParentMaintainCellChanges()) {
          this.DataChangeDetected.netRowChangeCounterIncrement();
        }
      }

      if (dataListIdx !== -1) {
        this._dataList()[dataListIdx]._isDelete = true;
        row._isDelete = true;
      }
      // keep both if seperate for new row case
      if (visibleDataListIdx !== -1) {
        //for select next row and when next row is not exists then select before row
        const index = this.visibleDataList.data.findIndex(
          (item) => item.rowid === row.rowid,
        );
        const rowId = this.visibleDataList?.data[index + 1]?.rowid;
        if (rowId !== undefined) {
          this.selection().select(rowId);
        } else {
          const beforeRowId = this.visibleDataList?.data[index - 1]?.rowid;
          this.selection().select(beforeRowId);
        }
        // remove from visibleDataList(use splice because if reassigned then it will detect change in list and reset datatable)
        this.visibleDataList.data.splice(visibleDataListIdx, 1);
        if (!row._isNew) {
          this.dataList().splice(visibleDataListIdx, 1);
          const rowId = row.rowid;
          const deleteValues = this._dataList().filter(
            (item: any) => item.rowid === rowId,
          );
          this.deleteValues.emit(deleteValues);
        } else {
          this.deleteValues.emit([row]);
        }
        this.visibleDataList._updateChangeSubscription();
        deletedCount++; // Increment deleted count

        this.updateRefScreenDefaultValue(null, this.tabId(), this.gridId());
      }
    }

    // Update paginator total count
    if (deletedCount > 0) {
      const currentTotal = this.paginatorValues()?.TotalData ?? 0;
      this.paginatorValues.set({
        TotalData: Math.max(0, currentTotal - deletedCount),
      });
    }

    this.SelecteChange.emit(this.selectedRows);
  }

  //when any cells is updated
  onRowDataUpdate(rowData: any, column: GRID | undefined): void {
    if (column === undefined) {
      return;
    }

    //remove invalid cells values
    if (rowData.invalidCells !== undefined) {
      rowData.invalidCells = rowData.invalidCells.filter(
        (invalidCellObj: any) => {
          // Get the column name and error data from the object
          const columnName = Object.keys(invalidCellObj)[0];
          const errorData = invalidCellObj[columnName];
          if (column.isPrimaryKey) {
            // If it's a primary key column, remove the PrimaryKeyColumns key and self errors too
            return (
              columnName !== 'PrimaryKeyColumns' &&
              columnName !== column.dataField
            );
          } else {
            // remove only this specific column
            return columnName !== column.dataField;
          }
        },
      );
    }

    const rowId = rowData.rowid;
    if (!this.letParentMaintainCellChanges()) {
      // datalist row
      const dataListRow = this._dataList().find(
        (row: any) => row.rowid === rowId,
      );
      if (!dataListRow && !rowData?._isNew) {
        return;
      }
      // visible datalist row
      let rawOldValue = null;
      if (dataListRow) {
        rawOldValue = dataListRow[column.dataField as keyof GRID];
        if (column.editorType === '3') {
          //add timezone in get data from API so that old value and new value format remaing same
          /*const date = new Date(rawOldValue)
          rawOldValue = LuxonDateTime.fromJSDate(date)
                    .setZone(this.plantTimeZone(), { keepLocalTime: true })
                    .toJSDate()*/
        }
      }
      const visibleDataListRow = rowData;
      const rawNewValue = visibleDataListRow[column.dataField];
      const oldValue =
        column.editorType === '3' &&
          rawOldValue !== null &&
          rawOldValue !== undefined
          ? new Date(rawOldValue)
          : rawOldValue;

      const newValue =
        column.editorType === '3' &&
          rawNewValue !== null &&
          rawNewValue !== undefined
          ? new Date(rawNewValue)
          : rawNewValue;

      if (!visibleDataListRow.changedCells) {
        visibleDataListRow.changedCells = [];
      }

      const oldStr = oldValue != null ? oldValue.toString() : '';
      const newStr = newValue != null ? newValue.toString() : '';

      if (oldStr !== newStr) {
        if (rowData._isNew) {
          const updatedData = {
            row: rowData,
            columnName: column.dataField,
          };
          this.onGridCellChanges.emit(updatedData);
          const item = this.dataList().find(
            (item: any) => item.rowid === rowData.rowid,
          );
          if (item) {
            Object.assign(item, rowData); // Update the found item
          }
          return;
        }

        if (!visibleDataListRow.changedCells.includes(column.dataField)) {
          visibleDataListRow.changedCells.push(column.dataField);
          if (!this.letParentMaintainCellChanges()) {
            this.addInGlobalInDetection(rowId, column.dataField);
          }
        }
        const item = this.dataList().find(
          (item: any) => item.rowid === rowData.rowid,
        );
        if (item) {
          Object.assign(item, rowData); // Update the found item
        }
      } else {
        visibleDataListRow.changedCells =
          visibleDataListRow.changedCells.filter(
            (clm: string) => clm !== column.dataField,
          );
        if (!this.letParentMaintainCellChanges()) {
          this.removeFromGlobalInDetection(rowId, column.dataField);
        }
      }
      const rowChangeObj = { row: rowData, columnName: column.dataField };
      this.onGridCellChanges.emit(rowChangeObj);
    } else {
      if (rowData._isNew) {
        const rowChangeObj = { row: rowData, columnName: column.dataField };
        this.onGridCellChanges.emit(rowChangeObj);
        return;
      }

      const dataListRow = this._dataList().find(
        (row: any) => row.rowid === rowId,
      );

      // visible datalist row
      if (!dataListRow) return;
      const updatedRow = this.visibleDataList.data.filter(
        (item: any) => item.rowid === rowId,
      );
      const updatedDataforParent = {
        updatedRow: updatedRow[0],
        columnName: column.dataField,
      };
      this.onGridCellChanges.emit(updatedDataforParent);

      const item = this.dataList().find(
        (item: any) => item.rowid === rowData.rowid,
      );
      if (item) {
        Object.assign(item, rowData); // Update the found item
      }
    }
  }

  addInGlobalInDetection(rowId: number, columnName: string): void {
    // ColumnName_RowId
    const identifier: string = columnName + '_' + rowId + '_';
    this.DataChangeDetected.dataChangeListPush(identifier);
  }

  removeFromGlobalInDetection(rowId: number, columnName: string): void {
    // ColumnName_RowId
    const identifier: string = columnName + '_' + rowId + '_';
    this.DataChangeDetected.dataChangeListRemove(identifier);
  }

  //when click  on grid save button
  async saveData(): Promise<boolean> {
    if (this.saveDataUrl() === undefined || this.saveDataUrl() === '') {
      this.onClickSaveBtn.emit(true);
      return false;
    }
    const saveData =
      this.passSelectedRowForSave() && !this.isEditableGrid()
        ? this.getSelectedRowData()
        : this.getSaveData();
    if (
      (await saveData).validStatus === false ||
      ((await saveData).AddList.length === 0 &&
        (await saveData).UpdateList.length === 0 &&
        (await saveData).DeleteList.length === 0)
    ) {
      return false;
    }

    this.saveList.AddList = (await saveData).AddList;
    this.saveList.UpdateList = (await saveData).UpdateList;
    this.saveList.DeleteList = (await saveData).DeleteList;

    // this.getSearchData.emit(false);
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));

    this.loader.increment(this.formLoaderKey());
    return new Promise((resolve) => {
      this.service
        .saveData(
          { [this.apiObjectName()]: this.saveList } /*,this.searchList()*/,
          this.saveDataUrl(),
        )
        .subscribe({
          next: async (res) => {
            this.loader.decrement(this.formLoaderKey());
            if (res.Message === null && res.Messagecode === null) {
              notify({ message: 'MESSAGE.COM_S0001' });
              // this.updateGridData(res);
              this.DataChangeDetected.netRowChangeCounterReset();
              this.DataChangeDetected.dataChangeListReset();
              resolve(true);
              // when get error at save time then not calling the getdata
              this.afterSave.emit();
            } /*else if(res.Messagecode === 'NODATAFOUND'){
              this._dataList.set([]);
              this.modifyDataList();
              notify({ message: 'MESSAGE.COM_I0001' });
              this.loader.decrement(this.formLoaderKey());
          }*/ else {
              const messageResponse: MessageResponseModel = {
                Messagecode: res.Messagecode,
                Message: res.Message,
                MsgDispType: res.MsgDispType,
              };
              // result have a null or a Number which Click of Dialog Button
              const result = await this.ActyCommonService.displayMessage(
                messageResponse,
                this.screenName(),
              );
              resolve(false);
            }

          },
          error: (err) => {
            if (err.error.Messagecode === 'COM_E0002') {
              this.setDuplicatePrimaryKey(err.error.Data);
            }
            this.loader.decrement(this.formLoaderKey());
            resolve(false);
          },
        });
      this.loader.decrement(this.formLoaderKey());
    });
  }

  private updateGridData(res: any): void {
    let dataCount: number = 0;
    this._dataList.set(res.Data[this.apiObjectName()]);
    dataCount = this._dataList()?.length;
    this.modifyDataList();
    //this.updateScrollHeight();
    this.paginatorValues.set({
      TotalData: res?.Data?.[`TotalData_${this.apiObjectName()}`],
    });
  }

  //Create a Method For set a Data in this.visibleDataList of Relation Column From a Entry-Screen
  public setRelationDataInVisibleDataList(
    relations: any[],
    flatFormValues: any,
  ): void {
    if (!relations || relations.length === 0) return;
    if (!this.visibleDataList?.data) return;

    this.visibleDataList.data.forEach((row: any) => {
      //  Update only NEW rows
      if (row._isNew !== true) return;

      relations.forEach((rel: any) => {
        const parentValue = flatFormValues[rel.parentDataField];

        if (parentValue !== undefined) {
          row[rel.childDataField] = parentValue;
        }
      });
    });
  }

  public setDuplicatePrimaryKey(
    duplicateData: any,
    shouldReturnValue: boolean = false,
  ): void | { [key: string]: { message: string; params: {} } } {
    let duplicateRows: any[] = [];

    if (!Array.isArray(duplicateData)) {
      const tableName = Object.keys(duplicateData)[0];
      duplicateRows = duplicateData[tableName];
    } else {
      duplicateRows = duplicateData;
    }

    for (const row of duplicateRows) {
      //  Check if the row has all primary key columns
      const hasAllPKs = this.primaryKeyColumns.every((pk) =>
        row.hasOwnProperty(pk),
      );

      if (!hasAllPKs) {
        continue; //  skip rows that don't satisfy your condition
      }

      //  Find the matching row in visibleDataList
      const match = this.visibleDataList.data.find(
        (r: any) =>
          r._isNew === true &&
          this.primaryKeyColumns.every(
            (pk) => this.normalizeValue(r[pk]) == this.normalizeValue(row[pk]),
          ),
      );

      if (match) {
        //  Create a NEW error array for each row — very important
        const newErrors = [
          {
            PrimaryKeyColumns: {
              message: 'MESSAGE.COM_E0008',
              params: {},
            },
          },
        ];

        if (shouldReturnValue === true) {
          return {
            PrimaryKeyColumns: { message: 'MESSAGE.COM_E0008', params: {} },
          };
        } else {
          //  Mark invalid cells
          this.addInvalidCells(match, newErrors);
        }
      }
    }
  }
  // this Method Create for a Mach a API value and this.visibleDataList.data. Ex : Wed Dec 10 2025 00:00:00 GMT+0530 (India Standard Time) (this.visibleDataList.data  value) == 2025-12-09T18:30:00+00:00 (API Value)
  private normalizeValue(value: any): any {
    if (value == null) return value;

    // Date object
    if (value instanceof Date) {
      return value.getTime();
    }

    // ISO date string → date value
    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
      return new Date(value).getTime();
    }

    //  DO NOT convert numeric strings
    return String(value);
  }

  /**
   * Method for validating single row
   * @param rowData
   * @returns a list of columns and a corresponding message
   */
  private async validateRowData(
    rowData: any,
  ): Promise<{ [key: string]: { message: string; params: {} } }[]> {
    const errors: { [key: string]: { message: string; params: {} } }[] = [];

    // Ensure invalidCells is always an array
    if (!Array.isArray(rowData.invalidCells)) {
      rowData.invalidCells = [];
    }

    //single row validation
    for (const column of this._dataGrid()) {
      if (column.isEditable == false) continue;
      const value = rowData[column.dataField];

      const exists = rowData.invalidCells.some(
        (cell: any) => Object.keys(cell)[0] === column.dataField,
      );
      if (exists) {
        continue;
      }
      // ISRequired validation
      const isDynamicallyRequired =
        Array.isArray(rowData?.childOperations?.requiredFields) &&
        rowData.childOperations.requiredFields.includes(column.dataField);

      if (
        column.isEditable === true &&
        (column?.isRequired ||
          isDynamicallyRequired ||
          (column?.isPrimaryKey && column?.isAutoGenerate !== true))
      ) {
        if (value === null || value === '' || value === undefined) {
          // Check if the field already exists in invalidCells
          errors.push({
            [column.dataField]: { message: 'MESSAGE.COM_E0006', params: {} },
          });
        } else {
          // Remove only MESSAGE.COM_E0006 errors for this column
          rowData.invalidCells = rowData.invalidCells.filter((item: any) => {
            const key = column.dataField;
            // It doesn't have this column as key and The message is NOT MESSAGE.COM_E0006
            return (
              !item.hasOwnProperty(key) ||
              item[key].message !== 'MESSAGE.COM_E0006'
            );
          });
        }
      }
      //added here single row validation
    }
    //multiple row validation
    //check if any invalid cells available then not check any other validation
    if (rowData?.invalidCells.length === 0 && errors.length === 0) {
      //check for duplicate data
      if (
        this.primaryKeyColumns.length > 0 &&
        this._dataGrid().findIndex((c: GRID) => c.isAutoGenerate) === -1 &&
        rowData._isNew
      ) {
        const isDuplicate = this.dataList().some((existingRow) => {
          return this.primaryKeyColumns.every((key) => {
            const gridKey = key as keyof GRID;
            const isDeleted = existingRow?._isDelete ?? false;
            return (
              existingRow[gridKey] === rowData[gridKey] &&
              existingRow?.rowid !== rowData.rowid &&
              isDeleted
            );
          });
        });

        if (isDuplicate) {
          //  Set Invalid Cell
          const InvalidCell = this.setDuplicatePrimaryKey([rowData], true);
          if (InvalidCell) {
            errors.push(InvalidCell);
          }
        }
      }
      //added here multi row validation
    }

    rowData.invalidCells = [...rowData.invalidCells, ...errors];
    return rowData.invalidCells;
  }

  /**
   * adds the invalidCells property in row
   * @param row always pass row byRef
   * @param columns object of column name and its error message
   */
  addInvalidCells(
    row: any,
    columns: { [key: string]: { message: string; params: {} } }[],
  ): void {
    // Ensure row.invalidCells is initialized as an empty array if undefined
    if (row.invalidCells === undefined) {
      row.invalidCells = [];
    }

    columns.forEach((clm) => {
      // Extract the key and value from the column object
      const key = Object.keys(clm)[0]; // Assuming each column object has only one key
      const value = clm[key];

      // Find an existing invalid cell with the same key
      const existingIndex = row.invalidCells.findIndex(
        (cell: any) => cell[key],
      );

      if (existingIndex === -1) {
        // If no matching key found, push the new invalid cell
        row.invalidCells.push(clm);
      } else {
        // If a matching key is found, override the existing cell
        row.invalidCells[existingIndex][key] = value;
      }
    });
  }

  // we make new function ("scrollToRow()") to scroll to selected row
  // goToRow(rowId: number): void {
  //   const selectedRow = this.visibleDataList.data.find(
  //     (row: any) => row.rowid === rowId
  //   );
  //   if (selectedRow) {
  //     this.scrollToSelectedRow(rowId);
  //   }
  // }

  scrollToRow(rowId: number) {
    if (!this.actyGridTableElement) return;

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        const tableEl = this.actyGridTableElement.nativeElement as HTMLElement;

        const row = tableEl
          .querySelector(
            `tbody tr[data-row-id="${rowId}"] div[grid-id="${this.gridId()}"]`,
          )
          ?.closest('tr') as HTMLElement | null;
        if (!row) return;

        row.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        // Re-enter Angular ONLY if you need UI updates
        this.ngZone.run(() => {
          this.selectRow(rowId);
        });
      });
    });
  }

  //convert ParentRowId into rowId
  convertParentRowIdintoRowId(
    parentRowId: number,
    isParentGrid?: boolean,
  ): void {
    const data = this.visibleDataList.data;

    const row = data.find((d) => d.parentRowId === parentRowId);
    if (!row) return;

    const rowId = row.rowid;
    const pageSize = this.paginator.pageSize;
    const pageIndex = Math.floor((rowId - 1) / pageSize);

    if (!isParentGrid) {
      this.isBlockResetRowSelection = true;

      if (this.paginator.pageIndex !== pageIndex) {
        this.paginator.pageIndex = pageIndex;
        this.paginator.page.next({
          pageIndex,
          pageSize,
          length: this.paginator.length,
        });
      }

      this.isBlockResetRowSelection = false;
    }

    this.scrollToRow(rowId);
  }
  /**
   * we make new function ("scrollToRow()") to scroll to selected row
   */
  // scrollToSelectedRow(rowId: number) {
  //   const index = this.visibleDataList.data.findIndex(
  //     (row: any) => row.rowid === rowId
  //   );

  //   if (index == null) return;
  //   const tableBody = this.actyGridTableElement.nativeElement.querySelector(
  //     'tbody'
  //   ) as HTMLElement;
  //   if (!tableBody) return;

  //   Determine row height (assume fixed if not found)
  //   let rowHeight = 40; //TODO get dynamic height form theme/dom
  //   const rows = tableBody.querySelectorAll('tr');
  //   if (rows.length >= 1) {
  //     const firstRow = rows[0] as HTMLElement;
  //     rowHeight = firstRow.offsetHeight || rowHeight;
  //   }

  //   // Calculate offset inside container
  //   const pageSize = this.paginator.pageSize;
  //   const targetPage = Math.floor(index / pageSize);

  //   // Switch paginator to target page
  //   this.paginator.pageIndex = targetPage;
  //   this.paginator._changePageSize(pageSize);
  //   setTimeout(() => {
  //     const container = this.tableContainer.nativeElement;

  //     const dtFirst = targetPage * pageSize;
  //     const scrollTop = rowHeight * (index - dtFirst);

  //     container.scrollTo({
  //       top: scrollTop,
  //       behavior: 'smooth',
  //     });
  //     this.selectRow(rowId);
  //   }, 50);
  // }

  /**
   * Formats the data based on its data type
   * currently used for date and number
   * @param rowData
   * @returns
   */
  private formatRowData(rowData: any): any {
    const formattedData: any = {};
    this._dataGrid().forEach((column: GRID) => {
      //this comment is added ignore column is passing for save data
      // if (column.isGridIgnore !== true) {
      const value = rowData[column.dataField];
      // Format based on dataType
      switch (column.editorType) {
        case '2': // Number
          formattedData[column.dataField] =
            value === '' || value === null ? null : Number(value);
          break;

        case '3': // Date
          formattedData[column.dataField] = value;
          break;

        default: // String and other types
          formattedData[column.dataField] =
            value === '' || value === null ? null : value;
      }
      // } else if (column.dataField?.startsWith('Updtdt')) {
      //   // for update date columns which is Updtdt
      //   const value = rowData[column.dataField];
      //   formattedData[column.dataField] = value;
      // }
    });

    return formattedData;
  }

  isInvalidCell(row: any, column: string): boolean {
    if (row?.invalidCells && row?.invalidCells.length > 0) {
      return true;
    }
    return (
      row.invalidCells !== undefined &&
      row.invalidCells.some(
        (cell: { column: string; message: string }) => cell.column === column,
      )
    );
  }

  /**
   * returns the invalid message for columnName form data
   * @param data
   * @param columnName
   * @returns
   */
  getInvalidMessage(data: any, columnName: string): any {
    const primaryKeys = this.primaryKeyColumns;
    if (data?.invalidCells && data.invalidCells.length > 0) {
      // Loop through all the objects in invalidCells
      for (const invalidCell of data.invalidCells) {
        // Check if the current object has the columnName as a key
        if (invalidCell.hasOwnProperty(columnName)) {
          return invalidCell[columnName]; // Return the corresponding object
        }
        if (
          primaryKeys.includes(columnName) &&
          invalidCell.hasOwnProperty('PrimaryKeyColumns')
        ) {
          return invalidCell['PrimaryKeyColumns'];
        }
      }
    }
    return null; // Return null if no match is found
  }

  getHintType(row: any, column: string): MessageType {
    const hint = this.getInvalidMessage(row, column);

    if (hint?.type !== undefined) {
      return hint.type;
    }
    const message = hint?.message ?? '';
    return this.ActyCommonService.getTypeFromMsgCode(message);
  }

  getHintIcon(row: any, column: string) {
    const hint = this.getInvalidMessage(row, column);

    let type = hint?.type;
    if (type === undefined) {
      const message = hint?.message ?? '';
      type = this.ActyCommonService.getTypeFromMsgCode(message);
    }
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
        return '';
    }
  }
  // this Method use for a get a Selected row and pass to a saveData
  async getSelectedRowData(): Promise<{
    AddList: any;
    UpdateList: any;
    DeleteList: any;
    validStatus: boolean;
  }> {
    const AddList: any = [];
    const DeleteList: any = [];
    const validStatus = true;

    //Get selected rows here
    const UpdateList = this.selectedRows;

    return {
      AddList,
      UpdateList,
      DeleteList,
      validStatus,
    };
  }

  async getSaveData(): Promise<{
    AddList: any;
    UpdateList: any;
    DeleteList: any;
    validStatus: boolean;
  }> {
    const addListPromises: Promise<any | null>[] = [];
    const updateListPromises: Promise<any | null>[] = [];
    const deleteList: any[] = [];
    let validStatus = true;

    const prepareRowWithValidation = async (row: any): Promise<any | null> => {
      const invalidColumns = await this.validateRowData(row);
      if (invalidColumns.length > 0) {
        validStatus = false;
        this.addInvalidCells(row, invalidColumns);
        this.invalidCellRowIds().push(row.rowid);
        //scroll To Error row
        this.scrollToRow(row.rowid);
      }
      return this.formatRowData(row);
    };

    for (const row of this.visibleDataList.filteredData) {
      if (row._isNew) {
        addListPromises.push(prepareRowWithValidation(row));
      } else if (row.changedCells?.length > 0) {
        updateListPromises.push(prepareRowWithValidation(row));
      }
    }

    // Run validations before formatting deleteList
    const [addListRaw, updateListRaw] = await Promise.all([
      Promise.all(addListPromises),
      Promise.all(updateListPromises),
    ]);

    // Return early if validation failed
    if (!validStatus) {
      const firstInvalidCell = this.invalidCellRowIds()[0];

      // if (this.dataTable && this.dataTable.rows) {
      //this.goToRow(firstInvalidCell); //TODO
      this.invalidCellRowIds.set([]);
      // }
      return {
        AddList: [],
        UpdateList: [],
        DeleteList: [],
        validStatus,
      };
    }

    for (const row of this._dataList()) {
      if (row._isDelete) {
        deleteList.push(await this.formatRowData(row));
      }
    }

    const AddList = addListRaw.filter(Boolean);
    const UpdateList = updateListRaw.filter(Boolean);

    return {
      AddList,
      UpdateList,
      DeleteList: deleteList,
      validStatus,
    };
  }

  get selectedRows(): any[] {
    const data = this.visibleDataList?.data;
    const selection = this.selection();

    if (!data || !selection || selection.isEmpty()) {
      return [];
    }

    // Convert selected IDs to a Set for O(1) lookup
    const selectedSet = new Set(selection.selected);

    // Filter using the Set
    return data.filter((row) => selectedSet.has(row.rowid));
  }

  async sortData(column: string, toggle: boolean = true): Promise<void> {
    const replySubject = new Subject<boolean>();
    let isValid = false;

    if (this.hasInitialLoad() == false) {
      return;
    }

    this.onGridActionRequest.emit({
      notifier: replySubject,
    });

    if (this.isAllDataLoad() || this.skipMasterFilterValidation()) {
      isValid = true;
    } else {
      isValid = await firstValueFrom(replySubject.pipe(take(1)));
    }
    if (isValid) {
      if (toggle) {
        if (this.sortColumn !== column) {
          this.sortColumn = column;
          this.sortDirection = 'asc';
        } else {
          if (this.sortDirection === 'asc') {
            this.sortDirection = 'desc';
          } else if (this.sortDirection === 'desc') {
            this.sortDirection = 'asc';
          } else {
            this.sortColumn = '';
            this.sortDirection = '';
          }
        }
      }

      this.loader.increment(this.formLoaderKey());

      let GridEditorType: any = '';

      this.gridFilter().forEach((filterState) => {
        if (!filterState?.rules?.length) return;

        const rules = filterState.rules
          .filter((r) => r?.value?.length > 0)
          .map((r) => ({
            Value: r.value,
            Type: this.conditionOperatorMap[r.condition?.toLowerCase()] || 0,
          }));

        if (
          filterState.editorType == '5' ||
          filterState.editorType == '6' ||
          filterState.editorType == '7'
        ) {
          GridEditorType = '4';
        } else if (filterState.editorType == '8') {
          GridEditorType = '1';
        } else {
          GridEditorType = filterState.editorType;
        }
        if (rules.length > 0) {
          this.filterObj[filterState.columnname] = {
            MatchType: this.matchModeMap[filterState.matchMode],
            Rules: rules,
            InputType: Number(GridEditorType),
          };
        }
      });
      if (this.isAllDataLoad()) {
        if (this.sortColumn) {
          this.visibleDataList.data.sort((a, b) => {
            const valueA = a[this.sortColumn];
            const valueB = b[this.sortColumn];

            if (valueA == null) return 1;
            if (valueB == null) return -1;

            if (typeof valueA === 'number' && typeof valueB === 'number') {
              return this.sortDirection === 'asc'
                ? valueA - valueB
                : valueB - valueA;
            }

            const strA = valueA.toString().toLowerCase();
            const strB = valueB.toString().toLowerCase();

            if (strA < strB) return this.sortDirection === 'asc' ? -1 : 1;
            if (strA > strB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
          });
          this.initializeColumnWidths();
          this.resetRowSelection();
        } else {
          this.visibleDataList.data = structuredClone(
            this.applyFilter(this.dataList()),
          );
        }
        this.visibleDataList._updateChangeSubscription();
      } else {
        if (this.isParentChild()) {
          this.parentChildGetData.emit({
            pageSize: this.paginator.pageSize,
            pageIndex: this.paginator.pageIndex,
            sortType: this.sortDirection,
            sortColumn: this.sortColumn,
            gridFilters: this.filterObj,
            previousPageIndex: 0,
          });
        } else {
          if (!this.getDataUrl()) {
            this.entryGetData.emit({
              pageSize: this.paginator.pageSize,
              pageIndex: this.paginator.pageIndex,
              sortType: this.sortDirection,
              sortColumn: this.sortColumn,
              gridFilters: this.filterObj,
              previousPageIndex: 0,
            });
          }
        }
      }

      this.loader.decrement(this.formLoaderKey());

      this.visibleDataList._updateChangeSubscription();
    }
  }

  getSortIcon(col: string): string {
    if (this.sortColumn !== col) return 'import_export'; // default unsorted
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  getColumnFilterState(col: string): ColumnFilterState {
    const findInColumns = (columns: any[]): ColumnFilterState | undefined => {
      for (const column of columns) {
        if (column.dataField === col) {
          return this.gridFilter().find((f) => f.columnname === col);
        }
        if (column.childColumns?.length) {
          const child = findInColumns(column.childColumns);
          if (child) return child;
        }
      }
      return undefined;
    };

    return (
      this.gridFilter().find((f) => f.columnname === col) ??
      findInColumns(this._dataGrid()) ?? {
        columnname: col,
        matchMode: 'all',
        rules: [{ condition: 'contains', value: '' }],
      }
    );
  }

  getColumnFilterRuleOptions(column: GRID): {
    value: string;
    display: string;
  }[] {
    if (column?.editorType === '2') return this.conditions_number;
    if (column?.editorType === '3') return this.conditions_date;
    return this.conditions_string;
  }

  addRule(column: GRID): void {
    let columnFilterObj = this.getColumnFilterState(column.dataField);
    let defaultCondition: FilterCondition;
    if (column?.editorType === '1') {
      defaultCondition = this.conditions_string[0].value as FilterCondition;
    } else if (column?.editorType === '2') {
      defaultCondition = this.conditions_number[0].value as FilterCondition;
    } else if (column.editorType === '4' || column.editorType === '5' || column.editorType === '6' || column.editorType === '7') {
      defaultCondition = this.conditions_string[4].value as FilterCondition;
    } else {
      defaultCondition = this.conditions_date[0].value as FilterCondition;
    }

    columnFilterObj.rules.push({ condition: defaultCondition, value: '' });
  }

  removeRule(col: string, index: number): void {
    let columnFilterObj = this.getColumnFilterState(col);
    columnFilterObj.rules.splice(index, 1);
  }

  async applyFilterAndCloseMenu(column: GRID, trigger: MatMenuTrigger): Promise<void> {
    const replySubject = new Subject<boolean>();
    let isValid = false;

    if (this.hasInitialLoad() == false) {
      return;
    }

    let columnFilterObj = this.gridFilter().find((f) => f.columnname === column.dataField);
    if (!columnFilterObj) {
      columnFilterObj = this.getColumnFilterState(column.dataField);
      columnFilterObj.editorType = column.editorType;
      this.gridFilter.update((filters) => [...filters, columnFilterObj!]);
    } else {
      columnFilterObj.editorType = column.editorType;
    }

    this.onGridActionRequest.emit({
      notifier: replySubject,
    });

    if (this.isAllDataLoad() || this.skipMasterFilterValidation()) {
      isValid = true;
    } else {
      isValid = await firstValueFrom(replySubject.pipe(take(1)));
    }
    if (isValid) {
      this.loader.increment(this.formLoaderKey());
      let GridEditorType: any = '';
      this.filterObj = {};

      this.gridFilter().forEach((filterState) => {
        if (!filterState?.rules?.length) return;

        const rules = filterState.rules
          .filter(
            (r) =>
              r?.value?.length > 0 ||
              (filterState.editorType === '3' &&
                r?.value !== null &&
                r?.value !== ''),
          )
          .map((r) => ({
            Value:
              filterState.editorType === '3'
                ? this.formatDateForDB(r.value)
                : r.value,
            Type: this.conditionOperatorMap[r.condition?.toLowerCase()] || 0,
          }));

        if (
          filterState.editorType == '5' ||
          filterState.editorType == '6' ||
          filterState.editorType == '7'
        ) {
          GridEditorType = '4';
        } else if (filterState.editorType == '8') {
          GridEditorType = '1';
        } else {
          GridEditorType = filterState.editorType;
        }
        if (rules.length > 0) {
          this.filterObj[filterState.columnname] = {
            MatchType: this.matchModeMap[filterState.matchMode],
            Rules: rules,
            InputType: Number(GridEditorType),
          };
        }
      });
      this.paginator.pageIndex = 0;
      if (this.isAllDataLoad()) {
        this.applyFilter();
        this.sortData(this.sortColumn, false);
      } else {
        if (this.isParentChild()) {
          this.parentChildGetData.emit({
            pageSize: this.paginator.pageSize,
            pageIndex: this.paginator.pageIndex,
            sortType: this.sortDirection,
            sortColumn: this.sortColumn,
            gridFilters: this.filterObj,
            previousPageIndex: 0,
          });
        } else {
          if (!this.getDataUrl()) {
            this.entryGetData.emit({
              pageSize: this.paginator.pageSize,
              pageIndex: this.paginator.pageIndex,
              sortType: this.sortDirection,
              sortColumn: this.sortColumn,
              gridFilters: this.filterObj,
              previousPageIndex: 0,
            });
          }
        }
      }
    }
    trigger.closeMenu();
    this.loader.decrement(this.formLoaderKey());
  }

  //references of Filter component
  formatDateForDB(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    // pad helper
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  }

  async clearFilterAndCloseMenu(
    col: GRID,
    trigger: MatMenuTrigger,
  ): Promise<void> {
    const replySubject = new Subject<boolean>();
    let isValid = false;

    if (this.hasInitialLoad() == false) {
      return;
    }

    this.onGridActionRequest.emit({
      notifier: replySubject,
    });

    if (this.isAllDataLoad() || this.skipMasterFilterValidation()) {
      isValid = true;
    } else {
      isValid = await firstValueFrom(replySubject.pipe(take(1)));
    }
    if (isValid) {
      this.clearFilter(col);

      let GridEditorType: any = '';
      this.filterObj = {};

      this.gridFilter().forEach((filterState) => {
        if (!filterState?.rules?.length) return;

        const rules = filterState.rules
          .filter((r) => r?.value?.length > 0)
          .map((r) => ({
            Value: r.value,
            Type: this.conditionOperatorMap[r.condition?.toLowerCase()] || 0,
          }));

        if (
          filterState.editorType == '5' ||
          filterState.editorType == '6' ||
          filterState.editorType == '7'
        ) {
          GridEditorType = '4';
        } else if (filterState.editorType == '8') {
          GridEditorType = '1';
        } else {
          GridEditorType = filterState.editorType;
        }
        if (rules.length > 0) {
          this.filterObj[filterState.columnname] = {
            MatchType: this.matchModeMap[filterState.matchMode],
            Rules: rules,
            InputType: Number(GridEditorType),
          };
        }
      });

      this.paginator.pageIndex = 0;
      if (this.isAllDataLoad()) {
        if (this.showPaginator()) {
          this.visibleDataList.paginator = this.paginator;
          this.buttonWrapper?.recalculateVisibility();
        }
      } else {
        if (this.isParentChild()) {
          this.parentChildGetData.emit({
            pageSize: this.paginator.pageSize,
            pageIndex: this.paginator.pageIndex,
            sortType: this.sortDirection,
            sortColumn: this.sortColumn,
            gridFilters: this.filterObj,
            previousPageIndex: 0,
          });
        } else {
          if (!this.getDataUrl()) {
            this.entryGetData.emit({
              pageSize: this.paginator.pageSize,
              pageIndex: this.paginator.pageIndex,
              sortType: this.sortDirection,
              sortColumn: this.sortColumn,
              gridFilters: this.filterObj,
              previousPageIndex: 0,
            });
          }
        }
      }
    }
    // Now, call closeMenu() on the trigger that was passed in
    trigger.closeMenu();
  }

  async resetGridFilter(): Promise<void> {
    const replySubject = new Subject<boolean>();
    let isValid = false;

    if (this.hasInitialLoad() == false) {
      return;
    }

    this.onGridActionRequest.emit({
      notifier: replySubject,
    });

    if (this.isAllDataLoad() || this.skipMasterFilterValidation()) {
      isValid = true;
    } else {
      isValid = await firstValueFrom(replySubject.pipe(take(1)));
    }
    if (isValid) {
      this.loader.increment(this.formLoaderKey());
      let newGridFilter: ColumnFilterState[] = [];

      const addFilterState = (col: GRID) => {
        if (col.childColumns && col.childColumns.length > 0) {
          col.childColumns.forEach(addFilterState);
        } else {
          let defaultCondition: FilterCondition;
          if (col.editorType === '1') {
            defaultCondition = this.conditions_string[0].value as FilterCondition;
          } else if (col.editorType === '2') {
            defaultCondition = this.conditions_number[0].value as FilterCondition;
          } else if (col.editorType === '4' || col.editorType === '5' || col.editorType === '6' || col.editorType === '7') {
            defaultCondition = this.conditions_string[4].value as FilterCondition;
          } else {
            defaultCondition = this.conditions_date[0].value as FilterCondition;
          }

          newGridFilter.push({
            columnname: col.dataField,
            matchMode: 'all',
            rules: [{ condition: defaultCondition, value: '' }],
            editorType: col.editorType,
          });
        }
      };

      this._dataGrid().forEach((column: GRID) => {
        addFilterState(column);
      });
      this.gridFilter.set(newGridFilter);
      this.filterObj = {};

      if (this.isAllDataLoad()) {
        this.applyFilter();
      } else {
        if (this.isParentChild()) {
          this.parentChildGetData.emit({
            pageSize: this.paginator.pageSize,
            pageIndex: this.paginator.pageIndex,
            sortType: this.sortDirection,
            sortColumn: this.sortColumn,
            gridFilters: this.filterObj,
            previousPageIndex: 0,
          });
        } else {
          if (!this.getDataUrl()) {
            this.entryGetData.emit({
              pageSize: this.paginator.pageSize,
              pageIndex: this.paginator.pageIndex,
              sortType: this.sortDirection,
              sortColumn: this.sortColumn,
              gridFilters: this.filterObj,
              previousPageIndex: 0,
            });
          }
        }
      }

      this.loader.decrement(this.formLoaderKey());
    }
  }

  // Add this method to your Grid component class
  applyFilter(list?: any): any[] {
    const sourceData = list || this.dataList();
    let filteredData = sourceData.filter((row: any) => {
      // Check if the row passes all column-level filters
      return this.gridFilter().every((filterState) => {
        // If a filter has no value, it passes automatically
        const hasValue = filterState.rules.some((rule) => rule.value !== '');
        if (!hasValue) {
          return true;
        }
        // Check if the row passes all rules for a single column (matchMode = 'all')
        if (filterState.matchMode === 'all') {
          const res = filterState.rules.every((rule) =>
            this.checkMatch(row, rule, filterState.columnname),
          );
          return res;
        }
        // Check if the row passes any rule for a single column (matchMode = 'any')
        else {
          const res = filterState.rules.some((rule) =>
            this.checkMatch(row, rule, filterState.columnname),
          );
          return res;
        }
      });
    });

    // Update the MatTableDataSource with the filtered data
    if (!list) {
      this.visibleDataList.data = structuredClone(filteredData);
      this.initializeColumnWidths();
      this.resetRowSelection();
      this.visibleDataList._updateChangeSubscription();
      // 2025/11/14 - commented because renderRows can sometimes gives error when matTable is processing dataSource
      //this.actyGridTable.renderRows();
    }
    return filteredData;
  }

  // Add this helper method to your Grid component class
  private checkMatch(
    row: any,
    rule: { condition: FilterCondition; value: any },
    columnName: string,
  ): boolean {
    const cellValue = row[columnName];

    if (cellValue === null || cellValue === undefined) {
      return false;
    }
    const columnConfig = this.getColumnConfig(columnName);

    // Handle multiselect filter (special case)
    if (columnConfig?.editorType === '4') {
      const multiselectFilterValues = rule.value
        ? rule.value.split(',').map((s: string) => s.trim())
        : [];
      return multiselectFilterValues.includes(cellValue);
    }

    // Handle other data types based on the column's configuration
    if (columnConfig?.editorType === '1') {
      // String matching
      const cellValueStr = cellValue.toString().toLowerCase();
      const filterValueStr = rule.value.toString().toLowerCase();
      switch (rule.condition) {
        case 'startsWith':
          return cellValueStr.startsWith(filterValueStr);
        case 'contains':
          return cellValueStr.includes(filterValueStr);
        case 'notContains':
          return !cellValueStr.includes(filterValueStr);
        case 'endsWith':
          return cellValueStr.endsWith(filterValueStr);
        case 'equals':
          return cellValueStr === filterValueStr;
        case 'notEquals':
          return cellValueStr !== filterValueStr;
        default:
          return false;
      }
    } else if (columnConfig?.editorType === '2') {
      // Number matching
      const cellValueNum = parseFloat(cellValue);
      const filterValueNum = parseFloat(rule.value);
      if (isNaN(cellValueNum) || isNaN(filterValueNum)) return false;

      switch (rule.condition) {
        case 'equals':
          return cellValueNum === filterValueNum;
        case 'notEquals':
          return cellValueNum !== filterValueNum;
        case 'lessThan':
          return cellValueNum < filterValueNum;
        case 'greaterThan':
          return cellValueNum > filterValueNum;
        default:
          return false;
      }
    } else if (columnConfig?.editorType === '3') {
      // Date matching
      const cellDate = new Date(cellValue);
      const filterDate = new Date(rule.value);

      // Normalize dates to remove time for accurate comparison
      const normalizeDate = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const normalizedCellDate = normalizeDate(cellDate);
      const normalizedFilterDate = normalizeDate(filterDate);

      switch (rule.condition) {
        case 'dateIs':
          return (
            normalizedCellDate.getTime() === normalizedFilterDate.getTime()
          );
        case 'dateIsNot':
          return (
            normalizedCellDate.getTime() !== normalizedFilterDate.getTime()
          );
        case 'dateIsBefore':
          return normalizedCellDate < normalizedFilterDate;
        case 'dateIsAfter':
          return normalizedCellDate > normalizedFilterDate;
        default:
          return false;
      }
    }
    return false;
  }

  clearFilter(column: GRID): void {
    let columnFilterObj = this.getColumnFilterState(column.dataField);
    columnFilterObj.matchMode = 'all';
    let defaultCondition: FilterCondition;
    if (column?.editorType === '1') {
      defaultCondition = this.conditions_string[0].value as FilterCondition;
    } else if (column?.editorType === '2') {
      defaultCondition = this.conditions_number[0].value as FilterCondition;
    } else if (column.editorType === '4' || column.editorType === '5' || column.editorType === '6' || column.editorType === '7') {
      defaultCondition = this.conditions_string[4].value as FilterCondition;
    } else {
      defaultCondition = this.conditions_date[0].value as FilterCondition;
    }

    columnFilterObj.rules = [{ condition: defaultCondition, value: '' }];

    this.applyFilter();
  }

  getGridFilterMultiselectoptions(col: string): MultiselectOption[] {
    let columnobj = this.getColumnConfig(col);
    let convertedList: MultiselectOption[] = [];
    if (columnobj && columnobj.memberList) {
      convertedList = columnobj.memberList.map((item) => ({
        key: item.code,
        label: item.caption,
      }));
    }
    return convertedList;
  }

  onGridActions(eventName: string, row: GRID) {
    this.gridActions.emit({ eventName: eventName, selectedRow: row });
  }

  /**
   * executes when summary changes in CellSummaryComponent
   * @param summaryState
   */
  onSummaryChanged(event: { isCellModeEnabled: boolean }) {
    this.isCellModeEnabled.set(event.isCellModeEnabled);
    if (this.isCellModeEnabled()) {
      //  this.selectedData = null;
    } else {
      this.selectedCells().clear();
    }
  }
  /**
   * Values of all cells in this.selectedCells()
   * Contains the value, dataType(for cell summary), row, column and memberList(for getting display value form the original key value)
   */
  selectedValues = computed((): any => {
    return Array.from(this.selectedCells()).map((cellKey) => {
      const [rowIndex, field] = cellKey.split('-');
      const rowData: any = this._dataList()[+rowIndex];

      const columnData: any = this._dataGrid().find(
        (col: GRID) => col.dataField === field,
      );
      return {
        value: rowData ? rowData[field] : null,
        dataType: columnData ? columnData.editorType : '',
        row: rowIndex,
        column: field,
        memberList: columnData.memberList ?? null,
      };
    });
  });

  onColumnResizeStart(event: MouseEvent, column: string) {
    event.preventDefault();

    const headerEl = this.headerCells.find((h: any) =>
      h.nativeElement.classList.contains(`mat-column-${column}`),
    )?.nativeElement;

    if (!headerEl) return;

    const bodyEls = this.bodyCells
      .filter((c: any) =>
        c.nativeElement.classList.contains(`mat-column-${column}`),
      )
      .map((c: any) => c.nativeElement);

    this.currentResizing = {
      column,
      startX: event.pageX,
      startWidth: headerEl.offsetWidth,
      headerEl,
      bodyEls,
    };

    // Add event listeners with proper binding
    document.addEventListener('mousemove', this.onColumnResizing.bind(this));
    document.addEventListener('mouseup', this.onColumnResizeEnd.bind(this));
  }

  private onColumnResizing(event: MouseEvent) {
    if (!this.currentResizing) return;

    event.preventDefault();
    const delta = event.pageX - this.currentResizing.startX;
    const newWidth = Math.max(0, this.currentResizing.startWidth + delta); // Change 50 to 0

    // Apply new width only to the resized column
    //this.currentResizing.headerEl.style.width = newWidth + 'px';
    this.currentResizing.headerEl.style.minWidth = newWidth + 'px';
    this.currentResizing.headerEl.style.maxWidth = newWidth + 'px';

    this.currentResizing.bodyEls.forEach((cell) => {
      //cell.style.width = newWidth + 'px';
      cell.style.minWidth = newWidth + 'px';
      cell.style.maxWidth = newWidth + 'px';
      // Ensure content is hidden with ellipsis when resized down
      cell.style.overflow = 'hidden';
      cell.style.textOverflow = 'ellipsis';
      cell.style.whiteSpace = 'nowrap';
    });
  }

  private onColumnResizeEnd() {
    document.removeEventListener('mousemove', this.onColumnResizing.bind(this));
    document.removeEventListener('mouseup', this.onColumnResizeEnd.bind(this));
    this.currentResizing = null;
  }

  initializeColumnWidths() {
    if (this.gridFormat() !== 'normal') return;
    if (this.headerCells.length === 0) return;
    const currSelection = this.selection().selected;
    this.selection().clear();
    const DropDownColumnList = this.dataGrid().filter((item: GRID) => item?.editorType === '4' && item?.isEditable === true && this.isEditableGrid()).map((item: GRID) => item.dataField)

    // Use requestAnimationFrame instead of setTimeout
    requestAnimationFrame(() => {
      // 1. Reset widths to let browser calculate natural size
      this.resetHeaderCellWidths();
      this.resetBodyCellWidths();

      // 2. Clear and Rebuild Cache
      this.cachedColumnWidths.clear();

      this.headerCells.forEach((headerCellRef) => {
        const headerCell = headerCellRef.nativeElement;
        const columnClass = Array.from(headerCell.classList).find((cls) =>
          cls.startsWith('mat-column-'),
        );

        if (columnClass) {
          const columnName = columnClass.replace('mat-column-', '');

          if (DropDownColumnList.includes(columnName)) {
            //GETTING DROPDOWN MAX-LENGTH VALUES WIDTH
            this.cachedColumnWidths.set(columnName, this.getDropDownListMaxValueLength(columnName));
          }
          else {
            // Calculate width logic
            let finalWidth = headerCell.offsetWidth + 1; // added 1px so that it avoids text ellipse
            if (headerCell.classList.contains('icon-cell-header')) {
              finalWidth += this.iconWidthInInputsInPxForWidthCalculation;
            }

            // Store in class property
            this.cachedColumnWidths.set(columnName, finalWidth);
          }
        }
      });

      // 3. Apply Cache to ALL cells (Initial Load)
      this.applyColumnWidths(false);

      this.isWidthInitialized = true;
      this.selection().select(...currSelection);
    });
  }

  //for the grid normal grid component dropdown width based on dropdown max-values
  getDropDownListMaxValueLength(dataField: string): number {
    const memberList = this.dataGrid().find((item: GRID) => item.dataField === dataField)?.memberList;
    let baseWidth: number = 0;
    if (memberList?.length) {
      // Calculate the maximum caption length, including spaces
      const captionCache = memberList.map(item => this.translate.instant(item.caption));

      const maxCaptionLength = Math.max(
        ...captionCache.map(caption => caption.length)
      );

      const iconWidth = this.dropDowniconWidthInInputsInPxForWidthCalculation;
      const charWidth = this.WCharacterWidthInPxForWidthCalculation; // approximate pixels per character

      /*rigthIconWidthAndPaddingInDropDownInPxForWidthCalculation in this variable
      18 is added for the select(rigth) icon when open dropdown list
      16px is padding between text and icon is not added
      18px icon rigth icon size and 16px rigth side padding */


      // Calculate width based on character count
      baseWidth = Math.max(
        maxCaptionLength * charWidth + iconWidth + this.rigthIconWidthAndPaddingInDropDownInPxForWidthCalculation,
        150 // Base width as a minimum
      );
    }
    return Math.min(baseWidth);
  }

  private resetHeaderCellWidths() {
    // Reset all header cells to auto width for accurate measurement
    this.headerCells.forEach((headerCellRef) => {
      const headerCell = headerCellRef.nativeElement;
      headerCell.style.width = '';
      headerCell.style.minWidth = '';
      headerCell.style.maxWidth = '';
      headerCell.style.visibility = '';
      headerCell.style.overflow = '';
      headerCell.style.textOverflow = '';
      headerCell.style.whiteSpace = '';
    });
  }

  private resetBodyCellWidths() {
    // Reset all body cells to auto width for accurate measurement
    this.bodyCells.forEach((bodyCellRef) => {
      const bodyCell = bodyCellRef.nativeElement;
      bodyCell.style.width = '';
      bodyCell.style.minWidth = '';
      bodyCell.style.maxWidth = '';
      bodyCell.style.visibility = '';
      bodyCell.style.overflow = '';
      bodyCell.style.textOverflow = '';
      bodyCell.style.whiteSpace = '';
    });
  }

  private applyColumnWidths(onlyNewRows: boolean = false) {
    // 1. Apply to Headers (Skip if we are only updating new rows)
    if (!onlyNewRows) {
      this.headerCells.forEach((headerCellRef) => {
        const headerCell = headerCellRef.nativeElement;
        const columnClass = Array.from(headerCell.classList).find((cls) =>
          cls.startsWith('mat-column-'),
        );

        if (columnClass) {
          const columnName = columnClass.replace('mat-column-', '');
          // Use the Class Property Cache
          const width = this.cachedColumnWidths.get(columnName);

          if (width !== undefined) {
            headerCell.style.width = `${width}px`;
            headerCell.style.minWidth = `${width}px`;
            headerCell.style.maxWidth = `${width}px`;
            if (width === 0) {
              headerCell.style.visibility = 'hidden';
            } else {
              headerCell.style.visibility = 'visible';
              headerCell.style.overflow = 'hidden';
              headerCell.style.textOverflow = 'ellipsis';
              headerCell.style.whiteSpace = 'nowrap';
            }
          }
        }
      });
    }

    // 2. Apply to Body Cells
    this.bodyCells.forEach((bodyCellRef) => {
      const bodyCell = bodyCellRef.nativeElement;

      // If adding a new row, skip cells that already have width
      if (onlyNewRows && bodyCell.style.width) {
        return;
      }

      const columnClass = Array.from(bodyCell.classList).find((cls) =>
        cls.startsWith('mat-column-'),
      );

      if (columnClass) {
        const columnName = columnClass.replace('mat-column-', '');
        // Use the Class Property Cache
        const width = this.cachedColumnWidths.get(columnName);

        if (width !== undefined) {
          bodyCell.style.width = `${width}px`;
          bodyCell.style.minWidth = `${width}px`;
          bodyCell.style.maxWidth = `${width}px`;

          if (width === 0) {
            bodyCell.style.visibility = 'hidden';
          } else {
            bodyCell.style.visibility = 'visible';
            bodyCell.style.overflow = 'hidden';
            bodyCell.style.textOverflow = 'ellipsis';
            bodyCell.style.whiteSpace = 'nowrap';
          }
        }
      }
    });

    // 3. Fix Layout
    const tableElement = document.querySelector(
      '.acty-grid-table',
    ) as HTMLElement;
    if (tableElement) {
      tableElement.style.tableLayout = 'fixed';
    }
  }

  async onPageChange(e: any): Promise<void> {
    const replySubject = new Subject<boolean>();
    let isValid = false;

    if (this.hasInitialLoad() == false) {
      return;
    }

    this.onGridActionRequest.emit({
      notifier: replySubject,
    });

    if (this.isAllDataLoad() || this.skipMasterFilterValidation()) {
      isValid = true;
    } else {
      isValid = await firstValueFrom(replySubject.pipe(take(1)));
    }
    if (isValid) {
      const newPage = e.pageIndex;
      const previouspageIndex = e.previousPageIndex;
      this.currentPageSize.set(e.pageSize);

      if (!this.isAllDataLoad()) {
        if (this.hasGridChanges()) {
          const result = await this.confirmChanges();

          // CANCEL → stay on same page
          if (!result.proceed || this.confirmChangesResult == 0) {
            this.paginator.pageIndex = previouspageIndex;
            return;
          }

          if (this.confirmChangesResult == 2) {
            this.isSaveFromPaginator = true;
            this.paginator.pageIndex = previouspageIndex;
          }
        }
      }

      this.loader.increment(this.formLoaderKey());

      this.initializeColumnWidths();
      this.resetRowSelection();
      if (this.showDetailView) {
        this.detailViewToggle();
      }
      //this.updateScrollHeight();

      if (this.visibleDataList.data.length > 0) {
        if (!this.isParentChild() && !this.isAllDataLoad()) {
          if (!this.getDataUrl()) {
            this.entryGetData.emit({
              pageSize: this.paginator.pageSize,
              pageIndex: this.paginator.pageIndex,
              sortType: this.sortDirection,
              sortColumn: this.sortColumn,
              gridFilters: this.filterObj,
              previousPageIndex: previouspageIndex,
            });
          }
        } else if (this.isParentChild()) {
          this.parentChildGetData.emit({
            pageSize: this.paginator.pageSize,
            pageIndex: this.paginator.pageIndex,
            sortType: this.sortDirection,
            sortColumn: this.sortColumn,
            gridFilters: this.filterObj,
            previousPageIndex: previouspageIndex,
          });
        }
      }

      this.loader.decrement(this.formLoaderKey());
    } else {
      this.paginator.pageIndex = e.previousPageIndex;
      //TODO : Currently resetting pageIndex manually. Check if MatPaginator built-in previousPage() method that can be used instead.
      //this.paginator.previousPage()
    }
  }

  conditionOperatorMap: { [key: string]: number } = {
    startswith: 1,
    contains: 2,
    notcontains: 3,
    endswith: 4,
    equals: 5,
    notequals: 6,
    lessthan: 7,
    greaterthan: 8,
    dateis: 9,
    dateisnot: 10,
    dateisbefore: 11,
    dateisafter: 12,
  };

  matchModeMap: { [key: string]: number } = {
    all: 1, // MatchAll
    any: 2, // MatchAny
  };

  postData(url: string, body: any): Observable<any> {
    return this.http.post(url, body);
  }

  http = inject(HttpClient);

  getColumnDateFormat(clm: string): string | undefined {
    const columnData = this._dataGrid().find((c: GRID) => c.dataField === clm);

    if (!columnData) return undefined;

    const dateFormat = columnData.dateFormat;

    if (!dateFormat) return undefined;

    return dateFormat;
  }

  resetRowSelection(): void {
    //if reset row selection is block then not reset row selection
    if (this.isBlockResetRowSelection) {
      return;
    }
    if (this.selectionMode() === 'single') {
      const paginator = this.paginator;
      const index = paginator ? paginator.pageIndex * paginator.pageSize : 0;

      if (!this.visibleDataList?.data?.length) {
        return;
      }
      if (this.resetDefaultSelectedRow) {
        this.selectRow(this.resetDefaultSelectedRow);
        return;
      }

      // Validate index is within range
      if (index < 0 || index >= this.visibleDataList.data.length) {
        return;
      }

      const row = this.visibleDataList.data[index];

      if (row?.rowid == null) {
        return;
      }

      if (!this.selection().isSelected(Number(row.rowid))) {
        requestAnimFrame(() => {
          this.selectRow(Number(row.rowid));
        });
      }
      this.tableContainer.nativeElement.scrollTop = 0;
    } else {
      requestAnimFrame(() => {
        if (this.selection().hasValue()) this.selection().clear();
      });
    }
  }

  onDetailViewTabChange(e: any): void {
    this.updateScrollHeight();
  }

  // get showTableOptions(): boolean {
  //   return this.showExport() || this.showSwapColumns() || this.showSortData();
  // }

  // Note : Button Set Direcly. So, Remove a table Option so comment Below code
  // onClickMenuButtons(event: any, btnName: string) {
  //   if (btnName === 'CORE.GRID.TableOptions') {
  //     this.onTableOptionsClick(event);
  //   }
  // }

  // onTableOptionsClick(item: any): void {
  //   switch (item.id) {
  //     case '1':
  //       this.requestFilterValue.emit();
  //       this.openExportDataDialog();
  //       break;
  //     case '2':
  //       this.openColumnSwapDialog();
  //       break;
  //     case '3':
  //       this.openSortDataDialog();
  //       break;
  //   }
  // }

  // get hasGridCaption(): boolean {
  //   return (
  //     this.GridMenuBtns()?.length > 0 ||
  //     (this.isCellSummary() && !this.isEditableGrid()) ||
  //     this.showTableOptions
  //   );
  // }
  get GridState(): { [key: string]: any } {
    return {
      isSearched: this._dataList() != null,
      selectedRowId: this.selection().selected[0],
      dtSortField: this.sortColumn,
      dtSortOrder:
        this.sortDirection === 'asc'
          ? 1
          : this.sortDirection === 'desc'
            ? -1
            : undefined,
      dtFilter: this.gridFilter(),
      dtRowsPerPage: this.paginator?.pageSize,
      gridOpsToggleState: this.gridOpsToggleState,
    };
  }
  async setGridState(value: { [key: string]: any }) {
    if (!value) return;
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
    // Apply the values to component properties
    if (value['selectedRowId'] !== undefined) {
      this.resetDefaultSelectedRow = value['selectedRowId'];
    }
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
    if (
      value['dtRowsPerPage'] !== undefined &&
      value['dtRowsPerPage'] !== null &&
      this.paginator
    ) {
      this.paginator.pageSize = value['dtRowsPerPage'];
    }
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
    if (value['dtSortField'] !== undefined && value['dtSortField'] !== '') {
      this.sortColumn = value['dtSortField'];

      if (value['dtSortOrder'] === 1) {
        this.sortDirection = 'asc';
      } else if (value['dtSortOrder'] === -1) {
        this.sortDirection = 'desc';
      } else {
        this.sortDirection = '';
      }
    }
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
    if (value['gridOpsToggleState'] !== undefined) {
      this.gridOpsToggleState = value['gridOpsToggleState'];
      this.onGridOpsToggle(this.gridOpsToggleState);
    }
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));

    if (value['dtFilter'] !== undefined) {
      this.gridFilter.set([]);
      this.gridFilter.set(value['dtFilter']);
    }
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
  }

  copyRowData(): void {
    this.selectedData = this.selectedRows.map((row) => ({ ...row }));
    if (!this.selectedData || this.selectedData.length === 0) {
      return;
    }
    //set null which column is auto increment
    this.selectedData.forEach((row) => {
      // Remove the changedCells property
      if ('changedCells' in row) {
        delete row.changedCells;
      }
      this._dataGrid().forEach((col: GRID) => {
        if (col.isAutoGenerate && col.dataField in row) {
          row[col.dataField] = null;
        }
      });
    });

    const copyData: GRID[] = [];
    const autoGenColumns = this._dataGrid()
      .filter((col: GRID) => col.isAutoGenerate || col.isPrimaryKey)
      .map((col: GRID) => col.dataField);

    this.selectedData.forEach((row: any) => {
      const newRow = { ...row }; // shallow clone

      // Reset autogenerate columns
      autoGenColumns.forEach((colName: string) => {
        newRow[colName] = null;
      });

      // Assign new row ID
      newRow._isNew = true;

      copyData.push(newRow);
    });
    this.copiedRows = copyData;
  }

  pasteRowData(): void {
    const copiedRowsData = structuredClone(this.copiedRows);
    copiedRowsData.forEach((item: any) => {
      item.rowid = this.nextRowId;
      this.nextRowId += 1;
    });

    const selectedRowId = this.selectedData[0].rowid;
    const selectedIndex = this.visibleDataList.data.findIndex(
      (r) => r.rowid === selectedRowId,
    );
    if (this.selectedData && this.selectedData.length === 1) {
      if (selectedIndex !== -1) {
        this.visibleDataList.data.splice(
          selectedIndex + 1,
          0,
          ...copiedRowsData,
        );
      } else {
        this.visibleDataList.data.unshift(...copiedRowsData);
      }
    } else {
      this.visibleDataList.data.unshift(...copiedRowsData);
    }
    if (!this.letParentMaintainCellChanges()) {
      copiedRowsData.forEach((row: any) => {
        this.DataChangeDetected.netRowChangeCounterIncrement();
      });
    }
    if (this.letParentMaintainCellChanges()) {
      this.pasteRowValue.emit(copiedRowsData[0]);
    }
    this.visibleDataList.data = [...this.visibleDataList.data];

    if (!this.isAllDataLoad()) {
      const pageSize = this.paginator?.pageSize;

      if (this.visibleDataList.data.length > pageSize) {
        this.visibleDataList.data.splice(pageSize);
        this.visibleDataList.data = [...this.visibleDataList.data];
      }
    }

    const dataListCurrent = this.dataList();
    if (this.selectionMode() === 'single') {
      const dataListIndex = this.dataList().findIndex(
        (item) => item.rowid === selectedRowId,
      );
      dataListCurrent.splice(dataListIndex + 1, 0, ...copiedRowsData);
    } else {
      dataListCurrent.splice(0, 0, ...copiedRowsData);
    }
    this.dataList.set([...dataListCurrent]);

    // Update paginator total count
    const currentTotal = this.paginatorValues()?.TotalData ?? 0;
    this.paginatorValues.set({
      TotalData: currentTotal + copiedRowsData.length,
    });

    if (!this.blockRowSelectionChange()) {
      this.selection().toggle(copiedRowsData[0].rowid);
    }
    setTimeout(() => {
      this.applyColumnWidths(true);
    });
    // 2025/11/14 - commented because renderRows can sometimes gives error when matTable is processing dataSource
    //this.actyGridTable.renderRows();
  }

  async copyRowsToClipboard(): Promise<void> {
    // 1. Check if there is data to copy
    if (!this.selectedRows || this.selectedRows.length === 0) {
      return;
    }

    // 2. Get columns in order to ensure data maps correctly
    // We map over the columns to create a tab-separated string for each row
    const columns = this._dataGrid();

    const tsvData = this.selectedRows
      .map((row) => {
        return columns
          .map((col: GRID) => {
            // Handle null/undefined values to avoid printing 'undefined'
            const val = row[col.dataField];
            return val === null || val === undefined ? '' : val;
          })
          .join('\t');
      })
      .join('\n');

    // 3. Write to system clipboard
    try {
      await navigator.clipboard.writeText(tsvData);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  async pasteRowsFromClipboard(): Promise<void> {
    try {
      // 1. Read text from clipboard
      const textData = await navigator.clipboard.readText();
      if (!textData) {
        return;
      }

      // 2. Parse Rows (split by new line)
      const rows = textData.split(/\r?\n/).filter((row) => row.trim() !== '');

      const columns = this._dataGrid();
      const autoGenColumns = columns
        .filter((col: GRID) => col.isAutoGenerate || col.isPrimaryKey)
        .map((col: GRID) => col.dataField);

      // 3. Map parsed text to Row Objects
      const newRowsData: any[] = rows.map((line) => {
        const values = line.split('\t');
        const newRow: any = {};

        // Assign values to columns based on index
        columns.forEach((col: GRID, index: number) => {
          // Logic from copyRowData: Reset auto-gen columns to null
          if (autoGenColumns.includes(col.dataField)) {
            newRow[col.dataField] = null;
          } else if (col.useValueWhenCopy && col.useValueWhenCopy !== 'copiedDataValue') {
            const copyValueKey = col.useValueWhenCopy as keyof GRID;
            newRow[col.dataField] = col[copyValueKey];
          } else {
            // Assign value from clipboard or null if index matches nothing
            newRow[col.dataField] =
              values[index] !== undefined ? values[index] : null;
          }
        });

        // Logic from copyRowData: Mark as new
        newRow._isNew = true;
        return newRow;
      });

      // 4. Assign Row IDs (Logic from pasteRowData)
      newRowsData.forEach((item: any) => {
        item.rowid = this.nextRowId;
        this.nextRowId += 1;
      });

      // 5. Determine Insertion Index
      let selectedIndex = -1;
      let selectedRowId = -1;

      if (this.selectedData && this.selectedData.length > 0) {
        selectedRowId = this.selectedData[0].rowid;
        selectedIndex = this.visibleDataList.data.findIndex(
          (r) => r.rowid === selectedRowId,
        );
      }

      // 6. Insert into Visible Data List
      if (
        this.selectedData &&
        this.selectedData.length === 1 &&
        selectedIndex !== -1
      ) {
        this.visibleDataList.data.splice(selectedIndex + 1, 0, ...newRowsData);
      } else {
        this.visibleDataList.data.unshift(...newRowsData);
      }

      // 7. Handle Cell Changes / Events
      if (!this.letParentMaintainCellChanges()) {
        newRowsData.forEach((row: any) => {
          this.DataChangeDetected.netRowChangeCounterIncrement();
        });
      }
      if (this.letParentMaintainCellChanges() && newRowsData.length > 0) {
        this.pasteRowValue.emit(newRowsData[0]);
      }

      // Update reference to trigger change detection if necessary
      this.visibleDataList.data = [...this.visibleDataList.data];

      // 8. Handle Pagination
      if (!this.isAllDataLoad()) {
        const pageSize = this.paginator?.pageSize;
        if (this.visibleDataList.data.length > pageSize) {
          this.visibleDataList.data.splice(pageSize);
          this.visibleDataList.data = [...this.visibleDataList.data];
        }
      }

      // 9. Update Master DataList
      const dataListCurrent = this.dataList();
      if (this.selectionMode() === 'single' && selectedIndex !== -1) {
        // Find index in the main list (in case it differs from visible list)
        const dataListIndex = this.dataList().findIndex(
          (item) => item.rowid === selectedRowId,
        );
        if (dataListIndex !== -1) {
          dataListCurrent.splice(dataListIndex + 1, 0, ...newRowsData);
        } else {
          // Fallback if ID not found
          dataListCurrent.splice(0, 0, ...newRowsData);
        }
      } else {
        dataListCurrent.splice(0, 0, ...newRowsData);
      }

      this.dataList.set([...dataListCurrent]);

      // Update paginator total count
      const currentTotal = this.paginatorValues()?.TotalData ?? 0;
      this.paginatorValues.set({
        TotalData: currentTotal + newRowsData.length,
      });

      // 10. Update Selection
      if (!this.blockRowSelectionChange() && newRowsData.length > 0) {
        this.selection().toggle(newRowsData[0].rowid);
      }

      setTimeout(() => {
        this.applyColumnWidths(true);
      });
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        notify({ message: 'MESSAGE.COM_W0008' });
        return;
      }
      throw err;
    }
  }

  hasGridChanges(): any {
    const hasNewOrChanged = this.visibleDataList.data.some(
      (row: any) => row._isNew === true || row.changedCells?.length > 0,
    );

    // check deleted from _dataList because those rows are removed from visibleDataList
    const hasDeleted = this._dataList().some(
      (row: any) => row._isDelete === true,
    );

    return hasNewOrChanged || hasDeleted;
  }
  //change detect check
  async confirmChanges(): Promise<changesReturn> {
    //when any changes is not available in
    if (
      this.DataChangeDetected.dataChangeList.length === 0 &&
      this.DataChangeDetected.netRowChangeCounter === 0
    ) {
      return { proceed: true, hasChanges: true };
    }
    const isGridChanged = this.hasGridChanges();
    if (!isGridChanged) {
      return { proceed: true, hasChanges: false }; // No changes, proceed without confirmation
    }

    const result = await this.msgDialogService.show({
      messageData: { message: 'MESSAGE.COM_C0001' },
      header: 'CORE.GRID.confirmation',
      buttons: [
        {
          label: 'キャンセル',
          severity: 'primary',
        },
        {
          label: 'いいえ',
          severity: 'primary',
        },
        {
          label: 'はい',
          severity: 'primary',
        },
      ],
      onClose: () => 0,
    });
    this.confirmChangesResult = result;
    if (result === 2) {
      // YES pressed then check data is contain any invalid cells
      const isSaveData = await this.saveData(); //update data
      if (isSaveData) {
        this.DataChangeDetected.dataChangeListReset();
        this.DataChangeDetected.netRowChangeCounterReset();
        return { proceed: true, hasChanges: true }; // Proceed with save if success
      }
    } else if (result === 1) {
      this.DataChangeDetected.dataChangeListReset();
      this.DataChangeDetected.netRowChangeCounterReset();
      // NO pressed
      return { proceed: true, hasChanges: true }; // Proceed without saving
    }
    // Default return to handle unexpected cases
    return { proceed: false, hasChanges: false };
  }

  //Check References Screen or not
  isReferenceScreenAvailable(column: GRID): boolean {
    return column.isReferenceScreenVisibleInGrid ? true : false;
  }

  getReferencesTableName(column: GRID): string {
    if (column.isReferenceScreenVisibleInGrid) {
      return column?.referenceScreenId ?? '';
    }
    return '';
  }

  getReferenceTitleCaption(column: GRID): string {
    if (column.isReferenceScreenVisibleInGrid) {
      return column.caption;
    }
    return '';
  }

  async getQueryIdForReferenceScreen(column: GRID): Promise<string> {
    if (column.isReferenceScreenVisibleInGrid && column.referenceScreenId) {
      const referenceScreenData =
        await this.referenceScreenService.getReferenceData(
          column.referenceScreenId,
        );
      return referenceScreenData.refQueryID ?? '';
    }
    return '';
  }

  isPrimaryKeyColumn(colNm: string) {
    return this._dataGrid().find(
      (item: GRID) =>
        item?.isPrimaryKey === true &&
        item?.ignorePrimaryKeyinPC !== true &&
        item?.dataField === colNm,
    )
      ? true
      : false;
  }
  isAutoGenerateColumn(column: GRID): boolean {
    return column.isAutoGenerate ? true : false;
  }

  isEditableCell(column: GRID, row: any): boolean {
    // Check if the row is marked for deletion
    const isDeleted = row?._isDelete ?? false;

    // Check if the column is editable, the row is selected, the column is not auto-generated, and the row is not deleted
    return (
      !isDeleted &&
      this.editableMap[column.dataField] &&
      this.selection().isSelected(row.rowid) &&
      !this.isAutoGenerateColumn(column)
    );
  }

  isEditableCheckboxCell(column: GRID, row: any): boolean {
    const isDeleted = row?._isDelete ?? false;

    return !isDeleted && this.editableMap[column.dataField];
  }

  // when data is selected from reference screen this function will be ececuted to set that data
  async onReferenceDataSelected(
    event: {
      gridId: string;
      refForColumn: string;
      selectedValue: string;
      mainScreenColumnValues: { key: string; value: string }[];
      rowId: number;
      tabId?: string;
      refTitleCaption: string;
    },
    rowData: any,
  ): Promise<void> {
    if (rowData.rowid !== event.rowId) {
      return;
    }
    const rowId = event.rowId;
    if (rowId === -1) {
      return;
    }
    if (event.gridId === this.gridId() && event.tabId === this.tabId()) {
      for (const { key, value } of event.mainScreenColumnValues) {
        // Convert first character to uppercase
        const capitalizedKey = key;

        // Check with capitalized version
        if (capitalizedKey in rowData) {
          (rowData as Record<string, any | null>)[capitalizedKey] = value;
        }
      }

      event.mainScreenColumnValues.forEach((columnValue: any) => {
        const columnNm = columnValue.key;
        const column = this._dataGrid().find(
          (col: GRID) => col.dataField === columnNm,
        );

        if (column?.isEditable) {
          this.onRowDataUpdate(rowData, column);
        }

        column?.onChangeCallback?.(rowData);
      });

      // Clear ref screen data
      this.refScreenOnRowData.set({
        referenceScreenId: '',
        refRelations: [],
        rowId: -1,
        refForColumn: '',
        gridId: '',
        tabId: '',
        selectedValue: '',
      });
      if (
        (event.selectedValue === '' ||
          event.selectedValue === null ||
          event.selectedValue === undefined) &&
        rowData
      ) {
        const InvalidMessage = [
          {
            [event.refForColumn]: {
              message: 'MESSAGE.COM_E0015',
              params: {
                refTitleCaption: this.translate.instant(event.refTitleCaption),
              },
            },
          },
        ];
        this.addInvalidCells(rowData, InvalidMessage);
      }
    }
  }

  /**
   * When done input then this is executed
   * @param rowData
   * @param column
   * @param hasReferenceScreen
   */
  onInputFinished(
    rowData: any,
    column: GRID,
    ignoreReferenceScreen = false,
  ): void {
    const hasReferenceScreen = column.isReferenceScreenVisibleInGrid
      ? true
      : false;
    // if it has reference screen then get its ref data by setting this.refScreenOnRowData
    if (hasReferenceScreen && !ignoreReferenceScreen) {
      this.setRefScreenRowData(rowData, column);
    }
    if (column.onChangeCallback) {
      column.onChangeCallback(rowData);
    }
    const rowChangeObj = {
      row: rowData,
      column: column,
      dataGrid: this._dataGrid(),
    };

    this.updateRefScreenDefaultValue(rowData, this.tabId(), this.gridId());

    this.onCellFocusChange.emit(rowChangeObj);
  }

  /**
   * function will set refScreenOnRowData which is used for getting reference data without opening the reference screen
   * @param rowData
   * @param column
   */
  setRefScreenRowData(rowData: any, column: GRID): void {
    if (
      column &&
      rowData[column.dataField] !== null &&
      rowData[column.dataField] !== ''
    ) {
      /**
       * refScreenOnRowData is given as input in reference button which searches for data
       * based on refScreenOnRowData set here.
       */
      this.refScreenOnRowData.set({
        referenceScreenId: column.referenceScreenId ?? '',
        refRelations: column.refRelations ?? [],
        gridId: this.gridId(),
        rowId: rowData.rowid,
        tabId: this.tabId(),
        refForColumn: column.dataField,
        selectedValue: rowData[column.dataField],
      });
    } else if (column) {
      column.refRelations?.forEach((refRelation: refScreenRelations) => {
        if (refRelation.mainScreenColumnName) {
          rowData[
            refRelation.mainScreenColumnName.replace(/\b\w/g, (char) =>
              char.toUpperCase(),
            )
          ] = null;
        }
      });
    }
  }

  // Development code below. For tabular grid

  isEditableColumn(column: GRID): boolean {
    if (!this.isEditableGrid()) {
      return false;
    }
    return !this.isAutoGenerateColumn(column) && column.isEditable
      ? column.isEditable
      : false;
  }

  isRequiredColumn(column: GRID): boolean {
    return column.isRequired ? column.isRequired : false;
  }

  isWrappedOrFirst(first: boolean): boolean {
    if (first) return true;
    return false;
  }

  /**
   * Generates a comprehensive professional tooltip with all column metadata
   * Each property is displayed on a separate line for clear readability
   */
  getColumnTooltip(column: string): string {
    return '';
    /*const gridColumn = this._dataGrid().find(
      (col: GRID) => col.dataField === column
    );

    if (!gridColumn) {
      return column;
    }

    const tooltipLines: string[] = [];

    if (gridColumn.isEditable) {
      tooltipLines.push('入力項目: はい');
    } else {
      tooltipLines.push('入力項目: エアー');
    }

    if (gridColumn.isRequired) {
      tooltipLines.push('必須入力項目');
    }

    return tooltipLines.join('\n');*/
  }

  isCellUpdated(column: string, row: any): boolean {
    if (row.changedCells?.length > 0 && row.changedCells.includes(column)) {
      return true;
    }
    return false;
  }

  hasRowError(row: any): boolean {
    return row.invalidCells && row.invalidCells.length > 0;
  }

  hasColumnError(column: GRID, row: any): boolean {
    // Check if this column has any error in invalidCells
    if (row.invalidCells && row.invalidCells.length > 0) {
      return row.invalidCells.some((invalidCell: any) => {
        // Check if this invalidCell object has the column as a key
        return (
          invalidCell.hasOwnProperty(column.dataField) ||
          (column.isPrimaryKey &&
            column?.ignorePrimaryKeyinPC !== true &&
            invalidCell.hasOwnProperty('PrimaryKeyColumns'))
        );
      });
    }

    return false;
  }

  isRequireColumnContainData(column: GRID, row: any): boolean {
    const isDynamicallyRequired =
      Array.isArray(row?.childOperations?.requiredFields) &&
      row.childOperations.requiredFields.includes(column.dataField);

    if (
      column.isEditable === true &&
      (column?.isRequired ||
        isDynamicallyRequired ||
        (column?.isPrimaryKey && column?.isAutoGenerate !== true))
    ) {
      if (
        row[column?.dataField] === null ||
        row[column?.dataField] === '' ||
        row[column?.dataField] === undefined
      )
        return true;
    }
    return false;
  }
  // Get all rows for a given ColumnGroup
  /*getRowsForGroup(groupNo: number): number[] {
    const rows = this._dataGrid()
      .filter((c) => Number(c.columnGroupNumber) === groupNo && !c.isGridIgnore &&  (c.dataField === "Itemcd" ||  c.dataField === "Productcd"))
      .map((c) => Number(c.rowIndex));
    return Array.from(new Set(rows)).sort((a, b) => a - b);
  } //

  // Get columns for a given row AND column group
  getFieldsForRow(rowNo: number, groupNo: number): any[] {
    return this._dataGrid().filter(
      (c) =>
        Number(c.rowIndex) === rowNo &&
        Number(c.columnGroupNumber) === groupNo &&
        !c.isGridIgnore && (c.dataField === "Itemcd" ||  c.dataField === "Productcd")
    );
  } //

  getColumnGroups(): number[] {
    const dataGrid = this._dataGrid();

    if (!dataGrid || !Array.isArray(dataGrid)) {
      return [1]; // Return default group if no data
    }

    // Get unique ColumnGroupNumber values from visible columns
    const uniqueGroups = new Set<number>();

    dataGrid.forEach((column: GRID) => {
      // Only consider visible columns that have ColumnGroupNumber
      if (column.IsVisibleInGrid !== false && column.columnGroupNumber) {
        const groupNumber = Number(column.columnGroupNumber);
        if (!isNaN(groupNumber) && (column.dataField === "Itemcd" ||  column.dataField === "Productcd")) {
          uniqueGroups.add(groupNumber);
        }
      }
    });

    // Convert Set to array and sort
    const groups = Array.from(uniqueGroups).sort((a, b) => a - b);

    // Return sorted groups, or default to [1] if no groups found
    return groups.length > 0 ? groups : [1];
  }*/

  getColumnGroups(): number[] {
    return this.cachedColumnGroups;
  }

  // O(1) Lookup
  getRowsForGroup(groupNo: number): number[] {
    return this.cachedRowsByGroup.get(groupNo) || [];
  }

  // O(1) Lookup
  getFieldsForRow(rowNo: number, groupNo: number): any[] {
    const key = `${groupNo}_${rowNo}`;
    return this.cachedFieldsKeyMap.get(key) || [];
  }

  getAllRows(): number[] {
    return this.cachedAllRows;
  }

  private columnMaxLengthWidths: { [key: string]: string } = {};

  generateColumnMaxLengthWidth(): void {
    const dataGrid = this._dataGrid();

    if (!dataGrid || !Array.isArray(dataGrid)) {
      return;
    }

    // No need to fetch metadata anymore, use properties directly from GRID
    this.columnMaxLengthWidths = {};

    dataGrid.forEach((column) => {
      if (column.IsVisibleInGrid !== false && column.dataField) {
        this.columnMaxLengthWidths[column.dataField] =
          this.calculateColumnWidth(column);
      }
    });
  }

  private calculateColumnWidth(column: GRID): string {
    // Default widths based on editor type
    const typeWidths: { [key: string]: string } = {
      '1': '120px', // text
      '2': '120px', // number
      '3': '150px', // date
      '4': '150px', // dropdown
      '5': '50px', // checkbox
      '6': '50px', // checkbox
    };

    let baseWidth = typeWidths[column.editorType] || '150px';
    const baseWidthValue = parseInt(baseWidth, 10);

    // Logic for String Types (Editor Type 1)
    if (column.editorType === '1') {
      const charLength = column.maxLength || 0;
      const iconWidth = column.isReferenceScreenVisibleInGrid
        ? this.iconWidthInInputsInPxForWidthCalculation
        : 0;
      if (charLength > 0) {
        const charWidth = this.WCharacterWidthInPxForWidthCalculation; // approximate pixels per character
        const calculatedWidth = Math.max(
          charLength * charWidth + iconWidth,
          baseWidthValue, // Use base width as minimum
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
        baseWidthValue, // Use base width as minimum
      );
      // Cap at 300px for numbers
      baseWidth = `${Math.min(calculatedWidth)}px`;
    }
    else if (column.editorType === '4' && column?.isEditable) {
      const memberList = column?.memberList;
      if (memberList?.length) {
        // Calculate the maximum caption length, including spaces
        const captionCache = memberList.map(item => this.translate.instant(item.caption));

        const maxCaptionLength = Math.max(
          ...captionCache.map(caption => caption.length)
        );

        const iconWidth = this.rigthIconWidthAndPaddingInDropDownInPxForWidthCalculation + this.dropDowniconWidthInInputsInPxForWidthCalculation;
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

  // Get width for a specific column
  getColumnMaxlengthWidth(column: GRID): string {
    //return '100%';
    if (column && column.tabularValueWidthpx) {
      // If the column has a tabularValueWidth, return that value
      return column.tabularValueWidthpx + 'px'; // assuming tabularValueWidth is a number
    }
    return this.columnMaxLengthWidths[column.dataField] || '150px';
  }

  //when parent select two row and child selete two row(both different parent) and when unselected any one parent then unselete that row form child
  async changeRowSeletectionBasedOnParent(data?: any) {
    this.selection().clear();
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
    const getOldSelectedRowId = this.getMatchedRowIds(
      this.visibleDataList.data,
      data,
    );
    this.selectRow(getOldSelectedRowId);
  }

  //get row id list for selecte row
  getMatchedRowIds(dataList: any[], selectedRow: any[]): number[] {
    const matchedRowIds: number[] = [];
    if (selectedRow && selectedRow.length > 0) {
      // Iterate through each selected row
      selectedRow.forEach((selectedItem) => {
        // Find all matching items in dataList where parentRowId matches the selected row's parentRowId
        const matchedItems = dataList.filter((item) => {
          const hasValidParentId = selectedItem.parentRowId != null;
          return (
            hasValidParentId && item.parentRowId === selectedItem.parentRowId
          );
        });
        // Collect the rowid values of the matched items
        matchedItems.forEach((matchedItem) => {
          matchedRowIds.push(matchedItem.rowid);
        });
      });

      return matchedRowIds;
    } else {
      return [];
    }
  }

  selectRow(rowid: number | number[]): void {
    if (!this.blockRowSelectionChange()) {
      const idsToSelect = Array.isArray(rowid) ? rowid : [rowid];
      this.selection().select(...idsToSelect);
      this.SelecteChange.emit(this.selectedRows);
    }
  }

  getColumnMaxLength(column: GRID): number | undefined {
    return column?.maxLength;
  }

  hasSuffixIcon(column: GRID): boolean {
    return (
      this.isReferenceScreenAvailable(column) ||
      column.editorType === '3' ||
      column.editorType === '4' ||
      column.isProtected === true
    );
  }

  onInputInternalHintChange(
    event: MessageDisplayOption | undefined,
    row: any,
    column: GRID,
  ): void {
    // Added setTimeout because this should run after onRowDataUpdate. As onRowDataUpdate will remoce the error and we dont want immediate removal.
    setTimeout(() => {
      if (
        !event ||
        !event.message ||
        event.message.trim() === '' ||
        event.type !== 'error'
      ) {
        return; // Exit the function early if message is empty
      }
      const invalidData = {
        message: event?.message ?? '',
        params: event?.params ?? {},
      };
      this.addInvalidCells(row, [{ [column.dataField]: invalidData }]);
    });
  }
  //open calender popup of date-time component
  openCalendarPopup(rowId: number, columnName: string) {
    requestAnimFrame(() => {
      const columnClass = `acty-date-column-${columnName}-rowid-${rowId}`;
      this.dateTimeList.toArray().forEach((component, index) => {
        const elementRef = this.dateTimeElements.toArray()[index];
        // Check if the element has a specific class
        const hasClass =
          elementRef.nativeElement.classList.contains(columnClass);
        if (hasClass && component) {
          //component.openCalendar();
        }
      });
    });
  }

  openDropDownList(rowId: number, columnName: string) {
    requestAnimFrame(() => {
      const columnClass = `acty-date-column-${columnName}-rowid-${rowId}`;
      this.dropDownList.toArray().forEach((component, index) => {
        const elementRef = this.dropDownElements.toArray()[index];
        // Check if the element has a specific class
        const hasClass =
          elementRef.nativeElement.classList.contains(columnClass);
        if (hasClass && component) {
          component.openDropDown();
        }
      });
    });
  }


  shouldSyncMinWidth(isFirstField: boolean, rowIndex: number): boolean {
    if (!isFirstField) return false;
    return rowIndex === 0;
  }

  get isFooterVisible(): boolean {
    return this.showPaginator() && this.showGridButtonContainer();
  }

  isPrimaryColumnOfNewRow(column: GRID, row: any): boolean {
    if (column.isPrimaryKey && column?.ignorePrimaryKeyinPC !== true) {
      return row._isNew ?? false;
    }
    return true;
  }

  async markAllAsDeleted(): Promise<void> {
    if (this._dataList() && this._dataList().length > 0) {
      this._dataList().forEach((row) => {
        row._isDelete = true;
      });
    }
  }

  async copyAllRows(): Promise<any[]> {
    const cloneDataListrows = structuredClone(this.dataList());
    if (cloneDataListrows && cloneDataListrows.length > 0) {
      cloneDataListrows.forEach((row) => {
        row._isNew = true;
      });
    }
    this.dataList.set(cloneDataListrows);
    return cloneDataListrows;
  }

  //set cell summary dialog in spefic locations(show inside paginations)
  getCellSummaryPosition() {
    if (this.paginatorContainer) {
      const rect =
        this.paginatorContainer.nativeElement.getBoundingClientRect();
      this.setCellSummaryPosition.set({ x: rect.left, y: rect.top });
    }
    return 0;
  }

  isDetailViewDisable() {
    return !this.isEditableGrid() || !this.isDetailViewEditable();
  }

  buttons = computed<BTN_TYPE[]>(() => {
    const visibility = this.buttonVisibility();

    if (this.isParentChild()) {
      return this.GridMenuBtns().map((btn) => ({
        ...btn,
        IsVisible: visibility[btn.btnId] ?? btn?.IsVisible,
      }));
    }

    const gridBtns = (this.GridMenuBtns() ?? []).map((btn) => ({
      ...btn,
      __buttonType: 'grid' as const,
      IsVisible: visibility[btn.btnId] ?? btn?.IsVisible,
    }));

    const generalBtns = (this.GeneralBtns() ?? []).map((btn) => ({
      ...btn,
      __buttonType: 'general' as const,
      IsVisible: visibility[btn.btnId] ?? btn?.IsVisible,
    }));

    return [...gridBtns, ...generalBtns];
  });

  changeIsVisibleStateOfBtn(
    showInEditableBtnIds: string[],
    showInNonEditableBtnIds: string[],
    isEditable: boolean,
  ) {
    const currentVisibility = this.buttonVisibility();
    const newVisibility = { ...currentVisibility };

    // Collect all existing btnIds from GridMenuBtns + GeneralBtns
    if (
      this.GeneralBtns() &&
      this.GeneralBtns().length > 0 &&
      this.GridMenuBtns() &&
      this.GridMenuBtns().length > 0
    ) {
      const allBtnIds = new Set<string>([
        ...this.GridMenuBtns()
          .filter((b) => b.IsVisible === true)
          .map((b) => b.btnId),

        ...this.GeneralBtns()
          .filter((b) => b.IsVisible === true)
          .map((b) => b.btnId),
      ]);

      // Editable buttons
      showInEditableBtnIds.forEach((btnId) => {
        if (allBtnIds.has(btnId)) {
          newVisibility[btnId] = isEditable;
        }
      });

      // Non-editable buttons
      showInNonEditableBtnIds.forEach((btnId) => {
        if (allBtnIds.has(btnId)) {
          if (btnId === 'fw_GRID_CellSummaryBtn') {
            //when rowFormat is false(when grid is tabular)
            if (this.gridFormat() === 'normal') {
              newVisibility[btnId] = !isEditable;
            } else {
              newVisibility[btnId] = false;
            }
          } else {
            newVisibility[btnId] = !isEditable;
          }
        }
      });

      this.buttonVisibility.set(newVisibility);
    }
  }

  getDropDownData(column: GRID, row?: any) {
    if (row) {
      if (row?.childOperations?.FilterFields) {
        const targetDataField = row?.childOperations?.FilterFields.find(
          (x: any) => x?.targetDataField == column.dataField,
        );
        if (targetDataField && targetDataField?.updatedField == 'memberList') {
          return targetDataField?.updatedValue || [];
        } else {
          return column?.memberList || [];
        }
      } else {
        return column?.memberList || [];
      }
    } else {
      return column?.memberList || [];
    }
  }

  getGridData(): any[] {
    return this.dataList() || undefined;
  }

  private updateRefScreenDefaultValue(row: any, tabId: string, gridId: string) {
    const prefix = `${tabId ? tabId + '.' : ''}${gridId}.`;

    if (!row) {
      this.referenceScreenService.defaultValue.update((prev) => {
        const updatedValue = { ...prev };
        Object.keys(updatedValue).forEach((key) => {
          if (key.startsWith(prefix)) {
            delete updatedValue[key];
          }
        });
        return updatedValue;
      });
      return;
    }

    const keys = Object.keys(row);
    const result: Record<string, any> = {};

    keys.forEach((key) => {
      const colName = `${tabId ? tabId + '.' : ''}${gridId}.${key}`;
      if (this.referenceDefaultValueColNames().includes(colName)) {
        result[colName] = row[key];
      }
    });

    if (Object.keys(result).length) {
      this.referenceScreenService.defaultValue.update((prev) => ({
        ...prev,
        ...result,
      }));
    }
  }
  public executeRowSelection(rowId: number) {
    const blockSelection = typeof this.blockRowSelectionChange === 'function' ? this.blockRowSelectionChange() : false;
    if (!blockSelection) {
      if (this.selectionMode && this.selectionMode() === 'single' && this.selection) {
        this.selection().clear();
      }
      this.selectRow(rowId);
      if (this.cdr) this.cdr.detectChanges();
    }
  }

  // Max depth across all columns
  getMaxHeaderDepth(cols: GRID[] = this._dataGrid(), depth = 1): number {
    return cols.reduce((max, col) => {
      const children = col.childColumns ?? [];
      const d = children.length ? this.getMaxHeaderDepth(children, depth + 1) : depth;
      return Math.max(max, d);
    }, depth);
  }

  // Is this column a leaf (last children)
  isLeafColumn(col: GRID): boolean {
    return !col.childColumns || col.childColumns.length === 0;
  }

  // Count leaf columns beneath col (colspan)
  getColSpan(col: GRID): number {
    if (this.isLeafColumn(col)) return 1;
    return (col.childColumns ?? []).reduce((sum: number, c: GRID) => sum + this.getColSpan(c), 0);
  }

  // Rowspan: fill remaining rows if leaf, else 1
  getRowSpan(col: GRID, currentDepth: number): number {
    if (!this.isLeafColumn(col)) return 1;
    return this.getMaxHeaderDepth() - currentDepth + 1;
  }

  calculateColumnDepths(cols: GRID[], depth = 1): void {
    for (const col of cols) {
      this.columnDepthMap.set(col.dataField, depth);
      if (col.childColumns && col.childColumns.length > 0) {
        this.calculateColumnDepths(col.childColumns, depth + 1);
      }
    }
  }

  getColumnDepth(col: GRID): number {
    return this.columnDepthMap.get(col.dataField) || 0;
  }

  // Flat list of ALL descendants (every depth)
  getAllDescendants(col: GRID): GRID[] {
    const result: GRID[] = [];
    for (const child of col.childColumns ?? []) {
      result.push(child);
      result.push(...this.getAllDescendants(child));
    }
    return result;
  }

  // Only LEAF dataFields — use for DATA ROW displayedColumns
  getLeafColumns(cols: GRID[] = this._dataGrid()): string[] {
    const leafChild: string[] = [];
    for (const col of cols) {
      if (this.isLeafColumn(col)) {
        leafChild.push(col.dataField);
      } else {
        leafChild.push(...this.getLeafColumns(col.childColumns));
      }
    }
    return leafChild;
  }

  // Per-depth header rows - use for mat-header-row [columns]
  // Returns an array where index 0 = depth-1 col names, index 1 = depth-2, etc.
  getHeaderRows(): string[][] {
    const maxDepth = this.getMaxHeaderDepth();
    const rows: string[][] = Array.from({ length: maxDepth }, () => []);

    const traverse = (cols: any[], depth: number) => {
      for (const col of cols) {
        if (!col.isGridIgnore && col.IsVisibleInGrid) {
          rows[depth - 1].push(col.dataField);
          if (!this.isLeafColumn(col)) {
            traverse(col.childColumns, depth + 1);
          }
        }
      }
    };

    traverse(this._dataGrid(), 1);
    if (rows.length > 0) {
      rows[0].unshift('no');

      if (this.selectionMode() === 'multiple') {
        rows[0].splice(1, 0, 'select'); // Insert 'select' after 'no'
      }

      // Add 'actions' column at the end of the first row if actions are visible
      if (this.isActionsVisible()) {
        rows[0].push('actions');
      }
    }
    return rows;
  }

  isPasswordHidden(row: any, rowId: number, dataField: string): boolean {
    if (!this.selection().isSelected(rowId)) {
      return row[`hide_${dataField}`] = true;
    }
    return row[`hide_${dataField}`] ?? true;
  }

  setPasswordHidden(row: any, rowId: number, dataField: string, isHidden: boolean) {
    row[`hide_${dataField}`] = isHidden;
  }

  toggleGridPassword(row: any, rowId: number, dataField: string, event: Event) {
    const currentState = this.isPasswordHidden(row, rowId, dataField);
    this.setPasswordHidden(row, rowId, dataField, !currentState);
  }
}
