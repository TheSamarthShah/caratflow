import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'acty-button',
  imports: [MatButtonModule, MatIconModule, CommonModule, TranslateModule],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  standalone: true,
})
export class Button {
  //types: filled, outlined, icon, mini fab
  type = input.required<'outlined' | 'filled' | 'icon' | 'mini fab' | 'text' | 'icon-outlined'>();
  disabled = input<boolean>();
  text = input<string>('');
  leftIcon = input<string | undefined>();
  rightIcon = input<string | undefined>();
  btnClass = input<string | undefined>();
  severity = input<
    'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | undefined
  >();
  avoidTabFocus = input<boolean>(false);

  clicked = output<void>();

  onClick() {
    if (this.disabled()) return;
    this.clicked.emit();
  }
}
