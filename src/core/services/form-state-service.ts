import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormStateService {
  /**
   * torokuModoruFormId - for toroku form to know which form has openend it.
   * mainly used for managing modoru button
   */
  torokuModoruFormId = signal<string>('');
  /**
   * torokuModoru - to let the form know that it is initialied by an modoru button of toroku form
   * mainly used to let form know to set its state form this service
   */
  torokuModoru = signal<boolean>(false);

  /**
   * saves the form state in a dictionary with formId as key
   */
  formStates = signal<{ [formId: string]: Record<string, any> }>({});

  /**
   * lastRoute - Stores the first segment of the current URL path when the session expires.
   * mainly used to redirect the user back to their last active page after they log in again
   */
  lastRoute?: string = '';

  /**
   * saves the form state and updates if already present
   * @param formId
   * @param newState
   */
  setFormState(formId: string, newState: Record<string, any>) {
    const currentStates = this.formStates();
    this.formStates.set({
      ...currentStates,
      [formId]: {
        ...newState,
      },
    });
  }

  getFormState(formId: string): Record<string, any> | undefined {
    return this.formStates()[formId];
  }
}
