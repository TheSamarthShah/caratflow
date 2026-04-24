import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class StripKanjiDateAdapter extends NativeDateAdapter {
  override getDate(date: Date): number {
    return date.getDate(); // plain number, no kanji
  }

  override getDateNames(): string[] {
    // Return plain numbers 1-31 without kanji
    return Array.from({ length: 31 }, (_, i) => String(i + 1));
  }
}