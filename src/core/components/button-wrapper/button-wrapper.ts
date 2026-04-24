import {
  Component,
  input,
  output,
  ViewChildren,
  QueryList,
  AfterViewInit,
  signal,
  ViewChild,
  inject,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  HostListener,
  ElementRef,
  model,
  NgZone,
} from '@angular/core';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Splitbutton } from '../splitbutton/splitbutton';
import { MenuButton } from '../menuButton/menuButton';
import { ToggleButton } from '../toggle-button/toggle-button';
import { Button } from '../button/button';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { notify } from 'src/core/services/toast.service';
import { BTN_TYPE } from 'src/core/models/extraButton.type';
import { ButtonItem } from 'src/core/models/ButtonItem.type';
import { Checkbox } from '../checkbox/checkbox';
import { Multiselect } from '../multiselect/multiselect';
import { firstValueFrom, take } from 'rxjs';

@Component({
  selector: 'acty-button-wrapper',
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    Splitbutton,
    MenuButton,
    ToggleButton,
    Button,
    TranslateModule,
    FormsModule,
    Checkbox,
    Multiselect
  ],
  templateUrl: './button-wrapper.html',
  styleUrls: ['./button-wrapper.scss']
})
export class ButtonWrapper implements OnChanges {
  @ViewChild('buttonWrapper') buttonWrapper!: ElementRef;
  @ViewChildren(MatMenu) menus!: QueryList<MatMenu>;
  @ViewChild('drawerTrigger') drawerTrigger!: MatMenuTrigger;
  @ViewChild('toggelButton') toggelButton!: ToggleButton;
  @ViewChild('visiblebuttonContainer', { read: ElementRef }) visibleContainer!: ElementRef<HTMLElement>;
  @ViewChildren('buttonItem', { read: ElementRef }) buttonItems!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren(MatMenuTrigger) menuTriggers!: QueryList<MatMenuTrigger>;

  cookieService = inject(CookieService);
  ref = inject(ChangeDetectorRef);
  el = inject(ElementRef);
  ngZone = inject(NgZone);

  formId = input.required<string>();
  childFormId = input<string>();
  buttons = input<BTN_TYPE[]>([]);
  isButtonDisabledFn = input<(btn: any) => boolean | undefined>();
  defaultVisibleCount = input<number>(5);
  buttonOrder = input<string | null>(null);
  buttonSettingVisible = input<boolean>(true);
  selectedValues = model<any>();
  ignoreButtonSetting = input<boolean>(false);

  buttonClicked = output<string>();
  extraButtonClicked = output<{ btnId: string; subAction?: string }>();
  toggleClicked = output<{ state: string; btnId: string }>();
  summaryChanged = output<any>();
  visibleButtonChanged = output();
  buttonCountChange = output();

  items = signal<ButtonItem[]>([]);
  isVisibilityChanged = signal<boolean>(false);
  visibleButtons = signal<BTN_TYPE[]>([]);
  isOverflow = signal<boolean>(false);

  userName: string = '';
  lastSavedOrder: string[] = [];
  toggleIcon !: boolean;
  selectedCategories: string = '';
  isMenuPinned: boolean = false;

  @HostListener('window:resize')
  onResize() {
    this.recalculateVisibility();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {

    if (this.isMenuPinned) return;
    const target = event.target as HTMLElement;
    const openTriggers = this.menuTriggers?.filter(t => t.menuOpen) ?? [];
    if (openTriggers.length === 0) return;
    if (target.closest('.menu-button')) return;
    for (const trigger of openTriggers) {
      const overlayRef = (trigger as any)._overlayRef;
      const overlayEl: HTMLElement | null = overlayRef?.overlayElement ?? null;
      if (overlayEl && overlayEl.contains(target)) {
        return;
      }
    }
    openTriggers.forEach(t => t.closeMenu());
  }

  async showGridAllButtons(){
      this.visibleButtons.set((this.buttons() ?? []).filter(btn => btn.IsVisible));
      const allBtnOrder = this.buttons().map(item => item.btnId).join(',');
      await this.setupItemsFromButtons();
      if (this.buttonSettingVisible()){ 
        await this.applyDefaultVisibility(allBtnOrder);
      }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['buttons']) {
      if(this.ignoreButtonSetting()){
       this.showGridAllButtons()
      }
      else{
        const cookieData = this.cookieService.get('seira_user') || '{}';
        this.userName = JSON.parse(cookieData).userid;
        // Children button visiblility change
        // this.visibleButtons.set(structuredClone((this.buttons() ?? []).filter(btn => btn.IsVisible)));   
        // this.visibleButtons.set((this.buttons() ?? []).filter(btn => btn.IsVisible));

        const defaultShowButtons = this.buttons().filter(btn => btn.defaultVisisbleInButtonSettings);

        const gridBtnIdsArray = defaultShowButtons
          .filter((btn : any)=> btn?.__buttonType === 'grid')
          .map(btn => btn.btnId);

        const generalBtnIdsArray = defaultShowButtons
          .filter((btn :any ) => btn.__buttonType === 'general')
          .map(btn => btn.btnId); 

        const filterBtnBtnIdsArray = defaultShowButtons
          .filter((btn :any ) => btn.__buttonType !== 'general' && btn?.__buttonType !== 'grid')
          .map(btn => btn.btnId);
        this.setupItemsFromButtons();
        if (this.buttonSettingVisible())
        {
          if ((this.formId() && this.formId().length > 0) && (this.childFormId() && this.childFormId()?.length! > 0)) {       
            const gridPayload = {
              FORMID: this.formId(),
              USERID: this.userName,
              CHILDID: this.childFormId()
            };
            const generalPayload = {
              FORMID: this.formId(),
              USERID: this.userName,
              CHILDID: 'GeneralButtons'
            };

          }
        } else{
          this.visibleButtons.set((this.buttons() ?? []).filter(btn => btn.IsVisible));
          this.applyDefaultVisibility(null);
        }
      }
    }
    if (changes['buttonOrder']) {
      if(this.ignoreButtonSetting()){
        this.applyDefaultVisibility(null);
        this.showGridAllButtons()
      }
      else{ 
      if (this.buttonOrder() == null || this.buttonOrder() === undefined) {
        this.applyDefaultVisibility(null);
       } 
      else {
        if ((this.formId() && this.formId().length > 0) && (this.childFormId() && this.childFormId()?.length! > 0)) {       
          const gridPayload = {
            FORMID: this.formId(),
            USERID: this.userName,
            CHILDID: this.childFormId()
          };
          const generalPayload = {
            FORMID: this.formId(),
            USERID: this.userName,
            CHILDID: 'GeneralButtons'
          };


        }
        
      }
      }
    }
  }

  private async setupItemsFromButtons() {
    const btns = this.visibleButtons() ?? [];
    const mapped: ButtonItem[] = btns.map((btn, i) => ({
      btnId: btn.btnId,
      button: btn,
      visible: i < this.defaultVisibleCount(),
      index: i
    }));
    this.items.set(mapped);
  }

  private async applyDefaultVisibility(defaultVisible: string | null) {
    queueMicrotask(() => {
      let visibleList: string[] = [];
      if (defaultVisible === '') {
        visibleList = [];
      } else if (defaultVisible === null) {
        // Default all buttons are hidden
        // visibleList = null as any;
        visibleList = [];
      } else if (defaultVisible) {
        visibleList = defaultVisible.split(',').map(v => v.trim());
      }

      const btns = this.visibleButtons() ?? [];

      /* //Children button visiblility changes
      let btns = structuredClone(this.buttons()) ?? [];
      // Iterate over all parent buttons (buttons with children in `menuModel`)
      btns = btns.map(item => {
        // Update the menuModel with filtered visible children
        item.menuModel = visibleList?.length > 0 ? this.getmenuModel(item, visibleList) : item?.menuModel;
        return item;
      });*/

       this.visibleButtons.set(btns);
      const mapped: ButtonItem[] = btns.map((btn, i) => ({
        btnId: btn.btnId,
        button: btn,
        visible:
          visibleList === null
            ? i < this.defaultVisibleCount()
            : visibleList.length
              ? visibleList.includes(btn.btnId)
              : false,
        index: i
      }))
        .filter(item => item.visible);

      // sort visible buttons by the order given in visibleList
      let visibleSorted = mapped.filter(m => m.visible);
      if (visibleList && visibleList.length) {
        visibleSorted.sort((a, b) =>
          visibleList.indexOf(a.btnId) - visibleList.indexOf(b.btnId)
        );
      }
      const sorted = [
        ...visibleSorted,
        ...mapped.filter(m => !m.visible)
      ];
      sorted.forEach((it, idx) => (it.index = idx));
      this.items.set(sorted);
      if (defaultVisible != null) {
        queueMicrotask(() => this.recalculateVisibility());
      }
      else{
        this.isOverflow.set(false);
        this.visibleButtonChanged.emit();
      }
      this.buttonCountChange.emit();
    });
  }

  /* //Children button visiblility changes
  getmenuModel(item: any, visibleList: any) {
    if (item?.menuModel && item?.menuModel.length > 0) {
      // For each parent button, filter visible children
      const parentButton = item;
      const children = parentButton.menuModel;

      // Filter children to only include visible ones
      parentButton.menuModel = children.filter((child: any) => {
        const childCaptionCore = parentButton.caption + '_' + child.label; // Remove parent part from child caption
        return visibleList?.includes(childCaptionCore);  // Compare the full child caption
      });

      // Return updated menuModel (filtered children or empty if no visible children)
      return parentButton.menuModel.length > 0 ? parentButton.menuModel : null;
    }
  }*/

  /*Old button order functionality using Menu checkbox
  toggleVisibilityById(id: string) {
    this.items.update(arr => {
      const updated = arr.map(it => it.id === id ? { ...it, visible: !it.visible } : it);
      const final = [...updated.filter(x => x.visible), ...updated.filter(x => !x.visible)];
      final.forEach((f, i) => f.index = i);
      return final;
    });
    this.visibleButtonChanged.emit();
    this.isVisibilityChanged.set(true);
  }*/

  onMenuItemClick(id: string, event: MouseEvent) {
    event.stopPropagation();
    const btn = (this.visibleButtons() ?? []).find(b => b.btnId === id);
    if (!btn) return;

    if (this.closeOnClick(btn)) {
      this.drawerTrigger?.closeMenu();
    } else {
      event.preventDefault();
    }
  }

  closeOnClick(btn: any): boolean {
    return !(btn.type === 'menu-outlined' || btn.type === 'menu-filled' || btn.type == 'split-outlined' || btn.type == 'split-filled');
  }

  onDrawerOpened() {
    queueMicrotask(() => {
      this.lastSavedOrder = this.items()
        .filter(it => it.visible)
        .map(it => it.btnId);
    });
  }

  onDrawerClosed() {
    queueMicrotask(() => {
      const visibleIds = this.items()
        .filter(it => it.visible)
        .map(it => it.btnId);

      if (!this.lastSavedOrder.length && !this.isVisibilityChanged()) {
        this.lastSavedOrder = [...visibleIds];
        return;
      }

      const isChanged =
        visibleIds.length !== this.lastSavedOrder.length ||
        visibleIds.some((id, i) => id !== this.lastSavedOrder[i]);

      if (!isChanged) return;

      this.lastSavedOrder = [...visibleIds];

      const payload = {
        FORMID: this.formId(),
        USERID: this.userName,
        CHILDID: this.childFormId(),
        BUTTONORDER: visibleIds.join()
      };

    });
  }

  handleClick(btnId: string) {
    this.buttonClicked.emit(btnId);
  }

  handleExtraClick(btnId: string, sub?: any) {
    this.extraButtonClicked.emit({ btnId, subAction: sub });
    this.drawerTrigger?.closeMenu();
  }

  handleToggle(state: string, btnId: string) {
    this.toggleClicked.emit({ state, btnId });
  }

  // isVisible(id: string): boolean {
  //   return !!this.items().find(it => it.id === id && it.visible);
  // }

  onMenuButtonClick(btn: any, event: Event) {
    event.stopPropagation();
    this.handleClick(btn.btnId);
    if (this.closeOnClick(btn)) {
      this.drawerTrigger?.closeMenu();
    }
  }

  onMenuModelClick(parentBtn: any, menuItem: any, event: Event) {
    event.stopPropagation();
    this.handleExtraClick(parentBtn.btnId, menuItem);
    this.drawerTrigger?.closeMenu();
  }

  // trackByCaption(index: number, btn: any) {
  //   return btn?.caption ?? index;
  // }

  drawerToggleClk(btn: any) {
    btn['state'] = btn?.state === 'active' ? 'inactive' : 'active';
    this.handleToggle(btn.state, btn.inactiveText ?? '');
    this.drawerTrigger?.closeMenu();
    this.toggleIcon = !this?.toggleIcon;
  }

  optionsChanged(btnOptionId: string | undefined, id: string, e: any) {
    if (e == true) {
      this.selectedValues.set(`${this.selectedValues()},${id}`);
    } else if (e == false) {
      const selectedValues = this.selectedValues().split(",").filter((n: any) => n !== id).join(",");
      this.selectedValues.set(selectedValues);
    }
    this.handleExtraClick(btnOptionId ?? '', this.selectedValues());
  }

  onMenuButtonClickToggle(event: MouseEvent) {
    event.stopPropagation();
    if (this.drawerTrigger.menuOpen) {
      this.drawerTrigger.closeMenu();
    } else {
      this.drawerTrigger.openMenu();
    }
  }

  get hiddenItems() {
    return this.items().filter(i => !i.visible);
  }

  getToggleIcon(btn?:BTN_TYPE){
    return this?.toggleIcon ? btn?.activeLeftIcon : btn?.inactiveLeftIcon;
  }

  getButtonById(id: string) {
    return (this.visibleButtons() ?? []).find(b => b.btnId === id);
  }

  getSplitData(btn?:BTN_TYPE){
    const additionalMenuItem = {
      menuId: 'open_sametab',
      icon: undefined,
      label: btn?.mainButtonMenuCaption ?? ''
    }
    return [additionalMenuItem, ...(btn?.menuModel ?? [])];
  }

  getMultiSelectData(btn?: BTN_TYPE) {
    const multiselectData = btn?.menuModel?.map((option)=> {
      return {
        key : option.menuId,
        label : option.label
      }
    });
    return multiselectData ?? [];
  }

  recalculateVisibility() {
    const container = this.visibleContainer?.nativeElement;
    if (!container) return;

    this.items.update(items =>
      items.map(item => ({ ...item, visible: true }))
    );

    container.style.flexWrap = 'wrap';

    requestAnimationFrame(async () => {
      const buttons = this.buttonItems?.toArray() ?? [];
      if (!buttons.length) return;

      const firstRowTop = buttons[0].nativeElement.offsetTop;
      let hasOverflow = false;
      //First check if More button will come or not
      //Once More button is added in the dom check for visibilityMap
      for (const btn of buttons) {
        if (btn.nativeElement.offsetTop > firstRowTop) {
          hasOverflow = true;
          break;
        }
      }
      this.isOverflow.set(hasOverflow);
      await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
      const visibilityMap = buttons.map(btn => {
        const wrapped = btn.nativeElement.offsetTop > firstRowTop;
        return !wrapped;
      });

      container.style.flexWrap = 'nowrap';
      this.items.update(items =>
        items.map((item, index) => ({
          ...item,
          visible: visibilityMap[index]
        }))
      );
    });
    this.visibleButtonChanged.emit();
  }

  shouldShowSeparator(i: number): boolean {
    const cur = (this.items()[i]?.button as any)?.__buttonType;
    const next = (this.items()[i + 1]?.button as any)?.__buttonType;
    return cur === 'grid' && next === 'general';
  }

  async onDrawerMenuClosed(menuWrapper?: HTMLElement) {
    if (this.isMenuPinned) {
      await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
        if (menuWrapper) {
          const nativeFocusable = menuWrapper.querySelector('button, a[href], input, [tabindex]:not([tabindex="-1"])') as HTMLElement;
          if (nativeFocusable) {
            nativeFocusable.focus();
          } else {
            menuWrapper.focus();
          }
        }
    }
    
    this.isMenuPinned = false;
  }

  async onPinMenu(event: Event) {
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));

    if (!this.isMenuPinned) {
      this.isMenuPinned = true;
      if (!this.drawerTrigger.menuOpen) {
        this.drawerTrigger.openMenu();
      }
    } else {
      this.isMenuPinned = false;
    }
  }

  @HostListener('document:click', ['$event'])
  async onClickOutside(event: MouseEvent) {
    if (!this.drawerTrigger?.menuOpen) return;

    const target = event.target as HTMLElement;
    if (target.closest('.menu-button')) return;

    const overlayRef = (this.drawerTrigger as any)._overlayRef;
    const overlayEl: HTMLElement | null = overlayRef?.overlayElement ?? null;
    if (overlayEl && overlayEl.contains(target)) return;

    this.isMenuPinned = false;
    this.drawerTrigger.closeMenu(); 
  }
}
