import { Subject } from 'rxjs/internal/Subject';
import { BTN_TYPE } from './extraButton.type';
import { refScreenRelations } from './refScreen.type';

export type CopyUsageValues =
  | 'defaultCopyValue'
  | 'defaultAddValue'
  | 'copiedDataValue';

export type GRID = {
  dataField: string;
  caption: string;
  tableName: string;
  dbColName: string;
  editorType: string; //1: string, 2: number, 3: date, 4: kbn, 5: checkbox(boolean)
  isProtected?:boolean;
  relativeColumnname?: string;
  columnFor?:string;
  isSpinButton?: boolean;
  maxLength?: number;
  maxValue?: number;
  minValue?: number;
  dataPrecision?: number;
  dataScale?: number;
  IsVisibleInGrid: boolean;
  IsVisibleInSearch: boolean;
  isGridIgnore?: boolean;
  displayOrderForGrid?: number;
  displayOrderForSearch?: number;
  isPrimaryKey?: boolean;
  isAutoGenerate?: boolean;
  isEditable?: boolean;
  isFrozen?: boolean;
  IsSortable?: boolean;
  IsFilterable?: boolean;
  isVisibleInDetail?:boolean;
  isRequired?: boolean;
  dateFormat?: string | undefined;
  tabGroup?: {
    tabCaption: string;
    colSpan: number;
  };
  alignment?: string;
  memberList?: Array<{
    code: string;
    caption: string;
  }>;
  ignorePrimaryKeyinPC? : boolean;

  onChangeCallback?: (rowData: any) => void;

  searchRequired?: 'FROM' | 'TO' | 'BOTH' | 'ANY' | '' ;
  showMatchType?: boolean;
  isReferenceScreenVisibleInGrid?: boolean;
  referenceScreenId?: string;
  refRelations?: refScreenRelations[];

  columnGroupNumber?: number;
  rowIndex?: number;
  tabularValueWidthpx? : number;
  tabIndex?: number;
  calculationFormula?: string;
  dependentOperations?: {
    calculations: Array<{
      dependentField: string;
      operant: string;
      targetField: string;
    }>;
    childOperations: Array<{
      action?: {
        actionName: string;
        compareValue: boolean;
        targetField: string;
      }
    }>;
  };
  childAggregation?: {
    operation: 'sum' | 'avg' | 'count' | 'min' | 'max';
    sourceGrid: string;
    sourceField: string;
  };
  childColumns?: GRID[];
  defaultCopyValue?: any;
  defaultAddValue?: any;
  useValueWhenCopy?: CopyUsageValues;
};

// column-filter.model.ts
export type FilterCondition =
  | 'startsWith'
  | 'contains'
  | 'notContains'
  | 'endsWith'
  | 'equals'
  | 'notEquals'
  | 'lessThan'
  | 'greaterThan'
  | 'dateIs'
  | 'dateIsNot'
  | 'dateIsBefore'
  | 'dateIsAfter';
export type MatchMode = 'all' | 'any';

export type ColumnFilterRule = {
  condition: FilterCondition;
  value: string;
}

export type ColumnFilterState = {
  columnname: string;
  matchMode: MatchMode;
  rules: ColumnFilterRule[];
  editorType?: string;
}

export type detailViewConfig = {
  tabCaption: string;
  tabColumns: number;
};

export type gridColumnHeaderMetaData = {
  dataField: string;
  caption: string;
  editorType: string; //1: string, 2: number, 3: date, 4: kbn , 5: dateTime
};

export type GRID_INFO = {
    gridId : string,
    dataGrid : GRID[],
    gridButtons : BTN_TYPE[],
    childGridInfo : GRID_INFO[],
    treeViewGridInfo : TREEVIEWGRID_INFO[],
    showPaginator : boolean,
    relations : RELATION[],
    pageSizes : number[],
    showExport: boolean,
    showSortData : boolean,
    isCellSummary : boolean,
    selectionMode :  'single' | 'multiple',
    showSwapColumns :boolean,
    gridFormat : 'normal' | 'tabular' | 'treeview',
    stickyLabel : boolean,
    isEditableGrid : boolean,
    resizableCols : boolean,
    exportUrl : string,
    apiObjectName : string,

    detailViewTabs : detailViewConfig[],
    childDisplayRowIndex : number,
    addTotalRow?: boolean,
    addTotalColumn?: boolean
}

export type RELATION = {
    childDataField : string,
    parentDataField : string
}

export type TREEVIEWGRID_INFO = {
    initialExpandAll : boolean,
    parentColumnDatafield : string,
    childColumnDatafield : string,
}

export type GridActionRequest = {
  notifier: Subject<boolean>;
}
