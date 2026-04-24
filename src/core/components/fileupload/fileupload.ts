import {
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Button } from '../button/button';
import { UploadFile } from 'src/core/models/UploadFile.type';

@Component({
  selector: 'acty-fileupload',
  standalone: true,
  imports: [CommonModule, Button, MatDividerModule, MatIconModule],
  templateUrl: './fileupload.html',
  styleUrl: './fileupload.scss',
})
export class Fileupload implements OnChanges {
  filesArrInp = input<UploadFile[]>([]);
  readonly = input<boolean>(false);
  filesChange = output<UploadFile[]>();
  filesArr: UploadFile[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filesArrInp']) {
      this.filesArr = this.filesArrInp();
    }
  }

  private lastGeneratedTime = 0;
  private counter = 0;

  private generateFileId(): number {
    const now = Date.now();
    if (now === this.lastGeneratedTime) {
      this.counter++;
    } else {
      this.lastGeneratedTime = now;
      this.counter = 0;
    }
    return now * 1000 + this.counter;
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();

    if (this.readonly()) {
      return;
    }

    if (event.dataTransfer?.files.length) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();

    if (this.readonly()) {
      // Show "not-allowed" (🚫) cursor
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }
    } else {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    }
  }

  addFiles(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList.item(i)!;
      this.filesArr.push({
        id: this.generateFileId(),
        name: file.name,
        size: file.size,
        file,
        isDBSaved: false,
      });
    }
    this.filesChange.emit(this.filesArr);
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.addFiles(input.files);
    }
  }

  removeFile(index: number) {
    const removed = this.filesArr[index];
    removed.deleted = true; // mark as deleted
    this.filesChange.emit(this.filesArr);
  }

  getVisibleFiles(): UploadFile[] {
    return this.filesArr.filter((f) => !f.deleted);
  }

  // Preview or download file
  previewFile(file: UploadFile) {
    if (!file.file) return;
    const fileUrl = URL.createObjectURL(file.file);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (['pdf', 'png', 'jpg', 'jpeg', 'gif'].includes(ext!)) {
      window.open(fileUrl, '_blank');
    } else {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    // optional: revoke blob after some time
    setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
  }

  downloadFile(file: UploadFile) {
    if (!file.file) return;
    const fileUrl = URL.createObjectURL(file.file);
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
