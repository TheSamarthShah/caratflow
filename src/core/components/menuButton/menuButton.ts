import { CommonModule } from '@angular/common';
import {
  Component,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from '../button/button';

@Component({
  selector: 'acty-menubutton',
  imports: [
    MatIconModule,
    MatMenuTrigger,
    MatMenuModule,
    CommonModule,
    TranslateModule,
    Button
  ],
  templateUrl: './menuButton.html',
  styleUrl: './menuButton.scss',
  standalone: true
})
export class MenuButton {
  type = input.required<'outlined' | 'filled'>();
  text = input<string>('');
  disabled = input<boolean>();
  /** Items for dropdown menu */
  menuItems = input.required<{id :string; label: string; icon?: string }[]>();
  severity = input<
    'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | undefined
  >();
  leftIcon = input<string | undefined>();
  rightIcon = input<string | undefined>();

  /** Event when main button clicked */
  clicked = output<void>();
  /** Event when dropdown menu item clicked */
  menuClicked = output<{id : string; label: string; icon?: string }>();
}
