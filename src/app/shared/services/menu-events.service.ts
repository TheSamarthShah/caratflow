import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MegaMenuItem } from 'src/core/models/megaMenuItem.type';

@Injectable({ providedIn: 'root' })
export class MenuEventsService {
  private readonly STORAGE_KEY = 'lastMenuClick';
  private childClickSource = new BehaviorSubject<MegaMenuItem | null>(this.loadFromStorage());
  childClick$ = this.childClickSource.asObservable();

  emitChildClick(item: any) {
    this.saveToStorage(item);
    this.childClickSource.next(item);
  }

  private saveToStorage(item: MegaMenuItem) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(item));
  }

  private loadFromStorage(): MegaMenuItem | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }
}
