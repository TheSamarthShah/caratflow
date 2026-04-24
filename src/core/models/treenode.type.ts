export class TreeNode {
  [key: string]: any;
  children?: TreeNode[];
  isEditing?: boolean;
  oldValue?: string;

  constructor(init?: Partial<TreeNode>) {
    Object.assign(this, init);
  }
}