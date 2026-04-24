import { Component, inject, input, NgZone, OnInit, output, signal, SimpleChanges, ViewChild } from '@angular/core';
import { DialogBox } from "../dialogbox/dialogbox";
import { Button } from '../button/button';
import { RadioButton } from "../radiobutton/radiobutton";
import { ReferenceSettingsService } from 'src/core/services/reference-settings-service';
import { FormControl, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { firstValueFrom, take } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'acty-reference-initial-searchkbn',
  imports: [DialogBox, Button, RadioButton, CommonModule, ReactiveFormsModule,TranslateModule],
  templateUrl: './reference-initial-searchkbn.html',
  styleUrl: './reference-initial-searchkbn.scss'
})
export class ReferenceInitialSearchkbn {
  @ViewChild('RefScreen') dialogBox!: DialogBox;
  referenceSettingsService = inject(ReferenceSettingsService);
  ngZone = inject(NgZone);

  //input
  formId = input.required<string>();
  referenceScreenId = input.required<string>();
  userId = input.required<string>();
  displayFlgInp = input<boolean>(false);

  //output
  dialogClose = output<boolean>();

  //signal
  initial_searchKBN = signal<'0' | '1'>('0'); // 1 for yes and 2 for no
  initial_conditionkbn = signal<'0' | '1'>('0'); // 1 for yes and 2 for no

  ReferencesKbns = new FormGroup({
    initialsearchkbn: new FormControl<number | null>(null),
    initialconditionkbn: new FormControl<number | null>(null),
  });
  
  onCloseDialog() {
    this.dialogClose.emit(false);
  }

  async openDialg() {
    await firstValueFrom(this.ngZone.onStable.pipe(take(1)));
    this.dialogBox.openDialog()
    
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayFlgInp']) {
      if (this.displayFlgInp() === true)
        this.openDialg()
    }
  }

  saveData(): void {
    let getinitialsearchkbn = this.ReferencesKbns?.value?.initialsearchkbn ? this.ReferencesKbns.value.initialsearchkbn : 0
    let getinitialconditionkbn = this.ReferencesKbns?.value?.initialconditionkbn ? this.ReferencesKbns.value.initialconditionkbn : 0
    const data = {
      UserId: this.userId(),
      FormId: this.formId(),
      referenceScreenId: this.referenceScreenId(),
      InitialSearchKBN: getinitialsearchkbn.toString(),
      InitialConditionKBN : getinitialconditionkbn.toString()
    };
    this.referenceSettingsService.saveReferenceSetting(data).subscribe({
      next: (res) => {
        if (res.Code === 200) {
          // this.messageService.add({
          //   severity: 'success',
          //   summary: SUCCESSMSG.S0001,
          // });
        }
      },
    });
    this.dialogClose.emit(false);
  }

  /**
   * The data will be fetched when the reference screen dialog opens(Method is used in reference screen component).
   * If the data is found then update the main kbn variable this.initial_searchKBN() with it else assing '1'
   * @returns the initial search kbn value
   */
  getData(): Promise<any> {
    const data = {
      UserId: this.userId(),
      FormId: this.formId(),
      referenceScreenId: this.referenceScreenId(),
    };
    return new Promise((resolve, reject) => {
      this.referenceSettingsService.getReferenceSetting(data).subscribe({
        next: (res) => {
          if (res.Messagecode === null && res.Message === null) {
            this.ReferencesKbns.reset();
            this.initial_searchKBN.set(
              res.Data.Record.initialsearchkbn
            );

            this.initial_conditionkbn.set(
              res.Data.Record.initialconditionkbn
            );
            
            this.ReferencesKbns?.setValue({
              initialsearchkbn: Number(res.Data.Record.initialsearchkbn),
              initialconditionkbn: Number(res.Data.Record.initialconditionkbn),
            });
          } else {
            this.initial_searchKBN.set('0');
            this.initial_conditionkbn.set('0');

            this.ReferencesKbns?.setValue({
              initialsearchkbn: 0,
              initialconditionkbn: 0,
            });
          }

          const data = {
            initialsearchkbn : this.initial_searchKBN(),
            initialconditionkbn : this.initial_conditionkbn()
          }
          resolve(data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

}
