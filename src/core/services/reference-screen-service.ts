import { inject, Injectable, signal } from '@angular/core';
import { ConfigDataService } from './config-data.service';
import { refScreenRelations } from '../models/refScreen.type';
import { ActyCommon } from './acty-common';
import { concatMap, from, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReferenceScreenService {

  configDataService = inject(ConfigDataService);
  actyCommonService = inject(ActyCommon)
 
  // userid = JSON.parse(this.cookieService.get('seira_user') || '{}')?.userid;
 
  isVisible = signal<boolean>(false);
  // Hold reference screen related inputs
  referenceScreenId = signal<string>('');
  formId = signal<string>('');
  userId = signal<string>('')
  refForColumn = signal<string>(''); // stores the main screen column name for which the reference screen
  selectedValue = signal<string | string[]>(''); // current value for/of main screen column
  // if the column name with its value is given then it'll use it every time. The value comes from form.
  refRelations = signal<refScreenRelations[]>([]);
  defaultValue = signal<{ [key: string]: any }>({
    "fw_userid" : this.actyCommonService.getUserId()
  });
  /**
   * only used for grids and toroku form.
   * It holds primary key data of current row to identify which row to set the value
   */
  rowId = signal<number>(-1);
  tabId = signal<string>(''); 
  gridId = signal<string>('');
  /**
   * used to fetch data without opening the reference screen
   * reference button will have it as input and when that changes, that will update the service data(here)
   * when gridRefData in service(here) changes then it will execute code for fetching data in reference dialog component whcih will set the data.
   */
  gridRefData = signal < {
    referenceScreenId: string;
    rowId: number;
    gridId?: string;
    tabId?: string;
    refForColumn: string;
    selectedValue: string | string[];
    refRelations: refScreenRelations[];
  } | null>(null);

  //For Output
  referenceSelected = signal<{
    refForColumn: string;
    selectedValue: string;
    mainScreenColumnValues: { key: string; value: string }[];
    rowId: number;
    tabId?: string;
    gridId: string;
    refTitleCaption : string;
  }>({
    refForColumn: '',
    selectedValue: '',
    mainScreenColumnValues: [],
    rowId: -1,
    tabId: '',
    gridId: '',
    refTitleCaption :'',
  });
  skipMasterFilterDefaultValue = signal<boolean>(false);

  private actionQueue = new Subject<() => Promise<void>>();
  public backgroundTaskCompleted$ = new Subject<void>();

  constructor() {
    this.actionQueue.pipe(
      concatMap(task => from(task()))
    ).subscribe();
  }

  queueTask(task: () => Promise<void>) {
    this.actionQueue.next(task);
  }

  showRefScreen(): void {
    this.isVisible.set(!this.isVisible());
  }

  closeRefScreen(): void {
    this.cleanDataOnClose();
    this.isVisible.set(false);
  }

  async getReferenceData(screenName:string){
    return await this.configDataService.getReferenceScreenConfig(`${screenName}`);
  }

  updateReferenceData(data: {
    referenceScreenId: string,
    formId: string;
    userId : string
    refRelations: refScreenRelations[];
    refForColumn: string;
    selectedValue: string | string[];
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
      refRelations: refScreenRelations[];
    } | null;
    skipMasterFilterDefaultValue: boolean;
  }): void {
    this.formId.set(data.formId);
    this.userId.set(data.userId);
    this.refRelations.set(data.refRelations);
    this.refForColumn.set(data.refForColumn);
    this.selectedValue.set(data.selectedValue);
    this.rowId.set(data.rowId);
    this.tabId.set(data.tabId ?? '');
    this.gridId.set(data.gridId);
    this.referenceScreenId.set(data.referenceScreenId);
    this.gridRefData.set(data.gridRefData);
    this.skipMasterFilterDefaultValue.set(data.skipMasterFilterDefaultValue)
  }
 
  resetDefaultValue(){
    this.defaultValue.set({
      "fw_userid" : this.actyCommonService.getUserId()
    });
  }

  resetreferenceScreenData(): void {
    // Reset Signals
    this.isVisible.set(false);
    this.referenceScreenId.set('');
    this.formId.set('');
    this.userId.set('');
    this.refForColumn.set('');
    this.selectedValue.set('');
    this.refRelations.set([]);    
    
    this.rowId.set(-1);
    this.tabId.set('');
    this.gridId.set('');
    this.gridRefData.set(null);
    
    // Reset defaultValue 
    this.resetDefaultValue();  

    this.referenceSelected.set({
      refForColumn: '',
      selectedValue: '',
      mainScreenColumnValues: [],
      rowId: -1,
      tabId: '',
      gridId: '',
      refTitleCaption: '',
    });

    // Reset flag
    this.skipMasterFilterDefaultValue.set(false);
  }

  cleanDataOnClose(): void {
    this.referenceScreenId.set('');
    this.refForColumn.set('');
    this.selectedValue.set('');
    this.refRelations.set([]);
    this.rowId.set(-1);
    this.tabId.set('');
    this.gridId.set('');
    this.gridRefData.set(null);
    this.skipMasterFilterDefaultValue.set(false);
  }
}
