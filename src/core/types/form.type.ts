import { FormGroup } from '@angular/forms';

export type EditorType = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type SearchRequiredType = 'FROM' | 'TO' | 'BOTH' | 'ANY' | boolean | '';

export interface MessageDisplayOption {
  message: string;
  type?: 'error' | 'warning' | 'info';
  params?: Record<string, unknown>;
}

export interface MemberListOption {
  caption: string;
  code: string | number;
  checked?: boolean;
}

export interface RefRelation {
  fromColName?: string;
  toColName?: string;
  mainScreenColumnName?: string;
  matchType?: string;
  refColumnName?: string;
}

export interface FormColumn {
  dataField: string;
  caption: string;
  editorType: EditorType;
  isVisible: boolean;
  rowIndex?: string;
  columnGroupNumber?: string;
  
  // Validation & Input States
  isRequired?: boolean;
  isEditable?: boolean;
  isDisabledField?: boolean;
  disableInputBox?: boolean;
  isAutoGenerate?: boolean;
  
  // Formatting & Limits
  maxLength?: number;
  maxValue?: number;
  minValue?: number;
  dataPrecision?: number;
  dataScale?: number;
  dateFormat?: string;
  isSpinButton?: boolean;
  
  // Filter Specific Features
  searchRequired?: SearchRequiredType;
  showMatchType?: boolean;
  
  // Data Bindings
  memberList?: MemberListOption[];
  defaultAddValue?: string | number | boolean;
  useValueWhenCopy?: boolean | 'copiedDataValue' | string;
  
  // Reference Screen
  isReferenceScreen?: boolean;
  referenceScreenId?: string;
  refRelations?: RefRelation[];
}

export interface ReferenceSelectedEvent {
  rowId: number;
  refForColumn: string;
  selectedValue: string | number;
  tabId?: string;
  gridId?: string;
  refTitleCaption: string;
  mainScreenColumnValues: Array<{ key: string; value: string | number | null }>;
}

export interface FormValueChangedEvent {
  form: FormGroup;
  updatedColumn: string;
}

export interface FieldInputFinishedEvent {
  tabId: string;
  updatedColumn: string;
}

export interface CustomDatePickerField {
  label: string;
  condition: string;
  dataField: string;
  min?: number;
  max?: number;
}