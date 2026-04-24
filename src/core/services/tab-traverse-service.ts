import { Injectable, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TabTraverseService {
  public traverseComplete$ = new Subject<'forward' | 'backward'>();
  public activeComponentType: 'Form' | 'Grid' | 'ParentChildGrid' | 'ButtonWrapper' | 'Custom' | 'GridButtonsOnly' | 'ParentChildGridButtonsOnly' | null = null;
  public activeComponentInstance: HTMLElement | object | null = null;
  elementMemoryStack: HTMLElement[] = [];
  contextStack: string[] = ['root'];

  /// Registers the current component as active and focuses its initial boundary element.
  public registerComponent(
    componentType: 'Form' | 'Grid' | 'ParentChildGrid' | 'ButtonWrapper' | 'Custom' | 'GridButtonsOnly' | 'ParentChildGridButtonsOnly',
    componentInstance: HTMLElement | object,
    direction: 'forward' | 'backward' = 'forward'
  ): void {
    this.activeComponentType = componentType;
    this.activeComponentInstance = componentInstance;

    if (componentType === 'Grid' || componentType === 'ParentChildGrid') {
      requestAnimationFrame(() => {
      const resetHandled = this.resetGridSelectionOnEntry(componentType, componentInstance, direction);
      if (resetHandled) return;
      });
    }

    this.focusBoundaryElement(componentType, componentInstance, direction);
  }

  /// Handels Tab/Enter keys to manage internal focus traversal or emit completion when boundaries are reached.
  public checkBoundaryAndTraverse(event: KeyboardEvent): void {
    if ((event.key === 'Tab' || event.key === 'Enter') && this.activeComponentType && this.activeComponentInstance) {
      const activeEl = document.activeElement as HTMLElement;
      if (!activeEl) return;

      if (this.activeComponentType === 'Grid' || this.activeComponentType === 'ParentChildGrid') {
        const specificGridInstance = this.findGridInstanceForElement(this.activeComponentInstance, activeEl);
        if (specificGridInstance) {
          const rowHandled = this.handleInternalRowTraverse(specificGridInstance, activeEl, event.shiftKey, event);
          if (rowHandled) return;
        }
      }

      const elements = this.getElementsFor(this.activeComponentType, this.activeComponentInstance);
      if (elements.length === 0) return;

      const isShift = event.shiftKey;
      const currentIndex = elements.findIndex(el => el === activeEl || el.contains(activeEl));
      if (currentIndex === -1) return;
      const boundaryElement = isShift ? elements[0] : elements[elements.length - 1];

      if (boundaryElement && (activeEl === boundaryElement || boundaryElement.contains(activeEl))) {
        event.preventDefault();
        event.stopPropagation();
        this.clearActive();
        this.traverseComplete$.next(isShift ? 'backward' : 'forward');
      }
      else {
        event.preventDefault();
        const nextIndex = isShift ? currentIndex - 1 : currentIndex + 1;
        if (elements[nextIndex]) {
          requestAnimationFrame(() => {
            elements[nextIndex].focus();
          });
        }
      }
    }
  }

  /// Clears out the currently active component data
  private clearActive() {
    this.activeComponentType = null;
    this.activeComponentInstance = null;
  }

  /// Gets the focusable items based on the current component's type.
  private getElementsFor(type: 'Form' | 'Grid' | 'ParentChildGrid' | 'ButtonWrapper' | 'Custom' | 'GridButtonsOnly' | 'ParentChildGridButtonsOnly' | string, instance: object | HTMLElement): HTMLElement[] {
    let elements: HTMLElement[] = [];
    if (type === 'Form') return this.getFormElements(instance);
    if (type === 'Grid') return this.getGridElements(instance, true);
    if (type === 'GridButtonsOnly') return this.getGridElements(instance, false);
    if (type === 'ParentChildGrid') return this.getParentChildGridElements(instance, true);
    if (type === 'ParentChildGridButtonsOnly') return this.getParentChildGridElements(instance, false);
    if (type === 'Custom' || type === 'ButtonWrapper') {
      const node = this.getDOMNode(instance);
      return node ? this.extractDOM(node) : [];
    }
    return Array.from(new Set(elements));
  }

  /// Extracts focusable elements from a Form component.
  private getFormElements(formComponent: object): HTMLElement[] {
    const form = formComponent as { focusableCells: object[] };
    return this.extractFromQueryList(form.focusableCells);
  }

  /// Extracts focusable elements from a Grid component.
  private getGridElements(gridComponent: object | null, includeCells: boolean): HTMLElement[] {
    if (!gridComponent) return [];
    const elements: HTMLElement[] = [];

    const grid = gridComponent as { focusableCells: object[]; buttonWrapper: object; paginatorEl: object; };
    // 1. Grid Rows
    if (includeCells &&grid.focusableCells) {
      elements.push(...this.extractFromQueryList(grid.focusableCells));
    }

    // 2. Button Wrapper
    const btnNode = this.getDOMNode(grid.buttonWrapper);
    if (btnNode) {
      elements.push(...this.extractDOM(btnNode));
    }

    // 3. Paginator
    const paginatorNode = this.getDOMNode(grid.paginatorEl);
    if (paginatorNode) {
      elements.push(...this.extractDOM(paginatorNode));
    }

    return elements;
  }

  /// Extracts the HTML element from an Angular object
  private getDOMNode(ref: ElementRef<HTMLElement> | HTMLElement | object | null): HTMLElement | null {

    if (!ref) return null;
    if (ref instanceof HTMLElement) return ref;
    if ('nativeElement' in ref && ref.nativeElement instanceof HTMLElement) {
      return ref.nativeElement;
    }

    const obj = ref as Record<string, unknown>;
    for (const key in obj) {
      const val = obj[key];
      if (val && typeof val === 'object' && 'nativeElement' in val) {
        const potentialNode = (val as ElementRef).nativeElement;
        if (potentialNode instanceof HTMLElement) return potentialNode;
      }
    }
    return null;
  }

  /// Recursively gathers focusable elements from a parent-child grid.
  private getParentChildGridElements(pcGridComponent: object, includeCells: boolean): HTMLElement[] {
    if (!pcGridComponent) return [];
    const elements: HTMLElement[] = [];

    const pc = pcGridComponent as { gridComponent: object; treegridComponent: object; childParentChildGrids: { toArray: () => object[] } | object[]; buttonWrapper: object; };

    if (pc.gridComponent) {
      elements.push(...this.getGridElements(pc.gridComponent, includeCells));
    } else if (pc.treegridComponent) {
      elements.push(...this.getGridElements(pc.treegridComponent, includeCells));
    }

    const children = Array.isArray(pc.childParentChildGrids)
      ? pc.childParentChildGrids
      : (pc.childParentChildGrids?.toArray());

    if (children) {
      children.forEach((child) => {
        elements.push(...this.getParentChildGridElements(child, includeCells));
      });
    }

    const pcBtnNode = this.getDOMNode(pc.buttonWrapper);
    if (pcBtnNode) {
      elements.push(...this.extractDOM(pcBtnNode));
    }

    return elements;
  }

  private extractFromQueryList(queryList: object | HTMLElement[] | null | undefined): HTMLElement[] {
    if (!queryList) return [];

    const elements: HTMLElement[] = [];
    const refs = typeof (queryList as { toArray?: () => object[] }).toArray === 'function'
      ? (queryList as { toArray: () => object[] }).toArray()
      : (queryList as object[]);

    refs.forEach((ref) => {
      const host = (ref as { nativeElement?: HTMLElement })?.nativeElement || (ref as HTMLElement);
      if (host instanceof HTMLElement) {
        elements.push(...this.getNativeFocusables(host));
      }
    });

    return elements;
  }

  /// retrieve all focusable elements within a given container.
  private extractDOM(container: HTMLElement): HTMLElement[] {
    return this.getNativeFocusables(container);
  }

  /// Queries the DOM to find all visible elements
  private getNativeFocusables(host: HTMLElement): HTMLElement[] {
    if (!host) return [];

    const focusables = host.querySelectorAll<HTMLElement>(
      'input, textarea, mat-select, button, a[href]'
    );

    const validFocusables = Array.from(focusables).filter(el => {
      if (el.getAttribute('aria-hidden') === 'true') return false;
      if (el.offsetWidth === 0 && el.offsetHeight === 0 && el.getClientRects().length === 0) return false;
      if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return false;
      if (el.classList.contains('mat-mdc-button-disabled') || el.classList.contains('disabled')) return false;
      if (el.getAttribute('tabindex') === '-1' || el.closest('[tabindex="-1"]')) return false;
      if (el.classList.contains('disabled')) return false;
      if (el.closest('[disabled], [aria-disabled="true"]')) return false;

      return true;
    });

    if (validFocusables.length > 0) {
      return validFocusables;
    }
    return [];
  }

  /// Changes the active component in the background without moving cursor
  public setActiveSilently(componentType: 'Form' | 'Grid' | 'ParentChildGrid' | 'ButtonWrapper' | 'Custom' | 'GridButtonsOnly' | 'ParentChildGridButtonsOnly', componentInstance: object | HTMLElement | null): void {
    this.activeComponentType = componentType;
    this.activeComponentInstance = componentInstance;
  }

  /// Validates if a specific DOM element lives inside a given component instance.
  public isElementInComponent(
    type: 'Form' | 'Grid' | 'ParentChildGrid' | 'ButtonWrapper' | 'Custom' | 'GridButtonsOnly' | 'ParentChildGridButtonsOnly' | string,
    instance: object | null,
    activeEl: HTMLElement
  ): boolean {
    if (!instance) return false;
    const elements = this.getElementsFor(type, instance);
    return elements.some(el => el === activeEl || el.contains(activeEl));
  }

  /// Recursively searches for the grid instance that owns a focused element.
  private findGridInstanceForElement(instance: object | null, activeEl: HTMLElement): object | null {
    if (!instance || !(activeEl instanceof HTMLElement)) return null;

    const mainGrid = instance as { actyGridTableElement?: { nativeElement: HTMLElement } };
    if (mainGrid.actyGridTableElement?.nativeElement?.contains(activeEl)) {
      return instance;
    }

    const pcGrid = instance as {
      gridComponent?: object;
      treegridComponent?: object;
      childParentChildGrids?: { toArray?: () => object[] } | object[];
    };

    if (pcGrid.gridComponent) {
      const found = this.findGridInstanceForElement(pcGrid.gridComponent, activeEl);
      if (found) return found;
    }

    if (pcGrid.treegridComponent) {
      const found = this.findGridInstanceForElement(pcGrid.treegridComponent, activeEl);
      if (found) return found;
    }

    if (pcGrid.childParentChildGrids) {
      const children = typeof (pcGrid.childParentChildGrids as { toArray?: () => object[] }).toArray === 'function'
        ? (pcGrid.childParentChildGrids as { toArray: () => object[] }).toArray()
        : (pcGrid.childParentChildGrids as object[]);

      for (const child of children) {
        if (child === instance) continue; 
        
        const found = this.findGridInstanceForElement(child, activeEl);
        if (found) return found;
      }
    }

    return null;
  }

  /// Handels grid or parent child grid row traverse
  private handleInternalRowTraverse(gridInstance: object, activeEl: HTMLElement, isShift: boolean, event: KeyboardEvent): boolean {
    const grid = gridInstance as { actyGridTableElement?: { nativeElement: HTMLElement } };
    const tableEl = grid.actyGridTableElement?.nativeElement;
    if (!tableEl) return false;

    const currentRowEl = activeEl.closest('tr[data-row-id]') as HTMLElement;
    if (!currentRowEl) return false;

    const allRows = Array.from(tableEl.querySelectorAll('tr[data-row-id]')).filter((tr) =>
      tr.closest('table') === tableEl.closest('table')
    ) as HTMLElement[];

    const rowIndex = allRows.indexOf(currentRowEl);
    if (rowIndex === -1) return false;

    const focusablesInRow = this.getNativeFocusables(currentRowEl);
    if (!focusablesInRow.length) return false;

    const currentIndex = focusablesInRow.findIndex(el => el === activeEl || el.contains(activeEl));
    if (currentIndex === -1) return false;

    const isFirstInRow = currentIndex === 0;
    const isLastInRow = currentIndex === focusablesInRow.length - 1;
    const isFirstRow = rowIndex === 0;
    const isLastRow = rowIndex === allRows.length - 1;

    if (!isShift && isLastInRow && isLastRow) return false;
    if (isShift && isFirstInRow && isFirstRow) return false;

    if (!isShift && isLastInRow) {
      event.preventDefault();
      const nextRowId = allRows[rowIndex + 1].getAttribute('data-row-id');
      this.triggerRowChange(gridInstance, Number(nextRowId), 'forward');
      return true;
    }

    if (isShift && isFirstInRow) {
      event.preventDefault();
      const prevRowId = allRows[rowIndex - 1].getAttribute('data-row-id');
      this.triggerRowChange(gridInstance, Number(prevRowId), 'backward');
      return true;
    }

    event.preventDefault();

    const nextIndex = isShift ? currentIndex - 1 : currentIndex + 1;
    if (focusablesInRow[nextIndex]) {
      setTimeout(() => {
        focusablesInRow[nextIndex].focus();
      }, 0);
    }

    return true;
  }

  /// Handels grid row selection and focus its element
  private triggerRowChange(gridInstance: object, rowId: number, direction: 'forward' | 'backward') {
    const parsedId = isNaN(Number(rowId)) ? rowId : Number(rowId);

    const grid = gridInstance as {
      executeRowSelection?: (id: number) => void;
      actyGridTableElement?: { nativeElement: HTMLElement };
    };

    if (typeof grid.executeRowSelection === 'function') {
      grid.executeRowSelection(parsedId);
    }

    setTimeout(() => {
      const tableEl = grid.actyGridTableElement?.nativeElement;
      const newRow = tableEl?.querySelector(`tr[data-row-id="${rowId}"]`) as HTMLElement;

      if (newRow) {
        const focusables = this.getNativeFocusables(newRow);
        if (focusables.length > 0) {
          direction === 'forward' ? focusables[0].focus() : focusables[focusables.length - 1].focus();
        }
      }
    }, 0);
  }

  /// Sets focus to either the very first or very last element in a component based on direction.
  private focusBoundaryElement(componentType: string, componentInstance: object, direction: 'forward' | 'backward') {
    const elements = this.getElementsFor(componentType, componentInstance);
    if (elements.length > 0) {
      direction === 'forward' ? elements[0].focus() : elements[elements.length - 1].focus();
    } else {
      this.clearActive();
      this.traverseComplete$.next(direction);
    }
  }

  /// Handels row selection when navigating into a grid from another element.
  private resetGridSelectionOnEntry(componentType: string, componentInstance: object, direction: 'forward' | 'backward'): boolean {
    let targetGrid = null;

    if (componentType === 'Grid') {
      targetGrid = componentInstance;
    } else if (componentType === 'ParentChildGrid') {
      const pc = componentInstance as { gridComponent?: object; treegridComponent?: object };
      if (direction === 'forward') {
        targetGrid = pc.gridComponent || pc.treegridComponent || null;
      } else {
        targetGrid = this.getDeepestChildGrid(componentInstance) || pc.gridComponent || pc.treegridComponent || null;
      }
    }

    if (!targetGrid) return false;

    const grid = targetGrid as {
      actyGridTableElement?: { nativeElement: HTMLElement };
      executeRowSelection?: (id: number) => void;
    };

    const tableEl = grid.actyGridTableElement?.nativeElement;
    if (!tableEl) return false;

    const allRows = Array.from(tableEl.querySelectorAll('tr[data-row-id]')) as HTMLElement[];
    if (allRows.length === 0) return false;

    const targetRowEl = direction === 'forward' ? allRows[0] : allRows[allRows.length - 1];
    const targetRowId = Number(targetRowEl.getAttribute('data-row-id'));

    requestAnimationFrame(() => {
      if (typeof grid.executeRowSelection === 'function') {
        grid.executeRowSelection(targetRowId);
        this.focusBoundaryElement(componentType, componentInstance, direction);
        return true;
      }
      return false;
    });

    return false;
  }

  /// Recursive method to find the deepest nested child grid in a parent-child structure.
  private getDeepestChildGrid(pcInstance: object | null): object | null {
    if (!pcInstance) return null;

    const pc = pcInstance as {
      childParentChildGrids?: { toArray?: () => object[] } | object[];
      gridComponent?: object;
      treegridComponent?: object;
    };

    if (pc.childParentChildGrids) {
      const children = typeof (pc.childParentChildGrids as { toArray?: () => object[] }).toArray === 'function'
        ? (pc.childParentChildGrids as { toArray: () => object[] }).toArray()
        : (pc.childParentChildGrids as object[]);

      if (children && children.length > 0) {
        const lastChild = children[children.length - 1];
        const deeper = this.getDeepestChildGrid(lastChild);
        if (deeper) return deeper;

        const lastChildPc = lastChild as { gridComponent?: object; treegridComponent?: object };
        return lastChildPc.gridComponent || lastChildPc.treegridComponent || null;
      }
    }
    return null;
  }

  /// Waits for a component to load before registering it
  public waitAndRegister(
    tabType: 'Form' | 'Grid' | 'ParentChildGrid' | 'ButtonWrapper' | 'Custom' | 'GridButtonsOnly' | 'ParentChildGridButtonsOnly',
    instanceGetter: () => object | null,
    direction: 'forward' | 'backward',
    onTimeout: () => void,
    attempts: number = 0
  ): void {
    if (attempts > 20) {
      onTimeout();
      return;
    }
    requestAnimationFrame(() => {
      const instance = instanceGetter();
      if (instance) {
        this.registerComponent(tabType, instance, direction);
      } else {
        this.waitAndRegister(tabType, instanceGetter, direction, onTimeout, attempts + 1);
      }
    });
  }

  /// checks a list of tabs to find which one contains the currently focused element.
  public findActiveTabIndex(tabs: { type: 'Form' | 'Grid' | 'ParentChildGrid' | 'ButtonWrapper' | 'Custom' | 'GridButtonsOnly' | 'ParentChildGridButtonsOnly' }[], instanceGetter: (tab: object) => any, activeEl: HTMLElement): number {
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const instance = instanceGetter(tab);
      if (instance && this.isElementInComponent(tab.type, instance, activeEl)) {
        this.setActiveSilently(tab.type, instance);
        return i;
      }
    }
    return -1;
  }

  public resetTabTraverseService(): void {
    this.activeComponentInstance = null;
    this.activeComponentType = null;
    this.traverseComplete$ = new Subject<'forward' | 'backward'>();
  }

  /// Saves the currently focused element to a memory stack.
  public memorizeCurrentFocus(): void {
    const activeEl = document.activeElement as HTMLElement;
    
    if (activeEl && activeEl !== document.body) {
      this.elementMemoryStack.push(activeEl);
    }
  }

  /// Retrieves the last saved element from the memory stack and restores focus to it.
  public restoreMemorizedFocus(): boolean {
    if (this.elementMemoryStack.length > 0) {
      
      const targetElement = this.elementMemoryStack.pop();

      if (targetElement && targetElement.isConnected) {
        requestAnimationFrame(() => {
          targetElement.focus();
        });
        return true; 
      }
      
      return this.restoreMemorizedFocus(); 
    }
    return false; 
  }

  /// push new context to context stack
  public pushContext(contextId: string): void {
    this.contextStack.push(contextId);
  }
  
  /// Removes the most recent context from stack
  public popContext(): void {
    if (this.contextStack.length > 1) {
      this.contextStack.pop();
    }
  }

  /// checks if the provided context matches the current context stack.
  public isCurrentContext(contextId: string): boolean {    
    return this.contextStack[this.contextStack.length - 1] === contextId;
  }
}