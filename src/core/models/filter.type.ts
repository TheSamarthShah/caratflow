import { refScreenRelations } from "./refScreen.type";

export type FILTER = {
  name: string;
  displayName: string;
  visible: boolean;
  required: boolean;
  value_from: string | string[];
  value_to: string;
  match_type: number;
  showMatchType?: boolean;
  data_type: string; //1: string, 2: number, 3: date, 4: checkbox, 6: radiobtn
  colMetadataKey: {
    tableName: string;
    columnName: string;
  };
  memberList?: Array<{
    code: string;
    name: string;
  }>;
  dateFormat?: string;
  invalidInput?: boolean;
  isReferenceScreen: boolean;
  referenceScreenId?: string;
  refTableJPName?: string;
  refRelations?: Array<refScreenRelations>;
};

export type MetadataKey = {
  tableName: string;
  columnName: string;
};

export type FILTERConditionSave = {
  Conditionno: string;
  Columnname: string;
  Visible: string;
  Fromvalue: string;
  Tovalue: string;
  Combovalue: string;
  Checkvalue?: string;
  Datatype?:string;
}

export function getFilterConditions(type: '1' | '3' | '2'): string[] {
  switch (type) {
    case '1':
      return [
        "TASK.Search.~",
        "TASK.Search.IsEqualTo",
        "TASK.Search.NotEqualTo",
        "TASK.Search.StartsWith",
        "TASK.Search.DoesNotStartsWith",
        "TASK.Search.EndsWith",
        "TASK.Search.ItDoesNotEndsWith",
        "TASK.Search.Contains",
        "TASK.Search.DoesNotInclude",
        "TASK.Search.IsBlank",
        "TASK.Search.IsNotBlank"
      ];

    case '3':
      return [
        "TASK.Search.~",
        "TASK.Search.IsEqualTo",
        "TASK.Search.NotEqualTo",
        "TASK.Search.IsBlank",
        "TASK.Search.IsNotBlank",
      ];

    case '2':
      return [
        "TASK.Search.~",
        "TASK.Search.IsEqualTo",
        "TASK.Search.NotEqualTo",
        "TASK.Search.IsBlank",
        "TASK.Search.IsNotBlank"
      ];

    default:
      return [];
  }
}

export type CustomDatePickerFields = {
  label: string;
  condition: string;
  dataField: string;
  min?: number;
  max?: number;
}