import { Component, effect, inject, input, NgZone, OnChanges, output, SimpleChanges } from '@angular/core';
import { Button } from '../button/button';
import { ReferenceScreenService } from 'src/core/services/reference-screen-service';
import { firstValueFrom, take } from 'rxjs';
import { refScreenRelations } from 'src/core/models/refScreen.type';

@Component({
  selector: 'acty-reference-screen-button',
  imports: [Button],
  templateUrl: './reference-screen-button.html',
  styleUrl: './reference-screen-button.scss'
})
export class ReferenceScreenButton implements OnChanges {
  refScreenService = inject(ReferenceScreenService);
  ngZone = inject(NgZone);

  // Inputs
  referenceScreenId = input.required<string>();
  formId = input.required<string>();
  userId = input.required<string>();
  refForColumn = input.required<string>();
  selectedValue = input<string | string[] | any>();
  // if the column name with its value is given then it'll use it every time. The value comes from form.
  refRelations = input<refScreenRelations[]>([]);
  rowId = input<number>(-1);
  tabId = input<string>('');
  // use when multiple grids in same form to avoid emit propogation (specially for toroku forms)
  gridId = input<string>('');
  isBackgroundLoading = input<boolean>();
  disabled = input<boolean>();
  gridRefData = input<{
    referenceScreenId: string;
    rowId: number;
    gridId?: string;
    tabId?: string;
    refForColumn: string;
    selectedValue: string | string[];
    refRelations: refScreenRelations[];
  }>();
  skipMasterFilterDefaultValue = input<boolean>(false);

  // Outputs
  referenceSelected = output<{
    refForColumn: string;
    selectedValue: string;
    mainScreenColumnValues: { key: string; value: string }[];
    rowId: number;
    tabId?: string;
    gridId: string;
    refTitleCaption : string;
  }>();

  constructor() {
    effect(async () => {
      /**
       * If referenceSelected in service is changed and its refForColumn is not empty string then some value is selected so emit that value so it can be set.
       */
      if (this.refScreenService.referenceSelected().refForColumn != '') {
        await this.referenceSelected.emit(
          this.refScreenService.referenceSelected()
        );
        // After emiting reset the value in service
        this.refScreenService.referenceSelected.set({
          refForColumn: '',
          selectedValue: '',
          mainScreenColumnValues: [],
          rowId: -1,
          tabId: '',
          gridId: '',
          refTitleCaption : '',
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // gridRefData is used to get ref data without opening the dialog so when its input is changed update it in service
    if (changes['gridRefData']) {
      const currentData = this.gridRefData();

      if (currentData && currentData.refForColumn && currentData.refForColumn !== '' && this.refForColumn() === currentData.refForColumn) {
        this.refScreenService.queueTask(async () => {

          // 1. Trigger the background process
          this.refScreenService.gridRefData.set(currentData);

          // 2. PAUSE the queue until the background task completely finishes and fires its completion event
          await firstValueFrom(this.refScreenService.backgroundTaskCompleted$);
        });
      } else {
        this.refScreenService.gridRefData.set(currentData ?? null);
      }
    }
  }

  async showDialog(): Promise<void> {
    this.refScreenService.queueTask(async () => {
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
    this.refScreenService.updateReferenceData({
      referenceScreenId: this.referenceScreenId(),
      formId: this.formId(),
      userId: this.userId(),
      refRelations: this.refRelations(),
      refForColumn: this.refForColumn(),
      selectedValue: this.selectedValue() ?? '',
      rowId: this.rowId(),
      tabId: this.tabId(),
      gridId: this.gridId(),
      gridRefData: this.gridRefData() ?? null,
      skipMasterFilterDefaultValue : this.skipMasterFilterDefaultValue()
    });
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
    this.refScreenService.showRefScreen();
  });
  }
}
