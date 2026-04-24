export class MegaMenuItem {
  id?: string;
  label?: string;
  name!: string;
  icon?: string;
  route?: string;
  children?: MegaMenuItem[];
  ScreenType?: string;
}