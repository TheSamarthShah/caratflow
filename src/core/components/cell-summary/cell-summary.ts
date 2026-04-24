import {
  Component,
  input,
  output,
  Signal,
  computed,
  effect,
  ViewChild,
  model,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { DialogBox } from '../dialogbox/dialogbox';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'acty-cell-summary',
  imports: [ DialogBox, TranslateModule],
  templateUrl: './cell-summary.html',
  styleUrl: './cell-summary.scss',
})
export class CellSummary implements OnChanges {
  @ViewChild('dialog') dialogBox!: DialogBox;

  selectedValues = input<{ value: any; dataType: string }[]>([]);
  selectedCategories = model<string|null>(null);
  setCellSummaryPosition = input<{x : number,y : number}>({x : 0,y :0});

  summaryChanged = output<{
    isCellModeEnabled: boolean;
  }>();

  DisplaySelectedCellData: Signal<{
    col1: string;
    col2: string;
    col3: string;
    col4: string;
    col5: string;
    col6: string;
  }> = computed(() => {
    const values = this.selectedValues();
    const numericValues = values
      .filter((v) => v.dataType === '2' && v.value !== null)
      .map((v) => Number(v.value));

    const numericCount = values.filter((v) => v.dataType === '2').length;

    return {
      col1:
        numericCount > 0
          ? this.formatNumber(
              numericValues.reduce((sum, num) => sum + num, 0) / numericCount
            )
          : '',
      col2: values.length.toString(),
      col3: values
        .filter((v) => v.value !== null && v.value !== undefined)
        .length.toString(),
      col4:
        numericValues.length > 0
          ? this.formatNumber(Math.min(...numericValues))
          : '',
      col5:
        numericValues.length > 0
          ? this.formatNumber(Math.max(...numericValues))
          : '',
      col6: this.formatNumber(numericValues.reduce((sum, num) => sum + num, 0)),
    };
  });

  private formatNumber(num: number): string {
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
  }

  //  computedValues: MultiselectOption[] = [
  //   { key: '1', label: 'CORE.CELLSUMMARY.CellMode' }, // This is Cell Selectin Make on or off So Dont Change this line
  //   { key: '2', label: 'CORE.CELLSUMMARY.Average' },
  //   { key: '3', label: 'CORE.CELLSUMMARY.NumberOfData' },
  //   { key: '4', label: 'CORE.CELLSUMMARY.NumberOfValue' },
  //   { key: '5', label: 'CORE.CELLSUMMARY.Minimum' },
  //   { key: '6', label: 'CORE.CELLSUMMARY.Maximum' },
  //   { key: '7', label: 'CORE.CELLSUMMARY.Total' },
  // ];


  constructor() {
    effect(() => {
      this.summaryChanged.emit({
        isCellModeEnabled: this.isCellModeEnabled(),
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCategories']){
      this.onCategoryChange(this.selectedCategories());
    }
  }

  isCellModeEnabled: Signal<boolean> = computed(() => {
    return this.selectedCategories() === '1' ? true : false;
  });
  // 👇 This will always reflect how many cells are selected
  selectionCount: Signal<number> = computed(() => {
    return this.selectedValues().length;
  });

  onCategoryChange(selected: any): void {
    // this.selectedCategories.set(selected);
    const hasOne = String(selected)
      .split(',')
      .map((v) => v.trim())
      .includes('1');

    this.summaryChanged.emit({
      isCellModeEnabled: hasOne,
    });
    if (hasOne) {
      this?.dialogBox?.openDialog();
    } else {
      this?.dialogBox?.onClose();
    }
  }
}
