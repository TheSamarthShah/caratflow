import {
  Component,
  inject,
  input,
  OnChanges,
  OnInit,
  output,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Button } from '../button/button';
import { gridColumnHeaderMetaData } from '../../models/grid.type';
import { DropDown } from '../dropdown/dropdown';
import { RadioButton } from '../radiobutton/radiobutton';
import { TranslateModule } from '@ngx-translate/core';
import { DialogButton } from 'src/core/models/dialogbutton.type';
import { DialogBox } from '../dialogbox/dialogbox';
import { SortDataService } from 'src/core/services/sort-data-service';
import { LoaderService } from 'src/core/services/loader-service';
@Component({
  selector: 'acty-sort-data',
  imports: [Button, DialogBox, RadioButton, DropDown, TranslateModule],
  templateUrl: './sort-data.html',
  styleUrl: './sort-data.scss',
})
export class SortData implements OnInit, OnChanges {
  @ViewChild('dialog') dialogBox!: DialogBox;

  sortDataService = inject(SortDataService);
  loader = inject(LoaderService)

  // Inputs
  displayDialogInp = input.required<boolean>();
  sortOptionsInp = input.required<gridColumnHeaderMetaData[]>(); // Input as gridColumnHeader[]
  formId = input.required<string>();
  userId = input.required<string>();
   childId = input<string>('');
  formLoaderKey = input.required<string>();

  // Outputs
  sortDataChanged = output();
  closeSortDataTrigger = output();

  displayFlg = signal(false);
  sortingData = signal<{
    UserId: any;
    FormId: string;
     ChildId : string;
    Columns: {
      SortSeq: string;
      SortColumn: string | null;
      SortType: string;
    }[];
  }>({
    UserId: '',
    FormId: '',
     ChildId : '',
    Columns: Array.from({ length: 5 }, (_, i) => ({
      SortSeq: (i + 1).toString(),
      SortColumn: '',
      SortType: '0',
    })),
  });

  sortOptions: gridColumnHeaderMetaData[] = []; // Transformed list

  initialSortingData: {
    UserId: any;
    FormId: string;
     ChildId : string,
    Columns: {
      SortSeq: string;
      SortColumn: string;
      SortType: string;
    }[];
  } = {
    UserId: '',
    FormId: '',
    ChildId : '',
    Columns: Array.from({ length: 5 }, (_, i) => ({
      SortSeq: (i + 1).toString(),
      SortColumn: '',
      SortType: '0',
    })),
  };

  ngOnInit(): void {
    this.getSort();   
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayDialogInp']) {
      this.displayFlg.set(this.displayDialogInp());
      if (this.displayFlg()) {
        DialogBox.instance?.openDialog();
        this.sortingData.set(
          JSON.parse(JSON.stringify(this.initialSortingData))
        );
                
      } else {
        DialogBox.instance?.onClose();
      }
    }

    if (changes['sortOptionsInp']) {
      this.sortOptions = this.sortOptionsInp().map((option) => ({
        dataField: option.dataField,
        caption: option.caption,
        editorType: option.editorType,
      }));
    }

    if (changes['formId']) {
      // Update sortingData when formId is available
      this.sortingData.set({
        ...this.sortingData(),
        FormId: this.formId(),
      });
      this.initialSortingData = {
        ...this.initialSortingData,
        FormId: this.formId(),
      };
    }

    if (changes['userId']) {
      // Update sortingData when userId is available
      this.sortingData.set({
        ...this.sortingData(),
        UserId: this.userId(),
      });
      this.initialSortingData = {
        ...this.initialSortingData,
        UserId: this.userId(),
      };
    }

    if (changes['childId']) {
      // Update sortingData when childId is available
      this.sortingData.set({
        ...this.sortingData(),
        ChildId: this.childId(),
      });
      this.initialSortingData = {
        ...this.initialSortingData,
        ChildId : this.childId(),
      };
    }
  }

  onCloseDialog(data: any) {
    if (data === 'close') {
      this.displayFlg.set(false);
      this.closeSortDataTrigger.emit();
      DialogBox.instance?.onClose();
    }
  }

  handleDialogResult(result: string) {
    if (result === 'Reset') {
      this.resetSort();
    } else if (result === 'Cancel') {
    }
  }
  onSelectionChanged(selected: any, column: any): void {
    // this.selectedId = selected?.Id;

    this.sortingData.update((data) => {
      const updatedCols = data.Columns.map((c) =>
        c.SortSeq === column.SortSeq
          ? { ...c, SortColumn: selected } // replace SortColumn
          : c
      );

      return {
        ...data,
        Columns: updatedCols,
      };
    });
  }

  onSortTypeChanged(selected: any, column: any) {
    // Depending on acty-radio-button, event might be like { value: '0' }

    this.sortingData.update((data) => {
      const updatedCols = data.Columns.map((c) =>
        c.SortSeq === column.SortSeq
          ? { ...c, SortType: selected.value } // replace SortColumn
          : c
      );
      return {
        ...data,
        Columns: updatedCols,
      };
    });
  }

  getSort(): void {
    this.sortDataService
      .getSortingData(
        this.sortingData().UserId ?? '',
        this.sortingData().FormId ?? '',
        this.sortingData().ChildId ?? ''
      )
      .subscribe({
        next: (res) => {
          if (res.Messagecode === null && res.Message === null) {
            this.sortingData.set(
              JSON.parse(JSON.stringify(res.Data.SortingData))
            );
            this.initialSortingData = JSON.parse(
              JSON.stringify(res.Data.SortingData)
            );
          }
        },
      });
  }

  // resets the sorting to common default settings
  resetSort(): void {
    this.sortingData.set({
      UserId: this.userId(),
      FormId: this.formId(),
       ChildId : this.childId(),
      Columns: Array.from({ length: 5 }, (_, i) => ({
        SortSeq: (i + 1).toString(),
        SortColumn: '',
        SortType: '0',
      })),
    });

    // const resetColumns = Array.from({ length: 5 }, (_, i) => ({
    //   SortSeq: (i + 1).toString(),
    //   SortColumn: '',   // 👈 very important: clears dropdown
    //   SortType: '0',
    // }));

    // this.sortingData.set({
    //   UserId: this.userId(),
    //   FormId: this.formId(),
    //   Columns: resetColumns,   // 👈 new array reference
    // });

    // // Also update initialSortingData if needed
    // this.initialSortingData = {
    //   UserId: this.userId(),
    //   FormId: this.formId(),
    //   Columns: resetColumns,
    // };
  }
  getDefaultValue(column: any, expected: string): boolean {
    return column.SortType === expected ? true : false;
  }

  private hasSortingDataChanged(): boolean {
    return (
      JSON.stringify(this.sortingData()) !==
      JSON.stringify(this.initialSortingData)
    );
  }

  applySort(): void {
     if (!this.hasSortingDataChanged()) {
    // this.messageService.add({
    //   severity: 'info',
    //   summary: INFOMSG.I0002,
    // });
       return;
     }

    this.loader.increment(this.formLoaderKey())
    this.sortDataService.saveSortingData(this.sortingData()).subscribe({
      next: (data) => {
        if (data.Messagecode === null && data.Message === null) {
          this.sortDataChanged.emit();
        }
        // this.displayDialog.set(false);
        this.initialSortingData = JSON.parse(
          JSON.stringify(this.sortingData())
        );
        this.loader.decrement(this.formLoaderKey())
        this.closeModel();
      },
      error: (err) => {
        this.loader.decrement(this.formLoaderKey())
      },
    });
  }

  closeModel(): void {
    this.displayFlg.set(false);
    this.closeSortDataTrigger.emit();
    DialogBox.instance?.onClose();
  }
}
