import {
  Component,
  inject,
  input,
  output,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FILTER } from '../../models/filter.type';
import { gridColumnHeaderMetaData } from '../../models/grid.type';
import { Button } from '../button/button';
import { DialogBox } from '../dialogbox/dialogbox';
import { TextInput } from '../text-input/text-input';
import { MatInputModule } from '@angular/material/input';
import { DialogButton } from 'src/core/models/dialogbutton.type';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { DropDown } from '../dropdown/dropdown';
import { TranslateModule,TranslateService } from '@ngx-translate/core';
import { ExportDataService } from 'src/core/services/export-data-service';
import { FormsModule } from "@angular/forms";
import { LoaderService } from 'src/core/services/loader-service';
import { RELATION } from 'src/core/models/entryScreen.type';

@Component({
  selector: 'acty-export',
  imports: [
    DialogBox,
    TextInput,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    DropDown,
    TranslateModule,
    FormsModule
  ],
  templateUrl: './export.html',
  styleUrl: './export.scss',
})
export class Export {
  @ViewChild('dialog') dialogBox!: DialogBox;

  //services injection
  exportFileService = inject(ExportDataService); //for exporting files
  translate = inject(TranslateService);
  // loader = inject(LoaderService)

  //inputs
  exportURL = input<string>('');
  exportData = input<Array<FILTER> | undefined>([]);
  gridColumnList = input<Array<gridColumnHeaderMetaData>>([]);
  displayInp = input<boolean>(false); //flag to manage hide and show of popup
  formLoaderKey = input.required<string>();
  additionalSearchData = input<any>(null);
  apiObjectName = input<string>('');
  getDataMethod = input<string>('');
  relationList = input<{ [key: string]: RELATION[] }>({});
  currPkData = input<{ [key: string]: any } | null>(null);
  screenName = input<string>('');
  //outputs
  closeTriggered = output();

  displayFlg = signal(false);
  isInvalidFileName = signal<boolean>(false);

  CaptionName: string = 'CORE.EXPORT.Export';
  fileName: string = '';
  buttons: DialogButton[] = [
    {
      btnId: 'fwh_exportDataDownloadBtn',
      text: 'CORE.EXPORT.Download',
      type: 'filled',
      severity: 'primary',
      leftIcon: 'save',
      disabled: false,
    },
  ] as const;
  fileTypeForSave: string = '.csv'; // Default value
  FiletypeforDropDown = [
    { id: "1", name: '.csv' },
    { id: "2", name: '.txt' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayInp']) {
      this.displayFlg.set(this.displayInp());
      if (this.displayFlg()) {
        DialogBox.instance?.openDialog();
        
      } else {
        DialogBox.instance?.onClose();
      }
    }
    if(changes['screenName']){      
      this.fileName = this.translate.instant('SCREEN.'+this.screenName()) + '_' + new Date().getTime();
    }
  }


  onCloseDialog(data: any) {
    if (data === 'close') {
      this.displayFlg.set(false);
      this.closeTriggered.emit();
      DialogBox.instance?.onClose();
    }
  }

  closeModel(): void {
    this.displayFlg.set(false);
    this.closeTriggered.emit();
    DialogBox.instance?.onClose();
  }

  handleDialogResult(result: string) {
    if (result === 'fwh_exportDataDownloadBtn') {
      this.exportFile();
    }
  }
  onSelectionChanged(selected: any): void {
    if (selected == '2') {
      this.fileTypeForSave = '.txt';
    } else {
      this.fileTypeForSave = '.csv';
    }
  }

  // Method to get current values
  getFileData(): {
    name: string;
    type: string;
    fullName: string;
  } {
    return {
      name: this.fileName,
      type: this.fileTypeForSave,
      fullName: this.fileName + this.fileTypeForSave,
    };
  }

  checkFileName(): boolean {
    if (this.fileName === '' || this.fileName === null) {
      return true;
    }
    return false;
  }

  getAddtionalData(){
    if(!this.additionalSearchData()?.TableName){
      return {...this.additionalSearchData() , TableName : ''}
    }else{
      return this.additionalSearchData();
    }
  }

  //This function is use to export the data to a csv file
  exportFile(): void {
    this.isInvalidFileName.set(this.checkFileName());
    if (this.isInvalidFileName() == false) {
      // this.loader.increment(this.formLoaderKey())
      this.exportFileService
        .exportData(
          this.exportData(),
          this.gridColumnList(),
          this.fileTypeForSave,
          this.getAddtionalData(),
          this.screenName(),
          this.apiObjectName(),
          this.getDataMethod(),
          this.relationList(),
          this.currPkData()
        )
        .subscribe({
          next: (res) => {
            if(res !== null){
              // Create download link
              const url = window.URL.createObjectURL(res);
              const a = document.createElement('a');
              // this.loader.decrement(this.formLoaderKey())
              this.handleDialogResult('ok');

              a.href = url;
              a.download = this.getFileData().fullName;
              document.body.appendChild(a);
              a.click();
              // Clean up
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }
          },
          error: (err) => {
            // this.loader.decrement(this.formLoaderKey())
          },
        });
    }
  }

}
