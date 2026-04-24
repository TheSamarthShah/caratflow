import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { ToastService } from "../../core/services/toast.service";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from "@angular/material/tooltip";
import { DateTime } from "src/core/components/datetime/datetime";
import { SelectOnFocus } from "src/core/directive/select-on-focus";
import { ShowTooltipIfTruncatedDirective } from "src/core/directive/show-tooltip-if-truncated";
import { OverlayModule } from "@angular/cdk/overlay";
import { Button } from "src/core/components/button/button";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    TranslateModule,
    MatTooltipModule,
    SelectOnFocus,
    ShowTooltipIfTruncatedDirective,
    OverlayModule,
    Button
  ],
  declarations: [
    DateTime
  ],
  exports: [
    DateTime
  ],
  providers: [
    ToastService,
    DatePipe
  ]
})
export class SharedModule {
  //constructor(toastService: ToastService) { }
}
