import { inject, Pipe, PipeTransform } from '@angular/core';
import { Language_Config } from '../models/languages.config';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'actyNumber'
})
export class ActyNumberPipe implements PipeTransform {

  private readonly translate = inject(TranslateService);

  /** Centralized getter for the current language config */
  private get currentLangConfig() {
    return (
      Language_Config.find((l) => l.code === this.translate.currentLang) ||
      Language_Config.find((l) => l.code === 'en') || // Fallback to English
      Language_Config[0]
    );
  }

  transform(value: number, lang : string =''): string {
    if (value === null || value === undefined) return '';

    // Split the number into the integer part and the decimal part
    const [integerPart, decimalPart] = value.toString().split('.');

    // Format the integer part with commas
    const formattedInteger = this.formatInteger(integerPart);

    // Return the formatted number with the decimal part (if it exists)
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  }

  private formatInteger(values: string): string {
    let expression = this.currentLangConfig.numberFormat;
    const parts = expression.split(',');
    // The length of the string after the comma is the length of the second part
    const firstPart = parts[1] ? parts[1].length : 0;
    const secondPart = parts[0] ? parts[0].length : 0;
    
    // Split integer part into the last three digits and the remaining part
    const lastPart = values.slice(-Math.abs(firstPart));
    const remaining = values.slice(0, -Math.abs(firstPart));

    // Add commas every two digits for the remaining part
    // const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    const formattedRemaining = remaining.replace(new RegExp(`\\B(?=(\\d{${secondPart}})+(?!\\d))`, 'g'), ',');

    // Combine the formatted part with the last three digits
    return remaining.length > 0 ? `${formattedRemaining},${lastPart}` : lastPart;
  }
}
