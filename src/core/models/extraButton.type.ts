import { entryScreenMode } from "./entryScreen.type";
export type BTN_TYPE = {
  type:
    | 'outlined'
    | 'filled'
    | 'icon'
    | 'mini fab'
    | 'text'
    | 'split-outlined'
    | 'split-filled'
    | 'menu-outlined'
    | 'menu-filled'
    | 'toggle';
  disabled?: boolean;
  IsVisible?: boolean;
  defaultVisisbleInButtonSettings? : boolean;
  caption: string;
  btnId:string;
  leftIcon?: string;
  rightIcon?: string;
  btnClass?: string;
  severity?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warn'
    | 'help'
    | 'danger'
    | undefined;
  menuModel?: {menuId :string; label: string; icon?: string }[];
 
  state?: 'active' | 'inactive';
  inactiveText?: string;
  activeText?: string | null;
  inactiveLeftIcon?: string | undefined;
  activeLeftIcon?: string | undefined;
  inactiveRightIcon?: string | undefined;
  activeRightIcon?: string | undefined;
  activeBtnClass?: string | undefined;
  inactiveBtnClass?: string | undefined;
  mainButtonMenuCaption?: string | undefined;
  entryScreenDisableModeList? :entryScreenMode[];
  entryScreenVisibleModeList?:entryScreenMode[];
 
  onBtnClick?: (e: any) => void;
  onMenuBtnClick?: (item: { id: string; label: string; icon?: string }) => void;
};

export type buttonEmitType = {
  type? : 'button' | 'menuAndSpiltButton' | 'toggleButton';
  normalButtonData? : string;
  menuAndspiltButtonData? : {btnId? : string,menuButtonId? : string};
  toggleButtonData? : {btnId? : string, state : 'active' |'inactive'};
}