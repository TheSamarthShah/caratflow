import { Component, inject, Input, input, OnChanges, OnInit, output, signal, SimpleChanges, ViewChild } from '@angular/core';
import { DialogBox } from "../dialogbox/dialogbox";
import { SwapColumns } from 'src/core/models/swapcolumns.type';
import { MatTable, MatTableModule } from '@angular/material/table';
import { Checkbox } from "../checkbox/checkbox";
import { CdkDragDrop, moveItemInArray, CdkDrag } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { SwapColumnServices } from 'src/core/services/swap-column-services';
import { LoaderService } from 'src/core/services/loader-service';
import { PeriodicElement } from 'src/core/models/PeriodicElement.type';
import { ShowTooltipIfTruncatedDirective } from 'src/core/directive/show-tooltip-if-truncated';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogButton } from 'src/core/models/dialogbutton.type';

@Component({
  selector: 'acty-swap-column',
  imports: [DialogBox, MatTableModule, CdkDrag, DragDropModule, FormsModule, CommonModule, TranslateModule, MatIconModule, Checkbox, ShowTooltipIfTruncatedDirective, MatTooltipModule],
  templateUrl: './swap-column.html',
  styleUrl: './swap-column.scss'
})
export class SwapColumn implements OnChanges,OnInit{

  @ViewChild('table', {static: true}) table!: MatTable<PeriodicElement>;
  
  service = inject(SwapColumnServices)
  loader = inject(LoaderService);
  
  userId = input.required<string>();
  formId = input.required<string>();
  childId = input<string>('');
  displayInp = input<boolean>(false); 
  gridColumnList = input<Array<any>>([]);
  formLoaderKey = input.required<string>();
  closeTriggered = output<void>();
  swapDataUpdated = output<Array<SwapColumns>>();

  displayFlg = signal(false);
  gridColumnList2 = signal<Array<SwapColumns>>([]);

  buttons: DialogButton[] = [
    {
      btnId: 'fwh_resetToInitialData',
      text: 'CORE.SWAPCOLUMN.BTN_TEXT_INITIAL_DATA',
      type: 'outlined',
      severity: undefined,
      disabled: false,
      avoidDialogCloseOnClick: true,
    },
    {
      btnId: 'fwh_saveSwapData',
      text: 'CORE.SWAPCOLUMN.BTN_TEXT_OK',
      type: 'filled',
      severity: 'primary',
      disabled: false,
      avoidDialogCloseOnClick: true,
    },
  ] as const;
  checked: boolean = false;
  newGridColumnList: Array<SwapColumns> = [];
  arrangedGridColumnList: Array<any> = [];
  swapData: SwapColumns[] = [];

  displayedColumns = ['drag', 'name', 'visible', 'fixed'];
 
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayInp']) {
      this.displayFlg.set(this.displayInp());
      if(this.displayInp()) {
        DialogBox.instance?.openDialog();        
      }
      else
        DialogBox.instance?.onClose();
    }
    this.table.renderRows();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.getSwapData();
    },10);
    this.table.renderRows();
  }

  handleDialogResult(result: string) {
    if (result === 'fwh_resetToInitialData') {
      this.resetData();
    }else if( result === 'fwh_saveSwapData'){
      this.saveData();
    }
  }

  //when drog row and change the index of row
   dropTable(event: CdkDragDrop<string>) {
    const list = this.gridColumnList2();
    const previousIndex = list.findIndex((d) => d === event.item.data);

    moveItemInArray(list, previousIndex, event.currentIndex);

    const currentIndex = event.currentIndex;
    const movedRow = list[currentIndex];

    //Check next row condition
    const nextRow = list[currentIndex + 1];

    if (nextRow && nextRow._FROZEN) {
      movedRow._FROZEN = true;
      movedRow.frozen = '1';
    } else {
      movedRow._FROZEN = false;
      movedRow.frozen = '0';
    }

    //maintain continuity upward
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (list[i + 1]._FROZEN) {
        list[i]._FROZEN = true;
        list[i].frozen = '1';
      } else {
        break;
      }
    }

    this.gridColumnList2.set([...list]);
    this.table.renderRows();
  }

  //calling api
  async getSwapData(): Promise<void> {
    const userId = this.userId();
    const formId = this.formId();
    const childId = this.childId();
    this.loader.increment(this.formLoaderKey());
    this.swapData = await this.service.getSwapDataOfForm(userId, formId,childId);
    if (this.swapData.length > 0) {
      this.arrangGridDisplay();
      for (let i = 0; i < this.arrangedGridColumnList.length; i++) {
        const matchedColumn = this.swapData.find(
          (swapDataItem) =>
            swapDataItem.colnm === this.arrangedGridColumnList[i].dataField
        );

        if (matchedColumn) {
          const newItem = {
            ...matchedColumn,
            _DISPLAYNAME: this.arrangedGridColumnList[i].displayName,
            _FROZEN: matchedColumn.frozen === '1',
            _VISIBLE: matchedColumn.visible === '1',
          };
          this.gridColumnList2().push(newItem);
        } else {
          this.newGridColumnList.push({
            userid: this.userId(),
            formid: this.formId(),
            childid: this.childId(),
            _DISPLAYNAME: this.arrangedGridColumnList[i].displayName,
            colnm: this.arrangedGridColumnList[i].dataField,
            visible: '1',
            _VISIBLE: true,
            frozen: '0',
            _FROZEN: false,
            colno: i,
            dispcolno: i,
          });
        }
      }

      // Get current length of gridColumnList2 this is existing columns
      const maxColumnLength = this.gridColumnList2().length;

      //update COLNO of newGridColumnList
      this.newGridColumnList.map((item, index) => {
        item.colno = maxColumnLength + index;
        return item;
      });

      //add new columns to the gridColumnList2 at the last position
      this.gridColumnList2().push(...this.newGridColumnList);
    } else {
      //if the no data found then take initial value base on the grid display
      for (let i = 0; i < this.gridColumnList().length; i++) {
        this.gridColumnList2().push({
          userid: this.userId(),
          formid: this.formId(),
          childid : this.childId(),
          _DISPLAYNAME: this.gridColumnList()[i].displayName,
          colnm: this.gridColumnList()[i].dataField,
          visible: '1',
          _VISIBLE: true,
          frozen: '0',
          _FROZEN: false,
          colno: i,
          dispcolno: i,
        });
      }
    }
    this.loader.decrement(this.formLoaderKey())
  }

  onCloseDialog(data : any){
    if(data === 'close'){
      this.displayFlg.set(false);
      this.closeTriggered.emit();
      DialogBox.instance?.onClose();
    }
  }
  saveData(): void {
    for (let i = 0; i < this.gridColumnList2().length; i++) {
      this.gridColumnList2()[i].dispcolno = i;
    }
    this.loader.increment(this.formLoaderKey())
    //save data to database using API
    this.service.savechanges(this.gridColumnList2()).subscribe({
      next: (res) => {
        if (res.Code === 200) {
          // this.messageService.add({
          //   severity: 'success',
          //   summary: SUCCESSMSG.S0001,
          // });
          this.swapDataUpdated.emit(this.gridColumnList2());
        }
       this.swapDataUpdated.emit(this.gridColumnList2());
       this.loader.decrement(this.formLoaderKey())
       this.closeModel();
      },
      error: (err) => {
        this.loader.decrement(this.formLoaderKey())
      },
    });
  }

  resetData(): void {
    this.gridColumnList2().forEach((col: any) => {
      col.VISIBLE = '1';
      col.FROZEN = '0';
      col._VISIBLE = true;
      col._FROZEN = false;
    });

    this.gridColumnList2().sort((a: any, b: any) => a.colno - b.colno);
  }

  closeModel(): void {
    this.displayFlg.set(false);
    this.closeTriggered.emit();
    DialogBox.instance?.onClose();
  }

  onDialogResize(event: any): void {
    this.updateSwapScrollHeight();
  }

  /**
   * fills up the remaining height of the screen with the grid by setting its height with that much px
   * @returns
   */
  updateSwapScrollHeight(): void {
    const dataDiv: HTMLElement = document.querySelector(
      '.swapDataDiv'
    ) as HTMLElement;
    if (!dataDiv) return;

    const availableHeight: number = dataDiv.clientHeight;

    const tableContainer: HTMLElement = dataDiv.querySelector(
      '.p-datatable-table-container'
    ) as HTMLElement;
    if (tableContainer) {
      tableContainer.style.height = `${availableHeight}px`;
      tableContainer.style.maxHeight = `${availableHeight}px`;
      tableContainer.style.paddingTop = '2px';
    }
  }

  arrangGridDisplay(): void {
    // Update this.dataGrid based on swapData
    const updatedGrid = this.gridColumnList().map((gridItem) => {
      const swapItem = this.swapData.find(
        (swap) => swap.colnm === gridItem.dataField
      );

      return swapItem
        ? {
            ...gridItem,
            displaySeq: swapItem.dispcolno,
            frozen: swapItem.frozen === '1', // Convert char to boolean
            visible: swapItem.visible === '1', // Convert char to boolean
          }
        : gridItem;
    });

    // Sort with frozen columns first (sorted by displaySeq), then others (sorted by displaySeq)
    updatedGrid.sort((a, b) => {
      // Use type assertion to access 'frozen' property if it exists, otherwise default to false
      const aFrozen = (a as any).frozen ?? false;
      const bFrozen = (b as any).frozen ?? false;

      // If one is frozen and the other isn't, frozen comes first
      if (aFrozen && !bFrozen) return -1;
      if (!aFrozen && bFrozen) return 1;

      // If both are frozen or both non-frozen, sort by displaySeq
      return ((a as any).displaySeq ?? 0) - ((b as any).displaySeq ?? 0);
    });

    this.arrangedGridColumnList = updatedGrid;
  }
  
  syncFrozenRows(changedRow: SwapColumns){
    const list = this.gridColumnList2();
    const rowIndex = list.indexOf(changedRow);

    if (changedRow._FROZEN) {
      for (let i = 0; i <= rowIndex; i++) {
        list[i].frozen = '1';
        list[i]._FROZEN = true;
      }
    } else {
      for (let i = rowIndex; i < list.length; i++) {
        list[i].frozen = '0';
        list[i]._FROZEN = false;
      }
    }

    this.gridColumnList2.set([...list]);
    this.table.renderRows();
  }  
}
