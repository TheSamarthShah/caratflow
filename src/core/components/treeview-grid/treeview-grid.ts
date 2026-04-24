import { Component, input, Input, model, OnChanges, output, signal, SimpleChanges, OnInit, computed, Injector, forwardRef, effect } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { GRID, GRID_INFO, RELATION } from 'src/core/models/grid.type';
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SelectionModel } from '@angular/cdk/collections';
import { Button } from 'src/core/components/button/button';
import { ButtonWrapper } from '../button-wrapper/button-wrapper';
import { inject } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from "@angular/material/form-field";
import { BTN_TYPE } from 'src/core/models/extraButton.type';
import { CORE_CONFIG } from 'src/core/core.config.token';;
import { Form } from "src/core/components/form/form";
import { columnInfo } from 'src/core/models/entryScreen.type';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { refScreenRelations } from 'src/core/models/refScreen.type';
import { ReferenceScreenService } from 'src/core/services/reference-screen-service';

// Internal node with nested structure
interface DynamicTreeNode {
  itemData: any;
  displayString: string;
  children?: DynamicTreeNode[];
}

// Flat node for Material Tree UI
interface DynamicFlatNode {
  expandable: boolean;
  displayString: string;
  level: number;
  source: DynamicTreeNode; // Reference back to the original data
}

@Component({
  selector: 'acty-treeview-grid',
  standalone: true,
  imports: [CommonModule, MatTreeModule, MatIconModule, MatButtonModule, Button, TranslateModule, FormsModule, MatFormFieldModule, ButtonWrapper, Form],
  templateUrl: './treeview-grid.html',
  styleUrl: './treeview-grid.scss'
})
export class TreeviewGrid implements OnChanges, OnInit {

  formConfigData = signal<columnInfo[] | undefined>(undefined);
  activeParentNode: DynamicFlatNode | null = null;
  selectedNode: DynamicFlatNode | null = null;
  // Selection signal tracking the DynamicTreeNode (which contains itemData)
  selection = signal<SelectionModel<DynamicTreeNode>>(
    new SelectionModel<DynamicTreeNode>(false, [])
  );
  detailFormcontrol: FormGroup = new FormGroup({});

  selectedRow: any = null;     // Tracks the currently highlighted node object
  selectedParentCd: string = ''; // Tracks the string ID of the selected parent

  //  Framework Control Variables ---
  isBlockResetRowSelection: boolean = false; // Prevents recursive selection loops

  // --- Inputs ---
  dataGrid = input<GRID[]>([]);
  parentColumnDatafield = input.required<string>();
  childColumnDatafield = input.required<string>();
  seperator = input<string>(' - ');
  dataListInp = input<{ list: any[]; total?: number }>();
  _dataListInp: { list: any[]; total?: number } = { list: [], total: 0 };
  selectionMode = input<'single' | 'multiple'>('single');
  initialExpandAll = input<boolean>(false);

  isTriggerRefscreenofTreeviw = input<boolean>();
  formId = input.required<string>();
  gridId = input<string>('');
  GridMenuBtns = input<BTN_TYPE[]>([]);
  buttonOrder = input<string | null>(null);
  buttonSettingVisible = input<boolean>(true);
  ignoreButtonSetting = input<boolean>(false);
  GeneralBtns = input<BTN_TYPE[]>([]);

  isParentChild = input<boolean>(false);
  buttonVisibility = signal<Record<string, boolean>>({});
  onTreeviewChanges = output<any>();

  refScreenOnRowData = signal<{
    referenceScreenId: string;
    rowId: number;
    refForColumn: string;
    selectedValue: any;
    gridId: string;
    tabId?: string;
    refRelations: refScreenRelations[];
  }>({
    referenceScreenId: '',
    rowId: -1,
    refForColumn: '',
    selectedValue: '',
    gridId: '',
    tabId: '',
    refRelations: [],
  });
  //---Output---
  onClickSaveBtn = output<boolean>();
  SelecteChange = output<any>();

  screenName = input<string>('');
  coreConfig = inject(CORE_CONFIG);
  private injector = inject(Injector);
  refScreenService = inject(ReferenceScreenService);
  columnNames: string[] = [];

  // --- Material Tree Configuration ---
  private _transformer = (node: DynamicTreeNode, level: number): DynamicFlatNode => {
    return {
      expandable: !!node.children && node.children.length > 0,
      displayString: node.displayString,
      level: level,
      source: node // Attaching the source here is crucial
    };
  };

  treeControl = new FlatTreeControl<DynamicFlatNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: DynamicFlatNode) => node.expandable;

  constructor() { // Ensure service is injected
    effect(async () => {

      const selectedRef = this.refScreenService.referenceSelected();


      // Check if a selection actually happened
      if (selectedRef.refForColumn !== '' && selectedRef.gridId === this.gridId()) {

        // In a Treeview, we usually update the node currently being edited
        const nodeToUpdate = this.selectedNode;

        if (nodeToUpdate) {
          // Call the logic directly instead of emitting

          await this.handleReferenceUpdateLogic(selectedRef, nodeToUpdate);
        }

        // Reset the service signal so it can trigger again next time
        this.refScreenService.referenceSelected.set({
          refForColumn: '',
          selectedValue: '',
          mainScreenColumnValues: [],
          rowId: -1,
          tabId: '',
          gridId: '',
          refTitleCaption: '',
        });
      }
    });
  }

  ngOnInit() {
    this.resetSelectionModel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataListInp'] || changes['dataGrid']) {

      this._dataListInp = this.dataListInp() ?? { list: [], total: 0 }

      const prev = changes['dataListInp'].previousValue?.list || [];
      const curr = changes['dataListInp'].currentValue?.list || [];

      curr.forEach((currentRow: any, index: number) => {

        // 2. Cast the previous row to any so we can access it via [columnName]
        const prevRow = prev[index] as any;

        if (!prevRow) return;

        // 3. Object.keys works on 'any' objects without needing a specific interface
        Object.keys(currentRow).forEach((columnName: string) => {

          const oldValue = prevRow[columnName];
          const newValue = currentRow[columnName];

          // 4. Compare and store the changed column name
          if (oldValue !== newValue) {
            if (!this.columnNames.includes(columnName) && columnName !== "_isNew") {
              this.columnNames.push(columnName);
            }
          }
        });
      });

      this.buildTree();
      this.detectAndProcessChangedRow(prev, curr);
    }
    if (changes['dataGrid'] && this.dataGrid()) {
      this.updateFormConfig(this.dataGrid());
    }
    if (changes['selectionMode']) {
      this.resetSelectionModel();
    }
  }

  private async handleReferenceUpdateLogic(event: any, node: DynamicFlatNode): Promise<void> {
    const rowData = node.source.itemData;

    // 1. Validation: Match IDs and Context
    // if (rowData.rowid !== event.rowId || event.rowId === -1) return;
    // if (event.gridId !== this.gridId() || event.tabId !== this.formId()) return;

    const patchValues: Record<string, any> = {};

    // 2. Map incoming reference values to rowData
    for (const { key, value } of event.mainScreenColumnValues) {
      const capitalizedKey = key.charAt(0) + key.slice(1);

      if (capitalizedKey in rowData) {
        rowData[capitalizedKey] = value;
        patchValues[capitalizedKey] = value;
      }
      // Also check exact key if PascalCase isn't used
      if (key in rowData && key !== capitalizedKey) {
        rowData[key] = value;
        patchValues[key] = value;
      }
    }
    // 3. Trigger Grid Callbacks/Updates
    event.mainScreenColumnValues.forEach((columnValue: any) => {
      const column = this.dataGrid()?.find(col => col.dataField === columnValue.key);

      // Custom logic for tree data updates
      if (column?.onChangeCallback) {
        column.onChangeCallback(rowData);
      }
    });
    // 4. SYNC: Update the Detail Form UI
    if (this.detailFormcontrol) {
      this.detailFormcontrol.patchValue(patchValues);
    }

    this.columnNames.forEach((name) => {
      const updatedData = {
        row: rowData,
        changedValue: node.source.itemData[name],
        changeColumnName: name,
      };
      this.onTreeviewChanges.emit(updatedData);
    });

    // 5. SYNC: Refresh Tree Display String
    node.displayString = this.getDisplayString(rowData);

  }


  private resetSelectionModel() {
    this.selection.set(
      new SelectionModel<DynamicTreeNode>(this.selectionMode() === 'multiple', [])
    );
  }

  private detectAndProcessChangedRow(oldList: any[], newList: any[]) {

    // If lengths are different, it might be an addition/deletion 
    // If lengths are same, look for the modified object
    newList.forEach((newItem, index) => {
      const oldItem = oldList[index];

      // Simple JSON stringify check or check specific ID field
      // Using JSON.stringify is a quick way to find any property change
      if (!oldItem || JSON.stringify(newItem) !== JSON.stringify(oldItem)) {
        this.onRowChanged(newItem);
      }
    });
  }

  private onRowChanged(newRowData: any) {
    const gridConfig = this.dataGrid();

    const rootNode = this.dataSource.data[0] as DynamicTreeNode;
    if (!gridConfig || !newRowData) return;

    // 1. Iterate through the grid configuration to find reference columns
    gridConfig.forEach((column: GRID) => {
      // Only process columns that are configured as reference screens
      if (column.referenceScreenId) {

        const value = newRowData[column.dataField];

        const rootValue = rootNode.itemData[column.dataField];

        if (rootValue !== null && rootValue !== '') {

          // 2. Set the reference screen signal with current row context
          this.refScreenOnRowData.set({
            referenceScreenId: column.referenceScreenId ?? '',
            refRelations: column.refRelations ?? [],
            gridId: this.gridId() || '',
            rowId: -1,
            tabId: this.formId(),    // Using formId as the tab identifier
            refForColumn: column.dataField,
            selectedValue: rootValue,
          });
          this.refScreenService.gridRefData.set(this.refScreenOnRowData() ?? null)

        } else {
          // 3. Clear dependent fields if the reference value is empty
          column.refRelations?.forEach((refRelation) => {
            if (refRelation.mainScreenColumnName) {
              // Apply your specific PascalCase transformation
              const dependentFieldName = refRelation.mainScreenColumnName.replace(
                /\b\w/g,
                (char) => char.toUpperCase()
              );

              // Clear the value in the data object
              newRowData[dependentFieldName] = null;
            }
          });
        }
      }
    });

    // 4. Update the Detail Form with the processed row data
    if (this.detailFormcontrol) {
      this.detailFormcontrol.patchValue(newRowData, { emitEvent: false });
    }
  }

  buildTree(): void {
    const listData = structuredClone(this._dataListInp);

    if (!listData || !listData.list || listData.list.length === 0) {
      this.dataSource.data = [];
      return;
    }

    const parentCol = this.parentColumnDatafield();
    const childCol = this.childColumnDatafield();

    // Step 1: Map each Parent ID to an array of its Child Items
    const parentToChildren = new Map<string, any[]>();
    const allChildIds = new Set<string>();

    // We need to save the first row data for a parent so we can construct the root nodes later
    const parentDataMap = new Map<string, any>();

    listData.list.forEach(item => {
      const pId = item[parentCol];
      const cId = item[childCol];

      if (pId) {
        // Save the parent item data the first time we see it
        if (!parentDataMap.has(pId)) {
          parentDataMap.set(pId, item);
        }

        // Link the child row to this parent ID
        if (cId) {
          if (!parentToChildren.has(pId)) {
            parentToChildren.set(pId, []);
          }
          parentToChildren.get(pId)!.push(item);
          allChildIds.add(cId);
        }
      }
    });
    // Step 2: Identify Root Nodes (Parents that are NEVER children)
    const rootIds = Array.from(parentDataMap.keys()).filter(id => !allChildIds.has(id));

    // Step 3: Recursive function to build the tree
    // Recursion guarantees a NEW object instance is created for every path
    const buildNode = (nodeId: string, itemData: any, isParentLevel: boolean, path: Set<string>): DynamicTreeNode | null => {
      // Safety check: Prevent infinite loops if data has circular references (e.g., A -> B -> A)
      if (path.has(nodeId)) {
        return null;
      }

      // Keep track of the current path to pass down to children
      const currentPath = new Set(path);
      currentPath.add(nodeId);

      // Create a brand new node instance
      // 1. Create a copy of the itemData so we don't accidentally mutate the original data
      const nodeItemData = { ...itemData };


      let childrenItems = parentToChildren.get(nodeId);
      let customflgforMBOMRegistration = false;

      // 2. If this is a child node, overwrite the parent column with the child column's value
      if ((!childrenItems && itemData[childCol]) || customflgforMBOMRegistration) {
        // Set the ID first
        nodeItemData[parentCol] = itemData[childCol];
        // itemData[parentCol] = itemData[childCol];
        // Dynamic loop to handle relative column replacements (e.g., Parent_Item_nm = Child_Item_nm)
        // Replace 'this.datagridColumns' with your actual grid column array
        const columns = this.dataGrid() || [];

        columns.forEach(col => {
          if (col.relativeColumnname && itemData[col.relativeColumnname] !== undefined) {
            /**
             * This performs the dynamic assignment:
             * nodeItemData["Parent_Item_nm"] = itemData["Child_Item_nm"]
             */
            nodeItemData[col.dataField] = itemData[col.relativeColumnname];
            // itemData[col.dataField] = itemData[col.relativeColumnname];
          }
        });
      }

      // 3. Create the brand new node instance
      const node: DynamicTreeNode = {
        itemData: nodeItemData,
        displayString: this.getDisplayString(nodeItemData),
        children: []
      };
      // If this node has children, build them recursively
      if (childrenItems) {
        node.children = childrenItems
          .map(childItem => {
            const childId = childItem[childCol];

            // --- LOGIC CHANGE START ---
            // Check if this child is also a parent (has its own main row)
            // We use the main row from 'allNodesMap' if it exists, otherwise use the childItem
            let mainItemRow = parentDataMap.get(childId) || childItem;

            return buildNode(childId, mainItemRow, false, currentPath);
            // --- LOGIC CHANGE END ---
          })
          .filter((child): child is DynamicTreeNode => child !== null);
      }

      return node;
    };

    // Step 4: Construct the tree starting from the roots
    const treeRoot: DynamicTreeNode[] = [];
    rootIds.forEach(rootId => {
      const rootItemData = parentDataMap.get(rootId);
      const rootNode = buildNode(rootId, rootItemData, true, new Set<string>());
      if (rootNode) {
        treeRoot.push(rootNode);
      }
    });

    this.dataSource.data = treeRoot;
    this.selectFirstNode();
  }

  private selectFirstNode(): void {
    // We look at the 'dataNodes' or the flattened view of the tree
    // In Material Tree, this is usually available on the treeControl or dataSource
    const flatNodes = this.treeControl.dataNodes;

    if (flatNodes && flatNodes.length > 0) {
      const firstNode = flatNodes[0];
      this.selectNode(firstNode);
      if (this.initialExpandAll()) {
        this.treeControl.expandAll();
      }
    }
  }
  private getDisplayString(rowData: any): string {

    // First, get your field names for comparison
    const parentCol = this.parentColumnDatafield();
    const childCol = this.childColumnDatafield();
    let displayString = ""


    if (!this.dataGrid() || this.dataGrid().length === 0) return '';

    displayString = this.dataGrid()
      .filter(col => col.IsVisibleInGrid)
      .sort((a, b) => (a.displayOrderForGrid || 0) - (b.displayOrderForGrid || 0))
      .map(col => {
        // Check the condition: Do Parent ID and Child ID match for this specific row?
        const isMatchingRow = rowData[parentCol] === rowData[childCol];

        // Determine the field: Use relativeColumnname ONLY if they match AND it exists
        const fieldToUse = (isMatchingRow && col.relativeColumnname)
          ? col.relativeColumnname
          : col.dataField;

        return rowData[fieldToUse];
      })
      .filter(val => val !== null && val !== undefined && val !== '')
      .join(this.seperator());
    return displayString;
  }

  // --- Selection Logic ---
  // selectNode(node: DynamicFlatNode): void {
  //   this.activeParentNode = node;
  //   const model = this.selection();
  //   const sourceNode = node.source;
  //   const isAlreadySelected = model.isSelected(sourceNode);

  //   if (this.selectionMode() === 'single') {

  //     if ( isAlreadySelected) {
  //       return; 
  //     }
  //     else{
  //       // In single mode, clear existing and select new
  //       const alreadySelected = model.isSelected(sourceNode);
  //       model.clear();
  //       if (!alreadySelected) model.select(sourceNode);
  //     }

  //   } else {
  //     model.toggle(sourceNode);
  //   }

  //   // Emit the itemData from the selected nodes
  //   this.emitSelection();
  // }

  convertParentRowIdintoNode(parentRowId: number, isParentGrid?: boolean): void {

    const data = this.dataSource.data;

    // Find node in the flat list used by the tree
    const targetNode = data.find((node: any) =>
      node.parentRowId === parentRowId || node.itemData?.parentRowId === parentRowId
    );

    if (!targetNode) return;

    const flatNode = targetNode as unknown as DynamicFlatNode;

    this.selectNode(flatNode)

    // Ensure parent nodes are expanded so this node is visible
    this.expandParents(targetNode);

    // Select and Scroll
    this.onNodeSelect(targetNode);
    const finalRowId = targetNode.itemData?.rowid;
    this.scrollToRow(finalRowId);
  }

  private expandParents(node: any): void {
    const { treeControl, dataSource } = this;

    // Access level directly from the node object
    const currentLevel = node.level;

    if (currentLevel > 0) {
      const dataList = dataSource.data;
      const index = dataList.indexOf(node);

      // Look backwards from the current node to find the parent
      for (let i = index - 1; i >= 0; i--) {
        const prevNode = dataList[i];
        // const prevLevel = prevNode.level;

        // A node is a parent if its level is exactly one less than the current node
        // if (prevLevel < currentLevel) {
        //   treeControl.expand(prevNode);

        //   // If we aren't back at the root (level 0), keep climbing up
        //   if (prevLevel > 0) {
        //     this.expandParents(prevNode);
        //   }
        //   break; 
        // }
      }
    }
  }

  // Add the EventEmitter at the top of your class if it doesn't exist:
  // @Output() rowSelected = new EventEmitter<any>();

  onNodeSelect(node: any): void {
    // 1. Set this node as the currently selected row 
    // (Your HTML template likely uses this to apply a 'selected' CSS class)
    this.selectedRow = node;

    // 2. If your tree tracks the selected ID as a string/number
    if (node.itemData && node.itemData.Parent_item_cd) {
      this.selectedParentCd = node.itemData.Parent_item_cd;
    }

  }

  scrollToRow(rowId: number): void {
    // We use a small timeout (100ms) to ensure Angular has finished 
    // expanding the tree node and rendering the HTML into the DOM.
    setTimeout(() => {

      // Attempt 1: Find the specific row by its unique ID
      // (Ensure your tree node HTML template has something like [id]="'tree-row-' + node.rowid")
      let element = document.getElementById(`tree-row-${rowId}`);

      // Attempt 2: If you don't use HTML IDs, fallback to finding it by querySelector
      if (!element) {
        // Look for the specific text or data-attribute representing the row
        const allTreeNodes = document.querySelectorAll('mat-tree-node, tr.mat-row');
        if (allTreeNodes && allTreeNodes.length >= rowId) {
          element = allTreeNodes[rowId - 1] as HTMLElement;
        }
      }

      // If the element is found in the DOM, scroll it into the center of the view
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Optional: Flash a CSS class to draw the user's attention to the error row
        element.classList.add('flash-error-highlight');
        setTimeout(() => element.classList.remove('flash-error-highlight'), 2000);
      }
    }, 100);
  }

  selectNode(node: DynamicFlatNode): void {
    this.activeParentNode = node;
    this.selectedNode = node; // Ensure this is assigned so the template can see it

    const model = this.selection();
    const sourceNode = node.source;

    if (this.selectionMode() === 'single') {
      if (model.isSelected(sourceNode)) return;
      model.clear();
      model.select(sourceNode);
    } else {
      model.toggle(sourceNode);
    }

    const formGroup = this.detailFormcontrol;
    const config = this.formConfigData();

    if (formGroup && config) {
      const patchValues: Record<string, any> = {};

      // 1. Standard Mapping: Loop through visible columns
      config.forEach(column => {
        const fieldName = column.dataField;
        if (fieldName && sourceNode.itemData.hasOwnProperty(fieldName)) {
          patchValues[fieldName] = sourceNode.itemData[fieldName];
        }
      });


      // 3. Patch the form
      formGroup.patchValue(patchValues);
    }

    this.emitSelection();
  }

  private emitSelection() {
    const selectedItems = this.selection().selected.map(s => s.itemData);
    if (this.selectionMode() === 'single') {
      this.SelecteChange.emit(selectedItems);
    } else {
      this.SelecteChange.emit(selectedItems);
    }
  }

  isNodeSelected(node: DynamicFlatNode): boolean {
    return this.selection().isSelected(node.source);
  }

  isChildOfActiveParent(node: DynamicFlatNode): boolean {
    if (!this.activeParentNode) return false;
    if (this.activeParentNode === node) return false; // Don't highlight the parent itself as gray

    const nodes = this.treeControl.dataNodes;
    const parentIndex = nodes.indexOf(this.activeParentNode);
    const currentIndex = nodes.indexOf(node);

    // If node is after parent and at a deeper level, it's a descendant
    if (currentIndex > parentIndex) {
      for (let i = parentIndex + 1; i <= currentIndex; i++) {
        if (nodes[i].level <= this.activeParentNode.level) {
          return false; // Reached another node at same or higher level
        }
      }
      return true;
    }
    return false;
  }

  toggleExpand(event: Event, node: DynamicFlatNode) {
    event.stopPropagation();
    this.treeControl.toggle(node);
    this.activeParentNode = node;
  }

  async saveData(): Promise<boolean> {
    this.onClickSaveBtn.emit(true);
    return false;
  }

  buttonClicked(nameOfButton: string) {

    if (nameOfButton === 'fw_TREEVIEW_ExpandAll') {
      this.treeControl.expandAll();
    }
    if (nameOfButton === 'fw_TREEVIEW_CollapseAll') {
      this.treeControl.collapseAll();
    }
  }


  buttons = computed<BTN_TYPE[]>(() => {
    const visibility = this.buttonVisibility();

    if (this.isParentChild()) {
      return this.GridMenuBtns().map(btn => ({
        ...btn,
        IsVisible: visibility[btn.btnId] ?? btn?.IsVisible
      }));
    }

    const gridBtns = (this.GridMenuBtns() ?? []).map(btn => ({
      ...btn,
      __buttonType: 'grid' as const,
      IsVisible: visibility[btn.btnId] ?? btn?.IsVisible
    }));

    const generalBtns = (this.GeneralBtns() ?? []).map(btn => ({
      ...btn,
      __buttonType: 'general' as const,
      IsVisible: visibility[btn.btnId] ?? btn?.IsVisible
    }));

    return [...gridBtns, ...generalBtns];
  });

  //     changeIsVisibleStateOfBtn(
  //   showInEditableBtnIds: string[],
  //   showInNonEditableBtnIds: string[],
  //   isEditable: boolean
  // ) {
  //   const currentVisibility = this.buttonVisibility();
  //   const newVisibility = { ...currentVisibility };

  //   // Collect all existing btnIds from GridMenuBtns + GeneralBtns
  //   if( this.GridMenuBtns() && this.GridMenuBtns().length > 0){
  //     const allBtnIds = new Set<string>([
  //       ...this.GridMenuBtns()
  //         .filter(b => b.IsVisible === true)
  //         .map(b => b.btnId),
  //     ]);

  //     // Editable buttons
  //     showInEditableBtnIds.forEach(btnId => {
  //       if (allBtnIds.has(btnId)) {
  //         newVisibility[btnId] = isEditable;
  //       }
  //     });

  //     // Non-editable buttons
  //     showInNonEditableBtnIds.forEach(btnId => {
  //       if (allBtnIds.has(btnId)) {
  //           newVisibility[btnId] = !isEditable;
  //       }
  //     });

  //     this.buttonVisibility.set(newVisibility);
  //   }
  // }

  //NEED TO ADD CONDITION WHEN TO SHOW AND WHEN
  private updateFormConfig(grid: GRID[]) {
    const mappedData = grid.filter((item) => item.isVisibleInDetail === true).map((item): columnInfo => {
      return {
        dataField: item.dataField,
        caption: item.caption,
        tableName: item.tableName,
        dbColName: item.dbColName,
        editorType: item.editorType,

        isEditable: false,
        isPrimaryKey: item.isPrimaryKey,
        isAutoGenerate: item.isAutoGenerate,
        isRequired: item.isRequired,
        isVisible: item.isVisibleInDetail ?? false,

        memberList: item.memberList,
        refRelations: item.refRelations,
        referenceScreenId: item.referenceScreenId,
        isReferenceScreen: !!item.referenceScreenId,

        rowIndex: item.rowIndex?.toString(),
        columnGroupNumber: item.columnGroupNumber?.toString(),

        dateFormat: item.dateFormat,
        alignment: item.alignment,

        isSpinButton: item.isSpinButton,
        maxLength: item.maxLength,
        maxValue: item.maxValue,
        minValue: item.minValue,
        dataPrecision: item.dataPrecision,
        dataScale: item.dataScale,

        dependentOperations: item.dependentOperations ? {
          childOperations: item.dependentOperations.childOperations
        } : undefined,

        childAggregation: item.childAggregation,
        showMatchType: item.showMatchType,

        filterConditions: [],
        disableInputBox: false,
        entryScreenEditableModeList: [],
        entryScreenVisibleModeList: []
      };
    });

    // 4. Update the signal manually
    this.formConfigData.set(mappedData);
  }
}