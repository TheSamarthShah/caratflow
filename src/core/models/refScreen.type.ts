
export type refScreenType = {
    referenceScreenId: string,
    refTableName: string;
    refTitleCaption: string,
    refQueryID: string;
    refColumns: refScreenColumns[],
};

export type refScreenRelations = {
  fromColName: string;
  matchType:
  '~'
  | 'IsEqualTo'
  | 'NotEqualTo'
  | 'StartsWith'
  | 'DoesNotStartsWith'
  | 'EndsWith'
  | 'ItDoesNotEndsWith'
  | 'Contains'
  | 'DoesNotInclude'
  | 'IsBlank'
  | 'IsNotBlank';
  toColName: string;
  refColumnName: string;
  mainScreenColumnName: string;
};

export type refScreenColumns = {
  columnName: string;
  caption: string;
  editorType: string; //1: string, 2: number, 3: date, 4: kbn
  IsVisibleInGrid: boolean;
  IsVisibleInSearch: boolean;
  memberList?: Array<{
    code: string;
    caption: string;
  }>;
  searchVisible: boolean;
  queryOrderBySeq?: number;
  
  maxLength? : number;
  maxValue? : number
  minValue? : number;
  dataPrecision? : number;
  dataScale? : number;
};
