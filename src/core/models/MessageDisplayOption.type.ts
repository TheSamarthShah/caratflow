export type MessageType = 'success' | 'error' | 'info' | 'warning';

export type MessageToastPosition =  | 'top-right'  | 'top-left'  | 'bottom-right'  | 'bottom-left';
/**
 * @property messageheader - Do not translate. Used for static values like LogId.
 * @property message - The message text to display.
 * @property type - The message type (success, error, info, or warning).
 * @property params - Optional parameters used for string formatting within the message.
 */
export type MessageDisplayOption = {
  messageheader?: string; 
  message?: string;
  type?: MessageType;  
  params?: Record<string, any>;
};