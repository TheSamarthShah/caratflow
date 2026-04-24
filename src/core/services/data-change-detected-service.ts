import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataChangeDetectedService {
  //list contains column id of all the changed columns
  dataChangeList: string[] = [];

  //counter to manage row add and delete mainly in toroku grid
  netRowChangeCounter: number = 0;

  netRowChangeCounterReset(): void {
    this.netRowChangeCounter = 0;
  }

  netRowChangeCounterIncrement(): void {
    this.netRowChangeCounter += 1;
  }

  netRowChangeCounterDecrement(): void {
    this.netRowChangeCounter -= 1;
  }

  dataChangeListReset(): void {
    this.dataChangeList = [];
  }

  dataChangeListPush(columnName: string): void {
    if (!this.dataChangeList.includes(columnName)) {
      this.dataChangeList.push(columnName);
    }
  }

  dataChangeListRemove(columnName: string): void {
    if (this.dataChangeList.includes(columnName)) {
      this.dataChangeList.splice(this.dataChangeList.indexOf(columnName), 1);
    }
  }
}
