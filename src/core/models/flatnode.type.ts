export class FlatNode {
  [key: string]: any;
  expandable!: boolean;
  level!: number;

  constructor(init?: Partial<FlatNode>) {
    Object.assign(this, init);
  }
}