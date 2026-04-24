import { AfterViewInit, Component, ElementRef, inject, input, model, NgZone, OnChanges, OnInit, output, signal, Signal, SimpleChanges, ViewChild, ViewChildren, QueryList, Injector } from '@angular/core';
import { Grid } from "../grid/grid";
import { CommonModule } from '@angular/common';
import { firstValueFrom, take } from 'rxjs';
import { Button } from '../button/button';
import { GridServices } from 'src/core/services/grid-services';
import { GRID, GRID_INFO, GridActionRequest, RELATION } from 'src/core/models/grid.type';
import { ActyCommon } from 'src/core/services/acty-common';
import { SaveData, ParentChildSaveData } from 'src/core/models/save-data.type';
import { Splitter, SplitPanel } from '../splitter/splitter';
import { DataChangeDetectedService } from 'src/core/services/data-change-detected-service';
import { changesReturn } from 'src/core/models/confimChangesGuardsProps.type';
import { MessageDialogService } from 'src/core/services/message-dialog-service';
import { notify } from 'src/core/services/toast.service';
import { CookieService } from 'ngx-cookie-service';
import { BTN_TYPE, buttonEmitType } from 'src/core/models/extraButton.type';
import { LoaderService } from 'src/core/services/loader-service';
import { ButtonWrapper } from '../button-wrapper/button-wrapper';
import { FILTER } from 'src/core/models/filter.type';
import { TreeviewGrid } from "../treeview-grid/treeview-grid";

@Component({
  selector: 'acty-parent-child-grid',
  imports: [Grid, CommonModule, SplitPanel, Splitter, ButtonWrapper, TreeviewGrid],
  templateUrl: './parent-child-grid.html',
  styleUrl: './parent-child-grid.scss'
})
export class ParentChildGrid implements OnInit, OnChanges {
  @ViewChild(Grid) gridComponent!: Grid;

  @ViewChild(TreeviewGrid) treegridComponent!: TreeviewGrid;
  @ViewChildren(ParentChildGrid) childParentChildGrids!: QueryList<ParentChildGrid>;
  @ViewChild('parentChildGridWrapper') parentChildGridWrapper!: ElementRef;
  @ViewChild('parentChildSplitter', { static: true }) splitter!: Splitter;

  service = inject(GridServices);
  ActyCommonService = inject(ActyCommon);
  DataChangeDetected = inject(DataChangeDetectedService);
  msgDialogService = inject(MessageDialogService);
  cookieService = inject(CookieService);
  loader = inject(LoaderService);
  ngZone = inject(NgZone);
  el = inject(ElementRef);

  dataGridGroup = model.required<GRID_INFO>();
  searchList = input<Array<FILTER> | undefined>([]);
  dataListGroupInp = input<any>();
  isTriggerRefscreenofTreeviw = input<boolean>();
  _dataListGroupInp = input<any>();
  isParentGrid = input<boolean>(true);
  SelectionChange = input<any>();
  spitterHeigth = input<any>();
  getDataUrl = input<string>('');
  screenName = input<string>('');
  getDataMethod = input<string>('GetData');
  currPkData = input<{ [key: string]: any } | null>(null);
  saveDataUrl = input<string>('');
  formId = input<string>('');
  triggerUpdateScollHeigthInp = input<boolean>(false);
  //for single button wrapper show in last grid
  // uniqueButtonListInp = input<BTN_TYPE[]>([]);
  uniqueGridIdListInp = input<string[]>([]);
  GeneralBtns = input<BTN_TYPE[]>([]);
  uniqueDisableListInp = model<any[]>([]);
  allGridRelationManagerListInp = input<{ [key: string]: RELATION[] }>({});
  relationWithMainParentListInp = input<any>()
  isupdatedChildInp = input<string>('')
  parentChildBtnOrder = input<any | null>(null);
  //for Select Error row in parent child grid
  invalidRowSelection = input<{gridId : string, row : any}>({ gridId : '',row : null});
  referenceDefaultValueColNames = model<string[]>([]);
  tabId = input<string>('');
  skipMasterFilterValidation = input<boolean>(false);
  childRowContainError = output<{childRelation : RELATION[],childErrorRow : any,childGridId : string}>();
  generalButtonOrder = model<any | null>(null);
  isParentChildHorizontalSplitter = input<boolean>(true);
  ignoreButtonSetting = input<boolean>(false);
  isGridButtonsInitialized = model<boolean>(false);
  //getSearchData = output<boolean>();
  //infom to that parent for perfron validation (like inquiry screen)
  onGridRowDelete = output<any>();
  onGridCellChanges = output<any>();
  onCellFocusChange = output<any>();
  onButtonClicked = output<buttonEmitType>();
  afterSave = output<void>();
  entryGetData = output<{pageSize: number;pageIndex: number; sortType: any; sortColumn: any; gridFilters: any, previousPageIndex: number}>();
  requestFilterValue = output<void>();
  triggerGetdataCall = output<void>();

  activeGridId = model<string>('');
  buttonOrder = model<string | null>(null);
  selectedGroup = model<{ [key: string]: any[] }>({});

  callingGridButton = output<{ gridId: string, buttonClick: buttonEmitType }>();
  extraButtonClick = output<any>();
  onGridActionRequest  = output<GridActionRequest>();
  addNewGridRow = output<any>();


  //changes when data change inside the grid component
  dataListGroup = signal<{ [key: string]: any[] }>({});
  //the data can not be changes when changes in grid
  _dataListGroup = signal<{ [key: string]: any[] }>({});
  invalidCellRowIds = signal<number[]>([]);
  formLoaderKey = signal<string>('');
  childVerticalContainerSize = signal<number[]>([]);

  //when row selection is changes
  rowSelectionChanges: any;
  //for passing data in Grid Compoenent
  gridDataList!: { list: any[], total?: number };
  //List For Grid Id with column list for save data and check validations
  ColumnListGroup: { [key: string]: GRID[] } = {};
  userId: string = JSON.parse(this.cookieService.get('seira_user') || '{}').userid || '';
  //Save Data List
  saveDataList: { [key: string]: SaveData } = {};
  dataGridColumnList: { [key: string]: GRID[] } = {};
  primaryKeyColumns: { [key: string]: string[] } = {};
  //for single button wrapper show in last grid
  // uniqueButtonListValue : BTN_TYPE[] = [];
  uniqueGridIdListValue: string[] = [];
  // isButtonDisabledFn: any[] = [];
  isButtonDisabledFn : any; 
  isCopyRowFlag: boolean = false;
  allGridRelationManagerList: { [key: string]: RELATION[] } = {};
  relationWithMainParentList : any;
  allGridAPIObjRelationList: { [key: string]: RELATION[] } = {};
  triggerUpdateScollHeigth: boolean = false;
  isupdatedChild: string = '';
  ignorePrimaryKeyinPCList: string[] = [];
  blockRowSelectionChange: boolean = false;
  _resultObjectGridIds: { [key: string]: string } = {};  // Map to store sizes by rowIndex
  childContainerSize: Map<number, number[]> = new Map();
  private confirmChangesResult: number | null = null;
  private isSaveFromPaginator: boolean = false;
  isGeneralWrapperVisible: boolean = false;
  gridPreviouspageIndex: number = 0;
  //for parent row select after child row selection changes 
  isChangeingParentRowForSelectRowInChild : boolean = false;
  currGridRowForSelection : any;
  inValidRowOfGridWithRowId : { gridId : string , row : any} = { gridId : '' , row : null};
  hasInitialLoad = model<boolean>(false);
  lastParentPk: string = '';
  lastProcessedPk: string = '';

  ngOnInit(): void {
    if (this.isGridButtonsInitialized()) {
      this.updateButtonList()
    }
    this.formLoaderKey.set(this.formId() + '_loader')
    this.changeColumnState(this.dataGridGroup().dataGrid, this.dataGridGroup().relations);

    this.activeGridId.set(this.uniqueGridIdListInp()[0] ?? this.uniqueGridIdListValue[0])
    //for auto entry screen main relation column is null
    this.getIgnorePrimaryKeyinPCList();
    this.isButtonDisabledFn = this.isButtonDisabled.bind(this);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataGridGroup']) {
      if (this.dataGridGroup() && this.isParentGrid()) {
        //when not click on search and add row with save
        this.initializeDataListGroup(this.dataGridGroup())
        this._dataGridSetup();
        this.setResultObjectGridIds();
      }
    }
    if(changes['GeneralBtns']){
      if (this.isParentGrid()) {
        this.updateButtonList()
      }
    }
    // if (changes['activeGridId']) {
    //   if (this.activeGridId() === this.dataGridGroup().gridId) {
    //     const gridData = this.isButtonDisabledFn.find(item => item.hasOwnProperty(this.activeGridId()));
    //     gridData[this.activeGridId()] = this.isButtonDisabled.bind(this);
    //   }
    // }
    if (changes['SelectionChange'] && this.isParentGrid() === false && this.SelectionChange() !== undefined) {
      this.relationManager();
      this.updateGridScrollHeight();
    }

    if (changes['dataListGroupInp']) {
      if (this.isParentGrid() && this.dataListGroupInp() && Object.keys(this.dataListGroupInp()).length > 0) {
        this.dataListGroup.set({});
        this._dataGridSetup();
        this.saveDataList = {};
        this._dataListGroup.set({});
        this.dataListGroup.set(this.dataListGroupInp())
        this.modifyDataList(this.dataListGroupInp())
        this.updateGridScrollHeight();
      }
      else {
        this.dataListGroup.set(this.dataListGroupInp());
      }
    }

    if (changes['_dataListGroupInp']) {
      this._dataListGroup.set(this._dataListGroupInp());
      this.relationManager();
    }
    if (changes['spitterHeigth']) {
      if (this.spitterHeigth()?.length > 0) {
        if (this.gridComponent) {
          this.gridComponent.updateScrollHeight();
        }
      } else {
        this.onSizeChange(this.spitterHeigth())
      }
    }
    if (changes['uniqueGridIdListInp']) {
      this.uniqueGridIdListValue = this.uniqueGridIdListInp()
    }
    //for single button wrapper show in last grid
    // if(changes['uniqueButtonListInp']){
    //   this.uniqueButtonListValue = this.uniqueButtonListInp();
    // }
    // if (changes['uniqueDisableListInp']) {
      // this.isButtonDisabledFn = this.uniqueDisableListInp();
    // }
    if (changes['allGridRelationManagerListInp']) {
      this.allGridRelationManagerList = this.allGridRelationManagerListInp()
    }
    if (changes['relationWithMainParentListInp']) {
      this.relationWithMainParentList = this.relationWithMainParentListInp()
    }
    if (changes['triggerUpdateScollHeigthInp']) {
      this.triggerUpdateScollHeigth = this.triggerUpdateScollHeigthInp()
      this.updateAllGridScrollHeight();
    }
    if (changes['isupdatedChildInp']) {
      const currentPk = this.isupdatedChildInp();
      // ignore same value (prevents loop)
      if (this.lastProcessedPk === currentPk) return;
      this.lastProcessedPk = currentPk;
      this.isupdatedChild = currentPk;
      this.relationManager();
    }
    if (changes['parentChildBtnOrder']) {
      if (this.parentChildBtnOrder() && (this.parentChildBtnOrder()[this?.dataGridGroup().gridId] != null || (this.parentChildBtnOrder()?.['GeneralButtons']) != null)) {
        const parentChildOrder = this.parentChildBtnOrder()[this?.dataGridGroup().gridId]
        const generalOrder = this.parentChildBtnOrder()['GeneralButtons']

        let mergeOrder: string;

        if ((parentChildOrder != null && parentChildOrder != undefined) && (generalOrder != null && generalOrder != undefined)) {
          mergeOrder = `${parentChildOrder},${generalOrder}`;
        } else {
          mergeOrder = parentChildOrder ?? generalOrder;
        }
        this.buttonOrder.set(mergeOrder)
        this.generalButtonOrder.set(this.parentChildBtnOrder()['GeneralButtons']);
      }
    }
    if(changes['invalidRowSelection']){
      this.scrollToRow()
    }
  }

  async scrollToRow(){
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
      if(this.dataGridGroup()?.gridId === this.invalidRowSelection().gridId){
        const data = this.gridDataList.list;
        let foundRowForSelect = 0;
        for(let i = 0;i< data.length;i++){
          if(data[i].parentRowId === this.invalidRowSelection().row.parentRowId){
            this.gridComponent.convertParentRowIdintoRowId(data[i].parentRowId,false)
            this.loader.decrement(this.formLoaderKey());
            foundRowForSelect++;
            break;
          }
        }
          
        if(foundRowForSelect === 0){
          this.isChangeingParentRowForSelectRowInChild = true;
          this.childRowContainError.emit({
            childRelation : this.dataGridGroup().relations,
            childErrorRow : this.invalidRowSelection().row,
            childGridId : this.dataGridGroup().gridId,
          })
        }
      }
      else{
        this.inValidRowOfGridWithRowId = this.invalidRowSelection();
      } 
  }

  emitFromChildForSelectedParentRow(event : {childRelation : RELATION[],childErrorRow : any,childGridId : string}){
    const data = this.dataListGroup()[this.dataGridGroup().apiObjectName];
    const childRelation = event.childRelation;
    const childRow = event.childErrorRow;
    const parentForSelectionRow = data.find(parent =>
      childRelation.every((rel : any) =>
        parent[rel.parentDataField] === childRow[rel.childDataField]
      )
    );
    const currentData = this.gridDataList.list.find(parent =>
      childRelation.every((rel : any) =>
        parent[rel.parentDataField] === childRow[rel.childDataField]
      )
    );
    this.currGridRowForSelection = parentForSelectionRow
    if(!currentData){
      this.isChangeingParentRowForSelectRowInChild = true;
      this.childRowContainError.emit({
          childRelation : this.dataGridGroup().relations,
          childErrorRow : parentForSelectionRow,
          childGridId : this.dataGridGroup().gridId,
        })
    }else{
      //  this.gridComponent.convertParentRowIdintoRowId(parentForSelectionRow.parentRowId,this.isParentGrid())
      if(this.dataGridGroup().gridFormat !== "treeview"){
        this.gridComponent.convertParentRowIdintoRowId(parentForSelectionRow.parentRowId,this.isParentGrid());
      }
      else{
        this.treegridComponent.convertParentRowIdintoNode(parentForSelectionRow.parentRowId,this.isParentGrid());
      }
      
    }
  }

  updateButtonList() {
    const group = this.dataGridGroup();
      if (!group) return;

      let target = group;
      let maxIndexCount = 0;

      if (Array.isArray(group.childGridInfo) && group.childGridInfo.length > 0) {

        const children = group.childGridInfo;

        const indexedChildren = children.filter(c => c.childDisplayRowIndex !== undefined && c.childDisplayRowIndex !== null);

        if (indexedChildren.length > 0) {
          const maxIndex = Math.max(...indexedChildren.map(c => c.childDisplayRowIndex));
          const maxIndexChildren = indexedChildren.filter(c => Number(c.childDisplayRowIndex) === maxIndex);
          maxIndexCount = maxIndexChildren.length;
          
          if(maxIndexCount > 1){
            this.isGeneralWrapperVisible = true;          
          }
          else{            
            target = indexedChildren.filter(c => Number(c.childDisplayRowIndex) === maxIndex).at(-1)!;
          }
        } else {
          while (target.childGridInfo && target.childGridInfo.length > 0) {
            target = target.childGridInfo[target.childGridInfo.length - 1];
          }
        }
      }

      target.gridButtons = (target.gridButtons ?? []).map(btn => ({...(btn as any),__buttonType: (btn as any).__buttonType ?? 'grid'}));

      const generalBtns = this.GeneralBtns() ?? [];

      if (generalBtns.length > 0 && this.isGeneralWrapperVisible == false) {

        target.gridButtons = target.gridButtons.filter((item: any) => item.__buttonType !== "general");
        const existingGeneralBtnIds = new Set(
          (target.gridButtons ?? [])
            .filter(b => (b as any).__buttonType === 'general')
            .map(b => b.btnId)
        );

        const newGeneralBtns = generalBtns
          .filter(btn => !existingGeneralBtnIds.has(btn.btnId))
          .map(btn => ({
            ...(btn as any),
            __buttonType: 'general'
          }));

        if (newGeneralBtns.length > 0) {
          target.gridButtons = [
            ...target.gridButtons,
            ...newGeneralBtns
          ];
        }
      }

    this.dataGridGroup.set(group);
    this.isGridButtonsInitialized.set(false);
  }

  uniqueDisableListInpValueChange(data: any) {
    this.uniqueDisableListInp.set(data)
  }

  getFilterData() {
    this.requestFilterValue.emit();
  }

  // getButtonDisableData(grid: string) {
  //   //remove when show button wrapper in last grid
  //   return this.isButtonDisabled.bind(this)

  //   //for single button wrapper show in last grid
  //   const gridData = this.isButtonDisabledFn.find(item => item.hasOwnProperty(grid));
  //   if (gridData) {
  //     return gridData[grid] // Output: 'that values for firstGrid'
  //   }
  // }

  setResultObjectGridIds(): void {

    const addToDictionary = (grid: any) => {

      // add current grid
      if (grid?.apiObjectName && grid?.gridId) {
        this._resultObjectGridIds[grid.apiObjectName] = grid.gridId;
      }

      // check childGridInfo
      if (Array.isArray(grid?.childGridInfo)) {
        grid.childGridInfo.forEach((child: any) => {
          addToDictionary(child);
        });
      }
    };

    const gridGroup = this.dataGridGroup();

    // if root is array
    if (Array.isArray(gridGroup)) {
      gridGroup.forEach(g => addToDictionary(g));
    }
    // if root is object
    else {
      addToDictionary(gridGroup);
    }
  }

  //for  when data is not load and new row added in parent and child
  initializeDataListGroup(dataGrid: GRID_INFO) {
    const apiObjectName = dataGrid.apiObjectName;
    const gridGroup = { [apiObjectName]: [] };

    // Set the dataListGroup with the new object
    this.dataListGroup.set({ ...this.dataListGroup(), ...gridGroup });
    this._dataListGroup.set({ ...this.dataListGroup(), ...gridGroup });
    if (dataGrid?.childGridInfo && dataGrid?.childGridInfo.length > 0) {
      for (let i = 0; i < dataGrid?.childGridInfo.length; i++) {
        this.initializeDataListGroup(dataGrid?.childGridInfo[i])
      }
    }
    this.gridDataList = { list: this.dataListGroup()[this.dataGridGroup().apiObjectName] };
  }

  //when any cell change in grid then calling(get row)
  onGridCellChangesByChild(data: { row: any; columnName: string }) {
    this.onGridCellChanges.emit(data);
  }

  onRowDeleteByChild(data: any) {
    this.onGridRowDelete.emit(data);
  }

  getLiveChildGridData(): { [apiObjectName: string]: any[] } {
    const result: { [apiObjectName: string]: any[] } = {};

    // Own grid
    const ownApi = this.dataGridGroup().apiObjectName;
    if (this.gridComponent?.visibleDataList?.data) {
      result[ownApi] = this.gridComponent.visibleDataList.data;
    } else {
      result[ownApi] = this.dataListGroup()[ownApi] ?? [];
    }

    // Child PCGrid instances — each has its own gridComponent
    if (this.childParentChildGrids?.length) {
      this.childParentChildGrids.forEach((childPCGrid: ParentChildGrid) => {
        const childApi = childPCGrid.dataGridGroup().apiObjectName;
        if (childPCGrid.gridComponent?.visibleDataList?.data) {
          result[childApi] = childPCGrid.gridComponent.visibleDataList.data;
        } else {
          result[childApi] = this.dataListGroup()[childApi] ?? [];
        }
      });
    }

    return result;
  }

  //when focus lose of cell then get all row
  onCellFocusChangeByChild(data: { row: any; column: GRID } & { sourceAPIObjectName: string, dataGridGroup: GRID_INFO, dataList: any, selectedGroup: any, childGridData: any }) {
    const changedRow = (data as any).row;
    const resolvedActiveGridId = changedRow
      ? this.dataGridGroup().apiObjectName
      : data.sourceAPIObjectName;

    const filteredData = {
      sourceAPIObjectName: resolvedActiveGridId,
      column: data.column,
      dataGridGroup: this.dataGridGroup(),
      selectedGroup: changedRow
        ? { ...this.selectedGroup(), [this.dataGridGroup().apiObjectName]: [changedRow] }
        : (data.selectedGroup
            ? { ...this.selectedGroup(), ...data.selectedGroup }
            : this.selectedGroup()),
      childGridData: this.getLiveChildGridData(),
      row: data?.row
    }

    this.onCellFocusChange.emit(filteredData);
    //check cells is contain primary then continue otherwise not check any validation(primary key as well as parent-values changes)
    const isCellContainPrimaryKey = this.dataGridGroup().dataGrid.some((item: GRID) => item.isPrimaryKey && item?.ignorePrimaryKeyinPC !== true && item.dataField === data.column.dataField);
    if (!isCellContainPrimaryKey) {
      return;
    }
    //get primary key column names
    const primaryKeyColumns = this.dataGridGroup().dataGrid
      .filter((item: GRID) => item.isPrimaryKey && item?.ignorePrimaryKeyinPC !== true)
      .map((item: GRID) => item.dataField);

    // build composite PK (important if multiple keys)
    const currentPk = primaryKeyColumns.map(key => data.row[key]).join('|')?.toString();

    if (isCellContainPrimaryKey) {
      if (data.row[data.column.dataField] !== undefined && data.row[data.column.dataField] !== null && data.row[data.column.dataField] !== '') {
        this.checkPrimaryKeyValidation(data.row, data.column.dataField, primaryKeyColumns);
      }
      if (this.dataGridGroup()?.childGridInfo !== undefined && this.dataGridGroup()?.childGridInfo.length > 0) {
        for (let i = 0; i < this.dataGridGroup()?.childGridInfo.length; i++) {
          this.parentValuesChanges(data.row, this.dataGridGroup()?.childGridInfo[i]?.relations, this.dataGridGroup());
        }
        
        // prevent duplicate trigger
        if (this.lastParentPk === currentPk) {
          return;
        }
        this.lastParentPk = currentPk;
        this.isupdatedChild = currentPk;
      }
    }

    let filteredPrimaryKeys;
    if (!this.isParentGrid()) {
      const childColumns = this.dataGridGroup().relations.map(row => row.childDataField);
      filteredPrimaryKeys = primaryKeyColumns.filter(key => !childColumns.includes(key));
    }
    else {
      filteredPrimaryKeys = primaryKeyColumns;
    }
    const arePrimaryKeysNull = filteredPrimaryKeys.every((key) => {
      return data.row[key] === null || data.row[key] === undefined || data.row[key] === '';
    });
    if (arePrimaryKeysNull && this.dataGridGroup()?.childGridInfo !== undefined && this.dataGridGroup()?.childGridInfo.length > 0) {
      //deleted child row when primary key is null
      // this.deleteChildData(data.row,this.dataGridGroup().childGridInfo[0].relations,this.dataGridGroup())
      //stop row selection changes and show message in invalid cells
      if (this.isChildAvailable()) {
        const newErrors = [
          {
            [data.column.dataField]: {
              message: 'MESSAGE.COM_E0019',
              params: {},
            },
          },
        ];
        this.blockRowSelectionChange = true;
        this.addInvalidCells(data.row, newErrors)
      }
    } else {
      this.blockRowSelectionChange = false;
    }
  }

  addChildNewGridRow(row?:any){
    this.addNewGridRow.emit({row: row});
  }

  isChildAvailable(): boolean {
    let isChild: boolean = false;
    if (this.dataGridGroup().childGridInfo && this.dataGridGroup().childGridInfo.length > 0) {
      const parentRow = this.rowSelectionChanges[0];
      for (let i = 0; i < this.dataGridGroup()?.childGridInfo.length; i++) {
        const nextChildapiObjectName = this.dataGridGroup().childGridInfo[i].apiObjectName;
        const list = this.dataListGroup()[nextChildapiObjectName];
        const relations = this.dataGridGroup().childGridInfo[i].relations || [];

        if (!list) {
          return false;
        }
        // Filter list dynamically using all relations mappings
        const childRecords = list.filter((item: any) =>
          relations.every((mapping: RELATION) =>
            parentRow[mapping.parentDataField] === item[mapping.childDataField]
          )
        );
        //if record is not available in child or fields contain values then return true
        if (childRecords.length !== 0) {
          isChild = true;
          return true;
        }
      }
      return isChild;
    }
    else {
      return false;
    }
  }

  checkPrimaryKeyValidation(rowData: any, columnName: string, primaryKeyColumns: string[]) {
    //check for duplicate data
    if (
      primaryKeyColumns.length > 0 &&
      this.dataGridGroup()?.dataGrid.findIndex((c: GRID) => c.isAutoGenerate) === -1 &&
      rowData._isNew
    ) {
      const isDuplicate = this.dataListGroup()[this.dataGridGroup().apiObjectName].some((existingRow) => {
        return primaryKeyColumns.every((key: any) => {
          const gridKey = key as keyof GRID;
          return (
            existingRow[gridKey] === rowData[gridKey] &&
            existingRow?.parentRowId !== rowData.parentRowId
          );
        });
      });

      if (isDuplicate) {
        const newErrors = [
          {
            PrimaryKeyColumns: {
              message: 'MESSAGE.COM_E0008',
              params: {},
            },
          },
        ];
        rowData[columnName] = '';
        this.addInvalidCells(rowData, newErrors)
      }
    }
  }

  //on click button then get button caption
  onButtonClick(button: buttonEmitType) {
    this.onButtonClicked.emit(button)
  }

  //change column is editable state
  changeColumnState(dataGrid: GRID[], relations: RELATION[]) {
    if (relations) {
      //if column is set in relations then it is editable false
      dataGrid.forEach((gridItem) => {
        // Check if dataField matches any childDataField in relations
        const match = relations.some(relation => relation.childDataField === gridItem.dataField);

        // If there's a match, set `isEditable` to false
        if (match) {
          gridItem.isEditable = false;
        }
      });
    }
  }

  _dataGridSetup() {
    this.getAllColumnList(this.dataGridGroup(), this.dataGridColumnList)
    this.uniqueGridIdListValue = this.getAllIds(this.dataGridGroup());
    this.getPrimaryKeyColumnList()
    // this.setButtonDisable();
    // this.uniqueButtonListValue = this.getUniqueButtonList(this.dataGridGroup(),[])
    this.getAllGridRelationList(this.dataGridGroup());
    this.relationWithMainParentList = this.getAllAPIObjectNameRelationList(this.dataGridGroup());
  }

  getIgnorePrimaryKeyinPCList() {
    this.ignorePrimaryKeyinPCList = this.dataGridGroup().dataGrid
      .filter(item => item.ignorePrimaryKeyinPC === true)  // Filter out objects with ignorePrimaryKeyinPC as true
      .map(item => item.dataField);
  }

  //create all relations
  getAllGridRelationList(grid: GRID_INFO) {
    // Add the current grid to the result object
    this.allGridRelationManagerList[grid.gridId] = grid?.relations ?? [];

    // If there are childGridInfo grids, process them recursively
    if (grid.childGridInfo && grid.childGridInfo.length > 0) {
      grid.childGridInfo.forEach((childGrid: GRID_INFO) => {
        this.getAllGridRelationList(childGrid);
      });
    }
  }

  // async setButtonDisable() {
  //   for (let i = 0; i < this.uniqueGridIdListValue.length; i++) {
  //     const gridId = this.uniqueGridIdListValue[i];
  //     const data = { [gridId]: this.isButtonDisabled.bind(this) }
  //     // Store the binding of the isButtonDisabled function in the object
  //     this.isButtonDisabledFn.push(data)
  //   }
  // }

  // Single method to both collect buttons and get unique button list
  getUniqueButtonList(gridGroup: GRID_INFO, resultMap: any = {}): any[] {
    // 1. Process the current node and add to resultMap
    if (gridGroup.gridButtons) {
      gridGroup.gridButtons.forEach((button: any) => {
        // Add button to resultMap, using caption or inactiveText as the key for uniqueness
        const key = button.btnId || button.inactiveText;
        if (!resultMap[key]) {
          resultMap[key] = button; // Store the full button object
        }
      });
    }

    // 2. Recursively handle childGridInfo nodes
    if (gridGroup.childGridInfo && gridGroup.childGridInfo.length > 0) {
      gridGroup.childGridInfo.forEach((childNode: GRID_INFO) => {
        this.getUniqueButtonList(childNode, resultMap); // Recurse into childGridInfo
      });
    }

    // 3. Return the unique button objects based on caption or inactiveText
    return Object.values(resultMap); // Return all unique button objects
  }

  getPrimaryKeyColumnList() {
    for (const gridName in this.dataGridColumnList) {
      if (this.dataGridColumnList.hasOwnProperty(gridName)) {
        this.primaryKeyColumns[gridName] = this.dataGridColumnList[gridName]
          .filter((col: GRID) => col.isPrimaryKey && col?.ignorePrimaryKeyinPC !== true)
          .map((col: GRID) => col.dataField);
      }
    }
  }

  getAllIds(node: GRID_INFO, list: string[] = []): string[] {
    list.push(node.gridId);
    if (node.childGridInfo && node.childGridInfo.length > 0) {
      for (let c of node.childGridInfo) {
        this.getAllIds(c, list);
      }
    }
    return list;
  }

  getAllColumnList(gridGroup: GRID_INFO, resultMap: any): void {
    // 1. Process the current node
    // Set the node's ID as the key and the columnList array as the value
    resultMap[gridGroup.gridId] = gridGroup.dataGrid ?? [];

    // 2. Recurse into children
    if (gridGroup.childGridInfo && gridGroup.childGridInfo.length > 0) {
      for (const childNode of gridGroup.childGridInfo) {
        // Recursive call using 'this.' for class methods
        this.getAllColumnList(childNode, resultMap);
      }
    }
  }

  //this function is called when sort data is save 
  triggerGetdata() {
    if(this.isParentGrid() && this.getDataUrl() !== ''){
      this.getData();
    }else{
      this.triggerGetdataCall.emit();
    }
  }

  async getData(afterSave: boolean = false) {
    if (!afterSave) {
      const result = await this.confirmChanges();

      if (result.proceed === false) {
        //return;
        if (!result.proceed || this.confirmChangesResult == 0) {
          this.gridComponent.paginator.pageIndex = this.gridPreviouspageIndex;
          return;
        }

        if (this.confirmChangesResult == 2) {
          this.isSaveFromPaginator = true;
          this.gridComponent.paginator.pageIndex = this.gridPreviouspageIndex;
        }
      }
    }

    this.saveDataList = {};
    this._dataListGroup.set({});
    const relationList = this.getAllAPIObjectNameRelationList(this.dataGridGroup());

    return new Promise((resolve, reject) => {
      this.loader.increment(this.formLoaderKey());
      this.service.getDataOfPage(
        this.searchList() ?? [],
        '',
        '',
        this.getDataUrl(),
        this.dataGridGroup().gridFormat !== "treeview"? this.gridComponent.paginator.pageIndex * this.gridComponent.paginator.pageSize:0,
        this.dataGridGroup().gridFormat !== "treeview"?this.gridComponent.paginator.pageSize:null,
        [],
        this._resultObjectGridIds,
        this.dataGridGroup().gridFormat !== "treeview"?this.gridComponent.sortDirection:undefined,
        this.dataGridGroup().gridFormat !== "treeview"?this.gridComponent.sortColumn:undefined,
        this.dataGridGroup().gridFormat !== "treeview"?this.gridComponent.filterObj:undefined,
        relationList
      ).subscribe({
        next: (res) => {
          this.loader.decrement(this.formLoaderKey());
          this.dataListGroup.set(res.Data)
          this.modifyDataList(res.Data)
          this.hasInitialLoad.set(true);
        },
        error: (err) => {
          this.loader.decrement(this.formLoaderKey());
        }
      })
    });
  }

  getAllAPIObjectNameRelationList(
    grid: GRID_INFO,
    parentMappings: any[] = [],
    rootValidFields: Set<string> | null = null
  ): Record<string, any[]> { // Returns an object where key is apiObjectName
    const currentGridRelations = grid?.relations ?? [];
    const normalizedRelations: any[] = [];

    // Initialize the results object for this level
    let results: Record<string, any[]> = {};

    // 1. Capture Root Columns (Top-Level Only)
    if (rootValidFields === null) {
      rootValidFields = new Set(
        grid.dataGrid?.map((col) => col.dataField) ?? []
      );
    }

    // 2. Process Relations
    if (parentMappings.length === 0) {
      currentGridRelations.forEach((rel: any) => {
        if (rootValidFields.has(rel.parentDataField)) {
          normalizedRelations.push({
            MainParentDataField: rel.parentDataField,
            ChildDataField: rel.childDataField
          });
        }
      });
    } else {
      currentGridRelations.forEach((rel: any) => {
        const ancestorLink = parentMappings.find(
          (p: any) => p.ChildDataField === rel.parentDataField
        );

        if (ancestorLink) {
          if (rootValidFields.has(ancestorLink.MainParentDataField)) {
            normalizedRelations.push({
              MainParentDataField: ancestorLink.MainParentDataField,
              ChildDataField: rel.childDataField
            });
          }
        } else if (rootValidFields.has(rel.parentDataField)) {
          normalizedRelations.push({
            MainParentDataField: rel.parentDataField,
            ChildDataField: rel.childDataField
          });
        }
      });
    }

    // 3. Add current grid's findings to the results object
    if (normalizedRelations.length > 0) {
      results[grid.apiObjectName] = normalizedRelations;
    }

    // 4. Recursive Call and Merge Results
    if (grid.childGridInfo && grid.childGridInfo.length > 0) {
      grid.childGridInfo.forEach((childGrid: GRID_INFO) => {
        // Merge results from children into the current results object
        const childResults = this.getAllAPIObjectNameRelationList(
          childGrid,
          normalizedRelations,
          rootValidFields
        );
        Object.assign(results, childResults);
      });
    }

    return results; // Return the full accumulated object
  }
  showFilter = true;
  firstPanelSize = 50;
  firstPanelMaxPercent = 50;
  firstPanelMinPercent = 5.3;
  firstPanelMinSize = 30;
  allPanelMinDrag = 30;
  SpitterHeigthChange: any;
  onSizeChange(newSize: number[]) {
    if (newSize) {
      this.SpitterHeigthChange = newSize;
      this.firstPanelSize = Math.max(
        this.firstPanelMinPercent,
        Math.min(newSize[0], this.firstPanelMaxPercent)
      );
      this.updateAllGridScrollHeight();
    }
  }

  updateAllGridScrollHeight() {
    this.updateGridScrollHeight();
    this.triggerUpdateScollHeigth = !this.triggerUpdateScollHeigth;
    if (this.gridComponent) {
      this.gridComponent.initializeColumnWidths();
    }
  }

  updateGridScrollHeight() {
    if (this.gridComponent) {
      if (this.isParentChildHorizontalSplitter()) {
        this.gridComponent.updateScrollHeight();
      }
    }
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;

    if (this.showFilter) {
      setTimeout(() => this.adjustFirstPanelHeight(), 0);
    } else {
      this.firstPanelSize = this.firstPanelMinSize;

      if (this.showFilter) {
        this.adjustFirstPanelHeight();
      }
    }
    this.updateGridScrollHeight();
  }

  adjustFirstPanelHeight() {
    if (!this.parentChildGridWrapper || !this.splitter) return;

    // Get the splitter container's height
    const containerHeight = this.splitter.splitContainer.nativeElement.offsetHeight;

    const filterHeightPx = this.parentChildGridWrapper.nativeElement.scrollHeight;
    const filterHeightPercent = (filterHeightPx / containerHeight) * 100;

    // Clamp to min/max percent
    this.firstPanelSize = Math.max(
      this.firstPanelMinPercent,
      Math.min(filterHeightPercent, this.firstPanelMaxPercent)
    );
    this.updateGridScrollHeight();
  }

  relationManager() {
    this.gridDataList = { list: [] };

    const seletedParentRow = this.SelectionChange();
    if (seletedParentRow?.length > 0) {
      const apiObjectName = this.dataGridGroup().apiObjectName;
      const list = this.dataListGroupInp()[apiObjectName];
      const relations = this.dataGridGroup().relations || [];

      if (!list) {
        return;
      }
      // Filter list dynamically using all relations mappings
      this.gridDataList = {
        list: list.filter((item: any) =>
          seletedParentRow.some((parentRow: any) =>
            relations.every((mapping: RELATION) =>
              parentRow[mapping.parentDataField] === item[mapping.childDataField]
            )
          )
        ),
        total: list.filter((item: any) =>
          seletedParentRow.some((parentRow: any) =>
            relations.every((mapping: RELATION) =>
              parentRow[mapping.parentDataField] === item[mapping.childDataField]
            )
          )
        ).length
      }
      if (this.gridComponent) {
        this.gridComponent.changeRowSeletectionBasedOnParent(this.rowSelectionChanges);
      }
    }
    else {
      if (this.gridComponent)
        this.gridComponent.changeRowSeletectionBasedOnParent()
    }
    if (this.gridComponent && this.gridComponent.paginator) {
      this.gridComponent.paginator.pageIndex = 0;
    }
  }

  async onSelecteChange(data: any[]) {
    if (data && data.length > 0) {
      this.rowSelectionChanges = data;
      const selectedValues = this.selectedGroup();
      selectedValues[this.dataGridGroup()?.apiObjectName] = this.rowSelectionChanges;
      this.selectedGroup.set(selectedValues);
    } else {
      this.rowSelectionChanges = [];
    }

    if (this.isChangeingParentRowForSelectRowInChild) {
      const invalidData = this.isParentGrid()
        ? this.inValidRowOfGridWithRowId
        : this.invalidRowSelection();
      const selectedParentRowIds = data.map(row => row?.parentRowId);

      //Invalid row belongs to a different grid
      if (invalidData.gridId !== this.dataGridGroup().gridId) {
        setTimeout(() => {
          this.inValidRowOfGridWithRowId = {
            gridId: invalidData.gridId,
            row: invalidData.row
          };

          // Check if ANY selected row matches current parent row
          const hasMatchingParentRow = selectedParentRowIds.some(
            parentRowId =>
              parentRowId === this.currGridRowForSelection?.parentRowId
          );

          if (hasMatchingParentRow) {
            this.isChangeingParentRowForSelectRowInChild = false;
          }
        });

      } 
      //Invalid row belongs to same grid
      else {
        setTimeout(() => {
          const errorRowParentRowId =
            this.invalidRowSelection()?.row?.parentRowId;

          //Check if NONE of the selected rows match invalid parent row
          const hasInvalidParentRow = selectedParentRowIds.some(
            parentRowId => parentRowId === errorRowParentRowId
          );

          if (!hasInvalidParentRow) {
            this.scrollToRow();
            this.isChangeingParentRowForSelectRowInChild = false;
          }
        });
      }
    }
  }

  onValueChangesforTreeView(data: any){
    for (let i = 0; i < this.dataGridGroup()?.childGridInfo.length; i++) {
            this.parentValuesChangesforTreeView(data.row, this.dataGridGroup()?.childGridInfo[i]?.relations, this.dataGridGroup(),data.changedValue,data.changeColumnName);
        }
        this.onGridCellChanges.emit(data);
  }
  onValueChanges(data: any, gridId: string) {
    //when new added row values is chanegs
    if (data?.row?._isNew) {
      const apiObjectName = this.dataGridGroup().apiObjectName;
      const updatedItem = data?.row;
      const allData = this.dataListGroup();
      allData[apiObjectName] = allData[apiObjectName].map((item: any) =>
        item.parentRowId === updatedItem.parentRowId ? updatedItem : item
      );
      this.dataListGroup.set(allData);
      const updatedData = {
        row: data.row,
        columnName: data.columnName,
      };
      if (this.dataGridGroup()?.childGridInfo !== undefined && this.dataGridGroup()?.childGridInfo.length > 0) {
        for (let i = 0; i < this.dataGridGroup()?.childGridInfo.length; i++) {
          const isRelationalColumn = this.dataGridGroup()?.childGridInfo[i]?.relations.some((item: any) => item.parentDataField === data.columnName);
          if (isRelationalColumn) {
            this.parentValuesChanges(data.row, this.dataGridGroup()?.childGridInfo[i]?.relations, this.dataGridGroup());
          }
        }
      }
      this.onGridCellChanges.emit(updatedData);
    }
    else {
      const rowData = data.updatedRow;
      const columnName = data.columnName;
      const apiObjectName = this.dataGridGroup().apiObjectName;
      const rowId = rowData.parentRowId;
      const gridColumn = this.dataGridGroup().dataGrid.find(
        (col: GRID) => col.dataField === columnName
      );
      // datalist row
      const dataListRow = this._dataListGroup()[apiObjectName].find(
        (row: any) => row.parentRowId === rowId
      );
      // visible datalist row
      if (!dataListRow) return;
      const visibleDataListRow = rowData;
      const rawOldValue = dataListRow[columnName as keyof GRID];
      const rawNewValue = visibleDataListRow[columnName];
      if (!gridColumn) return;
      const oldValue =
        gridColumn.editorType === '3' &&
          rawOldValue !== null &&
          rawOldValue !== undefined
          ? new Date(rawOldValue)
          : rawOldValue;

      const newValue =
        gridColumn.editorType === '3' &&
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
        const allData = this.dataListGroup();
        allData[apiObjectName] = allData[apiObjectName].map((item: any) =>
          item.parentRowId === rowData.parentRowId ? visibleDataListRow : item
        );
        this.dataListGroup.set(allData);
        if (!visibleDataListRow.changedCells.includes(columnName)) {
          visibleDataListRow.changedCells.push(columnName);
          this.addInGlobalInDetection(rowId, columnName);
        }
      } else {
        visibleDataListRow.changedCells = visibleDataListRow.changedCells.filter(
          (clm: string) => clm !== columnName
        );
        const allData = this.dataListGroup();
        allData[apiObjectName] = allData[apiObjectName].map((item: any) =>
          item.parentRowId === rowData.parentRowId ? visibleDataListRow : item
        );
        this.dataListGroup.set(allData);
        this.removeFromGlobalInDetection(rowId, columnName);
      }
      const updatedData = {
        row: rowData,
        columnName: columnName,
      };
      this.onGridCellChanges.emit(updatedData);

      // Trigger childOperations (readOnly / required / filter) for direct cell changes
      // e.g. checkbox click without going through onCellFocusChange
      if (gridColumn) {
        const gridIdToApiObjectName = Object.entries(this._resultObjectGridIds)
          .reduce((acc, [apiName, gId]) => { acc[gId] = apiName; return acc; }, {} as { [gridId: string]: string });
        const resolvedActiveGridId = gridIdToApiObjectName[gridId] ?? gridId;

        setTimeout(() => {
          this.onCellFocusChange.emit({
            sourceAPIObjectName: resolvedActiveGridId,
            column: gridColumn,
            dataGridGroup: this.dataGridGroup(),
            selectedGroup: { ...this.selectedGroup(), [this.dataGridGroup().apiObjectName]: [rowData] },
            childGridData: this.getLiveChildGridData()
          });
          this.addNewGridRow.emit({row: rowData});
        });
      }
    }
  }

  parentValuesChanges(updateParentRow: any, relations: RELATION[], dataGrid: GRID_INFO) {
    const parentRow = updateParentRow;
    const valuesChangesList: any[] = [];

    if (dataGrid?.childGridInfo === undefined || dataGrid?.childGridInfo.length === 0) {
      return;
    }

    for (let i = 0; i < dataGrid?.childGridInfo.length; i++) {
      const nextChildapiObjectName = dataGrid?.childGridInfo[i]?.apiObjectName;
      if (!nextChildapiObjectName) {
        return;
      }

      const childList = structuredClone(this.dataListGroup()[nextChildapiObjectName]);
      if (!childList) {
        return; // If no childList exists, return early
      }

      childList.forEach((item: any) => {
        relations.forEach((mapping: RELATION) => {
          if (parentRow.parentRowId === item.targetParentRowId) {
            // Store the update in valuesChangesList before applying it
            valuesChangesList.push(item);
            // Apply the update
            item[mapping.childDataField] = parentRow[mapping.parentDataField];
          }
        });
      });

      // Assign the updated child list back to the data list group
      this.dataListGroup()[nextChildapiObjectName] = childList;

      if (valuesChangesList.length > 0) {
        for (let x = 0; x < valuesChangesList.length; x++) {
          this.parentValuesChanges(
            valuesChangesList[x],
            this.uniqueGridIdListInp().length > 0 ? this.allGridRelationManagerListInp()[nextChildapiObjectName] : this.allGridRelationManagerList[nextChildapiObjectName],
            dataGrid.childGridInfo[i])
        }
      }
    }
  }

    parentValuesChangesforTreeView(updateParentRow: any, relations: RELATION[], dataGrid: GRID_INFO, changeValue: string,changeColumnName:string) {
    const parentRow = updateParentRow;
    const valuesChangesList: any[] = [];

    if (dataGrid?.childGridInfo === undefined || dataGrid?.childGridInfo.length === 0) {
      return;
    }

    for (let i = 0; i < dataGrid?.childGridInfo.length; i++) {
      const nextChildapiObjectName = dataGrid?.childGridInfo[i]?.apiObjectName;
      const gridId = dataGrid?.childGridInfo[i]?.gridId
      if (!nextChildapiObjectName) {
        return;
      }

      const childList = structuredClone(this.dataListGroup()[nextChildapiObjectName].filter((item) => item[changeColumnName] === changeValue));
      const childListNotChanged = structuredClone(this.dataListGroup()[nextChildapiObjectName].filter((item) => item[changeColumnName] !== changeValue));

      if (!childList) {
        return; // If no childList exists, return early
      }

      childList.forEach((item: any) => {
        relations.forEach((mapping: RELATION) => {
            // Store the update in valuesChangesList before applying it
            valuesChangesList.push(item);
            // Apply the update
            item[mapping.childDataField] = parentRow[mapping.parentDataField];
        });
      });

      // Assign the updated child list back to the data list group

      const combinedList = [...childList, ...childListNotChanged];

       this.dataListGroup()[nextChildapiObjectName] = combinedList;

      if (valuesChangesList.length > 0) {
        for (let x = 0; x < valuesChangesList.length; x++) {
          this.parentValuesChangesforTreeView(
            valuesChangesList[x],
            this.uniqueGridIdListInp().length > 0 ? this.allGridRelationManagerListInp()[nextChildapiObjectName] : this.allGridRelationManagerList[nextChildapiObjectName],
            dataGrid.childGridInfo[i],changeValue,changeColumnName)
        }
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

  onRowDeleted(data: any) {
    if (data !== undefined && data !== null && data.length !== 0) {
      const apiObjectName = this.dataGridGroup().apiObjectName;
      const list = this.dataListGroup();
      const DeleteRowParentId = data[0].parentRowId;
      list[apiObjectName] = list[apiObjectName].filter((item: any) => item.parentRowId !== DeleteRowParentId);
      this.dataListGroup.set(list);

      if (DeleteRowParentId !== -1 && !data[0]?._isNew && data[0]?._isDelete) {
        const DataList1 = this._dataListGroup();
        const DeleteRow = DataList1[apiObjectName].find((item: any) => item.parentRowId === DeleteRowParentId);
        DeleteRow._isDelete = true;
      }
      if (data[0]._isNew) {
        this.DataChangeDetected.netRowChangeCounterDecrement();
      }
      else {
        this.DataChangeDetected.netRowChangeCounterIncrement();
      }
    }
    if (this.dataGridGroup()?.childGridInfo !== undefined && this.dataGridGroup()?.childGridInfo.length > 0) {
      for (let i = 0; i < this.dataGridGroup()?.childGridInfo.length; i++) {
        this.deleteChildData(data[0], this.dataGridGroup().childGridInfo[i].relations, this.dataGridGroup())
      }
    }
    this.onGridRowDelete.emit(data);
  }

  deleteChildData(deletedRow: any, relations: RELATION[], dataGrid: GRID_INFO): void {
    if (dataGrid?.childGridInfo === undefined || dataGrid?.childGridInfo.length === 0) {
      return;
    }

    for (let i = 0; i < dataGrid?.childGridInfo.length; i++) {
      const nextChildapiObjectName = dataGrid?.childGridInfo[i]?.apiObjectName;

      const childList = this.dataListGroup()[nextChildapiObjectName];      // List for view filtering
      const _childList = this._dataListGroup()[nextChildapiObjectName];    // Source list for marking (_isDelete)
      const nextRelationManager = this.uniqueGridIdListInp().length > 0 ? this.allGridRelationManagerListInp()[nextChildapiObjectName] : this.allGridRelationManagerList[nextChildapiObjectName]; // Relation for the next level
      if (!childList && !_childList) {
        return;
      }
      const deletedValues: any[] = [];
      const updatedChildList = childList.filter((item: any) => {
        const isDeleted = relations.every((mapping: RELATION) =>
          deletedRow[mapping.parentDataField] === item[mapping.childDataField]
        );
        // If the item is removed (isDeleted is true), push it to the deletedValues array
        if (isDeleted) {
          deletedValues.push(item);
        }
        // Only keep the item if it is not deleted
        return !isDeleted;
      });

      this.dataListGroup()[nextChildapiObjectName] = updatedChildList;
      _childList.forEach((item: any) => {
        const isMatch = relations.every((mapping: RELATION) =>
          deletedRow[mapping.parentDataField] === item[mapping.childDataField]
        );

        if (isMatch) {
          item._isDelete = true;
        }
      });
      if (deletedValues.length > 0 && nextRelationManager) {
        for (const deletedChildRow of deletedValues) {
          if (deletedChildRow?._isNew === true) {
            this.DataChangeDetected.netRowChangeCounterDecrement();
          }
          else {
            this.DataChangeDetected.netRowChangeCounterIncrement();
          }
          this.deleteChildData(
            deletedChildRow,        // New Parent Row (the row we just marked for deletion)
            nextRelationManager,
            dataGrid?.childGridInfo[i]    // Relation to link to the grand-children
          );
        }
      }
    }
  }

  activeGridChangeByParent(data: string) {
    this.activeGridId.set(data);
  }

  onClickPCGridButton(clicked: { gridId: string, buttonClick: buttonEmitType }) {
    this.buttonClicked(clicked.buttonClick)
  }

  //when click on grid component and change the active grid
  clickOnGrid(data: string) {
    this.activeGridId.set(data)
  }


  buttonClicked(button: buttonEmitType) {
    if (this.isParentGrid() === false) {
      this.onButtonClicked.emit(button)
    }
    if (button?.type === 'button' && button.normalButtonData === 'fw_GENERAL_SaveBtn') {
      if (this.isParentGrid()) {
      const format = this.dataGridGroup()?.gridFormat;

      if (format === "treeview") {
      // Treeview Logic
      if (this.treegridComponent) {
        this.treegridComponent.saveData();
      }
    } else {
      // Normal Grid Logic
      if (this.gridComponent) {
        this.gridComponent.saveData();
      }
    }
    } else{
        this.callingGridButton.emit({gridId : this.dataGridGroup().gridId ,buttonClick : button})
      }
    }
    if (button?.type === 'button') {
      if (button.normalButtonData === 'fw_GRID_AddRow') {
        if (this.SelectionChange()?.length === 1 || this.isParentGrid()) {
          this.gridComponent.addNewRow();
          this.onButtonClicked.emit(button)
        }
        else {
          notify({ message: 'MESSAGE.COM_W0007' });
        }
      }
      if (button.normalButtonData === 'fw_GRID_PasteRow') {
         if (this.SelectionChange()?.length === 1 || this.isParentGrid()) {
            this.gridComponent.pasteRowsFromClipboard();
          }
          else {
            notify({ message: 'MESSAGE.COM_W0007' });
          }
      }
      if (button.normalButtonData === 'fw_GRID_CopyRow') {
        this.isCopyRowFlag = true;
      }

      if (button.normalButtonData === 'fw_GRID_ExportData') {
        this.requestFilterValue.emit(); 
        this.gridComponent.openExportDataDialog();
      }
    }

    if (button?.type === 'toggleButton') {
      if (button.toggleButtonData?.btnId === 'fw_GRID_GridFilterSort') {
        this.gridComponent.onGridOpsToggle(button?.toggleButtonData?.state)
      }
    }

    if (button?.type === 'menuAndSpiltButton') {
      if (button?.menuAndspiltButtonData?.btnId === 'fw_GRID_CellSummaryBtn' && button?.menuAndspiltButtonData?.menuButtonId) {
        this.gridComponent.selectedCellSummary.set(button?.menuAndspiltButtonData?.menuButtonId)
      }
      if (button?.menuAndspiltButtonData?.btnId === 'fw_General_HistoryMenuBtn' && button?.menuAndspiltButtonData?.menuButtonId) {
        this.onButtonClicked.emit(button);
      }
    }
  }

  onRowAdded(data: any) {
    if (data?._isNew === true) {
      const apiObjectName = this.dataGridGroup().apiObjectName;
      const list = this.dataListGroup()[apiObjectName];
      let maxParentRowId = 0;
      if (list.length > 0) {
        maxParentRowId = Math.max(...list.map((item: any) => item.parentRowId));
      }
      maxParentRowId++;
      let addedItem = data;
      if (this.SelectionChange() !== undefined) {
        const relations = this.dataGridGroup().relations || [];
        const updateAddrow = (relations: RELATION[], addrow: any, parentRow: any) => {
          relations.forEach((relations: RELATION) => {
            const { parentDataField, childDataField } = relations;

            // If both the parentDataField in parentRow and the childDataField in addrow exist and are not null
            if (parentRow[parentDataField] !== undefined && addrow[childDataField] !== undefined) {
              addrow[childDataField] = parentRow[parentDataField];
            }
          });
        };

        updateAddrow(relations, addedItem, this.SelectionChange()[0]);
      }
      let allData = this.dataListGroup();
      addedItem.parentRowId = maxParentRowId;
      if (!this.isParentGrid()) {
        addedItem.targetParentRowId = this.SelectionChange()[0]?.parentRowId;
      }
      allData[apiObjectName].push(addedItem);
      this.DataChangeDetected.netRowChangeCounterIncrement();
    }
  }

  async modifyDataList(data: any) {
    // Create a copy so you don’t mutate the original data
    const updatedData = { ...data };

    // Loop through all keys in the object
    Object.keys(updatedData).forEach((key) => {
      // Only process array-type tables (like FirstTable, SecondTable, etc.)
      if (Array.isArray(updatedData[key])) {
        let rowid = 1;

        // Add rowid to each element
        updatedData[key] = updatedData[key].map((item: any) => ({
          ...item,
          parentRowId: rowid++,
        }));
      }
    });

    // Create a copy so you don’t mutate the original data
    const updatedData1 = { ...data };

    // Loop through all keys in the object
    Object.keys(updatedData1).forEach((key) => {
      // Only process array-type tables (like FirstTable, SecondTable, etc.)
      if (Array.isArray(updatedData1[key])) {
        let rowid = 1;

        // Add rowid to each element
        updatedData1[key] = updatedData1[key].map((item: any) => ({
          ...item,
          parentRowId: rowid++,
        }));
      }
    });

    await this._dataListGroup.set(updatedData1);
    await this.dataListGroup.set(updatedData);
    this.gridDataList = { list: this.dataListGroup()[this.dataGridGroup().apiObjectName], total: data ? data[`TotalData_${this.dataGridGroup().apiObjectName}`] : 0 };
  }

  //create list for Grid ID for Save
  getTableapiObjectNames(gridData: any) {
    let apiObjectName = [gridData.apiObjectName]; // Start by adding the current table's gridId
    if (gridData.childGridInfo && gridData.childGridInfo.length > 0) {
      // If the current table has a childGridInfo, recursively get the ids from the childGridInfo
      for (let i = 0; i < gridData?.childGridInfo.length; i++) {
        apiObjectName = apiObjectName.concat(this.getTableapiObjectNames(gridData.childGridInfo[i]));
      }
    }
    return apiObjectName;
  }

  //create list for Grid ID for Save
  getAllGridIdForSaveData(gridData: any) {
    let gridId = [gridData.gridId]; // Start by adding the current table's gridId
    if (gridData.childGridInfo && gridData.childGridInfo.length > 0) {
      // If the current table has a childGridInfo, recursively get the ids from the childGridInfo
      for (let i = 0; i < gridData?.childGridInfo.length; i++) {
        gridId = gridId.concat(this.getAllGridIdForSaveData(gridData.childGridInfo[i]));
      }
    }
    return gridId;
  }

  getColumnDataList(gridData: any): Record<string, GRID[]> {
    const result: Record<string, GRID[]> = {};
    // Add current table ID and dataGrid
    result[gridData.gridId] = gridData.dataGrid;
    // If there's a childGridInfo, merge recursively
    if (gridData.childGridInfo && gridData.childGridInfo.length > 0) {
      for (let i = 0; i < gridData?.childGridInfo.length; i++) {
        Object.assign(result, this.getColumnDataList(gridData.childGridInfo[i]));
      }
    }
    return result;
  }

  isSaveData(): boolean {
    return Object.keys(this.saveDataList).some(key => {
      const data = this.saveDataList[key];
      return data.AddList.length !== 0 || data.DeleteList.length !== 0 || data.UpdateList.length !== 0;
    });
  }
  async saveData(isPassingParent: boolean = false): Promise<ParentChildSaveData> {
    let validStatusPassingToParent = true;
    const dataGridapiObjectNamesGroup = this.getTableapiObjectNames(this.dataGridGroup())
    const dataGridIdGroup = this.getAllGridIdForSaveData(this.dataGridGroup())
    this.ColumnListGroup = this.getColumnDataList(this.dataGridGroup())
    for (let x = 0; x < dataGridapiObjectNamesGroup.length; x++) {
      const saveData = this.getSaveData(dataGridapiObjectNamesGroup[x], dataGridIdGroup[x]);
      //when any cell is invliad cell then return error
      const validStatus = (await saveData).validStatus ?? false
      const addData = (await saveData).AddList || [];
      const UpdateList = (await saveData).UpdateList || [];
      const DeleteList = (await saveData).DeleteList || [];

      const Datas: SaveData = {
        AddList: addData,
        UpdateList: UpdateList,
        DeleteList: DeleteList
      };

      this.saveDataList[dataGridapiObjectNamesGroup[x]] = Datas;
      if (validStatus === false) {
        if (!isPassingParent) {
          return { data: this.saveDataList, validStatus: false }
        }
        validStatusPassingToParent = false;
      }
    }
    if (isPassingParent) {
      return { data: this.saveDataList, validStatus: validStatusPassingToParent };
    }

    //when any change is not in parent childGridInfo grid then not calling api
    if (!this.isSaveData()) {
      return { data: this.saveDataList, validStatus: false }
    }
    // this.getSearchData.emit(false);
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));

    this.loader.increment(this.formLoaderKey());
    return new Promise((resolve) => {
      this.service.saveData(this.saveDataList, /*this.searchList(), */this.saveDataUrl()).subscribe({
        next: (res) => {
          if (res.Message === null && res.Messagecode === null) {
            this.loader.decrement(this.formLoaderKey());
            notify({ message: 'MESSAGE.COM_S0001' });
            this.DataChangeDetected.netRowChangeCounterReset();
            this.DataChangeDetected.dataChangeListReset();
            if(this.dataGridGroup().selectionMode === 'multiple'){
              this.rowSelectionChanges = []
            }
            // this.dataListGroup.set(res.Data)
            // this.modifyDataList(res.Data)
            this.afterSave.emit();
          }
        },
        error: (err) => {
          this.loader.decrement(this.formLoaderKey());
          resolve({ data: this.saveDataList, validStatus: false });
        }
      });
    });
  }

  async getSaveData(apiObjectName: string = '', gridId: string = ''): Promise<{
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
      const invalidColumns = await this.validateRowData(row, apiObjectName, gridId);
      if (invalidColumns.length > 0) {
        validStatus = false;
        this.addInvalidCells(row, invalidColumns);
        this.invalidCellRowIds().push(row.rowid);
        this.loader.increment(this.formLoaderKey());
        if(this.dataGridGroup().gridId === gridId){
          this.gridComponent.convertParentRowIdintoRowId(row.parentRowId,this.isParentGrid())
          this.loader.decrement(this.formLoaderKey());
        }
        else{
          this.inValidRowOfGridWithRowId = {gridId : gridId, row : row }
        }

      }
      return this.formatRowData(row, gridId);
    };

    const data = (this.dataListGroup())[apiObjectName];
    if (data !== undefined) {
      for (const row of data) {
        if (row._isNew) {
          addListPromises.push(prepareRowWithValidation(row));
        } else if (row.changedCells?.length > 0) {
          updateListPromises.push(prepareRowWithValidation(row));
        }
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

      this.invalidCellRowIds.set([]);
      return {
        AddList: [],
        UpdateList: [],
        DeleteList: [],
        validStatus,
      };
    }

    if ((this._dataListGroup() as any)[apiObjectName] !== undefined) {
      for (const row of ((this._dataListGroup() as any)[apiObjectName])) {
        if (row._isDelete) {
          deleteList.push(await this.formatRowData(row, gridId));
        }
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

  /**
   * adds the invalidCells property in row
   * @param row always pass row byRef
   * @param columns object of column name and its error message
   */
  addInvalidCells(
    row: any,
    columns: { [key: string]: { message: string, params: {} } }[]
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
      const existingIndex = row.invalidCells.findIndex((cell: any) => cell[key]);

      if (existingIndex === -1) {
        // If no matching key found, push the new invalid cell
        row.invalidCells.push(clm);
      } else {
        // If a matching key is found, override the existing cell
        row.invalidCells[existingIndex][key] = value;
      }
    });
  }

  /**
   * Formats the data based on its data type
   * currently used for date and number
   * @param rowData
   * @returns
   */
  private formatRowData(rowData: any, gridId: string): any {
    const formattedData: any = {};
    this.ColumnListGroup[gridId].forEach((column: GRID) => {
      if (column.isGridIgnore !== true) {
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
      } else if (column.dataField?.startsWith('Updtdt')) {
        // for update date columns which is Updtdt
        const value = rowData[column.dataField];
        formattedData[column.dataField] = value;
      }
    });

    return formattedData;
  }

  isInvalidCell(row: any, column: string): boolean {
    return (
      row.invalidCells !== undefined &&
      row.invalidCells.some(
        (cell: { column: string; message: string }) => cell.column === column
      )
    );
  }

  /**
   * returns the invalid message for columnName form data
   * @param data
   * @param columnName
   * @returns
   */
  getInvalidMessage(data: any, columnName: string): string {
    return (
      data?.invalidCells?.find((cell: any) => cell?.column === columnName)
        ?.message || 'Error'
    );
  }

  /**
     * Method for validating single row
     * @param rowData
     * @returns a list of columns and a corresponding message
     */
  private async validateRowData(
    rowData: any, apiObjectName: string, gridId: string,
  ): Promise<{ [key: string]: { message: string, params: {} } }[]> {
    const errors: { [key: string]: { message: string, params: {} } }[] = [];

    // Ensure invalidCells is always an array
    if (!Array.isArray(rowData.invalidCells)) {
      rowData.invalidCells = [];
    }

    //single row validation
    for (const column of this.ColumnListGroup[gridId]) {
      const value = rowData[column.dataField];

      const exists = rowData.invalidCells.some(
        (cell: any) => Object.keys(cell)[0] === column.dataField,
      );
      if (exists) {
        continue;
      }

      // Required validation
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

    //check for duplicate data
    if (
      this.primaryKeyColumns[gridId].length > 0 &&
      this.dataGridColumnList[gridId].findIndex((c: GRID) => c.isAutoGenerate) === -1 &&
      rowData._isNew
    ) {
      const isDuplicate = this.dataListGroup()[apiObjectName].some((existingRow) => {
        return this.primaryKeyColumns[gridId].every((key) => {
          const gridKey = key as keyof GRID;
          return existingRow[gridKey] === rowData[gridKey] && existingRow?.rowid !== rowData.rowid;
        });
      });

      if (isDuplicate) {
        const InvalidCell = this.setDuplicatePrimaryKey([rowData], gridId, apiObjectName, true);
        if (InvalidCell) {
          errors.push(InvalidCell);
        }
      }
    }

    rowData.invalidCells = [...rowData.invalidCells, ...errors];
    return rowData.invalidCells;
  }

  public setDuplicatePrimaryKey(
    duplicateData: any, gridId: string, apiObjectName: string,
    shouldReturnValue: boolean = false
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
      const hasAllPKs = this.primaryKeyColumns[gridId].every((pk) =>
        row.hasOwnProperty(pk)
      );

      if (!hasAllPKs) {
        continue; //  skip rows that don't satisfy your condition
      }

      //  Find the matching row in visibleDataList
      const match = this.dataListGroup()[apiObjectName].find((r) =>
        this.primaryKeyColumns[gridId].every((pk) => r[pk] === row[pk])
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

  hasGridChanges(): any {
    // Iterate over all grid keys in the dataListGroup object
    for (const gridKey in this.dataListGroup()) {
      if (this.dataListGroup()[gridKey] && this.dataListGroup()[gridKey].length > 0 && this.dataListGroup().hasOwnProperty(gridKey)) {
        // Check for new or changed rows in the current grid (gridKey)
        const hasNewOrChanged = this.dataListGroup()[gridKey].some(
          (row: any) => row._isNew === true || row.changedCells?.length > 0
        );

        // Check for deleted rows in the corresponding grid in _dataListGroup
        const hasDeleted = this._dataListGroup()[gridKey]?.some(
          (row: any) => row._isDelete === true
        );

        // If there are new, changed, or deleted rows, return true
        if (hasNewOrChanged || hasDeleted) {
          return true;
        }
      }
    }
    // If no changes were found in any grid, return false
    return false;
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
    });
    this.confirmChangesResult = result;
    if (result === 2) {
      // YES pressed then check data is contain any invalid cells
      const isSaveData = await this.saveData(); //update data
      if (isSaveData.validStatus) {
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

  checkRelationValidity(): boolean {
    // Iterate over each relations and check if the corresponding value in selectionRow is null or undefined
    if (this.SelectionChange()?.length > 0) {
      for (const rel of this.dataGridGroup().relations) {
        const parentDataField = rel.parentDataField;
        if (!this.ignorePrimaryKeyinPCList.includes(parentDataField)) {
          // If the value in selectionRow is null or undefined, return false
          if (this.SelectionChange()[0][parentDataField] === null || this.SelectionChange()[0][parentDataField] === undefined || this.SelectionChange()[0][parentDataField] === '') {
            return false;
          }
        }
      }
    } else {
      return false
    }
    // If all checks pass, return true
    return true;
  }

  //gird button is disable or not
  isButtonDisabled(nameOfBtn: any): boolean {
    //when block row selection change then disable all buttons, can't perfrom any operation in grid
    if (this.blockRowSelectionChange) {
      return true;
    }
    //paste row button is disable whenever any row is not copy
    if (nameOfBtn.btnId === 'fw_GRID_PasteRow') {
      return /*this.isCopyRowFlag ?*/ false /*: true*/;
    }
    if (!(this.SelectionChange() || this.uniqueGridIdListValue[0] === this.dataGridGroup().gridId)) {
      if (nameOfBtn.btnId === 'fw_GRID_AddRow') {
        return true;
      }
    }
    //when parent(relations manager column) is not contain any values then disable button in childGridInfo
    if (this.SelectionChange()) {
      const isParentContainValue = this.checkRelationValidity();
      if (!isParentContainValue) {
        if (nameOfBtn.btnId === 'fw_GRID_AddRow') {
          return true;
        }
      }
    }

    //button is disable when grid is not contain sel data
    if (this.rowSelectionChanges?.length === 0 || this.rowSelectionChanges === undefined) {
      if (nameOfBtn.btnId === 'fw_GRID_DeleteRow' || nameOfBtn.btnId === 'fw_GRID_CopyRow' || nameOfBtn.btnId === 'fw_GENERAL_CopyData' || nameOfBtn.btnId === 'fw_GENERAL_EditData') {
        return true;
      }
    }
    return false;
  }

   async copyAllRows(): Promise<{[key: string]: any[]}> {
    const cloneDataListrows = structuredClone(this.dataListGroup());
    Object.keys(cloneDataListrows).forEach(key => {
      if (Array.isArray(cloneDataListrows[key])) {
        cloneDataListrows[key].forEach(item => item._isNew = true);
      }
    });
    return cloneDataListrows;
  }

  async resetGrid(): Promise<void> {
    //Reset Signals
    this.dataListGroup.set({});
    this._dataListGroup.set({});
    this.invalidCellRowIds.set([]);
    this.activeGridId.set('');
    this.buttonOrder.set(null);
    this.childVerticalContainerSize.set([]);

    //Reset Fields
    this.rowSelectionChanges = undefined;
    this.gridDataList = { list: [], total: 0 };
    this.saveDataList = {};
    this.dataGridColumnList = {};
    this.primaryKeyColumns = {};
    this.ColumnListGroup = {};
    this.uniqueGridIdListValue = [];
    // this.isButtonDisabledFn = [];
    this.allGridRelationManagerList = {};
    this.allGridAPIObjRelationList = {};
    this._resultObjectGridIds = {};
    this.triggerUpdateScollHeigth = false;
    this.isupdatedChild = '';
    this.isCopyRowFlag = false;
    this.ignorePrimaryKeyinPCList = [];
    this.blockRowSelectionChange = false;
    this.childContainerSize.clear();

    //Reset Child Grid Components
    this.gridComponent?.resetGrid();

    //Recursive reset for child ParentChildGrid instances
    this.childParentChildGrids?.forEach(child => child.resetGrid());
  }

  get groupedRows() {
    const info = this.dataGridGroup().childGridInfo;
    if (!info) return [];

    // 1. Group items
    const groups = info.reduce((acc, item) => {
      // FALLBACK: If index is missing, use a unique negative number 
      // or a large number so they don't group together.
      const row = item.childDisplayRowIndex != null ? item.childDisplayRowIndex : Math.random() + 1000;

      if (!acc[row]) acc[row] = [];
      acc[row].push(item);
      return acc;
    }, {} as Record<number, any[]>);

    // 2. Sort and return

    return Object.keys(groups)
      .sort((a, b) => Number(a) - Number(b))
      .map(key => groups[Number(key)]);
  }

  onSplitterSizeChange(rowIndex: number, sizes: number[]) {
    this.childContainerSize.set(rowIndex, sizes); // Store sizes based on rowIndex
    this.SpitterHeigthChange = sizes;
  }

  getPanelSize(index: any, length: number, rowIndex: number) {
    const sizeList = this.childContainerSize?.get(rowIndex)
    if (!sizeList) {
      return 100 / length
    }
    else {
      return sizeList[index]
    }
  }

  async triggerParentChildGetData(event: { pageSize: number; pageIndex: number, sortType: any, sortColumn: any, gridFilters: any, previousPageIndex: number }): Promise<void> {
    if (this.isParentGrid()) {
      this.gridPreviouspageIndex = event.previousPageIndex;
      if (!this.getDataUrl()) {
        const result = await this.confirmChanges();

        if (result.proceed === false) {
          if (!result.proceed || this.confirmChangesResult == 0) {
            this.gridComponent.paginator.pageIndex = event.previousPageIndex;
            return;
          }

          if (this.confirmChangesResult == 2) {
            this.isSaveFromPaginator = true;
            this.gridComponent.paginator.pageIndex = event.previousPageIndex;
          }
        }

        this.entryGetData.emit({pageSize : event.pageSize, pageIndex : event.pageIndex, sortType: event.sortType, sortColumn: event.sortColumn, gridFilters: event.gridFilters, previousPageIndex: event.previousPageIndex});
      }
    }
  }

  onVerticalplitterSizeChange(size: number[]) {
    this.childVerticalContainerSize.set(size);
    this.SpitterHeigthChange = size;
  }

  getVerticalPanelSize(index: number, length: number) {
    if (this.childVerticalContainerSize() && this.childVerticalContainerSize().length > 0) {
      return this.childVerticalContainerSize()[index]
    }
    else {
      return 100 / length
    }
  }

  generalButtonClicked(nameOfButton: string) {    
    this.gridComponent.buttonClicked(nameOfButton);
  }

  extraButtonClicked(buttonName: string, menu?: any) {
    this.gridComponent.extraButtonClicked(buttonName, menu)
  }

  getGridData(gridId: string): any[] {
    return this.dataListGroup()[gridId] || [];
  }
}
