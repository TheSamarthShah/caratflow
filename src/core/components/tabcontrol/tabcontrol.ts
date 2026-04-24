import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChildren,
  effect,
  ElementRef,
  EventEmitter,
  forwardRef,
  input,
  Input,
  model,
  output,
  Output,
  QueryList,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TabItem } from 'src/core/models/tabControl.type';

@Component({
  selector: 'acty-tab-control',
  templateUrl: './tabcontrol.html',
  styleUrl: './tabcontrol.scss',
  imports: [CommonModule, TranslateModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TabControl),
      multi: true,
    },
  ],
})
export class TabControl implements AfterContentInit {
  @ContentChildren('tab', { descendants: true, read: ElementRef })
  tabs!: QueryList<ElementRef>;

  tabWidth = input(450);
  tabChange = output<void>();

  activeIndex = 0;
  totalWidth = 0;
  tabsItem = model<TabItem[]>([]);

  ngAfterContentInit() {
      this.showActiveTab();
      this.calculateTabWidth();

    this.tabs.changes.subscribe(() => {
        this.updateLabels();
        this.showActiveTab();
        this.calculateTabWidth();
    });
  }

  get visibleTabs() {
    return this.tabsItem().filter(t => !t.hidden);
  }

  private updateLabels() {
  if (!this.tabsItem() || this.tabsItem().length === 0) {
    this.tabsItem.set(
      this.tabs.toArray().map(tab => ({
        label: tab.nativeElement.getAttribute('label') || 'Tab',
        hidden: false,
        disabled: false
      }))
    );
  }
}

  private calculateTabWidth() {
    this.totalWidth = this.visibleTabs.length * this.tabWidth();
  }

   private showActiveTab() {
    const visibleIndexes = this.tabsItem()
      .map((t, i) => ({ t, i }))
      .filter(x => !x.t.hidden)
      .map(x => x.i);

    this.tabs?.forEach((tab, i) => {
      tab.nativeElement.style.display =
        visibleIndexes[this.activeIndex] === i ? 'block' : 'none';
    });
  }

  selectTab(index: number) {
    const tab = this.visibleTabs[index];

    if (!tab || tab.disabled) return;

      this.activeIndex = index;
      this.showActiveTab();
      this.tabChange.emit();
    }

  private readonly syncTabs = effect(() => {
    this.tabsItem();
    this.syncActiveTab();
    this.showActiveTab();
    this.calculateTabWidth();
  });

  private syncActiveTab() {
    const visibleTabs = this.tabsItem()?.filter(t => !t.hidden);

    if (!visibleTabs.length) return;

    // If current index is enabled → do nothing
    if (
      this.activeIndex < visibleTabs.length &&
      !visibleTabs[this.activeIndex].disabled
    ) {
      return;
    }

    // find next enabled tab AFTER current index
    for (let i = this.activeIndex + 1; i < visibleTabs.length; i++) {
      if (!visibleTabs[i].disabled) {
        this.activeIndex = i;
        return;
      }
    }

    // If no next tab, search backward
    for (let i = this.activeIndex - 1; i >= 0; i--) {
      if (!visibleTabs[i].disabled) {
        this.activeIndex = i;
        return;
      }
    }

    this.activeIndex = 0;
  }
}
