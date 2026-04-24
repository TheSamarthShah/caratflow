import { ComponentRef } from "@angular/core";
import { MessageDialog } from "../components/message-dialog/message-dialog";
import { MessageDisplayOption } from "./MessageDisplayOption.type";

export type ActyDialogData = {
  messageData: MessageDisplayOption;
  header?: string;
  buttons?: DialogButton[]; // array of buttons
  messagePrifixIcon?:string;
  onClose?: () => void;
};

export type DialogButton = {
  label: string; // button label
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' | null | undefined; // classes for style of button
  callback?: () => void; // call back function when button clicked
};

export type TrackedDialog = {
  componentRef: ComponentRef<MessageDialog>;
  header?: string;
  message?: string;
  isClosing: boolean; // Add flag to prevent double-close
}