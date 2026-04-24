import { GRID_INFO } from './grid.type';
import { refScreenRelations } from './refScreen.type';

export type entryScreenMode = 'Add' | 'Edit' | 'Copy' | 'Detail';

export type CopyUsageValues =
  | 'defaultCopyValue'
  | 'defaultAddValue'
  | 'copiedDataValue';

export type columnInfo = {
  dataField: string;
  caption: string;
  tableName: string;
  dbColName: string;
  editorType: string; //1: string, 2: number, 3: date, 4: dropdown, 5: checkbox(boolean) , 6: radio, 7: checkbox(group) , 8: textarea
  isProtected?:boolean;
  isEditable?: boolean;
  entryScreenEditableModeList?: entryScreenMode[];
  entryScreenVisibleModeList?: entryScreenMode[];
  isPrimaryKey?: boolean;
  isAutoGenerate?: boolean;
  isRequired?: boolean;
  memberList?: Array<{
    code: string;
    caption: string;
  }>;
  refRelations?: Array<refScreenRelations>;
  referenceScreenId?: string;
  rowIndex?: string;
  columnGroupNumber?: string;
  isVisible: boolean;
  isReferenceScreen: boolean;
  dateFormat?: string | undefined;
  alignment?: string;
  defaultCopyValue?: any;
  defaultAddValue?: any;
  useValueWhenCopy?: CopyUsageValues;
  isSpinButton?: boolean;
  maxLength?: number;
  maxValue?: number;
  minValue?: number;
  dataPrecision?: number;
  dataScale?: number;
  isDisabledField?: boolean;
  dependentOperations?: {
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
    sourceGrid: string;  // This is the Tab ID (Tab1, Tab2, Tab3)
    sourceField: string;
  };
  showMatchType? : boolean;
  filterConditions? : string[];
  disableInputBox? : boolean;
  searchRequired? : 'FROM' | 'TO' | 'BOTH' | 'ANY' | '' ;
  fixedValueWidthpx? : number;
};

export type TabObject = {
  tabId: string;
  tabCaption: string;
  tabType: 'Grid' | 'Form' | 'Custom' | 'Approval';
  entryTabGroup:'Header' | 'Detail';
  isLazyLoadTab?: string;
  getDataMethod:string;
  apiObjectName: string;
  gridInfo: GRID_INFO;
  customGridInfo?: GRID_INFO[];
  customComponentKey?: string;
  entryHeaderFormFields: columnInfo[];
  relations: RELATION[]; // Relation with primary tab It will only be checked when the apiObjectName is different than the primaryHeaderTab
  hasDynamicPkDependency?: string;
  pkDependencyRules?: PkRules;
};

export type PkRules = {
  dependencySwitchCheckboxDatafield: string;
  checkedRules?: PkRuleObj;
  uncheckedRules?: PkRuleObj;
};

export type PkRuleObj = {
  selectorId: string;
  fields: string[];
}

export type RELATION = {
  childDataField: string;
  parentDataField: string;
}

export enum ApprovaScreenOparations {
  Requested = 1,
  Draft = 2,
  Approved = 3,
  Returned = 4,
  Withdraw = 5
}
